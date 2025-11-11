/**
 * Data Processor Module
 * Transforms raw NHL API data into structured standings with playoff positions
 */

import { NHLApiResponse, NHLStandingEntry } from '../types/nhl.js';
import { Team, ProcessedStandings, ConferenceStandings } from '../types/standings.js';
import { calculatePointPercentage, sortTeamsByStandings } from '../utils/calculations.js';
import { identifyDivisionLeaders, identifyWildCards } from '../utils/playoffs.js';

/**
 * Process raw NHL API data into structured standings with playoff positions
 * 
 * @param rawData - Raw NHL API response data
 * @returns Processed standings organized by conference with playoff positions identified
 */
export function processStandings(rawData: NHLApiResponse): ProcessedStandings {
  // Transform raw NHL API data into Team objects
  let teams = transformToTeams(rawData.standings);
  
  // Calculate point percentages for all teams
  teams = teams.map(team => ({
    ...team,
    pointPercentage: calculatePointPercentage(team.points, team.gamesPlayed),
  }));
  
  // Apply division leader identification
  teams = identifyDivisionLeaders(teams);
  
  // Apply wild card identification
  teams = identifyWildCards(teams);
  
  // Calculate conference ranks
  teams = calculateConferenceRanks(teams);
  
  // Organize teams by conference and division
  const eastern = organizeConference(teams, 'Eastern');
  const western = organizeConference(teams, 'Western');
  
  // Generate lastUpdated timestamp
  const lastUpdated = new Date().toISOString();
  
  return {
    eastern,
    western,
    lastUpdated,
  };
}

/**
 * Transform raw NHL API standing entries into Team objects
 * 
 * @param standings - Array of NHL standing entries from API
 * @returns Array of Team objects with initial data
 */
function transformToTeams(standings: NHLStandingEntry[]): Team[] {
  return standings.map((entry, index) => ({
    id: index + 1, // Generate sequential IDs since API doesn't provide team IDs in standings
    name: entry.teamName.default,
    abbreviation: entry.teamAbbrev.default,
    wins: entry.wins,
    losses: entry.losses,
    otLosses: entry.otLosses,
    points: entry.points,
    gamesPlayed: entry.gamesPlayed,
    pointPercentage: 0, // Will be calculated in next step
    regulationWins: entry.regulationWins,
    regulationPlusOtWins: entry.regulationPlusOtWins,
    division: entry.divisionName,
    conference: entry.conferenceName,
    isDivisionLeader: false, // Will be set by identifyDivisionLeaders
    isWildCard: false, // Will be set by identifyWildCards
    divisionRank: 0, // Will be set by identifyDivisionLeaders
    conferenceRank: 0, // Will be calculated after playoff positions
  }));
}

/**
 * Calculate conference ranks for all teams
 * 
 * @param teams - Array of teams with playoff positions identified
 * @returns Array of teams with conferenceRank set
 */
function calculateConferenceRanks(teams: Team[]): Team[] {
  // Group teams by conference
  const teamsByConference = new Map<string, Team[]>();
  
  for (const team of teams) {
    if (!teamsByConference.has(team.conference)) {
      teamsByConference.set(team.conference, []);
    }
    teamsByConference.get(team.conference)!.push(team);
  }
  
  // Calculate ranks within each conference
  const rankedTeams: Team[] = [];
  
  for (const conferenceTeams of teamsByConference.values()) {
    const sortedTeams = sortTeamsByStandings(conferenceTeams);
    
    sortedTeams.forEach((team, index) => {
      rankedTeams.push({
        ...team,
        conferenceRank: index + 1,
      });
    });
  }
  
  return rankedTeams;
}

/**
 * Organize teams by conference into divisions and wild cards
 * 
 * @param teams - Array of all teams with playoff positions identified
 * @param conferenceName - Name of the conference to organize
 * @returns ConferenceStandings with teams organized by division and wild cards
 */
function organizeConference(teams: Team[], conferenceName: string): ConferenceStandings {
  // Filter teams for this conference
  const conferenceTeams = teams.filter(team => team.conference === conferenceName);
  
  // Group teams by division
  const divisions: { [divisionName: string]: Team[] } = {};
  // Include every non-division-leader so the UI can show bubble teams beneath the wild card spots
  const wildCardStandings: Team[] = [];
  
  for (const team of conferenceTeams) {
    // Add to division
    if (!divisions[team.division]) {
      divisions[team.division] = [];
    }
    divisions[team.division].push(team);
    
    // Add to wild cards if applicable
    if (!team.isDivisionLeader) {
      // Preserve existing formatting: only top two entries carry the isWildCard flag
      wildCardStandings.push(team);
    }
  }
  
  // Sort teams within each division
  for (const divisionName in divisions) {
    divisions[divisionName] = sortTeamsByStandings(divisions[divisionName]);
  }
  
  // Sort wild cards
  const sortedWildCards = sortTeamsByStandings(wildCardStandings);
  
  return {
    divisions,
    wildCards: sortedWildCards,
  };
}
