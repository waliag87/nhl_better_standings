/**
 * Unit tests for validation functions
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  validateNHLApiResponse,
  validateTeamCount,
  validateDivisionDistribution,
  validateConferenceDistribution,
} from '../utils/validation.js';
import { NHLApiResponse, NHLStandingEntry } from '../types/nhl.js';

describe('validateNHLApiResponse', () => {
  const createValidTeam = (overrides: Partial<NHLStandingEntry> = {}): NHLStandingEntry => ({
    teamAbbrev: { default: 'TOR' },
    teamName: { default: 'Toronto Maple Leafs' },
    teamCommonName: { default: 'Maple Leafs' },
    teamLogo: 'https://example.com/logo.png',
    wins: 30,
    losses: 15,
    otLosses: 5,
    points: 65,
    gamesPlayed: 50,
    regulationWins: 25,
    regulationPlusOtWins: 28,
    divisionName: 'Atlantic',
    conferenceName: 'Eastern',
    divisionAbbrev: 'ATL',
    conferenceAbbrev: 'E',
    ...overrides,
  });

  it('should validate correct NHL API response', () => {
    const data = {
      standings: Array(32).fill(null).map((_, i) => createValidTeam({ 
        teamAbbrev: { default: `T${i}` } 
      })),
    };
    
    const result = validateNHLApiResponse(data);
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it('should reject null data', () => {
    const result = validateNHLApiResponse(null);
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.length > 0);
  });

  it('should reject missing standings array', () => {
    const result = validateNHLApiResponse({});
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some(e => e.field === 'standings'));
  });

  it('should reject incorrect team count', () => {
    const data = {
      standings: Array(30).fill(null).map(() => createValidTeam()),
    };
    
    const result = validateNHLApiResponse(data);
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some(e => e.field === 'standings.length'));
  });

  it('should reject team with missing required fields', () => {
    const data = {
      standings: [
        createValidTeam(),
        { teamAbbrev: { default: 'TOR' } }, // Missing most fields
      ],
    };
    
    const result = validateNHLApiResponse(data);
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.length > 0);
  });

  it('should reject invalid numeric values', () => {
    const data = {
      standings: Array(32).fill(null).map(() => createValidTeam({ wins: 100 })), // Invalid: > 82
    };
    
    const result = validateNHLApiResponse(data);
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some(e => e.message.includes('wins')));
  });

  it('should reject invalid games played calculation', () => {
    const data = {
      standings: Array(32).fill(null).map(() => createValidTeam({
        wins: 30,
        losses: 15,
        otLosses: 5,
        gamesPlayed: 60, // Should be 50
      })),
    };
    
    const result = validateNHLApiResponse(data);
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some(e => e.message.includes('Games played')));
  });

  it('should reject invalid points calculation', () => {
    const data = {
      standings: Array(32).fill(null).map(() => createValidTeam({
        wins: 30,
        otLosses: 5,
        points: 70, // Should be 65
      })),
    };
    
    const result = validateNHLApiResponse(data);
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some(e => e.message.includes('Points')));
  });
});

describe('validateTeamCount', () => {
  const createValidTeam = (): NHLStandingEntry => ({
    teamAbbrev: { default: 'TOR' },
    teamName: { default: 'Toronto Maple Leafs' },
    teamCommonName: { default: 'Maple Leafs' },
    teamLogo: 'https://example.com/logo.png',
    wins: 30,
    losses: 15,
    otLosses: 5,
    points: 65,
    gamesPlayed: 50,
    regulationWins: 25,
    regulationPlusOtWins: 28,
    divisionName: 'Atlantic',
    conferenceName: 'Eastern',
    divisionAbbrev: 'ATL',
    conferenceAbbrev: 'E',
  });

  it('should validate correct team count', () => {
    const data: NHLApiResponse = {
      standings: Array(32).fill(null).map(() => createValidTeam()),
    };
    
    const result = validateTeamCount(data);
    assert.strictEqual(result.isValid, true);
  });

  it('should reject incorrect team count', () => {
    const data: NHLApiResponse = {
      standings: Array(30).fill(null).map(() => createValidTeam()),
    };
    
    const result = validateTeamCount(data);
    assert.strictEqual(result.isValid, false);
  });
});

describe('validateDivisionDistribution', () => {
  const createTeam = (division: string): NHLStandingEntry => ({
    teamAbbrev: { default: 'TOR' },
    teamName: { default: 'Toronto Maple Leafs' },
    teamCommonName: { default: 'Maple Leafs' },
    teamLogo: 'https://example.com/logo.png',
    wins: 30,
    losses: 15,
    otLosses: 5,
    points: 65,
    gamesPlayed: 50,
    regulationWins: 25,
    regulationPlusOtWins: 28,
    divisionName: division,
    conferenceName: 'Eastern',
    divisionAbbrev: 'ATL',
    conferenceAbbrev: 'E',
  });

  it('should validate correct division distribution', () => {
    const data: NHLApiResponse = {
      standings: [
        ...Array(8).fill(null).map(() => createTeam('Atlantic')),
        ...Array(8).fill(null).map(() => createTeam('Metropolitan')),
        ...Array(8).fill(null).map(() => createTeam('Central')),
        ...Array(8).fill(null).map(() => createTeam('Pacific')),
      ],
    };
    
    const result = validateDivisionDistribution(data);
    assert.strictEqual(result.isValid, true);
  });

  it('should reject incorrect division distribution', () => {
    const data: NHLApiResponse = {
      standings: [
        ...Array(10).fill(null).map(() => createTeam('Atlantic')),
        ...Array(6).fill(null).map(() => createTeam('Metropolitan')),
        ...Array(8).fill(null).map(() => createTeam('Central')),
        ...Array(8).fill(null).map(() => createTeam('Pacific')),
      ],
    };
    
    const result = validateDivisionDistribution(data);
    assert.strictEqual(result.isValid, false);
  });
});

describe('validateConferenceDistribution', () => {
  const createTeam = (conference: string): NHLStandingEntry => ({
    teamAbbrev: { default: 'TOR' },
    teamName: { default: 'Toronto Maple Leafs' },
    teamCommonName: { default: 'Maple Leafs' },
    teamLogo: 'https://example.com/logo.png',
    wins: 30,
    losses: 15,
    otLosses: 5,
    points: 65,
    gamesPlayed: 50,
    regulationWins: 25,
    regulationPlusOtWins: 28,
    divisionName: 'Atlantic',
    conferenceName: conference,
    divisionAbbrev: 'ATL',
    conferenceAbbrev: 'E',
  });

  it('should validate correct conference distribution', () => {
    const data: NHLApiResponse = {
      standings: [
        ...Array(16).fill(null).map(() => createTeam('Eastern')),
        ...Array(16).fill(null).map(() => createTeam('Western')),
      ],
    };
    
    const result = validateConferenceDistribution(data);
    assert.strictEqual(result.isValid, true);
  });

  it('should reject incorrect conference distribution', () => {
    const data: NHLApiResponse = {
      standings: [
        ...Array(18).fill(null).map(() => createTeam('Eastern')),
        ...Array(14).fill(null).map(() => createTeam('Western')),
      ],
    };
    
    const result = validateConferenceDistribution(data);
    assert.strictEqual(result.isValid, false);
  });
});
