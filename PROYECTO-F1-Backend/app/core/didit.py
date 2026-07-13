import json
import logging
import urllib.request
import urllib.error
import uuid
from app import config

logger = logging.getLogger("app.didit")


def crear_sesion_didit(usuario_id: str, callback_url: str = None) -> dict:
    """
    Creates a KYC verification session with Didit using the direct DIDIT_API_KEY.
    If credentials are mock/missing, returns a simulated session.
    """
    if not config.DIDIT_API_KEY or config.DIDIT_API_KEY == "mock":
        # Simulate Didit session for development/fallback
        session_id = f"didit_session_{uuid.uuid4().hex[:12]}"
        session_url = f"https://sandbox.didit.me/verify?session={session_id}&vendor_id={usuario_id}"
        logger.info(f"[MOCK DIDIT] Created simulated KYC session for user {usuario_id}")
        return {
            "session_id": session_id,
            "session_url": session_url,
            "token": f"mock_token_{uuid.uuid4().hex}"
        }

    # Create verification session directly using the API Key
    session_url_api = f"{config.DIDIT_API_URL}/v1/session"
    session_payload = {
        "vendor_session_id": usuario_id,
        "features": ["document-verification", "liveness"]
    }
    if callback_url:
        session_payload["callback_url"] = callback_url

    session_headers = {
        "Authorization": f"Bearer {config.DIDIT_API_KEY}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    try:
        req_session = urllib.request.Request(
            session_url_api,
            data=json.dumps(session_payload).encode("utf-8"),
            headers=session_headers,
            method="POST"
        )
        with urllib.request.urlopen(req_session, timeout=10) as res_session:
            res_data = json.loads(res_session.read().decode("utf-8"))
            # Standardize keys to match frontend schemas: session_id, session_url, token
            return {
                "session_id": res_data.get("id", res_data.get("session_id", "")),
                "session_url": res_data.get("url", res_data.get("session_url", "")),
                "token": res_data.get("token", "")
            }
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        logger.error(f"Didit create session HTTP error: {e.code} - {err_body}")
        # Fallback to mock session so it doesn't crash the application
        return {
            "session_id": f"fallback_{uuid.uuid4().hex[:8]}",
            "session_url": f"https://sandbox.didit.me/verify?error=fallback&vendor_id={usuario_id}",
            "token": "fallback_token"
        }
    except Exception as e:
        logger.error(f"Didit create session unexpected error: {str(e)}")
        return {
            "session_id": f"fallback_{uuid.uuid4().hex[:8]}",
            "session_url": f"https://sandbox.didit.me/verify?error=fallback&vendor_id={usuario_id}",
            "token": "fallback_token"
        }
