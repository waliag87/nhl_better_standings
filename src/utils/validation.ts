import { NHLApiResponse } from '../types/nhl.js';

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Expected number of NHL teams
 */
const EXPECTED_TEAM_COUNT = 32;

/**
 * Valid NHL divisions
 */
const VALID_DIVISIONS = ['Atlantic', 'Metropolitan', 'Central', 'Pacific'];

/**
 * Valid NHL conferences
 */
const VALID_CONFERENCES = ['Eastern', 'Western'];

/**
 * Validates the complete NHL API response structure
 * 
 * @param data - NHL API response to validate
 * @returns Validation result with any errors found
 */
export function validateNHLApiResponse(data: any): ValidationResult {
  const errors: ValidationError[] = [];

  // Check if data exists
  if (!data) {
    errors.push({
      field: 'data',
      message: 'NHL API response is null or undefined',
    });
    return { isValid: false, errors };
  }

  // Check if standings array exists
  if (!data.standings) {
    errors.push({
      field: 'standings',
      message: 'Missing standings array in API response',
    });
    return { isValid: false, errors };
  }

  // Check if standings is an array
  if (!Array.isArray(data.standings)) {
    errors.push({
      field: 'standings',
      message: 'Standings is not an array',
      value: typeof data.standings,
    });
    return { isValid: false, errors };
  }

  // Check team count
  const teamCount = data.standings.length;
  if (teamCount !== EXPECTED_TEAM_COUNT) {
    errors.push({
      field: 'standings.length',
      message: `Expected ${EXPECTED_TEAM_COUNT} teams, found ${teamCount}`,
      value: teamCount,
    });
  }

  // Validate each team entry
  data.standings.forEach((team: any, index: number) => {
    const teamErrors = validateTeamEntry(team, index);
    errors.push(...teamErrors);
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a single team standing entry
 * 
 * @param team - Team standing entry to validate
 * @param index - Index of the team in the standings array
 * @returns Array of validation errors found
 */
function validateTeamEntry(team: any, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `standings[${index}]`;

  // Check required fields exist
  const requiredFields = [
    'teamName',
    'teamAbbrev',
    'wins',
    'losses',
    'otLosses',
    'points',
    'gamesPlayed',
    'regulationWins',
    'divisionName',
    'conferenceName',
  ];

  requiredFields.forEach(field => {
    if (team[field] === undefined || team[field] === null) {
      errors.push({
        field: `${prefix}.${field}`,
        message: `Missing required field: ${field}`,
      });
    }
  });

  // If required fields are missing, skip further validation
  if (errors.length > 0) {
    return errors;
  }

  // Validate numeric fields
  const numericValidations = [
    { field: 'wins', min: 0, max: 82 },
    { field: 'losses', min: 0, max: 82 },
    { field: 'otLosses', min: 0, max: 82 },
    { field: 'points', min: 0, max: 164 },
    { field: 'gamesPlayed', min: 0, max: 82 },
    { field: 'regulationWins', min: 0, max: 82 },
  ];

  numericValidations.forEach(({ field, min, max }) => {
    const value = team[field];
    
    if (typeof value !== 'number') {
      errors.push({
        field: `${prefix}.${field}`,
        message: `Field ${field} must be a number`,
        value: typeof value,
      });
      return;
    }

    if (!Number.isFinite(value)) {
      errors.push({
        field: `${prefix}.${field}`,
        message: `Field ${field} must be a finite number`,
        value,
      });
      return;
    }

    if (value < min || value > max) {
      errors.push({
        field: `${prefix}.${field}`,
        message: `Field ${field} must be between ${min} and ${max}`,
        value,
      });
    }
  });

  // Validate games played equals wins + losses + otLosses
  const totalGames = team.wins + team.losses + team.otLosses;
  if (team.gamesPlayed !== totalGames) {
    errors.push({
      field: `${prefix}.gamesPlayed`,
      message: `Games played (${team.gamesPlayed}) does not match wins + losses + otLosses (${totalGames})`,
      value: team.gamesPlayed,
    });
  }

  // Validate points calculation (wins * 2 + otLosses * 1)
  const expectedPoints = team.wins * 2 + team.otLosses;
  if (team.points !== expectedPoints) {
    errors.push({
      field: `${prefix}.points`,
      message: `Points (${team.points}) does not match expected calculation (${expectedPoints})`,
      value: team.points,
    });
  }

  // Validate regulation wins doesn't exceed total wins
  if (team.regulationWins > team.wins) {
    errors.push({
      field: `${prefix}.regulationWins`,
      message: `Regulation wins (${team.regulationWins}) cannot exceed total wins (${team.wins})`,
      value: team.regulationWins,
    });
  }

  // Validate division name
  if (!VALID_DIVISIONS.includes(team.divisionName)) {
    errors.push({
      field: `${prefix}.divisionName`,
      message: `Invalid division name: ${team.divisionName}. Must be one of: ${VALID_DIVISIONS.join(', ')}`,
      value: team.divisionName,
    });
  }

  // Validate conference name
  if (!VALID_CONFERENCES.includes(team.conferenceName)) {
    errors.push({
      field: `${prefix}.conferenceName`,
      message: `Invalid conference name: ${team.conferenceName}. Must be one of: ${VALID_CONFERENCES.join(', ')}`,
      value: team.conferenceName,
    });
  }

  // Validate team name structure
  if (team.teamName && typeof team.teamName === 'object') {
    if (!team.teamName.default || typeof team.teamName.default !== 'string') {
      errors.push({
        field: `${prefix}.teamName.default`,
        message: 'Team name must have a default string property',
      });
    }
  }

  // Validate team abbreviation structure
  if (team.teamAbbrev && typeof team.teamAbbrev === 'object') {
    if (!team.teamAbbrev.default || typeof team.teamAbbrev.default !== 'string') {
      errors.push({
        field: `${prefix}.teamAbbrev.default`,
        message: 'Team abbreviation must have a default string property',
      });
    }
  }

  return errors;
}

/**
 * Validates that all 32 NHL teams are present in the standings
 * 
 * @param data - NHL API response
 * @returns Validation result
 */
export function validateTeamCount(data: NHLApiResponse): ValidationResult {
  const errors: ValidationError[] = [];
  const teamCount = data.standings.length;

  if (teamCount !== EXPECTED_TEAM_COUNT) {
    errors.push({
      field: 'standings.length',
      message: `Expected ${EXPECTED_TEAM_COUNT} teams, found ${teamCount}`,
      value: teamCount,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates division distribution (8 teams per division)
 * 
 * @param data - NHL API response
 * @returns Validation result
 */
export function validateDivisionDistribution(data: NHLApiResponse): ValidationResult {
  const errors: ValidationError[] = [];
  const divisionCounts: Record<string, number> = {};

  data.standings.forEach(team => {
    const division = team.divisionName;
    divisionCounts[division] = (divisionCounts[division] || 0) + 1;
  });

  VALID_DIVISIONS.forEach(division => {
    const count = divisionCounts[division] || 0;
    if (count !== 8) {
      errors.push({
        field: `division.${division}`,
        message: `Expected 8 teams in ${division} division, found ${count}`,
        value: count,
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates conference distribution (16 teams per conference)
 * 
 * @param data - NHL API response
 * @returns Validation result
 */
export function validateConferenceDistribution(data: NHLApiResponse): ValidationResult {
  const errors: ValidationError[] = [];
  const conferenceCounts: Record<string, number> = {};

  data.standings.forEach(team => {
    const conference = team.conferenceName;
    conferenceCounts[conference] = (conferenceCounts[conference] || 0) + 1;
  });

  VALID_CONFERENCES.forEach(conference => {
    const count = conferenceCounts[conference] || 0;
    if (count !== 16) {
      errors.push({
        field: `conference.${conference}`,
        message: `Expected 16 teams in ${conference} conference, found ${count}`,
        value: count,
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Formats validation errors for logging
 * 
 * @param errors - Array of validation errors
 * @returns Formatted error string
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) {
    return 'No validation errors';
  }

  const lines = ['Validation errors found:'];
  errors.forEach((error, index) => {
    lines.push(`  ${index + 1}. [${error.field}] ${error.message}`);
    if (error.value !== undefined) {
      lines.push(`     Value: ${JSON.stringify(error.value)}`);
    }
  });

  return lines.join('\n');
}
