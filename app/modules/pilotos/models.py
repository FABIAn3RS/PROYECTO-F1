from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Piloto(Base):
    __tablename__ = "pilotos"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    nombre = Column(String(100), nullable=False)
    nacionalidad = Column(String(80))
    numero = Column(Integer)
    escuderia_id = Column(UUID(as_uuid=True), ForeignKey("escuderias.id", ondelete="SET NULL"), nullable=True)
    puntos_temporada = Column(Integer, nullable=False, default=0)
    temporada = Column(Integer, nullable=False)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    escuderia = relationship("Escuderia", back_populates="pilotos")
