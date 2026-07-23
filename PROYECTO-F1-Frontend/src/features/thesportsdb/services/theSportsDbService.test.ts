import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  filtrarGrandesPremios, 
  obtenerFotoPilotoPorNombre,
  obtenerLigaF1,
  listarEquiposF1,
  buscarEquipoF1,
  obtenerEquipoF1,
  listarPilotosEquipoF1,
  buscarPilotoF1,
  obtenerPilotoF1,
  listarEventosTemporadaF1,
  listarProximosEventosF1,
  listarEventosPasadosF1,
  obtenerEventoF1,
  obtenerResultadosEventoF1,
  obtenerDatosCompletosF1
} from './theSportsDbService';
import theSportsDbClient from '../../../core/api/theSportsDbClient';

vi.mock('../../../core/api/theSportsDbClient', () => {
  return {
    default: {
      get: vi.fn(),
    },
  };
});

describe('theSportsDbService tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('filtrarGrandesPremios', () => {
    it('debe filtrar eventos correctamente', () => {
      const eventos: any[] = [
        { strEvent: 'Spanish Grand Prix' },
        { strEvent: 'Spanish Grand Prix - Practice 1' },
        { strEvent: 'Spanish Grand Prix - Qualifying' },
        { strEvent: 'Spanish Grand Prix - Sprint' },
      ];
      expect(filtrarGrandesPremios(eventos)).toHaveLength(1);
      expect(filtrarGrandesPremios(eventos)[0].strEvent).toBe('Spanish Grand Prix');
    });
  });

  describe('obtenerLigaF1', () => {
    it('debe retornar la liga de F1', async () => {
      vi.mocked(theSportsDbClient.get).mockResolvedValue({
        data: { leagues: [{ idLeague: '4370', strLeague: 'Formula 1' }] }
      } as any);
      const liga = await obtenerLigaF1();
      expect(liga).not.toBeNull();
      expect(liga?.strLeague).toBe('Formula 1');
    });

    it('debe retornar null si no hay ligas', async () => {
      vi.mocked(theSportsDbClient.get).mockResolvedValue({
        data: { leagues: null }
      } as any);
      const liga = await obtenerLigaF1();
      expect(liga).toBeNull();
    });
  });

  describe('listarEquiposF1', () => {
    it('debe retornar los equipos de F1', async () => {
      vi.mocked(theSportsDbClient.get).mockResolvedValue({
        data: { teams: [{ idTeam: '1', strLeague: 'Formula 1', idLeague: '4370' }] }
      } as any);
      const equipos = await listarEquiposF1();
      expect(equipos).toHaveLength(1);
    });
  });

  describe('buscarEquipoF1', () => {
    it('debe retornar resultados de la busqueda', async () => {
      vi.mocked(theSportsDbClient.get).mockResolvedValue({
        data: { teams: [{ idTeam: '1', strLeague: 'Formula 1', idLeague: '4370' }] }
      } as any);
      const equipos = await buscarEquipoF1('Ferrari');
      expect(equipos).toHaveLength(1);
    });

    it('debe retornar vacio para busquedas vacias', async () => {
      const equipos = await buscarEquipoF1('   ');
      expect(equipos).toHaveLength(0);
    });
  });

  describe('obtenerEquipoF1', () => {
    it('debe retornar el equipo por id', async () => {
      vi.mocked(theSportsDbClient.get).mockResolvedValue({
        data: { teams: [{ idTeam: '1', strLeague: 'Formula 1', idLeague: '4370' }] }
      } as any);
      const equipo = await obtenerEquipoF1('1');
      expect(equipo).not.toBeNull();
    });
  });

  describe('listarPilotosEquipoF1', () => {
    it('debe retornar los pilotos de un equipo', async () => {
      vi.mocked(theSportsDbClient.get).mockResolvedValue({
        data: { player: [{ idPlayer: '1', strSport: 'Motorsport' }] }
      } as any);
      const pilotos = await listarPilotosEquipoF1('1');
      expect(pilotos).toHaveLength(1);
    });
  });

  describe('buscarPilotoF1', () => {
    it('debe buscar pilotos por nombre', async () => {
      vi.mocked(theSportsDbClient.get).mockResolvedValue({
        data: { player: [{ idPlayer: '1', strSport: 'Motorsport' }] }
      } as any);
      const pilotos = await buscarPilotoF1('Alonso');
      expect(pilotos).toHaveLength(1);
    });
  });

  describe('obtenerFotoPilotoPorNombre', () => {
    it('debe cachear resultados', async () => {
      vi.mocked(theSportsDbClient.get).mockResolvedValue({
        data: { player: [{ idPlayer: '1', strSport: 'Motorsport', strCutout: 'img_url' }] }
      } as any);
      const foto1 = await obtenerFotoPilotoPorNombre('Alonso');
      expect(foto1).toBe('img_url');

      // Second call should hit the cache without calling the API
      const foto2 = await obtenerFotoPilotoPorNombre('Alonso');
      expect(foto2).toBe('img_url');
      expect(theSportsDbClient.get).toHaveBeenCalledTimes(1);
    });

    it('debe retornar null para nombres vacíos', async () => {
      const result = await obtenerFotoPilotoPorNombre('');
      expect(result).toBeNull();
    });
  });

  describe('obtenerPilotoF1', () => {
    it('debe obtener el piloto', async () => {
      vi.mocked(theSportsDbClient.get).mockResolvedValue({
        data: { players: [{ idPlayer: '1', strSport: 'Motorsport' }] }
      } as any);
      const piloto = await obtenerPilotoF1('1');
      expect(piloto).not.toBeNull();
    });
  });

  describe('listarEventosTemporadaF1', () => {
    it('debe listar eventos', async () => {
      vi.mocked(theSportsDbClient.get).mockResolvedValue({
        data: { events: [{ idEvent: '1', strLeague: 'Formula 1', idLeague: '4370' }] }
      } as any);
      const eventos = await listarEventosTemporadaF1(2026);
      expect(eventos).toHaveLength(1);
    });
  });

  describe('listarProximosEventosF1', () => {
    it('debe listar proximos eventos', async () => {
      vi.mocked(theSportsDbClient.get).mockResolvedValue({
        data: { events: [{ idEvent: '1', strLeague: 'Formula 1', idLeague: '4370' }] }
      } as any);
      const eventos = await listarProximosEventosF1();
      expect(eventos).toHaveLength(1);
    });
  });

  describe('listarEventosPasadosF1', () => {
    it('debe listar eventos pasados', async () => {
      vi.mocked(theSportsDbClient.get).mockResolvedValue({
        data: { events: [{ idEvent: '1', strLeague: 'Formula 1', idLeague: '4370' }] }
      } as any);
      const eventos = await listarEventosPasadosF1();
      expect(eventos).toHaveLength(1);
    });
  });

  describe('obtenerEventoF1', () => {
    it('debe obtener un evento', async () => {
      vi.mocked(theSportsDbClient.get).mockResolvedValue({
        data: { events: [{ idEvent: '1', strLeague: 'Formula 1', idLeague: '4370' }] }
      } as any);
      const evento = await obtenerEventoF1('1');
      expect(evento).not.toBeNull();
    });
  });

  describe('obtenerResultadosEventoF1', () => {
    it('debe obtener resultados', async () => {
      vi.mocked(theSportsDbClient.get).mockResolvedValue({
        data: { results: [{ idResult: '1' }] }
      } as any);
      const resultados = await obtenerResultadosEventoF1('1');
      expect(resultados).toHaveLength(1);
    });
  });

  describe('obtenerDatosCompletosF1', () => {
    it('debe retornar datos agrupados', async () => {
      vi.mocked(theSportsDbClient.get).mockResolvedValue({
        data: { 
          leagues: [{ idLeague: '4370', strLeague: 'Formula 1' }],
          teams: [{ idTeam: '1', strLeague: 'Formula 1', idLeague: '4370' }],
          events: [{ idEvent: '1', strEvent: 'Monaco Grand Prix', strLeague: 'Formula 1', idLeague: '4370' }]
        }
      } as any);
      const datos = await obtenerDatosCompletosF1(2026);
      expect(datos.liga).not.toBeNull();
      expect(datos.equipos).toHaveLength(1);
      expect(datos.eventos).toHaveLength(1);
    });
  });
});
