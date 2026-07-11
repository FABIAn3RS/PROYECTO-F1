from sqlalchemy.orm import Session
from app.modules.auth.models import Usuario
from app.modules.usuarios import schemas


def actualizar_usuario(db: Session, usuario: Usuario, datos: schemas.UsuarioUpdate) -> Usuario:
    update_data = datos.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(usuario, key, value)
    db.commit()
    db.refresh(usuario)
    return usuario
