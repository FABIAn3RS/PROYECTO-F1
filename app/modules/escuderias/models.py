from sqlalchemy import Column, String, Integer, DateTime, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Escuderia(Base):
    __tablename__ = "escuderias"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    nombre = Column(String(100), nullable=False)
    nacionalidad = Column(String(80))
    color = Column(String(7))  # ej. '#FF1801'
    puntos_temporada = Column(Integer, nullable=False, default=0)
    temporada = Column(Integer, nullable=False)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    pilotos = relationship("Piloto", back_populates="escuderia")
