/**
 * Unit tests for playoff position identification functions
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { identifyDivisionLeaders, identifyWildCards } from '../utils/playoffs.js';
import { Team } from '../types/standings.js';

describe('identifyDivisionLeaders', () => {
  const createTeam = (id: number, division: string, conference: string, pointPercentage: number): Team => ({
    id,
    name: `Team ${id}`,
    abbreviation: `T${id}`,
    wins: 20,
    losses: 10,
    otLosses: 5,
    points: 45,
    gamesPlayed: 35,
    pointPercentage,
    regulationWins: 15,
    regulationPlusOtWins: 18,
    division,
    conference,
    isDivisionLeader: false,
    isWildCard: false,
    divisionRank: 0,
    conferenceRank: 0,
  });

  it('should identify top 3 teams in each division as leaders', () => {
    const teams = [
      createTeam(1, 'Atlantic', 'Eastern', 0.700),
      createTeam(2, 'Atlantic', 'Eastern', 0.650),
      createTeam(3, 'Atlantic', 'Eastern', 0.600),
      createTeam(4, 'Atlantic', 'Eastern', 0.550),
      createTeam(5, 'Metropolitan', 'Eastern', 0.680),
      createTeam(6, 'Metropolitan', 'Eastern', 0.620),
      createTeam(7, 'Metropolitan', 'Eastern', 0.580),
      createTeam(8, 'Metropolitan', 'Eastern', 0.540),
    ];
    
    const result = identifyDivisionLeaders(teams);
    
    const atlanticLeaders = result.filter(t => t.division === 'Atlantic' && t.isDivisionLeader);
    const metroLeaders = result.filter(t => t.division === 'Metropolitan' && t.isDivisionLeader);
    
    assert.strictEqual(atlanticLeaders.length, 3);
    assert.strictEqual(metroLeaders.length, 3);
    
    // Check that the correct teams are marked as leaders
    assert.ok(result.find(t => t.id === 1)?.isDivisionLeader);
    assert.ok(result.find(t => t.id === 2)?.isDivisionLeader);
    assert.ok(result.find(t => t.id === 3)?.isDivisionLeader);
    assert.ok(!result.find(t => t.id === 4)?.isDivisionLeader);
  });

  it('should set division rank correctly', () => {
    const teams = [
      createTeam(1, 'Atlantic', 'Eastern', 0.700),
      createTeam(2, 'Atlantic', 'Eastern', 0.650),
      createTeam(3, 'Atlantic', 'Eastern', 0.600),
    ];
    
    const result = identifyDivisionLeaders(teams);
    
    assert.strictEqual(result.find(t => t.id === 1)?.divisionRank, 1);
    assert.strictEqual(result.find(t => t.id === 2)?.divisionRank, 2);
    assert.strictEqual(result.find(t => t.id === 3)?.divisionRank, 3);
  });
});

describe('identifyWildCards', () => {
  const createTeam = (
    id: number,
    conference: string,
    pointPercentage: number,
    isDivisionLeader: boolean
  ): Team => ({
    id,
    name: `Team ${id}`,
    abbreviation: `T${id}`,
    wins: 20,
    losses: 10,
    otLosses: 5,
    points: 45,
    gamesPlayed: 35,
    pointPercentage,
    regulationWins: 15,
    regulationPlusOtWins: 18,
    division: 'Atlantic',
    conference,
    isDivisionLeader,
    isWildCard: false,
    divisionRank: isDivisionLeader ? 1 : 4,
    conferenceRank: 0,
  });

  it('should identify top 2 non-division-leaders per conference as wild cards', () => {
    const teams = [
      createTeam(1, 'Eastern', 0.700, true),
      createTeam(2, 'Eastern', 0.680, true),
      createTeam(3, 'Eastern', 0.660, true),
      createTeam(4, 'Eastern', 0.640, false),
      createTeam(5, 'Eastern', 0.620, false),
      createTeam(6, 'Eastern', 0.600, false),
      createTeam(7, 'Western', 0.690, true),
      createTeam(8, 'Western', 0.670, true),
      createTeam(9, 'Western', 0.650, true),
      createTeam(10, 'Western', 0.630, false),
      createTeam(11, 'Western', 0.610, false),
      createTeam(12, 'Western', 0.590, false),
    ];
    
    const result = identifyWildCards(teams);
    
    const easternWildCards = result.filter(t => t.conference === 'Eastern' && t.isWildCard);
    const westernWildCards = result.filter(t => t.conference === 'Western' && t.isWildCard);
    
    assert.strictEqual(easternWildCards.length, 2);
    assert.strictEqual(westernWildCards.length, 2);
    
    // Check that the correct teams are marked as wild cards
    assert.ok(result.find(t => t.id === 4)?.isWildCard);
    assert.ok(result.find(t => t.id === 5)?.isWildCard);
    assert.ok(!result.find(t => t.id === 6)?.isWildCard);
    
    assert.ok(result.find(t => t.id === 10)?.isWildCard);
    assert.ok(result.find(t => t.id === 11)?.isWildCard);
    assert.ok(!result.find(t => t.id === 12)?.isWildCard);
  });

  it('should not mark division leaders as wild cards', () => {
    const teams = [
      createTeam(1, 'Eastern', 0.700, true),
      createTeam(2, 'Eastern', 0.680, false),
      createTeam(3, 'Eastern', 0.660, false),
    ];
    
    const result = identifyWildCards(teams);
    
    assert.ok(!result.find(t => t.id === 1)?.isWildCard);
    assert.ok(result.find(t => t.id === 2)?.isWildCard);
    assert.ok(result.find(t => t.id === 3)?.isWildCard);
  });
});
