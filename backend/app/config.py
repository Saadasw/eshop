"""Application settings loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Global application settings via pydantic-settings.

    All values are read from environment variables (or a .env file).
    """

    # --- Provider Switches ---
    # Set to "local" to use local Postgres + filesystem instead of Supabase
    AUTH_PROVIDER: str = "supabase"      # "supabase" | "local"
    STORAGE_PROVIDER: str = "supabase"   # "supabase" | "local"

    # --- Supabase (required when AUTH_PROVIDER/STORAGE_PROVIDER = "supabase") ---
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # --- Database ---
    DATABASE_URL: str  # postgresql+asyncpg://...

    # --- JWT ---
    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # --- bKash ---
    BKASH_APP_KEY: str = ""
    BKASH_APP_SECRET: str = ""
    BKASH_USERNAME: str = ""
    BKASH_PASSWORD: str = ""
    BKASH_BASE_URL: str = "https://tokenized.sandbox.bka.sh/v1.2.0-beta"

    # --- CORS ---
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # --- Local Storage (used when STORAGE_PROVIDER = "local") ---
    LOCAL_STORAGE_DIR: str = "uploads"
    LOCAL_STORAGE_URL: str = "http://localhost:8000/uploads"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()  # type: ignore[call-arg]
