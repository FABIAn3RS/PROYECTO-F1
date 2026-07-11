import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import get_current_user
from app.modules.auth.models import Usuario
from app.modules.acceso import crud, schemas
from app.config import STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

try:
    import stripe
    if STRIPE_SECRET_KEY:
        stripe.api_key = STRIPE_SECRET_KEY
except ImportError:
    stripe = None

router = APIRouter(prefix="/acceso", tags=["Acceso/Pase"])


@router.post("/checkout", response_model=schemas.CheckoutSessionOut)
def create_checkout_session(
    datos: schemas.CheckoutSessionCreate,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verificar si ya tiene pase activo
    pase_activo = crud.obtener_pase_activo(db, usuario.id)
    if pase_activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya posees un pase de temporada activo."
        )

    session_id = f"mock_session_{uuid.uuid4()}"
    checkout_url = f"{datos.success_url}?session_id={session_id}"

    # Si stripe está instalado y hay llave configurada, intentar crear sesión real
    if STRIPE_SECRET_KEY and stripe:
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[{
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": "Pase de Temporada F1",
                            "description": "Acceso ilimitado a todos los Grandes Premios por 1 año",
                        },
                        "unit_amount": 2000,  # $20.00
                    },
                    "quantity": 1,
                }],
                mode="payment",
                success_url=f"{datos.success_url}?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=datos.cancel_url,
                client_reference_id=str(usuario.id),
            )
            session_id = session.id
            checkout_url = session.url
        except Exception:
            # Fallback en modo mock si falla Stripe
            pass

    # Guardar en base de datos como pendiente
    crud.crear_pase_pendiente(db, usuario.id, session_id)

    return schemas.CheckoutSessionOut(
        session_id=session_id,
        checkout_url=checkout_url
    )


@router.post("/mock-payment-success/{session_id}", status_code=status.HTTP_200_OK)
def mock_payment_success(session_id: str, db: Session = Depends(get_db)):
    """Simular éxito de pago en desarrollo."""
    pase = crud.activar_pase_por_session(db, session_id, f"mock_pi_{uuid.uuid4()}")
    if not pase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sesión de pago no encontrada o inválida."
        )
    return {"detail": "Pago simulado con éxito", "estado": pase.estado}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    if not stripe or not STRIPE_SECRET_KEY or not STRIPE_WEBHOOK_SECRET:
        return {"status": "skipped_no_keys"}

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Procesar evento
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        session_id = session.get("id")
        payment_intent_id = session.get("payment_intent")
        crud.activar_pase_por_session(db, session_id, payment_intent_id)
    elif event["type"] == "checkout.session.expired":
        session = event["data"]["object"]
        session_id = session.get("id")
        crud.fallar_pase_por_session(db, session_id)

    return {"status": "success"}
