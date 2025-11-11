/**
 * Processed Standings Interfaces
 * Used for calculating and displaying NHL standings with playoff positions
 */

/**
 * Playoff status for a team
 */
export type PlayoffStatus = 'clinched' | 'eliminated' | 'competing';

/**
 * Processed team with calculated standings information
 */
export interface Team {
  id: number;
  name: string;
  abbreviation: string;
  wins: number;
  losses: number;
  otLosses: number;
  points: number;
  gamesPlayed: number;
  pointPercentage: number;
  regulationWins: number;
  regulationPlusOtWins: number;
  division: string;
  conference: string;
  isDivisionLeader: boolean;
  isWildCard: boolean;
  divisionRank: number;
  conferenceRank: number;
  // Playoff calculator properties
  remainingGames?: number;
  remainingPoints?: number;
  maxPossiblePoints?: number;
  playoffStatus?: PlayoffStatus;
  requiredPointsPercentage?: number;
}

/**
 * Conference standings organized by divisions and wild cards
 */
export interface ConferenceStandings {
  divisions: {
    [divisionName: string]: Team[];
  };
  wildCards: Team[];
}

/**
 * Complete processed standings for both conferences
 */
export interface ProcessedStandings {
  eastern: ConferenceStandings;
  western: ConferenceStandings;
  lastUpdated: string;
  isStaleData?: boolean; // Flag indicating if data is from cache due to fetch failure
  cacheTimestamp?: string; // Original timestamp when data was cached
}

/**
 * Tiebreaker comparison result
 */
export enum TiebreakerResult {
  TEAM_A_WINS = -1,
  TIE = 0,
  TEAM_B_WINS = 1,
}

/**
 * Tiebreaker function type for comparing two teams
 */
export type TiebreakerFunction = (teamA: Team, teamB: Team) => TiebreakerResult;

/**
 * Point percentage calculation input
 */
export interface PointPercentageInput {
  points: number;
  gamesPlayed: number;
}

/**
 * Point percentage calculation result
 */
export interface PointPercentageResult {
  percentage: number;
  formatted: string; // Three decimal places
}

/**
 * Playoff calculations for a team based on a playoff threshold
 */
export interface PlayoffCalculations {
  remainingGames: number;
  remainingPoints: number;
  maxPossiblePoints: number;
  pointsGap: number;
  requiredPointsPercentage: number | null;
  playoffStatus: PlayoffStatus;
}
