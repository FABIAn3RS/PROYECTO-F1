from sqlalchemy import Column, String, Boolean, Integer, ForeignKey, DateTime, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Rol(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True)
    nombre = Column(String(30), nullable=False, unique=True)
    descripcion = Column(String(150))
    created_at = Column(DateTime, server_default=func.now())

    usuarios = relationship("Usuario", back_populates="rol")


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    nombre = Column(String(100), nullable=False)
    correo = Column(String(150), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    rol_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    activo = Column(Boolean, nullable=False, default=True)

    # EP-02: preferencias de perfil
    piloto_favorito_id = Column(UUID(as_uuid=True), ForeignKey("pilotos.id"), nullable=True)
    escuderia_favorita_id = Column(UUID(as_uuid=True), ForeignKey("escuderias.id"), nullable=True)

    # EP-07: carrera gratis asignada
    gp_gratis_id = Column(UUID(as_uuid=True), ForeignKey("grandes_premios.id"), nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    rol = relationship("Rol", back_populates="usuarios")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(255), nullable=False, unique=True)
    expira_en = Column(DateTime, nullable=False)
    usado = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, server_default=func.now())
