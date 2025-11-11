/**
 * Frontend TypeScript for rendering NHL standings
 * This script runs in the browser to display standings data
 */

import type { ProcessedStandings, Team } from './types/standings';
import { calculatePlayoffStats } from './utils/playoffCalculator.js';

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

  // Check if calculator is active (threshold exists in sessionStorage)
  const savedThreshold = sessionStorage.getItem('playoffThreshold');
  if (savedThreshold) {
    const threshold = parseInt(savedThreshold, 10);
    // Validate the threshold before using it
    if (!isNaN(threshold) && threshold >= 80 && threshold <= 120) {
      // If active, call updateTeamRowWithCalculator after creating row
      updateTeamRowWithCalculator(row, team, threshold);
    }
  }

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

/**
 * Validation result interface for playoff threshold
 */
interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate playoff threshold input value
 * @param value - The input value to validate
 * @returns Validation result with error message if invalid
 */
function validateThreshold(value: string): ValidationResult {
  // Check if value is empty
  if (!value || value.trim() === '') {
    return { valid: false, error: 'Please enter a threshold value' };
  }

  // Parse the value as a number
  const numValue = parseInt(value, 10);

  // Check if value is a valid number
  if (isNaN(numValue)) {
    return { valid: false, error: 'Please enter a valid number' };
  }

  // Validate value is between 80 and 120 (inclusive)
  if (numValue < 80 || numValue > 120) {
    return { valid: false, error: 'Threshold must be between 80 and 120 points' };
  }

  return { valid: true };
}

/**
 * Display validation error message for playoff threshold input
 * @param message - The error message to display
 */
function displayValidationError(message: string): void {
  const errorElement = document.getElementById('threshold-error');
  const inputElement = document.getElementById('playoff-threshold') as HTMLInputElement;

  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }

  if (inputElement) {
    inputElement.setAttribute('aria-invalid', 'true');
  }
}

/**
 * Clear validation error message for playoff threshold input
 */
function clearValidationError(): void {
  const errorElement = document.getElementById('threshold-error');
  const inputElement = document.getElementById('playoff-threshold') as HTMLInputElement;

  if (errorElement) {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  }

  if (inputElement) {
    inputElement.setAttribute('aria-invalid', 'false');
  }
}

/**
 * Handle threshold input change event
 * Validates input, saves to sessionStorage, and triggers calculations
 * @param event - The input event
 */
function handleThresholdChange(event: Event): void {
  const inputElement = event.target as HTMLInputElement;
  const clearButton = document.getElementById('clear-threshold') as HTMLButtonElement;
  
  // Get input value
  const value = inputElement.value;
  
  // Validate the input
  const validation = validateThreshold(value);
  
  // If invalid, display error and return early
  if (!validation.valid) {
    displayValidationError(validation.error || 'Invalid input');
    return;
  }
  
  // If valid, clear any existing errors
  clearValidationError();
  
  // Parse the validated threshold value
  const threshold = parseInt(value, 10);
  
  // Save threshold to sessionStorage
  sessionStorage.setItem('playoffThreshold', threshold.toString());
  
  // Show the clear button
  if (clearButton) {
    clearButton.style.display = 'inline-block';
  }
  
  // Call function to show calculator columns
  showCalculatorColumns();
  
  // Call function to update all team calculations
  updateAllPlayoffCalculations(threshold);
  
  // Announce to screen readers that calculations have been updated
  announceToScreenReader(`Playoff calculations updated for ${threshold} point threshold`);
}

/**
 * Show the calculator columns in all standings tables
 * Makes the "Req. Pts %" column visible with smooth transition
 */
function showCalculatorColumns(): void {
  // Select all "Req. Pts %" column headers
  const columnHeaders = document.querySelectorAll('.req-pts-col');
  columnHeaders.forEach(header => {
    const headerElement = header as HTMLElement;
    // Set display first
    headerElement.style.display = 'table-cell';
    // Use requestAnimationFrame to ensure display change is applied before adding visible class
    requestAnimationFrame(() => {
      headerElement.classList.add('visible');
    });
  });

  // Add CSS class to tables indicating calculator is active
  const tables = document.querySelectorAll('.standings-table');
  tables.forEach(table => {
    table.classList.add('calculator-active');
  });
}

/**
 * Hide the calculator columns in all standings tables
 * Hides the "Req. Pts %" column and removes calculator cells with smooth transition
 */
function hideCalculatorColumns(): void {
  // Select all "Req. Pts %" column headers
  const columnHeaders = document.querySelectorAll('.req-pts-col');
  columnHeaders.forEach(header => {
    const headerElement = header as HTMLElement;
    // Remove visible class to trigger transition
    headerElement.classList.remove('visible');
  });

  // Remove visible class from all calculator cells to trigger transition
  const calculatorCells = document.querySelectorAll('.req-pts-cell');
  calculatorCells.forEach(cell => {
    (cell as HTMLElement).classList.remove('visible');
  });

  // Wait for transition to complete before hiding and removing elements
  setTimeout(() => {
    // Set display to none after transition completes
    columnHeaders.forEach(header => {
      (header as HTMLElement).style.display = 'none';
    });

    // Remove all calculator cells from team rows
    calculatorCells.forEach(cell => {
      cell.remove();
    });

    // Remove calculator active class from tables
    const tables = document.querySelectorAll('.standings-table');
    tables.forEach(table => {
      table.classList.remove('calculator-active');
    });
  }, 250); // Match the transition duration (250ms)
}

/**
 * Set playoff calculator content visibility and update toggle button state
 * @param visible - Whether the calculator content should be shown
 */
function setCalculatorContentVisibility(visible: boolean): void {
  const calculatorContent = document.getElementById('calculator-content');
  const toggleButton = document.getElementById('calculator-toggle') as HTMLButtonElement | null;

  if (!calculatorContent || !toggleButton) {
    return;
  }

  calculatorContent.hidden = !visible;
  toggleButton.setAttribute('aria-expanded', visible ? 'true' : 'false');
  toggleButton.setAttribute(
    'aria-label',
    visible ? 'Hide playoff calculator' : 'Show playoff calculator'
  );
}

/**
 * Create a status badge element for clinched or eliminated teams
 * @param status - The playoff status ('clinched' or 'eliminated')
 * @returns HTMLElement - The badge element
 */
function createStatusBadge(status: 'clinched' | 'eliminated'): HTMLElement {
  const badge = document.createElement('span');
  badge.className = `status-badge status-${status}`;
  badge.textContent = status === 'clinched' ? 'Clinched' : 'Eliminated';
  badge.setAttribute('aria-label', status === 'clinched' 
    ? 'Clinched playoff spot' 
    : 'Eliminated from playoffs');
  return badge;
}

/**
 * Update a team row with playoff calculator data
 * @param row - The table row element to update
 * @param team - The team data
 * @param threshold - The playoff threshold value
 */
function updateTeamRowWithCalculator(
  row: HTMLTableRowElement,
  team: Team,
  threshold: number
): void {
  // Call calculatePlayoffStats utility function
  const stats = calculatePlayoffStats(team, threshold);
  
  // Find or create the "Req. Pts %" cell in the row
  let reqPtsCell = row.querySelector('.req-pts-cell') as HTMLTableCellElement;
  const isNewCell = !reqPtsCell;
  
  if (!reqPtsCell) {
    reqPtsCell = document.createElement('td');
    reqPtsCell.className = 'req-pts-cell';
    row.appendChild(reqPtsCell);
  }
  
  // Clear existing cell content
  reqPtsCell.innerHTML = '';
  reqPtsCell.className = 'req-pts-cell'; // Reset classes
  
  // If status is clinched, create and append clinched badge
  if (stats.playoffStatus === 'clinched') {
    const badge = createStatusBadge('clinched');
    reqPtsCell.appendChild(badge);
  } 
  // If status is eliminated, create and append eliminated badge
  else if (stats.playoffStatus === 'eliminated') {
    const badge = createStatusBadge('eliminated');
    reqPtsCell.appendChild(badge);
  } 
  // If status is competing, display required percentage with one decimal place
  else if (stats.playoffStatus === 'competing' && stats.requiredPointsPercentage !== null) {
    const percentage = stats.requiredPointsPercentage.toFixed(1);
    reqPtsCell.textContent = `${percentage}%`;
    
    // Apply color coding class based on percentage difficulty
    if (stats.requiredPointsPercentage > 75) {
      reqPtsCell.classList.add('very-difficult');
    } else if (stats.requiredPointsPercentage > 60) {
      reqPtsCell.classList.add('difficult');
    } else if (stats.requiredPointsPercentage > 50) {
      reqPtsCell.classList.add('moderate');
    } else {
      reqPtsCell.classList.add('achievable');
    }
  }
  
  // Add visible class for smooth transition (use requestAnimationFrame for new cells)
  if (isNewCell) {
    requestAnimationFrame(() => {
      reqPtsCell.classList.add('visible');
    });
  } else {
    reqPtsCell.classList.add('visible');
  }
  
  // Update row aria-label to include playoff status
  const currentAriaLabel = row.getAttribute('aria-label') || '';
  let playoffStatusText = '';
  
  if (stats.playoffStatus === 'clinched') {
    playoffStatusText = ', Clinched playoff spot';
  } else if (stats.playoffStatus === 'eliminated') {
    playoffStatusText = ', Eliminated from playoffs';
  } else if (stats.requiredPointsPercentage !== null) {
    playoffStatusText = `, Requires ${stats.requiredPointsPercentage.toFixed(1)}% of remaining points`;
  }
  
  // Remove any existing playoff status text from aria-label
  const cleanedAriaLabel = currentAriaLabel.replace(/, (Clinched playoff spot|Eliminated from playoffs|Requires .+% of remaining points)/, '');
  row.setAttribute('aria-label', cleanedAriaLabel + playoffStatusText);
}

/**
 * Update all team rows with playoff calculations
 * @param threshold - The playoff threshold value
 */
function updateAllPlayoffCalculations(threshold: number): void {
  // Get standings data from embedded JSON
  const standingsData = getStandingsData();
  
  if (!standingsData) {
    console.error('Cannot update playoff calculations: no standings data available');
    return;
  }
  
  // Iterate through Eastern Conference
  updateConferenceCalculations('eastern', standingsData.eastern, threshold);
  
  // Iterate through Western Conference
  updateConferenceCalculations('western', standingsData.western, threshold);
}

/**
 * Update playoff calculations for all teams in a conference
 * @param conferenceName - The conference name ('eastern' or 'western')
 * @param conferenceData - The conference standings data
 * @param threshold - The playoff threshold value
 */
function updateConferenceCalculations(
  conferenceName: 'eastern' | 'western',
  conferenceData: ProcessedStandings['eastern'] | ProcessedStandings['western'],
  threshold: number
): void {
  // Iterate through all divisions
  for (const [divisionName, teams] of Object.entries(conferenceData.divisions)) {
    const divisionId = getDivisionId(divisionName);
    const tbody = document.getElementById(divisionId);
    
    if (!tbody) {
      console.warn(`Division element not found: ${divisionId}`);
      continue;
    }
    
    // For each team, find corresponding table row
    teams.forEach((team, index) => {
      const row = tbody.children[index] as HTMLTableRowElement;
      
      if (row) {
        // Call updateTeamRowWithCalculator for each row
        updateTeamRowWithCalculator(row, team, threshold);
      }
    });
  }
  
  // Handle wild card teams separately
  const wildCardId = `${conferenceName}-wild-card`;
  const wildCardTbody = document.getElementById(wildCardId);
  
  if (!wildCardTbody) {
    console.warn(`Wild card element not found: ${wildCardId}`);
    return;
  }
  
  // For each wild card team, find corresponding table row
  conferenceData.wildCards.forEach((team, index) => {
    const row = wildCardTbody.children[index] as HTMLTableRowElement;
    
    if (row) {
      // Call updateTeamRowWithCalculator for each row
      updateTeamRowWithCalculator(row, team, threshold);
    }
  });
}

/**
 * Handle clear threshold button click
 * Clears the input field, removes threshold from sessionStorage,
 * hides the clear button, and hides calculator columns
 */
function handleClearThreshold(): void {
  const inputElement = document.getElementById('playoff-threshold') as HTMLInputElement;
  const clearButton = document.getElementById('clear-threshold') as HTMLButtonElement;

  // Clear the input field value
  if (inputElement) {
    inputElement.value = '';
    // Return focus to input after clearing
    inputElement.focus();
  }

  // Remove threshold from sessionStorage
  sessionStorage.removeItem('playoffThreshold');

  // Hide the clear button
  if (clearButton) {
    clearButton.style.display = 'none';
  }

  // Call function to hide calculator columns
  hideCalculatorColumns();

  // Clear any validation errors
  clearValidationError();
  
  // Announce to screen readers that calculator has been cleared
  announceToScreenReader('Playoff calculator cleared');
}

/**
 * Announce a message to screen readers using an aria-live region
 * @param message - The message to announce
 */
function announceToScreenReader(message: string): void {
  // Find or create the announcement region
  let announcer = document.getElementById('sr-announcer');
  
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'sr-announcer';
    announcer.className = 'sr-only';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(announcer);
  }
  
  // Clear previous message
  announcer.textContent = '';
  
  // Use setTimeout to ensure screen readers pick up the change
  setTimeout(() => {
    announcer!.textContent = message;
  }, 100);
  
  // Clear the message after it's been announced
  setTimeout(() => {
    announcer!.textContent = '';
  }, 3000);
}

/**
 * Initialize the playoff calculator feature
 * Sets up event listeners and loads saved threshold from sessionStorage
 */
function initializePlayoffCalculator(): void {
  // Get reference to input element and clear button
  const inputElement = document.getElementById('playoff-threshold') as HTMLInputElement;
  const clearButton = document.getElementById('clear-threshold') as HTMLButtonElement;
  const toggleButton = document.getElementById('calculator-toggle') as HTMLButtonElement;
  const calculatorContent = document.getElementById('calculator-content') as HTMLElement;

  if (!inputElement || !clearButton || !toggleButton || !calculatorContent) {
    console.warn('Playoff calculator elements not found');
    return;
  }

  // Ensure calculator starts collapsed until user expands or a saved threshold exists
  setCalculatorContentVisibility(false);

  // Load saved threshold from sessionStorage if exists
  const savedThreshold = sessionStorage.getItem('playoffThreshold');
  
  if (savedThreshold) {
    // Populate input with saved value
    inputElement.value = savedThreshold;
    
    // Validate the saved threshold
    const validation = validateThreshold(savedThreshold);
    
    if (validation.valid) {
      // Show clear button
      clearButton.style.display = 'inline-block';
      setCalculatorContentVisibility(true);
      
      // Trigger calculation with saved threshold
      const threshold = parseInt(savedThreshold, 10);
      showCalculatorColumns();
      updateAllPlayoffCalculations(threshold);
    } else {
      // Clear invalid saved value
      sessionStorage.removeItem('playoffThreshold');
      inputElement.value = '';
    }
  }

  // Add event listener for input changes
  inputElement.addEventListener('input', handleThresholdChange);
  
  // Add keyboard support for Enter key
  inputElement.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      // Manually trigger validation and calculation
      const value = inputElement.value;
      const validation = validateThreshold(value);
      
      if (validation.valid) {
        const threshold = parseInt(value, 10);
        sessionStorage.setItem('playoffThreshold', threshold.toString());
        clearValidationError();
        
        if (clearButton) {
          clearButton.style.display = 'inline-block';
        }
        
        showCalculatorColumns();
        updateAllPlayoffCalculations(threshold);
        announceToScreenReader(`Playoff calculations updated for ${threshold} point threshold`);
      } else {
        displayValidationError(validation.error || 'Invalid input');
      }
    }
  });

  // Add event listener for clear button click
  clearButton.addEventListener('click', handleClearThreshold);
  
  // Add keyboard support for clear button (Enter and Space)
  clearButton.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClearThreshold();
    }
  });

  // Toggle calculator visibility on button click
  toggleButton.addEventListener('click', () => {
    const shouldShow = calculatorContent.hidden;
    setCalculatorContentVisibility(shouldShow);

    if (shouldShow) {
      inputElement.focus();
    }
  });
}

// Run when DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    renderStandings();
    initializePlayoffCalculator();
  });
} else {
  // DOM is already loaded
  renderStandings();
  initializePlayoffCalculator();
}
