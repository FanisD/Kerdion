import logging
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import pandas as pd
import joblib
from arch import arch_model

logger = logging.getLogger(__name__)

# ==========================================
# 1. THESIS MODEL DEFINITION
# ==========================================

class AdaptiveGraphConv(nn.Module):
    """
    Recreation of your custom Graph Convolution layer to match the .pth keys.
    Computes the adjacency matrix dynamically using node embeddings.
    """
    def __init__(self, num_nodes, node_dim, in_features, out_features):
        super(AdaptiveGraphConv, self).__init__()
        self.node_emb1 = nn.Parameter(torch.randn(num_nodes, node_dim))
        self.node_emb2 = nn.Parameter(torch.randn(node_dim, num_nodes))
        self.weight = nn.Parameter(torch.randn(in_features, out_features))

    def forward(self, x):
        # x shape: [Batch, Time, Nodes, In_Features]
        # Calculate dynamic adjacency matrix
        adj = F.softmax(F.relu(torch.mm(self.node_emb1, self.node_emb2)), dim=1)
        # Graph convolution: Multiply Adjacency * X
        h = torch.einsum('ij, btjf -> btif', adj, x)
        # Multiply by weights
        out = torch.matmul(h, self.weight)
        return out, adj

class AdaptiveSTGNN(nn.Module):
    def __init__(self, num_nodes=10, seq_len=30, in_channels=1, hidden_dim=32, node_dim=10):
        super(AdaptiveSTGNN, self).__init__()

        # 1. Temporal Convolution (TCN) για τον χρόνο
        self.tcn = nn.Conv2d(in_channels=1, out_channels=hidden_dim, kernel_size=(3, 1), padding=(1, 0))

        # 2. Adaptive Graph Convolution για τον χώρο
        self.gcn = AdaptiveGraphConv(num_nodes, node_dim, hidden_dim, hidden_dim)

        # 3. GRU για να δέσει τις χωροχρονικές πληροφορίες
        self.gru = nn.GRU(hidden_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, 1)

    def forward(self, x):
        # x shape: [Batch, Time, Nodes, 1]
        batch_size, seq_len, nodes, _ = x.shape

        # TCN (Το PyTorch Conv2d θέλει [Batch, Channels, Time, Nodes])
        x_tcn = x.permute(0, 3, 1, 2)
        h_tcn = F.relu(self.tcn(x_tcn))
        h_tcn = h_tcn.permute(0, 2, 3, 1) # Πίσω σε [Batch, Time, Nodes, Hidden]

        # Adaptive Graph Conv
        h_gcn, learned_adj = self.gcn(h_tcn)
        h_gcn = F.relu(h_gcn)

        # GRU
        gru_in = h_gcn.permute(0, 2, 1, 3).reshape(batch_size * nodes, seq_len, -1)
        gru_out, _ = self.gru(gru_in)
        last_out = gru_out[:, -1, :]

        out = self.fc(last_out).reshape(batch_size, nodes)

        return F.softplus(out), learned_adj


# ==========================================
# 2. THE SINGLETON INFERENCE ENGINE
# ==========================================

class VolatilityPredictor:
    """
    Singleton class to ensure heavy ML models and scalers are loaded 
    into RAM exactly once when the API/Worker boots.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(VolatilityPredictor, cls).__new__(cls)
            cls._instance._initialize_models()
        return cls._instance

    def _initialize_models(self):
        """Loads weights, scalers, and devices into memory."""
        logger.info("Initializing Kerdion ML Engine...")
        
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Load the MinMax Scaler
        try:
            self.scaler = joblib.load("app/services/weights/scaler.pkl")
            logger.info("MinMaxScaler loaded successfully.")
        except FileNotFoundError:
            logger.warning("scaler.pkl not found. Predictions will fail until provided.")
            self.scaler = None

        # Load the PyTorch Adaptive STGNN
        try:
            self.stgnn_model = AdaptiveSTGNN(num_nodes=10, seq_len=30).to(self.device)
            state_dict = torch.load("app/services/weights/adaptive_stgnn.pth", map_location=self.device)
            self.stgnn_model.load_state_dict(state_dict)
            self.stgnn_model.eval() 
            logger.info("Adaptive STGNN loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load adaptive_stgnn.pth: {e}")
            self.stgnn_model = None

    # ==========================================
    # 3. PREDICTION METHODS
    # ==========================================
    
    def predict_garch(self, historical_prices: pd.Series) -> float:
        """Baseline Model (From Notebook 2)."""
        log_returns = np.log(historical_prices / historical_prices.shift(1)).dropna()
        am = arch_model(log_returns * 100, vol='Garch', p=1, q=1, rescale=False)
        res = am.fit(disp='off')
        forecasts = res.forecast(horizon=1)
        predicted_variance = forecasts.variance.iloc[-1, 0]
        return float(np.sqrt(predicted_variance))

    def predict_stgnn(self, historical_df: pd.DataFrame, target_coin_index: int = 0) -> float:
        """
        Masterpiece Model (From Notebook 5).
        historical_df: Shape (31, 10).
        target_coin_index: 0 for BTC.
        """
        if self.stgnn_model is None or self.scaler is None:
            raise RuntimeError("Model or Scaler not loaded into memory.")

        # 1. Feature Engineering: Calculate Log-Returns (Drops the first row -> 30 rows)
        log_returns = np.log(historical_df / historical_df.shift(1)).dropna()
        
        # 2. Scale the data
        scaled_data = self.scaler.transform(log_returns)
        
        # 3. Convert to PyTorch Tensor [batch=1, time=30, nodes=10, channels=1]
        input_tensor = torch.tensor(scaled_data, dtype=torch.float32).unsqueeze(0).unsqueeze(-1).to(self.device)
        
        # 4. Forward Pass (Unpack the tuple)
        with torch.no_grad():
            predictions_scaled, _ = self.stgnn_model(input_tensor) # Shape of predictions_scaled: [1, 10]
            
        # 5. Inverse Transform
        predictions_numpy = predictions_scaled.cpu().numpy()
        predictions_actual = self.scaler.inverse_transform(predictions_numpy)
        
        # 6. Apply clipping and percentage conversion
        final_predictions = np.clip(predictions_actual * 100, a_min=0.1, a_max=None)
        
        # 7. Return the specific coin's predicted volatility
        target_volatility = final_predictions[0, target_coin_index]
        return float(target_volatility)

# Instantiate the global singleton object
ml_engine = VolatilityPredictor()