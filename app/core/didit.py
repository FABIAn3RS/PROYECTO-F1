import json
import logging
import urllib.request
import urllib.error
import uuid
from app import config

logger = logging.getLogger("app.didit")


def crear_sesion_didit(usuario_id: str, callback_url: str = None) -> dict:
    """
    Creates a KYC verification session with Didit.
    If credentials are mock/missing, returns a simulated session.
    """
    if not config.DIDIT_CLIENT_ID or config.DIDIT_CLIENT_ID == "mock":
        # Simulate Didit session
        session_id = f"didit_session_{uuid.uuid4().hex[:12]}"
        # A mock URL pointing to our frontend or a simulated screen
        session_url = f"https://sandbox.didit.me/verify?session={session_id}&vendor_id={usuario_id}"
        logger.info(f"[MOCK DIDIT] Created simulated KYC session for user {usuario_id}")
        return {
            "session_id": session_id,
            "session_url": session_url,
            "token": f"mock_token_{uuid.uuid4().hex}"
        }

    # Authenticate to get OAuth2 token
    auth_url = f"{config.DIDIT_API_URL}/v1/oauth/token"
    # standard client credentials payload
    auth_data = json.dumps({
        "client_id": config.DIDIT_CLIENT_ID,
        "client_secret": config.DIDIT_CLIENT_SECRET,
        "grant_type": "client_credentials"
    }).encode("utf-8")

    headers = {"Content-Type": "application/json"}

    try:
        req = urllib.request.Request(auth_url, data=auth_data, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=10) as res:
            res_json = json.loads(res.read().decode("utf-8"))
            access_token = res_json.get("access_token")
    except Exception as e:
        logger.error(f"Didit Auth error: {str(e)}")
        # Fallback to mock so it doesn't crash the application
        return crear_sesion_didit("mock", callback_url)

    # Create verification session
    session_url_api = f"{config.DIDIT_API_URL}/v1/session"
    session_payload = {
        "vendor_session_id": usuario_id,
        "features": ["document-verification", "liveness"]
    }
    if callback_url:
        session_payload["callback_url"] = callback_url

    session_headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    try:
        req_session = urllib.request.Request(
            session_url_api,
            data=json.dumps(session_payload).encode("utf-8"),
            headers=session_headers,
            method="POST"
        )
        with urllib.request.urlopen(req_session, timeout=10) as res_session:
            return json.loads(res_session.read().decode("utf-8"))
    except Exception as e:
        logger.error(f"Didit create session error: {str(e)}")
        return crear_sesion_didit("mock", callback_url)
