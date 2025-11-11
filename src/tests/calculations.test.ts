/**
 * Unit tests for calculations utility functions
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { calculatePointPercentage, applyTiebreaker, sortTeamsByStandings } from '../utils/calculations.js';
import { Team, TiebreakerResult } from '../types/standings.js';

describe('calculatePointPercentage', () => {
  it('should calculate correct point percentage for typical values', () => {
    const result = calculatePointPercentage(50, 40);
    assert.strictEqual(result, 0.625);
  });

  it('should return 0 when games played is 0', () => {
    const result = calculatePointPercentage(0, 0);
    assert.strictEqual(result, 0);
  });

  it('should round to three decimal places', () => {
    const result = calculatePointPercentage(33, 40);
    assert.strictEqual(result, 0.413);
  });

  it('should handle perfect record', () => {
    const result = calculatePointPercentage(164, 82);
    assert.strictEqual(result, 1.000);
  });

  it('should handle low point percentage', () => {
    const result = calculatePointPercentage(10, 50);
    assert.strictEqual(result, 0.100);
  });
});

describe('applyTiebreaker', () => {
  const createTeam = (overrides: Partial<Team>): Team => ({
    id: 1,
    name: 'Test Team',
    abbreviation: 'TST',
    wins: 20,
    losses: 10,
    otLosses: 5,
    points: 45,
    gamesPlayed: 35,
    pointPercentage: 0.643,
    regulationWins: 15,
    regulationPlusOtWins: 18,
    division: 'Atlantic',
    conference: 'Eastern',
    isDivisionLeader: false,
    isWildCard: false,
    divisionRank: 0,
    conferenceRank: 0,
    ...overrides,
  });

  it('should prefer team with fewer games played', () => {
    const teamA = createTeam({ gamesPlayed: 30, regulationWins: 15 });
    const teamB = createTeam({ gamesPlayed: 35, regulationWins: 15 });
    
    const result = applyTiebreaker(teamA, teamB);
    assert.strictEqual(result, TiebreakerResult.TEAM_A_WINS);
  });

  it('should prefer team with more regulation wins when games played are equal', () => {
    const teamA = createTeam({ gamesPlayed: 35, regulationWins: 20 });
    const teamB = createTeam({ gamesPlayed: 35, regulationWins: 15 });
    
    const result = applyTiebreaker(teamA, teamB);
    assert.strictEqual(result, TiebreakerResult.TEAM_A_WINS);
  });

  it('should return TIE when all tiebreakers are equal', () => {
    const teamA = createTeam({ gamesPlayed: 35, regulationWins: 15 });
    const teamB = createTeam({ gamesPlayed: 35, regulationWins: 15 });
    
    const result = applyTiebreaker(teamA, teamB);
    assert.strictEqual(result, TiebreakerResult.TIE);
  });

  it('should prefer team B when team B has fewer games played', () => {
    const teamA = createTeam({ gamesPlayed: 40, regulationWins: 15 });
    const teamB = createTeam({ gamesPlayed: 35, regulationWins: 15 });
    
    const result = applyTiebreaker(teamA, teamB);
    assert.strictEqual(result, TiebreakerResult.TEAM_B_WINS);
  });
});

describe('sortTeamsByStandings', () => {
  const createTeam = (id: number, pointPercentage: number, gamesPlayed: number, regulationWins: number): Team => ({
    id,
    name: `Team ${id}`,
    abbreviation: `T${id}`,
    wins: 20,
    losses: 10,
    otLosses: 5,
    points: 45,
    gamesPlayed,
    pointPercentage,
    regulationWins,
    regulationPlusOtWins: regulationWins + 2,
    division: 'Atlantic',
    conference: 'Eastern',
    isDivisionLeader: false,
    isWildCard: false,
    divisionRank: 0,
    conferenceRank: 0,
  });

  it('should sort teams by point percentage descending', () => {
    const teams = [
      createTeam(1, 0.500, 40, 15),
      createTeam(2, 0.700, 40, 15),
      createTeam(3, 0.600, 40, 15),
    ];
    
    const sorted = sortTeamsByStandings(teams);
    assert.strictEqual(sorted[0].id, 2);
    assert.strictEqual(sorted[1].id, 3);
    assert.strictEqual(sorted[2].id, 1);
  });

  it('should apply tiebreaker when point percentages are equal', () => {
    const teams = [
      createTeam(1, 0.600, 40, 15),
      createTeam(2, 0.600, 35, 15),
      createTeam(3, 0.600, 38, 15),
    ];
    
    const sorted = sortTeamsByStandings(teams);
    assert.strictEqual(sorted[0].id, 2); // Fewer games played
    assert.strictEqual(sorted[1].id, 3);
    assert.strictEqual(sorted[2].id, 1);
  });

  it('should not mutate original array', () => {
    const teams = [
      createTeam(1, 0.500, 40, 15),
      createTeam(2, 0.700, 40, 15),
    ];
    
    const originalOrder = teams.map(t => t.id);
    sortTeamsByStandings(teams);
    
    assert.deepStrictEqual(teams.map(t => t.id), originalOrder);
  });
});
