from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.modules.auth import router as auth_router
from app.modules.calendario import router as calendario_router
from app.modules.usuarios import router as usuarios_router
from app.modules.escuderias import router as escuderias_router
from app.modules.pilotos import router as pilotos_router
from app.modules.pronosticos import router as pronosticos_router
from app.modules.resultados import router as resultados_router
from app.modules.acceso import router as acceso_router
from app.modules.admin import router as admin_router
from app.modules.predicciones import router as predicciones_router

app = FastAPI(
    title="Pronósticos Deportivos F1 - API",
    description="API de gestión de usuarios, calendario, predicciones, resultados y accesos",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router.router)
app.include_router(calendario_router.router)
app.include_router(usuarios_router.router)
app.include_router(escuderias_router.router)
app.include_router(pilotos_router.router)
app.include_router(pronosticos_router.router)
app.include_router(resultados_router.router)
app.include_router(acceso_router.router)
app.include_router(admin_router.router)
app.include_router(predicciones_router.router)


@app.get("/", tags=["Salud"])
def health_check():
    return {"status": "ok"}

