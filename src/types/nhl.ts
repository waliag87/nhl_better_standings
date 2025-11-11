/**
 * NHL API Response Interfaces
 * Based on the NHL API endpoint: https://api-web.nhle.com/v1/standings/now
 */

/**
 * Team record information from NHL API
 */
export interface NHLTeamRecord {
  wins: number;
  losses: number;
  otLosses: number;
  gamesPlayed: number;
  points: number;
  regulationWins?: number;
  regulationPlusOtWins?: number;
}

/**
 * Team information from NHL API
 */
export interface NHLTeam {
  id: number;
  name: string;
  abbrev: string;
  divisionName: string;
  conferenceName: string;
  placeName?: {
    default: string;
  };
  teamLogo?: string;
}

/**
 * Standing entry from NHL API
 */
export interface NHLStandingEntry {
  teamAbbrev: {
    default: string;
  };
  teamName: {
    default: string;
  };
  teamCommonName: {
    default: string;
  };
  teamLogo: string;
  wins: number;
  losses: number;
  otLosses: number;
  points: number;
  gamesPlayed: number;
  regulationWins: number;
  regulationPlusOtWins: number;
  divisionName: string;
  conferenceName: string;
  divisionAbbrev: string;
  conferenceAbbrev: string;
  placeName?: {
    default: string;
  };
}

/**
 * Complete NHL API response structure
 */
export interface NHLApiResponse {
  standings: NHLStandingEntry[];
  wildCardIndicator?: boolean;
}
