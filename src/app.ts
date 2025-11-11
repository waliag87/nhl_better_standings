/**
 * Frontend TypeScript for rendering NHL standings
 * This script runs in the browser to display standings data
 */

import type { ProcessedStandings, Team } from './types/standings';

/**
 * Main function to render standings when DOM is loaded
 */
function renderStandings(): void {
  try {
    // Read embedded JSON data from HTML
    const standingsData = getStandingsData();
    
    if (!standingsData) {
      displayError('No standings data available');
      return;
    }

    // Display warning banner if using stale data
    if (standingsData.isStaleData) {
      displayStaleDataWarning(standingsData.cacheTimestamp || standingsData.lastUpdated);
    }

    // Render last updated timestamp
    renderLastUpdated(standingsData.lastUpdated);

    // Render Eastern Conference
    renderConference('eastern', standingsData.eastern);

    // Render Western Conference
    renderConference('western', standingsData.western);

  } catch (error) {
    console.error('Error rendering standings:', error);
    displayError('Failed to load standings data');
  }
}

/**
 * Get standings data from embedded JSON script tag
 */
function getStandingsData(): ProcessedStandings | null {
  try {
    const dataElement = document.getElementById('standings-data');
    
    if (!dataElement || !dataElement.textContent) {
      console.error('Standings data element not found or empty');
      return null;
    }

    const data = JSON.parse(dataElement.textContent) as ProcessedStandings;
    
    // Validate data structure
    if (!data.eastern || !data.western || !data.lastUpdated) {
      console.error('Invalid standings data structure');
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error parsing standings data:', error);
    return null;
  }
}

/**
 * Render last updated timestamp
 */
function renderLastUpdated(timestamp: string): void {
  const element = document.getElementById('last-updated-time');
  
  if (!element) {
    console.warn('Last updated element not found');
    return;
  }

  try {
    const date = new Date(timestamp);
    
    // Format date in a readable way
    const formatted = date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
    
    element.textContent = formatted;
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    element.textContent = timestamp;
  }
}

/**
 * Render a conference (Eastern or Western)
 */
function renderConference(
  conferenceName: 'eastern' | 'western',
  conferenceData: ProcessedStandings['eastern'] | ProcessedStandings['western']
): void {
  // Render divisions
  for (const [divisionName, teams] of Object.entries(conferenceData.divisions)) {
    const divisionId = getDivisionId(divisionName);
    renderDivision(divisionId, teams);
  }

  // Render wild cards
  const wildCardId = `${conferenceName}-wild-card`;
  renderWildCards(wildCardId, conferenceData.wildCards);
}

/**
 * Get the HTML element ID for a division
 */
function getDivisionId(divisionName: string): string {
  // Convert division name to kebab-case ID
  return divisionName.toLowerCase().replace(/\s+/g, '-') + '-division';
}

/**
 * Render teams in a division
 */
function renderDivision(divisionId: string, teams: Team[]): void {
  const tbody = document.getElementById(divisionId);
  
  if (!tbody) {
    console.warn(`Division element not found: ${divisionId}`);
    return;
  }

  // Clear existing content
  tbody.innerHTML = '';

  // Render each team
  teams.forEach(team => {
    const row = createTeamRow(team);
    tbody.appendChild(row);
  });
}

/**
 * Render wild card teams
 */
function renderWildCards(wildCardId: string, teams: Team[]): void {
  const tbody = document.getElementById(wildCardId);
  
  if (!tbody) {
    console.warn(`Wild card element not found: ${wildCardId}`);
    return;
  }

  // Clear existing content
  tbody.innerHTML = '';

  // Render each wild card team
  teams.forEach(team => {
    const row = createTeamRow(team);
    tbody.appendChild(row);
  });
}

/**
 * Create a table row for a team
 */
function createTeamRow(team: Team): HTMLTableRowElement {
  const row = document.createElement('tr');

  // Add CSS classes for playoff positions
  if (team.isDivisionLeader) {
    row.classList.add('division-leader');
    row.setAttribute('aria-label', `${team.name} - Division Leader - ${team.wins} wins, ${team.losses} losses, ${team.otLosses} overtime losses, ${team.points} points, ${formatPointPercentage(team.pointPercentage)} point percentage`);
  } else if (team.isWildCard) {
    row.classList.add('wild-card');
    row.setAttribute('aria-label', `${team.name} - Wild Card - ${team.wins} wins, ${team.losses} losses, ${team.otLosses} overtime losses, ${team.points} points, ${formatPointPercentage(team.pointPercentage)} point percentage`);
  } else {
    row.setAttribute('aria-label', `${team.name} - ${team.wins} wins, ${team.losses} losses, ${team.otLosses} overtime losses, ${team.points} points, ${formatPointPercentage(team.pointPercentage)} point percentage`);
  }

  // Team name cell
  const nameCell = document.createElement('td');
  nameCell.textContent = team.name;
  
  // Add screen reader text for playoff indicators
  if (team.isDivisionLeader) {
    const srText = document.createElement('span');
    srText.className = 'sr-only';
    srText.textContent = ' (Division Leader)';
    nameCell.appendChild(srText);
  } else if (team.isWildCard) {
    const srText = document.createElement('span');
    srText.className = 'sr-only';
    srText.textContent = ' (Wild Card)';
    nameCell.appendChild(srText);
  }
  
  row.appendChild(nameCell);

  // Games played cell
  const gpCell = document.createElement('td');
  gpCell.textContent = formatNumber(team.gamesPlayed);
  row.appendChild(gpCell);

  // Wins cell
  const winsCell = document.createElement('td');
  winsCell.textContent = formatNumber(team.wins);
  row.appendChild(winsCell);

  // Losses cell
  const lossesCell = document.createElement('td');
  lossesCell.textContent = formatNumber(team.losses);
  row.appendChild(lossesCell);

  // OT losses cell
  const otlCell = document.createElement('td');
  otlCell.textContent = formatNumber(team.otLosses);
  row.appendChild(otlCell);

  // Points cell
  const pointsCell = document.createElement('td');
  pointsCell.textContent = formatNumber(team.points);
  row.appendChild(pointsCell);

  // Point percentage cell
  const pctCell = document.createElement('td');
  pctCell.textContent = formatPointPercentage(team.pointPercentage);
  row.appendChild(pctCell);

  return row;
}

/**
 * Format a number, handling null/undefined values
 */
function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '--';
  }
  return value.toString();
}

/**
 * Format point percentage to three decimal places
 */
function formatPointPercentage(percentage: number | null | undefined): string {
  if (percentage === null || percentage === undefined || isNaN(percentage)) {
    return '.---';
  }
  return percentage.toFixed(3);
}

/**
 * Display warning banner when using stale cached data
 */
function displayStaleDataWarning(cacheTimestamp: string): void {
  const warningBanner = document.getElementById('stale-data-warning');
  const cacheTimestampElement = document.getElementById('cache-timestamp');
  
  if (!warningBanner) {
    console.warn('Warning banner element not found');
    return;
  }
  
  // Format the cache timestamp
  if (cacheTimestampElement) {
    try {
      const date = new Date(cacheTimestamp);
      const formatted = date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
      cacheTimestampElement.textContent = formatted;
    } catch (error) {
      console.error('Error formatting cache timestamp:', error);
      cacheTimestampElement.textContent = cacheTimestamp;
    }
  }
  
  // Show the warning banner
  warningBanner.style.display = 'block';
}

/**
 * Display an error message to the user
 */
function displayError(message: string): void {
  // Create error banner
  const errorBanner = document.createElement('div');
  errorBanner.className = 'error-banner';
  errorBanner.setAttribute('role', 'alert');
  errorBanner.style.cssText = `
    background-color: #fee;
    border: 2px solid #c33;
    color: #c33;
    padding: 1rem;
    margin: 1rem;
    border-radius: 0.5rem;
    text-align: center;
    font-weight: 600;
  `;
  errorBanner.textContent = message;

  // Insert at the top of main content
  const main = document.querySelector('main');
  if (main && main.firstChild) {
    main.insertBefore(errorBanner, main.firstChild);
  }
}

// Run when DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderStandings);
} else {
  // DOM is already loaded
  renderStandings();
}
