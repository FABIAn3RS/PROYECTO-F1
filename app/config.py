import os
from dotenv import load_dotenv

load_dotenv()

# Base de datos
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://pronosticos_user:pronosticos_pass@localhost:5432/pronosticos_deportivos",
)

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

# Didit KYC Identity Verification
DIDIT_CLIENT_ID = os.getenv("DIDIT_CLIENT_ID", "")
DIDIT_CLIENT_SECRET = os.getenv("DIDIT_CLIENT_SECRET", "")
DIDIT_API_URL = os.getenv("DIDIT_API_URL", "https://apix.didit.protocol")  # Default to sandbox

