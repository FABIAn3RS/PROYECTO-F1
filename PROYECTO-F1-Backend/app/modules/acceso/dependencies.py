import uuid
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.auth.models import Usuario
from app.modules.acceso.crud import obtener_pase_activo
from app.modules.calendario.crud import obtener_proximo_gran_premio


def verificar_pase_pronosticos(gp_id: uuid.UUID, usuario: Usuario, db: Session) -> None:
    """
    Un pronóstico solo se puede crear/editar/confirmar si el usuario:
    - es administrador, o
    - tiene un pase de temporada activo (pronósticos ilimitados), o
    - está usando su pronóstico gratuito en el GP que se le asignó automáticamente
      (el próximo GP a correrse en el momento en que lo reclama por primera vez).
    """
    if usuario.rol.nombre == "administrador":
        return
    if obtener_pase_activo(db, usuario.id):
        return

    if usuario.gp_gratis_id is None:
        proximo_gp = obtener_proximo_gran_premio(db)
        if proximo_gp:
            usuario.gp_gratis_id = proximo_gp.id
            db.commit()
            db.refresh(usuario)

    if usuario.gp_gratis_id == gp_id:
        return

    raise HTTPException(
        status_code=status.HTTP_402_PAYMENT_REQUIRED,
        detail="Se requiere un pase de temporada activo o usar tu pronóstico gratuito para este Gran Premio.",
    )
