import uuid
from datetime import datetime
from pydantic import BaseModel
from decimal import Decimal


class PaseTemporadaBase(BaseModel):
    id: uuid.UUID
    usuario_id: uuid.UUID
    estado: str
    monto: Decimal
    moneda: str
    fecha_pago: datetime | None = None
    fecha_expiracion: datetime | None = None

    class Config:
        from_attributes = True


class CheckoutSessionCreate(BaseModel):
    success_url: str
    cancel_url: str


class CheckoutSessionOut(BaseModel):
    session_id: str
    checkout_url: str
