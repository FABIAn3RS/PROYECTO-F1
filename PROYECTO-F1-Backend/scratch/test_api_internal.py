import os
import sys
import json
import urllib.request
import urllib.error
import uuid
from sqlalchemy import create_engine, text

# Read database URL from container environment
DB_URL = os.getenv("DATABASE_URL", "postgresql://pronosticos_user:pronosticos_pass@db:5432/pronosticos_deportivos")
# Inside container, FastAPI runs on localhost:8000
API_URL = "http://localhost:8000"

print("=" * 60)
print(" INICIANDO INTEGRATION TESTING PARA SEGURIDAD, KYC Y DEPOSITOS")
print("=" * 60)

try:
    engine = create_engine(DB_URL)
    connection = engine.connect()
    print("Database Connection: OK.")
except Exception as e:
    print(f"Database Connection Error: {e}")
    sys.exit(1)

# Generate test user info
test_email = f"test_{uuid.uuid4().hex[:6]}@pronosticos.com"
test_password = "Password123"
test_name = "Usuario Test"
user_id = None
token = None

# Helper function to make HTTP requests using urllib
def make_request(url, data=None, headers=None, method="GET"):
    req_headers = headers or {}
    req_data = None
    if data is not None:
        if isinstance(data, dict):
            req_data = json.dumps(data).encode("utf-8")
            req_headers["Content-Type"] = "application/json"
        else:
            req_data = data.encode("utf-8")
            req_headers["Content-Type"] = "application/x-www-form-urlencoded"
            
    req = urllib.request.Request(url, data=req_data, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            status_code = response.status
            body = response.read().decode("utf-8")
            return status_code, json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        status_code = e.code
        body = e.read().decode("utf-8")
        try:
            res_json = json.loads(body)
        except Exception:
            res_json = {"detail": body}
        return status_code, res_json
    except Exception as e:
        print(f"Request Error to {url}: {e}")
        return 500, {"detail": str(e)}

# 1. Health check
status, body = make_request(f"{API_URL}/")
if status == 200 and body.get("status") == "ok":
    print("Health Check API: OK.")
else:
    print(f"Health Check API Failed: {status} - {body}")
    sys.exit(1)

# 2. Registro de Usuario
print(f"-> Registering test user with email: {test_email}...")
status, body = make_request(f"{API_URL}/auth/register", data={
    "nombre": test_name,
    "correo": test_email,
    "password": test_password
}, method="POST")

if status == 201:
    user_id = body.get("id")
    print(f"Register Completed. User ID: {user_id}")
    print(f"correo_verificado: {body.get('correo_verificado')} (Expected: False)")
else:
    print(f"Register Failed: {status} - {body}")
    sys.exit(1)

# 3. Intentar Login con email sin verificar (Debe fallar con 403)
print("-> Attempting login before email verification...")
login_payload = f"username={urllib.parse.quote(test_email)}&password={urllib.parse.quote(test_password)}"
status, body = make_request(f"{API_URL}/auth/login", data=login_payload, method="POST")

if status == 403 and body.get("detail") == "correo_no_verificado":
    print("Login successfully blocked (HTTP 403 correo_no_verificado).")
else:
    print(f"Login should have been blocked, returned: {status} - {body}")
    sys.exit(1)

# 4. Consultar el codigo de verificacion generado en la Base de Datos
print("-> Fetching verification code from PostgreSQL...")
query = text("SELECT codigo FROM codigos_verificacion WHERE usuario_id = :uid AND usado = False")
result = connection.execute(query, {"uid": user_id}).fetchone()

if result:
    db_code = result[0]
    print(f"Verification code found in DB: {db_code}")
else:
    print("No active verification code found in DB.")
    sys.exit(1)

# 5. Verificar Correo usando el codigo
print("-> Sending code to /auth/verify-email...")
status, body = make_request(f"{API_URL}/auth/verify-email", data={
    "correo": test_email,
    "codigo": db_code
}, method="POST")

if status == 200:
    print("Email verified successfully.")
else:
    print(f"Verification failed: {status} - {body}")
    sys.exit(1)

# 6. Intentar Login de nuevo (Ahora debe funcionar y dar JWT)
print("-> Attempting login now that email is verified...")
status, body = make_request(f"{API_URL}/auth/login", data=login_payload, method="POST")

if status == 200:
    token = body.get("access_token")
    print("Login Successful. JWT token obtained.")
else:
    print(f"Login failed after verification: {status} - {body}")
    sys.exit(1)

auth_headers = {"Authorization": f"Bearer {token}"}

# 7. Intentar crear Checkout Session de Stripe sin telefono verificado ni KYC (Debe dar 403)
print("-> Testing deposit block without phone and KYC verification...")
status, body = make_request(f"{API_URL}/acceso/checkout", data={
    "success_url": "http://localhost/success",
    "cancel_url": "http://localhost/cancel"
}, headers=auth_headers, method="POST")

if status == 403 and body.get("detail") == "telefono_no_verificado":
    print("Deposit block successful: blocked because of missing phone verification.")
else:
    print(f"Checkout should have been blocked, returned: {status} - {body}")
    sys.exit(1)

# 8. Verificar Telefono
print("-> Verifying phone number...")
status, body = make_request(f"{API_URL}/users/me/verificar-telefono", data={
    "telefono": "+573009998877",
    "firebase_token": "mock_firebase_id_token"
}, headers=auth_headers, method="POST")

if status == 200 and body.get("telefono_verificado") is True:
    print("Phone marked as verified in user profile.")
else:
    print(f"Phone verification failed: {status} - {body}")
    sys.exit(1)

# 9. Volver a probar Checkout Session de Stripe (Debe dar 403 kyc_no_aprobado)
print("-> Testing deposit block due to missing KYC verification...")
status, body = make_request(f"{API_URL}/acceso/checkout", data={
    "success_url": "http://localhost/success",
    "cancel_url": "http://localhost/cancel"
}, headers=auth_headers, method="POST")

if status == 403 and body.get("detail") == "kyc_no_aprobado":
    print("Deposit block successful: blocked because of missing KYC verification.")
else:
    print(f"Checkout should have been blocked by KYC, returned: {status} - {body}")
    sys.exit(1)

# 10. Simular Aprobacion de KYC (Llamada al webhook de Didit)
print("-> Simulating Didit KYC approval webhook...")
status, body = make_request(f"{API_URL}/users/webhooks/didit", data={
    "vendor_session_id": user_id,
    "status": "approved"
}, method="POST")

if status == 200 and body.get("kyc_estado") == "aprobado":
    print("Webhook processed. KYC status updated to 'aprobado'.")
else:
    print(f"KYC webhook simulation failed: {status} - {body}")
    sys.exit(1)

# 11. Probar Checkout Session de Stripe ahora que todo esta verificado (Debe funcionar)
print("-> Creating Stripe checkout with fully verified profile...")
status, body = make_request(f"{API_URL}/acceso/checkout", data={
    "success_url": "http://localhost/success",
    "cancel_url": "http://localhost/cancel"
}, headers=auth_headers, method="POST")

if status == 200:
    print("Stripe checkout session created successfully.")
    print(f"Session ID: {body.get('session_id')}")
    print(f"Checkout URL: {body.get('checkout_url')}")
else:
    print(f"Checkout failed with verified profile: {status} - {body}")
    sys.exit(1)

# 12. Limpieza (Eliminar el usuario de prueba)
print("-> Cleaning up test user...")
status, body = make_request(f"{API_URL}/users/me", headers=auth_headers, method="DELETE")
if status == 200:
    print("Test user deleted from database successfully.")
else:
    print(f"Error deleting test user: {status} - {body}")

connection.close()

print("=" * 60)
print(" INTEGRATION TESTING SUCCESS: ALL ENDPOINTS & VERIFICATIONS WORK!")
print("=" * 60)
