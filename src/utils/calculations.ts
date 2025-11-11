/**
 * Standings Calculation Utilities
 * Functions for calculating point percentages, applying tiebreakers, and sorting teams
 */

import { Team, TiebreakerResult } from '../types/standings.js';

/**
 * Calculate point percentage for a team
 * Point Percentage = Points / (Games Played × 2)
 * 
 * @param points - Total points earned by the team
 * @param gamesPlayed - Total games played by the team
 * @returns Point percentage with three decimal places
 */
export function calculatePointPercentage(points: number, gamesPlayed: number): number {
  if (gamesPlayed === 0) {
    return 0;
  }
  
  const maxPossiblePoints = gamesPlayed * 2;
  const percentage = points / maxPossiblePoints;
  
  // Round to three decimal places
  return Math.round(percentage * 1000) / 1000;
}

/**
 * Compare two teams using NHL tiebreaker rules
 * Applied when teams have identical point percentages
 * 
 * Tiebreaker order:
 * 1. Games played (fewer is better)
 * 2. Regulation wins (more is better)
 * 
 * @param teamA - First team to compare
 * @param teamB - Second team to compare
 * @returns TiebreakerResult indicating which team ranks higher
 */
export function applyTiebreaker(teamA: Team, teamB: Team): TiebreakerResult {
  // Tiebreaker 1: Fewer games played is better
  if (teamA.gamesPlayed < teamB.gamesPlayed) {
    return TiebreakerResult.TEAM_A_WINS;
  }
  if (teamA.gamesPlayed > teamB.gamesPlayed) {
    return TiebreakerResult.TEAM_B_WINS;
  }
  
  // Tiebreaker 2: More regulation wins is better
  if (teamA.regulationWins > teamB.regulationWins) {
    return TiebreakerResult.TEAM_A_WINS;
  }
  if (teamA.regulationWins < teamB.regulationWins) {
    return TiebreakerResult.TEAM_B_WINS;
  }
  
  // If still tied, return TIE
  return TiebreakerResult.TIE;
}

/**
 * Sort teams by point percentage with tiebreaker rules
 * Teams are sorted in descending order (highest point percentage first)
 * 
 * @param teams - Array of teams to sort
 * @returns Sorted array of teams (does not mutate original array)
 */
export function sortTeamsByStandings(teams: Team[]): Team[] {
  // Create a copy to avoid mutating the original array
  const sortedTeams = [...teams];
  
  sortedTeams.sort((teamA, teamB) => {
    // Primary sort: Point percentage (descending)
    if (teamA.pointPercentage > teamB.pointPercentage) {
      return -1;
    }
    if (teamA.pointPercentage < teamB.pointPercentage) {
      return 1;
    }
    
    // If point percentages are equal, apply tiebreaker rules
    return applyTiebreaker(teamA, teamB);
  });
  
  return sortedTeams;
}
