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


def crear_codigo_verificacion(db: Session, usuario_id) -> str:
    codigo = "".join(secrets.choice("0123456789") for _ in range(6))
    
    # Desactivar cualquier código anterior activo del mismo usuario
    db.query(models.CodigoVerificacion).filter(
        models.CodigoVerificacion.usuario_id == usuario_id,
        models.CodigoVerificacion.usado == False
    ).update({"usado": True})
    
    nuevo_codigo = models.CodigoVerificacion(
        usuario_id=usuario_id,
        codigo=codigo,
        expira_en=datetime.now(timezone.utc) + timedelta(minutes=15),
    )
    db.add(nuevo_codigo)
    db.commit()
    return codigo


def validar_codigo_verificacion(db: Session, correo: str, codigo: str) -> bool:
    usuario = get_usuario_by_correo(db, correo)
    if not usuario:
        return False
    
    registro = (
        db.query(models.CodigoVerificacion)
        .filter(
            models.CodigoVerificacion.usuario_id == usuario.id,
            models.CodigoVerificacion.codigo == codigo,
            models.CodigoVerificacion.usado == False
        )
        .first()
    )
    if not registro:
        return False
    
    # Verificar expiracion
    if registro.expira_en.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        return False
        
    registro.usado = True
    usuario.correo_verificado = True
    db.commit()
    return True

