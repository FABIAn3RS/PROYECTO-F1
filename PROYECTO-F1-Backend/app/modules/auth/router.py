from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import verify_password, create_access_token, oauth2_scheme, token_blacklist
from app.core.exceptions import NoAutorizado, SinPermisos, SolicitudInvalida
from app.modules.auth import crud, schemas, models

router = APIRouter(prefix="/auth", tags=["Autenticación"])


from app.core.email import send_verification_email


# HU-01: Registro de usuario
@router.post("/register", response_model=schemas.UsuarioOut, status_code=status.HTTP_201_CREATED)
def registrar(datos: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    if crud.get_usuario_by_correo(db, datos.correo):
        raise SolicitudInvalida("El correo ya está registrado")
    usuario = crud.crear_usuario(db, datos)
    
    # Generar código de verificación
    codigo = crud.crear_codigo_verificacion(db, usuario.id)
    
    # Enviar email
    send_verification_email(usuario.correo, codigo)
    
    return usuario


# HU-02: Inicio de sesión
@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    usuario = crud.get_usuario_by_correo(db, form_data.username)

    if not usuario or not verify_password(form_data.password, usuario.password_hash):
        raise NoAutorizado("Correo o contraseña incorrectos")

    if not usuario.activo:
        raise SinPermisos("Cuenta inactiva")
        
    if not usuario.correo_verificado:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="correo_no_verificado"
        )

    access_token = create_access_token(data={"sub": str(usuario.id)})
    return schemas.Token(access_token=access_token)


@router.post("/verify-email", status_code=status.HTTP_200_OK)
def verificar_correo(datos: schemas.VerifyEmailRequest, db: Session = Depends(get_db)):
    exito = crud.validar_codigo_verificacion(db, datos.correo, datos.codigo)
    if not exito:
        raise SolicitudInvalida("Código de verificación inválido, usado o expirado")
    return {"detail": "Correo verificado correctamente"}


@router.post("/resend-code", status_code=status.HTTP_200_OK)
def reenviar_codigo(datos: schemas.ResendCodeRequest, db: Session = Depends(get_db)):
    usuario = crud.get_usuario_by_correo(db, datos.correo)
    if not usuario:
        raise SolicitudInvalida("El correo no está registrado")
    if usuario.correo_verificado:
        return {"detail": "El correo ya está verificado"}
    
    codigo = crud.crear_codigo_verificacion(db, usuario.id)
    send_verification_email(usuario.correo, codigo)
    return {"detail": "Código de verificación reenviado correctamente"}



# HU-04: Cerrar sesión (invalida el token actual vía blacklist)
@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(token: str = Depends(oauth2_scheme)):
    token_blacklist.add(token)
    return {"detail": "Sesión cerrada correctamente"}


# HU-03: Solicitar recuperación de contraseña
@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(datos: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    usuario = crud.get_usuario_by_correo(db, datos.correo)
    if usuario:
        token = crud.crear_reset_token(db, usuario)
        # En producción: enviar `token` por correo, no devolverlo en la respuesta.
        return {"detail": "Si el correo existe, se generó un token", "token_debug": token}
    return {"detail": "Si el correo existe, se generó un token"}


# HU-03: Establecer nueva contraseña con el token recibido
@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(datos: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    reset = crud.validar_reset_token(db, datos.token)
    if not reset:
        raise SolicitudInvalida("Token inválido o expirado")

    usuario = db.query(models.Usuario).filter(models.Usuario.id == reset.usuario_id).first()
    crud.actualizar_password(db, usuario, datos.nueva_password)

    reset.usado = True
    db.commit()

    return {"detail": "Contraseña actualizada correctamente"}
