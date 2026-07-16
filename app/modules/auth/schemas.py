import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator


class RolOut(BaseModel):
    id: int
    nombre: str

    class Config:
        from_attributes = True


class UsuarioBase(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)
    correo: EmailStr


class UsuarioCreate(UsuarioBase):
    password: str = Field(min_length=8, max_length=72)

    @field_validator("password")
    @classmethod
    def password_segura(cls, v: str) -> str:
        # HU-01: la contraseña debe cumplir requisitos mínimos de seguridad
        if not any(c.isupper() for c in v):
            raise ValueError("La contraseña debe tener al menos una mayúscula")
        if not any(c.isdigit() for c in v):
            raise ValueError("La contraseña debe tener al menos un número")
        return v


class UsuarioOut(UsuarioBase):
    id: uuid.UUID
    activo: bool
    correo_verificado: bool
    telefono: str | None = None
    telefono_verificado: bool
    kyc_estado: str
    rol: RolOut
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    correo: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    nueva_password: str = Field(min_length=8, max_length=72)

    @field_validator("nueva_password")
    @classmethod
    def password_segura(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("La contraseña debe tener al menos una mayúscula")
        if not any(c.isdigit() for c in v):
            raise ValueError("La contraseña debe tener al menos un número")
        return v


class VerifyEmailRequest(BaseModel):
    correo: EmailStr
    codigo: str = Field(min_length=6, max_length=6)


class ResendCodeRequest(BaseModel):
    correo: EmailStr

