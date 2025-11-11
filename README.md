# NHL Standings Website

A static website that displays current NHL team standings organized by point percentage, with automatic daily updates. The site shows division leaders, wild card positions, and all team statistics in a responsive, accessible format.

## Features

- **Point Percentage Rankings**: Teams sorted by point percentage (points / games played × 2)
- **Division Leaders**: Visual indicators for top 3 teams in each division
- **Wild Card Positions**: Highlights the 2 wild card teams per conference
- **Daily Updates**: Automatically fetches and updates standings every day at 12 AM PST
- **Responsive Design**: Works seamlessly on mobile and desktop devices
- **Accessible**: WCAG AA compliant with screen reader support

## Project Structure

```
nhl-standings-website/
├── src/
│   ├── app.ts                    # Frontend TypeScript for rendering
│   ├── template.html             # HTML template
│   ├── styles.css                # Responsive CSS styling
│   ├── scripts/
│   │   ├── build.ts              # Build orchestration
│   │   ├── fetchData.ts          # NHL API data fetcher
│   │   ├── generateSite.ts       # Static site generator
│   │   └── processStandings.ts   # Standings calculation logic
│   ├── types/
│   │   ├── nhl.ts                # NHL API response types
│   │   └── standings.ts          # Processed standings types
│   └── utils/
│       ├── calculations.ts       # Point percentage & tiebreakers
│       ├── playoffs.ts           # Division leader & wild card logic
│       └── validation.ts         # Data validation functions
├── dist/                         # Generated static files (deployed)
├── .github/
│   └── workflows/
│       └── update-standings.yml  # GitHub Actions workflow
├── package.json
├── tsconfig.json
└── README.md
```

## Prerequisites

- Node.js 18 or higher
- npm (comes with Node.js)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/[username]/nhl-standings-website.git
cd nhl-standings-website
```

2. Install dependencies:
```bash
npm install
```

## Local Development

### Build TypeScript Files

Compile TypeScript to JavaScript:
```bash
npm run build
```

### Generate the Site

Fetch current NHL data and generate the static site:
```bash
npm run generate
```

This command will:
1. Compile TypeScript files
2. Fetch current standings from the NHL API
3. Process the data (calculate point percentages, identify playoff positions)
4. Generate static HTML/CSS/JS files in the `dist/` directory

### Development Mode

Watch for TypeScript changes and recompile automatically:
```bash
npm run dev
```

### View the Site Locally

After generating the site, open `dist/index.html` in your browser, or use a local server:

```bash
# Using Python 3
cd dist
python3 -m http.server 8000

# Using Node.js (install http-server globally first)
npx http-server dist -p 8000
```

Then visit `http://localhost:8000` in your browser.

## NHL API Source

This project uses the official NHL API to fetch current standings data:

- **Endpoint**: `https://api-web.nhle.com/v1/standings/now`
- **Data Provided**: Team records, points, games played, division/conference information
- **Update Frequency**: The API provides real-time data; this site updates daily
- **No Authentication Required**: The API is publicly accessible

### API Response Structure

The API returns standings data including:
- Team names, abbreviations, and IDs
- Wins, losses, and overtime/shootout losses
- Total points and games played
- Division and conference affiliations
- Additional statistics (goals for/against, streaks, etc.)

## GitHub Actions Workflow

The site automatically updates daily using GitHub Actions.

### Workflow Configuration

The workflow is defined in `.github/workflows/update-standings.yml`:

- **Schedule**: Runs daily at 12 AM PST (8 AM UTC)
- **Manual Trigger**: Can be triggered manually via GitHub Actions UI
- **Node.js Version**: 20.x

### Workflow Steps

1. **Checkout repository**: Gets the latest code
2. **Setup Node.js**: Installs Node.js 20 with npm caching
3. **Install dependencies**: Runs `npm ci` for clean install
4. **Build TypeScript**: Compiles TypeScript files
5. **Generate site**: Fetches NHL data and generates static files
6. **Commit changes**: Commits updated `dist/` files to the default branch (if there are changes)
7. **Upload artifact**: Packages the built `dist/` directory for Pages
8. **Deploy to GitHub Pages**: Uses `actions/deploy-pages` to publish the artifact

### Required Permissions

The workflow requires the following permissions (already configured):
- `contents: write` - To commit updated files
- `pages: write` - To deploy to GitHub Pages
- `id-token: write` - For GitHub Pages deployment

### Manual Workflow Trigger

To manually trigger an update:

1. Go to your repository on GitHub
2. Click on the "Actions" tab
3. Select "Update NHL Standings" workflow
4. Click "Run workflow" button
5. Select the branch and click "Run workflow"

## GitHub Pages Setup

To deploy this site using GitHub Pages:

### 1. Enable GitHub Pages

1. Go to your repository settings
2. Navigate to "Pages" in the left sidebar
3. Under "Build and deployment", set **Source** to **GitHub Actions**
4. Click "Save"

### 2. Configure Repository Permissions

Ensure GitHub Actions has permission to deploy:

1. Go to Settings → Actions → General
2. Scroll to "Workflow permissions"
3. Select "Read and write permissions"
4. Check "Allow GitHub Actions to create and approve pull requests"
5. Click "Save"

### 3. Access Your Site

After the first successful workflow run, your site will be available at:

```
https://[username].github.io/[repository-name]/
```

### Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file to the `dist/` directory with your domain
2. Configure DNS settings with your domain provider
3. Update GitHub Pages settings with your custom domain

## How It Works

### Data Flow

1. **Fetch**: The `fetchData.ts` script retrieves current standings from the NHL API
2. **Process**: The `processStandings.ts` script:
   - Calculates point percentages for all teams
   - Identifies top 3 teams per division (division leaders)
   - Calculates 2 wild card teams per conference
   - Applies NHL tiebreaker rules
3. **Generate**: The `generateSite.ts` script:
   - Embeds processed data as JSON in the HTML template
   - Copies CSS and compiled JavaScript to `dist/`
4. **Render**: The frontend `app.ts` script:
   - Reads the embedded JSON data
   - Dynamically generates standings tables
   - Applies visual indicators for playoff positions

### Standings Calculation

**Point Percentage Formula**:
```
Point Percentage = Points / (Games Played × 2)
```

**Tiebreaker Rules** (applied in order):
1. Games played (fewer is better)
2. Regulation wins (more is better)
3. Regulation and overtime wins (more is better)

**Playoff Positions**:
- **Division Leaders**: Top 3 teams in each of the 4 divisions (12 total)
- **Wild Cards**: Next 2 highest point percentage teams per conference that aren't division leaders (4 total)

## Error Handling

The system includes robust error handling:

- **API Failures**: Retries up to 3 times with exponential backoff
- **Fallback Data**: Uses cached data from previous successful fetch if API is unavailable
- **Validation**: Verifies all 32 NHL teams are present and data is valid
- **Warning Indicators**: Displays a banner when using stale data
- **Build Preservation**: Keeps previous site version if build fails completely

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility

The site follows WCAG AA guidelines:

- Semantic HTML5 structure
- ARIA labels for tables and interactive elements
- Proper heading hierarchy
- Keyboard navigation support
- Screen reader friendly
- Sufficient color contrast ratios

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- NHL API for providing real-time standings data
- GitHub Pages for free static site hosting
- GitHub Actions for automated updates
