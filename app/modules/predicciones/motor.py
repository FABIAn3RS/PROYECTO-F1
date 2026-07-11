import uuid
from datetime import datetime, timezone

from app.modules.pilotos.models import Piloto
from app.modules.predicciones.schemas import NivelConfianza, PilotoProbabilidad, PrediccionGPOut

# Algoritmo básico y determinista: combina la clasificación actual (piloto y
# escudería) con el rendimiento histórico en el circuito y la forma reciente.
# No usa Machine Learning, solo una suma ponderada normalizada a probabilidades.
PESO_PUNTOS_PILOTO = 1.0
PESO_PUNTOS_ESCUDERIA = 0.3
PESO_RENDIMIENTO_CIRCUITO = 2.5
PESO_FORMA_RECIENTE = 2.0
PISO_MINIMO = 1.0  # evita puntajes en cero cuando todavía no hay datos (ej. pretemporada)


def _observacion(piloto: Piloto, rendimiento_circuito: float, forma_reciente: float) -> str:
    if rendimiento_circuito > 0 and forma_reciente > 0:
        return f"{piloto.nombre} combina buen historial en este circuito con buena forma reciente."
    if rendimiento_circuito > 0:
        return f"{piloto.nombre} ha sumado puntos en ediciones anteriores de este circuito."
    if forma_reciente > 0:
        return f"{piloto.nombre} llega con buena forma en las últimas carreras de la temporada."
    return f"{piloto.nombre} parte apoyado principalmente en su posición actual del campeonato."


def generar_prediccion(
    gp_id: uuid.UUID,
    temporada: int,
    pilotos: list[Piloto],
    historial_circuito: dict[uuid.UUID, float],
    forma_reciente_por_piloto: dict[uuid.UUID, float],
) -> PrediccionGPOut:
    calculados: list[tuple[Piloto, float, float, float]] = []
    for piloto in pilotos:
        puntos_escuderia = piloto.escuderia.puntos_temporada if piloto.escuderia else 0
        rendimiento_circuito = historial_circuito.get(piloto.id, 0.0)
        forma = forma_reciente_por_piloto.get(piloto.id, 0.0)

        puntaje = (
            PISO_MINIMO
            + piloto.puntos_temporada * PESO_PUNTOS_PILOTO
            + puntos_escuderia * PESO_PUNTOS_ESCUDERIA
            + rendimiento_circuito * PESO_RENDIMIENTO_CIRCUITO
            + forma * PESO_FORMA_RECIENTE
        )
        calculados.append((piloto, puntaje, rendimiento_circuito, forma))

    calculados.sort(key=lambda item: item[1], reverse=True)
    puntaje_total = sum(item[1] for item in calculados)

    probabilidades = [
        PilotoProbabilidad(
            piloto_id=piloto.id,
            nombre=piloto.nombre,
            escuderia=piloto.escuderia.nombre if piloto.escuderia else None,
            puntaje=round(puntaje, 2),
            probabilidad=round((puntaje / puntaje_total) * 100, 1),
        )
        for piloto, puntaje, _, _ in calculados
    ]

    podio_probable = probabilidades[:3]
    ganador_probable = probabilidades[0]

    diferencia = probabilidades[0].probabilidad - (probabilidades[1].probabilidad if len(probabilidades) > 1 else 0)
    if diferencia > 8:
        nivel_confianza = NivelConfianza.ALTO
    elif diferencia > 3:
        nivel_confianza = NivelConfianza.MEDIO
    else:
        nivel_confianza = NivelConfianza.BAJO

    observaciones = [
        f"{indice + 1}. " + _observacion(piloto, rendimiento_circuito, forma)
        for indice, (piloto, _, rendimiento_circuito, forma) in enumerate(calculados[:3])
    ]

    return PrediccionGPOut(
        gran_premio_id=gp_id,
        temporada=temporada,
        generado_en=datetime.now(timezone.utc),
        ganador_probable=ganador_probable,
        podio_probable=podio_probable,
        probabilidades=probabilidades,
        nivel_confianza=nivel_confianza,
        observaciones=observaciones,
    )
