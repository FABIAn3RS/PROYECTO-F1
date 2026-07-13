import theSportsDbClient from '../../../core/api/theSportsDbClient';
import {
  F1_LEAGUE_ID,
  type TheSportsDbEvent,
  type TheSportsDbEventResult,
  type TheSportsDbLeague,
  type TheSportsDbPlayer,
  type TheSportsDbTeam,
} from '../../../models/theSportsDb';

function esEquipoF1(equipo: TheSportsDbTeam): boolean {
  return equipo.idLeague === F1_LEAGUE_ID || equipo.strLeague === 'Formula 1';
}

function esEventoF1(evento: TheSportsDbEvent): boolean {
  return evento.idLeague === F1_LEAGUE_ID || evento.strLeague === 'Formula 1';
}

function esPilotoF1(piloto: TheSportsDbPlayer): boolean {
  return piloto.strSport === 'Motorsport';
}

function normalizarLista<T>(valor: T | T[] | null | undefined): T[] {
  if (!valor) return [];
  return Array.isArray(valor) ? valor : [valor];
}

export async function obtenerLigaF1(): Promise<TheSportsDbLeague | null> {
  const { data } = await theSportsDbClient.get<{ leagues: TheSportsDbLeague[] | null }>(
    '/lookupleague.php',
    { params: { id: F1_LEAGUE_ID } },
  );
  return data.leagues?.[0] ?? null;
}

export async function listarEquiposF1(): Promise<TheSportsDbTeam[]> {
  const { data } = await theSportsDbClient.get<{ teams: TheSportsDbTeam[] | null }>(
    '/search_all_teams.php',
    { params: { l: 'Formula_1' } },
  );

  const equipos = normalizarLista(data.teams).filter(esEquipoF1);
  if (equipos.length > 0) return equipos;

  const respaldo = await theSportsDbClient.get<{ teams: TheSportsDbTeam[] | null }>(
    '/lookup_all_teams.php',
    { params: { id: F1_LEAGUE_ID } },
  );

  return normalizarLista(respaldo.data.teams).filter(esEquipoF1);
}

export async function buscarEquipoF1(nombre: string): Promise<TheSportsDbTeam[]> {
  const consulta = nombre.trim().replace(/\s+/g, '_');
  if (!consulta) return [];

  const { data } = await theSportsDbClient.get<{ teams: TheSportsDbTeam[] | null }>(
    '/searchteams.php',
    { params: { t: consulta } },
  );

  return normalizarLista(data.teams).filter(esEquipoF1);
}

export async function obtenerEquipoF1(idEquipo: string): Promise<TheSportsDbTeam | null> {
  const { data } = await theSportsDbClient.get<{ teams: TheSportsDbTeam[] | null }>(
    '/lookupteam.php',
    { params: { id: idEquipo } },
  );
  const equipo = data.teams?.[0] ?? null;
  return equipo && esEquipoF1(equipo) ? equipo : null;
}

export async function listarPilotosEquipoF1(idEquipo: string): Promise<TheSportsDbPlayer[]> {
  const { data } = await theSportsDbClient.get<{ player: TheSportsDbPlayer[] | null }>(
    '/lookup_all_players.php',
    { params: { id: idEquipo } },
  );
  return normalizarLista(data.player).filter(esPilotoF1);
}

export async function buscarPilotoF1(nombre: string): Promise<TheSportsDbPlayer[]> {
  const consulta = nombre.trim().replace(/\s+/g, '_');
  if (!consulta) return [];

  const { data } = await theSportsDbClient.get<{ player: TheSportsDbPlayer[] | null }>(
    '/searchplayers.php',
    { params: { p: consulta } },
  );

  return normalizarLista(data.player).filter(esPilotoF1);
}

// Caché en memoria (por nombre) para no repetir búsquedas al mostrar el mismo
// piloto en distintas pantallas/pasos durante la sesión.
const cacheFotoPiloto = new Map<string, string | null>();

export async function obtenerFotoPilotoPorNombre(nombre: string): Promise<string | null> {
  const clave = nombre.trim().toLowerCase();
  if (!clave) return null;
  if (cacheFotoPiloto.has(clave)) return cacheFotoPiloto.get(clave) ?? null;

  try {
    const resultados = await buscarPilotoF1(nombre);
    const foto = resultados[0]?.strCutout ?? resultados[0]?.strThumb ?? null;
    cacheFotoPiloto.set(clave, foto);
    return foto;
  } catch {
    cacheFotoPiloto.set(clave, null);
    return null;
  }
}

export async function obtenerPilotoF1(idPiloto: string): Promise<TheSportsDbPlayer | null> {
  const { data } = await theSportsDbClient.get<{ players: TheSportsDbPlayer[] | null }>(
    '/lookupplayer.php',
    { params: { id: idPiloto } },
  );
  const piloto = data.players?.[0] ?? null;
  return piloto && esPilotoF1(piloto) ? piloto : null;
}

export async function listarEventosTemporadaF1(temporada: number): Promise<TheSportsDbEvent[]> {
  const { data } = await theSportsDbClient.get<{ events: TheSportsDbEvent[] | null }>(
    '/eventsseason.php',
    { params: { id: F1_LEAGUE_ID, s: temporada } },
  );
  return normalizarLista(data.events).filter(esEventoF1);
}

export async function listarProximosEventosF1(): Promise<TheSportsDbEvent[]> {
  const { data } = await theSportsDbClient.get<{ events: TheSportsDbEvent[] | null }>(
    '/eventsnextleague.php',
    { params: { id: F1_LEAGUE_ID } },
  );
  return normalizarLista(data.events).filter(esEventoF1);
}

export async function listarEventosPasadosF1(): Promise<TheSportsDbEvent[]> {
  const { data } = await theSportsDbClient.get<{ events: TheSportsDbEvent[] | null }>(
    '/eventspastleague.php',
    { params: { id: F1_LEAGUE_ID } },
  );
  return normalizarLista(data.events).filter(esEventoF1);
}

export async function obtenerEventoF1(idEvento: string): Promise<TheSportsDbEvent | null> {
  const { data } = await theSportsDbClient.get<{ events: TheSportsDbEvent[] | null }>(
    '/lookupevent.php',
    { params: { id: idEvento } },
  );
  const evento = data.events?.[0] ?? null;
  return evento && esEventoF1(evento) ? evento : null;
}

export async function obtenerResultadosEventoF1(
  idEvento: string,
): Promise<TheSportsDbEventResult[]> {
  const { data } = await theSportsDbClient.get<{ results: TheSportsDbEventResult[] | null }>(
    '/eventresults.php',
    { params: { id: idEvento } },
  );
  return normalizarLista(data.results);
}

export function filtrarGrandesPremios(eventos: TheSportsDbEvent[]): TheSportsDbEvent[] {
  return eventos.filter((evento) => {
    const nombre = evento.strEvent.toLowerCase();
    return nombre.includes('grand prix') && !nombre.includes('practice') && !nombre.includes('qualifying') && !nombre.includes('sprint');
  });
}

export async function obtenerDatosCompletosF1(temporada: number) {
  const [liga, equipos, eventos, proximos, pasados] = await Promise.all([
    obtenerLigaF1(),
    listarEquiposF1(),
    listarEventosTemporadaF1(temporada),
    listarProximosEventosF1(),
    listarEventosPasadosF1(),
  ]);

  return {
    liga,
    equipos,
    eventos,
    grandesPremios: filtrarGrandesPremios(eventos),
    proximos,
    pasados,
  };
}
