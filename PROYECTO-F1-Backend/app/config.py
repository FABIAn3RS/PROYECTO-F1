import os
from dotenv import load_dotenv

load_dotenv()

# Base de datos
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    db_user = os.getenv("POSTGRES_USER", "pronosticos_user")
    db_password = os.getenv("POSTGRES_PASSWORD")
    db_host = os.getenv("POSTGRES_HOST", "localhost")
    db_port = os.getenv("POSTGRES_PORT", "5432")
    db_name = os.getenv("POSTGRES_DB", "pronosticos_deportivos")
    
    if not db_password:
        raise ValueError("POSTGRES_PASSWORD environment variable is required to ensure database password protection.")
        
    DATABASE_URL = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

# JWT
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-cambiame")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# Stripe (para el módulo `acceso`, se usa más adelante)
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

THESPORTSDB_API_KEY = os.getenv("THESPORTSDB_API_KEY", "123")
THESPORTSDB_BASE_URL = os.getenv("THESPORTSDB_BASE_URL", "https://www.thesportsdb.com/api/v1/json")

# Resend Email Verification
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "mock")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")


# Didit KYC Identity Verification (API v3 - autenticación por API key)
DIDIT_API_KEY = os.getenv("DIDIT_API_KEY", "mock")
DIDIT_WORKFLOW_ID = os.getenv("DIDIT_WORKFLOW_ID", "")
DIDIT_WEBHOOK_SECRET = os.getenv("DIDIT_WEBHOOK_SECRET", "")
DIDIT_BASE_URL = os.getenv("DIDIT_BASE_URL", "https://verification.didit.me/v3")