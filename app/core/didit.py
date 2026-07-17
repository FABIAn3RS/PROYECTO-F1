import hashlib
import hmac
import json
import time
import logging

import httpx

from app import config

logger = logging.getLogger("app.didit")

DIDIT_BASE_URL = getattr(config, "DIDIT_BASE_URL", "https://verification.didit.me/v3")


def _modo_mock() -> bool:
    return not getattr(config, "DIDIT_API_KEY", None) or config.DIDIT_API_KEY == "mock"


async def crear_sesion_didit(usuario_id: str, callback_url: str | None = None) -> dict:
    """
    Crea una sesión de verificación KYC en Didit (API v3).
    Si no hay API key configurada, devuelve una sesión simulada (modo dev).
    """
    if _modo_mock():
        session_id = f"mock_session_{usuario_id[:8]}"
        logger.info(f"[MOCK DIDIT] Sesión KYC simulada para usuario {usuario_id}")
        return {
            "session_id": session_id,
            "url": f"https://verify.didit.me/session/mock-{session_id}",
            "session_token": "mock_token",
            "status": "Not Started",
        }

    payload = {
        "workflow_id": config.DIDIT_WORKFLOW_ID,
        "vendor_data": usuario_id,
    }
    if callback_url:
        payload["callback"] = callback_url

    headers = {
        "x-api-key": config.DIDIT_API_KEY,
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                f"{DIDIT_BASE_URL}/session/",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        # Didit devuelve 403 tanto para key inválida como para permisos insuficientes
        logger.error(f"Didit create session error: {e.response.status_code} - {e.response.text}")
        raise
    except Exception as e:
        logger.error(f"Didit connection error: {str(e)}")
        raise


async def obtener_decision_didit(session_id: str) -> dict:
    """Consulta el resultado de una sesión (útil para backfill/auditoría)."""
    if _modo_mock():
        return {"session_id": session_id, "status": "Not Started"}

    headers = {"x-api-key": config.DIDIT_API_KEY}
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(
            f"{DIDIT_BASE_URL}/session/{session_id}/decision/",
            headers=headers,
        )
        response.raise_for_status()
        return response.json()


def _shorten_floats(data):
    """Los floats enteros se serializan como int (así los firma Didit)."""
    if isinstance(data, dict):
        return {k: _shorten_floats(v) for k, v in data.items()}
    if isinstance(data, list):
        return [_shorten_floats(x) for x in data]
    if isinstance(data, float) and data.is_integer():
        return int(data)
    return data


def verificar_firma_webhook(raw_body: bytes, signature: str, timestamp: str, secret: str) -> bool:
    """Valida X-Signature-V2 (HMAC-SHA256 sobre el JSON canónico de Didit)."""
    if not signature or not timestamp:
        return False

    # Rechaza payloads con más de 5 minutos de antigüedad
    try:
        if abs(int(time.time()) - int(timestamp)) > 300:
            return False
    except ValueError:
        return False

    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError:
        return False

    canonical = json.dumps(
        _shorten_floats(payload),
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    )
    expected = hmac.new(
        secret.encode("utf-8"),
        canonical.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(signature, expected)