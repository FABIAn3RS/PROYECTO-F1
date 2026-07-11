from fastapi import HTTPException, status


class NoAutorizado(HTTPException):
    def __init__(self, detail: str = "No se pudo validar la credencial"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class SinPermisos(HTTPException):
    def __init__(self, detail: str = "No tienes permisos para esta acción"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class NoEncontrado(HTTPException):
    def __init__(self, detail: str = "Recurso no encontrado"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class SolicitudInvalida(HTTPException):
    def __init__(self, detail: str = "Solicitud inválida"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)
