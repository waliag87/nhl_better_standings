/**
 * Playoff Calculator Utilities
 * Calculates playoff-related statistics for NHL teams based on a user-defined threshold
 */

import { Team, PlayoffCalculations, PlayoffStatus } from '../types/standings';

/**
 * Constants for NHL season calculations
 */
const TOTAL_SEASON_GAMES = 82;
const POINTS_PER_GAME = 2;

/**
 * Calculate playoff statistics for a team based on a playoff threshold
 * 
 * @param team - The team to calculate playoff statistics for
 * @param playoffThreshold - The estimated points needed to make the playoffs
 * @returns PlayoffCalculations object with all calculated statistics
 */
export function calculatePlayoffStats(
  team: Team,
  playoffThreshold: number
): PlayoffCalculations {
  // Calculate remaining games (82 - gamesPlayed)
  const remainingGames = Math.max(0, TOTAL_SEASON_GAMES - team.gamesPlayed);
  
  // Calculate remaining points (remainingGames × 2)
  const remainingPoints = remainingGames * POINTS_PER_GAME;
  
  // Calculate max possible points (currentPoints + remainingPoints)
  const maxPossiblePoints = team.points + remainingPoints;
  
  // Calculate points gap (threshold - currentPoints)
  const pointsGap = playoffThreshold - team.points;
  
  // Determine playoff status and calculate required percentage
  let playoffStatus: PlayoffStatus;
  let requiredPointsPercentage: number | null = null;
  
  if (team.points >= playoffThreshold) {
    // Team has already reached the threshold - clinched
    playoffStatus = 'clinched';
  } else if (maxPossiblePoints < playoffThreshold) {
    // Team cannot reach the threshold even if they win all remaining games - eliminated
    playoffStatus = 'eliminated';
  } else {
    // Team is still competing for a playoff spot
    playoffStatus = 'competing';
    
    // Calculate required points percentage for competing teams
    // Handle edge case where remainingPoints is 0
    if (remainingPoints > 0) {
      requiredPointsPercentage = (pointsGap / remainingPoints) * 100;
    } else {
      // No remaining games - should have been caught by clinched/eliminated logic above
      requiredPointsPercentage = null;
    }
  }
  
  return {
    remainingGames,
    remainingPoints,
    maxPossiblePoints,
    pointsGap,
    requiredPointsPercentage,
    playoffStatus,
  };
}
