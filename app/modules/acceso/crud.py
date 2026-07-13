import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.modules.acceso import models


def obtener_pase_activo(db: Session, usuario_id: uuid.UUID) -> models.PaseTemporada | None:
    return (
        db.query(models.PaseTemporada)
        .filter(
            models.PaseTemporada.usuario_id == usuario_id,
            models.PaseTemporada.estado == "activo",
            models.PaseTemporada.fecha_expiracion > datetime.now()
        )
        .first()
    )


def crear_pase_pendiente(db: Session, usuario_id: uuid.UUID, session_id: str) -> models.PaseTemporada:
    pase = models.PaseTemporada(
        usuario_id=usuario_id,
        estado="pendiente",
        stripe_checkout_session_id=session_id
    )
    db.add(pase)
    db.commit()
    db.refresh(pase)
    return pase


def obtener_pase_por_session_usuario(
    db: Session, session_id: str, usuario_id: uuid.UUID
) -> models.PaseTemporada | None:
    return (
        db.query(models.PaseTemporada)
        .filter(
            models.PaseTemporada.stripe_checkout_session_id == session_id,
            models.PaseTemporada.usuario_id == usuario_id,
        )
        .first()
    )


def activar_pase_por_session(db: Session, session_id: str, payment_intent_id: str) -> models.PaseTemporada | None:
    pase = db.query(models.PaseTemporada).filter(models.PaseTemporada.stripe_checkout_session_id == session_id).first()
    if pase:
        pase.estado = "activo"
        pase.stripe_payment_intent_id = payment_intent_id
        pase.fecha_pago = datetime.now()
        pase.fecha_expiracion = datetime.now() + timedelta(days=365)
        db.commit()
        db.refresh(pase)
    return pase


def fallar_pase_por_session(db: Session, session_id: str) -> models.PaseTemporada | None:
    pase = db.query(models.PaseTemporada).filter(models.PaseTemporada.stripe_checkout_session_id == session_id).first()
    if pase:
        pase.estado = "fallido"
        db.commit()
        db.refresh(pase)
    return pase
