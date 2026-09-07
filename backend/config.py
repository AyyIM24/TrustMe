from pydantic_settings import BaseSettings
from typing import List


import os

ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")

class Settings(BaseSettings):
    DATABASE_URL: str = "mysql+pymysql://root:@localhost:3306/trustme_db"
    SECRET_KEY: str = "trustme-super-secret-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ML_MODEL_VERSION: str = "v1"
    SCRAPER_TIMEOUT: int = 10
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    GOOGLE_CLIENT_ID: str = "949959320287-mulvudjrs9pmvj9ln4ga4i7b4kftq9pr.apps.googleusercontent.com"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ENV_PATH
        extra = "ignore"


settings = Settings()
