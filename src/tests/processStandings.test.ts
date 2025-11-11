import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { processStandings } from '../scripts/processStandings.js';
import { NHLApiResponse, NHLStandingEntry } from '../types/nhl.js';

const createEntry = ({
  name,
  abbrev,
  division,
  conference,
  points,
  gamesPlayed,
}: {
  name: string;
  abbrev: string;
  division: string;
  conference: string;
  points: number;
  gamesPlayed: number;
}): NHLStandingEntry => ({
  teamAbbrev: { default: abbrev },
  teamName: { default: name },
  teamCommonName: { default: name },
  teamLogo: '',
  wins: points, // simple differentiator; exact values do not affect ordering
  losses: 0,
  otLosses: 0,
  points,
  gamesPlayed,
  regulationWins: points,
  regulationPlusOtWins: points,
  divisionName: division,
  conferenceName: conference,
  divisionAbbrev: division.slice(0, 3).toUpperCase(),
  conferenceAbbrev: conference.slice(0, 1).toUpperCase(),
  placeName: { default: name },
});

describe('processStandings wild card standings', () => {
  it('includes bubble teams beneath the two wild card spots', () => {
    const easternTeams = [
      createEntry({ name: 'E1', abbrev: 'E1', division: 'Atlantic', conference: 'Eastern', points: 70, gamesPlayed: 40 }),
      createEntry({ name: 'E2', abbrev: 'E2', division: 'Atlantic', conference: 'Eastern', points: 68, gamesPlayed: 40 }),
      createEntry({ name: 'E3', abbrev: 'E3', division: 'Atlantic', conference: 'Eastern', points: 66, gamesPlayed: 40 }),
      createEntry({ name: 'E4', abbrev: 'E4', division: 'Atlantic', conference: 'Eastern', points: 64, gamesPlayed: 40 }),
      createEntry({ name: 'E5', abbrev: 'E5', division: 'Atlantic', conference: 'Eastern', points: 62, gamesPlayed: 40 }),
      createEntry({ name: 'E6', abbrev: 'E6', division: 'Atlantic', conference: 'Eastern', points: 60, gamesPlayed: 40 }),
      createEntry({ name: 'E7', abbrev: 'E7', division: 'Atlantic', conference: 'Eastern', points: 58, gamesPlayed: 40 }),
    ];
    
    const westernTeams = [
      createEntry({ name: 'W1', abbrev: 'W1', division: 'Central', conference: 'Western', points: 70, gamesPlayed: 40 }),
      createEntry({ name: 'W2', abbrev: 'W2', division: 'Central', conference: 'Western', points: 65, gamesPlayed: 40 }),
      createEntry({ name: 'W3', abbrev: 'W3', division: 'Central', conference: 'Western', points: 60, gamesPlayed: 40 }),
      createEntry({ name: 'W4', abbrev: 'W4', division: 'Central', conference: 'Western', points: 55, gamesPlayed: 40 }),
    ];
    
    const rawData: NHLApiResponse = {
      standings: [...easternTeams, ...westernTeams],
    };
    
    const processed = processStandings(rawData);
    const easternWildCards = processed.eastern.wildCards;
    
    // We should show every non-division-leader team (4 bubble teams in this sample)
    assert.strictEqual(easternWildCards.length, 4);
    assert.ok(easternWildCards[0].isWildCard);
    assert.ok(easternWildCards[1].isWildCard);
    assert.strictEqual(easternWildCards[2].isWildCard, false);
    assert.strictEqual(easternWildCards[3].isWildCard, false);
  });
});
