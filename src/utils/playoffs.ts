/**
 * Playoff Position Identification
 * Functions for identifying division leaders and wild card teams
 */

import { Team } from '../types/standings.js';
import { sortTeamsByStandings } from './calculations.js';

/**
 * Identify and mark the top 3 teams in each division as division leaders
 * 
 * @param teams - Array of all teams
 * @returns Array of teams with isDivisionLeader flag set for top 3 in each division
 */
export function identifyDivisionLeaders(teams: Team[]): Team[] {
  // Group teams by division
  const teamsByDivision = new Map<string, Team[]>();
  
  for (const team of teams) {
    if (!teamsByDivision.has(team.division)) {
      teamsByDivision.set(team.division, []);
    }
    teamsByDivision.get(team.division)!.push(team);
  }
  
  // Process each division
  const processedTeams: Team[] = [];
  
  for (const [division, divisionTeams] of teamsByDivision) {
    // Sort teams within the division by point percentage
    const sortedDivisionTeams = sortTeamsByStandings(divisionTeams);
    
    // Mark top 3 teams as division leaders
    sortedDivisionTeams.forEach((team, index) => {
      processedTeams.push({
        ...team,
        isDivisionLeader: index < 3,
        divisionRank: index + 1,
      });
    });
  }
  
  return processedTeams;
}

/**
 * Identify and mark the 2 wild card teams per conference
 * Wild card teams are the highest point percentage teams that are not division leaders
 * 
 * @param teams - Array of teams with division leaders already identified
 * @returns Array of teams with isWildCard flag set for top 2 non-division-leaders per conference
 */
export function identifyWildCards(teams: Team[]): Team[] {
  // Group teams by conference
  const teamsByConference = new Map<string, Team[]>();
  
  for (const team of teams) {
    if (!teamsByConference.has(team.conference)) {
      teamsByConference.set(team.conference, []);
    }
    teamsByConference.get(team.conference)!.push(team);
  }
  
  // Process each conference
  const processedTeams: Team[] = [];
  
  for (const [conference, conferenceTeams] of teamsByConference) {
    // Filter out division leaders
    const nonDivisionLeaders = conferenceTeams.filter(team => !team.isDivisionLeader);
    
    // Sort remaining teams by point percentage
    const sortedNonLeaders = sortTeamsByStandings(nonDivisionLeaders);
    
    // Mark top 2 as wild card teams
    const wildCardTeams = sortedNonLeaders.slice(0, 2);
    const wildCardIds = new Set(wildCardTeams.map(t => t.id));
    
    // Add all teams with wild card flag set appropriately
    for (const team of conferenceTeams) {
      processedTeams.push({
        ...team,
        isWildCard: wildCardIds.has(team.id),
      });
    }
  }
  
  return processedTeams;
}
