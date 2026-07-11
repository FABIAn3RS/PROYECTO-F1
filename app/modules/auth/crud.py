import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.modules.auth import models, schemas
from app.core.security import hash_password


def get_usuario_by_correo(db: Session, correo: str) -> models.Usuario | None:
    return db.query(models.Usuario).filter(models.Usuario.correo == correo).first()


def get_rol_by_nombre(db: Session, nombre: str) -> models.Rol | None:
    return db.query(models.Rol).filter(models.Rol.nombre == nombre).first()


def crear_usuario(db: Session, datos: schemas.UsuarioCreate) -> models.Usuario:
    rol_usuario = get_rol_by_nombre(db, "usuario")

    nuevo_usuario = models.Usuario(
        nombre=datos.nombre,
        correo=datos.correo,
        password_hash=hash_password(datos.password),
        rol_id=rol_usuario.id,
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario


def crear_reset_token(db: Session, usuario: models.Usuario) -> str:
    token = secrets.token_urlsafe(32)
    reset = models.PasswordResetToken(
        usuario_id=usuario.id,
        token=token,
        expira_en=datetime.now(timezone.utc) + timedelta(minutes=30),
    )
    db.add(reset)
    db.commit()
    return token


def validar_reset_token(db: Session, token: str) -> models.PasswordResetToken | None:
    reset = (
        db.query(models.PasswordResetToken)
        .filter(models.PasswordResetToken.token == token)
        .first()
    )
    if not reset or reset.usado:
        return None
    if reset.expira_en.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        return None
    return reset


def actualizar_password(db: Session, usuario: models.Usuario, nueva_password: str) -> None:
    usuario.password_hash = hash_password(nueva_password)
    db.commit()
