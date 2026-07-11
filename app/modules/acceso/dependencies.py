from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import get_current_user
from app.modules.auth.models import Usuario
from app.modules.acceso.crud import obtener_pase_activo


def verificar_pase_pronosticos(
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Usuario:
    """El pase solo habilita la participación en pronósticos, no contenido informativo."""
    if usuario.rol.nombre == "administrador" or obtener_pase_activo(db, usuario.id):
        return usuario
    raise HTTPException(
        status_code=status.HTTP_402_PAYMENT_REQUIRED,
        detail="Se requiere un pase de temporada activo para realizar pronósticos.",
    )
