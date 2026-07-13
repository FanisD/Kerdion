from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Core Settings
    PROJECT_NAME: str
    ENVIRONMENT: str
    API_V1_STR: str
    SECRET_KEY: str

    # Database Settings
    DATABASE_URL: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    
    # Redis/Celery Settings
    CELERY_BROKER_URL: str
    CELERY_RESULT_BACKEND: str

    # This tells Pydantic to read from our .env file automatically
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

# Instantiate the settings so we can import it across the app
settings = Settings()