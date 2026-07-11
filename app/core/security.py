import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.database import get_db
from app.core.exceptions import NoAutorizado, SinPermisos
from app.modules.auth import models

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Blacklist en memoria para tokens invalidados por logout (HU-04).
# En producción conviene usar Redis en vez de un set en memoria de un solo proceso.
token_blacklist: set[str] = set()


def hash_password(password: str) -> str:
    # bcrypt has a 72-byte limit on the password.
    # To handle passwords longer than 72 bytes without ValueError, we truncate them.
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        password_bytes = plain_password.encode('utf-8')[:72]
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.Usuario:
    if token in token_blacklist:
        raise NoAutorizado()

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise NoAutorizado()
    except JWTError:
        raise NoAutorizado()

    usuario = db.query(models.Usuario).filter(models.Usuario.id == user_id).first()
    if usuario is None or not usuario.activo:
        raise NoAutorizado()

    return usuario


def get_current_admin(usuario: models.Usuario = Depends(get_current_user)) -> models.Usuario:
    if usuario.rol.nombre != "administrador":
        raise SinPermisos("Requiere permisos de administrador")
    return usuario
