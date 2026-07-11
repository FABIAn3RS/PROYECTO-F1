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

# TheSportsDB se consulta exclusivamente desde el backend durante una
# sincronización manual iniciada por un administrador.
THESPORTSDB_API_KEY = os.getenv("THESPORTSDB_API_KEY", "123")
THESPORTSDB_BASE_URL = os.getenv(
    "THESPORTSDB_BASE_URL", "https://www.thesportsdb.com/api/v1/json"
)
