import logging
import torch
import torch.nn as nn
import numpy as np
import pandas as pd
import joblib
from arch import arch_model

logger = logging.getLogger(__name__)

# ==========================================
# 1. THESIS MODEL DEFINITION (Placeholder)
# ==========================================
# You will paste your exact PyTorch class from Notebook 5 here.
class AdaptiveSTGNN(nn.Module):
    def __init__(self, num_nodes=10, seq_length=30, output_dim=1):
        super(AdaptiveSTGNN, self).__init__()
        # Placeholder for your Graph Wavenet / GTS layers, 
        # learnable node embeddings (E1, E2), and Temporal Convolutional layers.
        self.fc = nn.Linear(num_nodes * seq_length, num_nodes) 

    def forward(self, x):
        # x shape expected: [batch_size, seq_length, num_nodes]
        batch_size = x.size(0)
        x = x.view(batch_size, -1)
        out = self.fc(x)
        return out # shape: [batch_size, num_nodes]


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
        
        # 1. Device configuration (CUDA if you deploy on GPU later, else CPU)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # 2. Load the MinMax Scaler (from Notebook 3)
        try:
            self.scaler = joblib.load("app/services/weights/scaler.pkl")
            logger.info("MinMaxScaler loaded successfully.")
        except FileNotFoundError:
            logger.warning("scaler.pkl not found. Predictions will fail until provided.")
            self.scaler = None

        # 3. Load the PyTorch Adaptive STGNN (from Notebook 5)
        try:
            self.stgnn_model = AdaptiveSTGNN(num_nodes=10, seq_length=30).to(self.device)
            # map_location handles loading a GPU-trained model on a CPU machine
            state_dict = torch.load("app/services/weights/adaptive_stgnn.pth", map_location=self.device)
            self.stgnn_model.load_state_dict(state_dict)
            self.stgnn_model.eval() # Set to evaluation mode (turns off dropout/batchnorm)
            logger.info("Adaptive STGNN loaded successfully.")
        except FileNotFoundError:
            logger.warning("adaptive_stgnn.pth not found. Predictions will fail until provided.")
            self.stgnn_model = None

    # ==========================================
    # 3. PREDICTION METHODS
    # ==========================================
    
    def predict_garch(self, historical_prices: pd.Series) -> float:
        """
        Baseline Model (From Notebook 2).
        historical_prices: A Pandas Series of daily close prices for ONE coin.
        """
        # 1. Feature Engineering: Calculate Log-Returns
        log_returns = np.log(historical_prices / historical_prices.shift(1)).dropna()
        
        # 2. Fit GARCH(1,1)
        # Using rescale=True is standard practice to help the optimizer converge
        am = arch_model(log_returns * 100, vol='Garch', p=1, q=1, rescale=False)
        res = am.fit(disp='off')
        
        # 3. Forecast next day's variance
        forecasts = res.forecast(horizon=1)
        predicted_variance = forecasts.variance.iloc[-1, 0]
        
        # Return Volatility (Standard Deviation)
        return float(np.sqrt(predicted_variance))

    def predict_stgnn(self, historical_df: pd.DataFrame, target_coin_index: int = 0) -> float:
        """
        Masterpiece Model (From Notebook 5).
        historical_df: A DataFrame of shape (seq_length+1, 10) containing close prices for ALL 10 coins.
        target_coin_index: 0 for BTC, 1 for ETH, etc.
        """
        if self.stgnn_model is None or self.scaler is None:
            raise RuntimeError("Model or Scaler not loaded into memory.")

        # 1. Feature Engineering: Calculate Log-Returns (Drops the first row)
        log_returns = np.log(historical_df / historical_df.shift(1)).dropna()
        
        # 2. Scale the data using the exact scaler from training
        scaled_data = self.scaler.transform(log_returns)
        
        # 3. Convert to PyTorch Tensor [batch_size=1, seq_length=30, num_nodes=10]
        input_tensor = torch.tensor(scaled_data, dtype=torch.float32).unsqueeze(0).to(self.device)
        
        # 4. Forward Pass (No gradients needed)
        with torch.no_grad():
            predictions_scaled = self.stgnn_model(input_tensor) # Shape: [1, 10]
            
        # 5. Inverse Transform
        # We need to reshape it back to the scaler's expected format (1 row, 10 columns)
        predictions_numpy = predictions_scaled.cpu().numpy()
        predictions_actual = self.scaler.inverse_transform(predictions_numpy)
        
        # 6. Apply clipping and percentage conversion (From Notebook 4/5)
        # Multiply by 100 as per your thesis code, and clip minimum to 0.1
        final_predictions = np.clip(predictions_actual * 100, a_min=0.1, a_max=None)
        
        # 7. Return the specific coin's predicted volatility
        target_volatility = final_predictions[0, target_coin_index]
        return float(target_volatility)

# Instantiate the global singleton object
ml_engine = VolatilityPredictor()