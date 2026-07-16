import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from app.modules.resultados.schemas import ResultadoPosicionCreate
from app.modules.auth.schemas import RolOut


class GranPremioCreate(BaseModel):
    nombre: str = Field(..., max_length=150)
    pais: str = Field(..., max_length=100)
    circuito: str = Field(..., max_length=150)
    temporada: int
    ronda: int
    fecha_inicio: datetime
    fecha_carrera: datetime


class GranPremioUpdate(BaseModel):
    nombre: str | None = Field(None, max_length=150)
    pais: str | None = Field(None, max_length=100)
    circuito: str | None = Field(None, max_length=150)
    temporada: int | None = None
    ronda: int | None = None
    fecha_inicio: datetime | None = None
    fecha_carrera: datetime | None = None


class ResultadoOficialCreate(BaseModel):
    posiciones: list[ResultadoPosicionCreate]


class UsuarioAdminOut(BaseModel):
    id: uuid.UUID
    nombre: str
    correo: EmailStr
    activo: bool
    correo_verificado: bool
    telefono_verificado: bool
    kyc_estado: str
    rol: RolOut
    created_at: datetime

    class Config:
        from_attributes = True


class UsuarioAdminUpdate(BaseModel):
    nombre: str | None = Field(None, min_length=2, max_length=100)
    correo: EmailStr | None = None
    activo: bool | None = None
    rol_nombre: str | None = Field(None, pattern="^(usuario|administrador)$")
