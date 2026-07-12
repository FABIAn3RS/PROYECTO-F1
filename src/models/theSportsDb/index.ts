export const F1_LEAGUE_ID = '4370';

export interface TheSportsDbLeague {
  idLeague: string;
  strLeague: string;
  strSport: string;
  strLeagueAlternate: string | null;
  intFormedYear: string | null;
  strCountry: string | null;
  strWebsite: string | null;
  strFacebook: string | null;
  strTwitter: string | null;
  strInstagram: string | null;
  strDescriptionEN: string | null;
  strBadge: string | null;
  strLogo: string | null;
  strBanner: string | null;
  strPoster: string | null;
  strTrophy: string | null;
}

export interface TheSportsDbTeam {
  idTeam: string;
  strTeam: string;
  strTeamAlternate: string | null;
  strTeamShort: string | null;
  intFormedYear: string | null;
  strSport: string;
  strLeague: string;
  idLeague: string;
  strCountry: string | null;
  strLocation: string | null;
  strWebsite: string | null;
  strDescriptionEN: string | null;
  strColour1: string | null;
  strColour2: string | null;
  strColour3: string | null;
  strBadge: string | null;
  strLogo: string | null;
  strBanner: string | null;
  strEquipment: string | null;
  strStadium: string | null;
}

export interface TheSportsDbPlayer {
  idPlayer: string;
  strPlayer: string;
  strNationality: string | null;
  dateBorn: string | null;
  strNumber: string | null;
  strPosition: string | null;
  strSport: string;
  strTeam: string | null;
  idTeam: string | null;
  strDescriptionEN: string | null;
  strThumb: string | null;
  strCutout: string | null;
  strRender: string | null;
  strBirthLocation: string | null;
  strHeight: string | null;
  strWeight: string | null;
}

export interface TheSportsDbEvent {
  idEvent: string;
  strEvent: string;
  strSeason: string;
  idLeague: string;
  strLeague: string;
  strSport: string;
  intRound: string | null;
  dateEvent: string;
  strTime: string | null;
  strTimestamp: string | null;
  strVenue: string | null;
  strCountry: string | null;
  strStatus: string | null;
  strThumb: string | null;
  strPoster: string | null;
  strVideo: string | null;
  strPostponed: string | null;
}

export interface TheSportsDbEventResult {
  idResult: string;
  idEvent: string;
  strEvent: string;
  strResult: string;
  intPosition: string | null;
  strPlayer: string | null;
  idPlayer: string | null;
  strTeam: string | null;
  idTeam: string | null;
  strCountry: string | null;
  strTime: string | null;
  strDetail: string | null;
}
