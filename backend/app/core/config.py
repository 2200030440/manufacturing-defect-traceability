from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    APP_NAME: str = "Manufacturing Defect Traceability System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    DATABASE_URL: str = "sqlite:///./manufacturing.db"

    SECRET_KEY: str = "change-this-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    BACKEND_CORS_ORIGINS: str = '["http://localhost:5173","http://localhost:3000","http://127.0.0.1:5173","http://127.0.0.1:3000","*"]'

    FIRST_ADMIN_EMAIL: str = "admin@manufacturing.com"
    FIRST_ADMIN_PASSWORD: str = "Admin@123456"

    @property
    def cors_origins(self) -> List[str]:
        try:
            return json.loads(self.BACKEND_CORS_ORIGINS)
        except Exception:
            return ["*"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
