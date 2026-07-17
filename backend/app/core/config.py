from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Absolute path to the .env file located in the backend package directory
ENV_FILE_PATH = str(Path(__file__).resolve().parents[1] / ".env")

class Settings(BaseSettings):
    # Core Settings
    PROJECT_NAME: str
    ENVIRONMENT: str
    API_V1_STR: str
    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Database Settings
    DATABASE_URL: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    
    # Redis/Celery Settings
    CELERY_BROKER_URL: str
    CELERY_RESULT_BACKEND: str

    # This tells Pydantic to read from our .env file automatically.
    # Use an absolute path relative to this package so the settings load
    # correctly regardless of the current working directory.
    model_config = SettingsConfigDict(env_file=ENV_FILE_PATH, extra="ignore")

# Instantiate the settings so we can import it across the app
settings = Settings()