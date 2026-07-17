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
    correo_verificado: bool
    telefono: str | None = None
    telefono_verificado: bool
    kyc_estado: str
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


class VerificarTelefonoRequest(BaseModel):
    telefono: str = Field(..., min_length=7, max_length=30)
    firebase_token: str


class KycSessionOut(BaseModel):
    session_id: str
    url: str
    session_token: str | None = None
    status: str

