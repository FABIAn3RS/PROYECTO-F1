import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from app.modules.auth.schemas import RolOut


class UsuarioUpdate(BaseModel):
    nombre: str | None = Field(None, min_length=2, max_length=100)
    correo: EmailStr | None = None
    piloto_favorito_id: uuid.UUID | None = None
    escuderia_favorita_id: uuid.UUID | None = None


class UsuarioPerfilOut(BaseModel):
    id: uuid.UUID
    nombre: str
    correo: EmailStr
    activo: bool
    rol: RolOut
    piloto_favorito_id: uuid.UUID | None = None
    escuderia_favorita_id: uuid.UUID | None = None
    gp_gratis_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EstadisticasOut(BaseModel):
    pronosticos_totales: int
    pronosticos_confirmados: int
    puntos_totales: int
    aciertos_pole: int
    aciertos_vuelta_rapida: int
    aciertos_podio: int
