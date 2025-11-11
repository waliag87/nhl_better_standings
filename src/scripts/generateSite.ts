/**
 * Static Site Generator Module
 * Generates static HTML files with embedded standings data
 */

import * as fs from 'fs';
import * as path from 'path';
import { ProcessedStandings } from '../types/standings.js';

/**
 * Generate static site with embedded standings data
 * 
 * @param standings - Processed standings data to embed in the site
 */
export function generateSite(standings: ProcessedStandings): void {
  try {
    // Ensure dist directory exists
    const distDir = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    // Read HTML template file
    const templatePath = path.join(process.cwd(), 'src', 'template.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf-8');

    // Embed processed standings data as JSON in script tag
    const standingsJson = JSON.stringify(standings, null, 2);
    htmlContent = htmlContent.replace(
      '<!-- JSON data will be inserted here -->',
      standingsJson
    );

    // Write output HTML to dist/index.html
    const outputHtmlPath = path.join(distDir, 'index.html');
    fs.writeFileSync(outputHtmlPath, htmlContent, 'utf-8');
    console.log(`✓ Generated HTML: ${outputHtmlPath}`);

    // Copy CSS file to dist/styles.css
    const cssSourcePath = path.join(process.cwd(), 'src', 'styles.css');
    const cssDestPath = path.join(distDir, 'styles.css');
    fs.copyFileSync(cssSourcePath, cssDestPath);
    console.log(`✓ Copied CSS: ${cssDestPath}`);

    // Copy compiled JavaScript to dist/app.js
    const jsSourcePath = path.join(distDir, 'app.js');
    if (fs.existsSync(jsSourcePath)) {
      console.log(`✓ JavaScript already compiled: ${jsSourcePath}`);
    } else {
      console.warn(`⚠ Warning: Compiled JavaScript not found at ${jsSourcePath}`);
      console.warn('  Make sure to run TypeScript compilation before generating the site');
    }

    console.log('\n✓ Static site generation complete!');
    console.log(`  Output directory: ${distDir}`);
  } catch (error) {
    console.error('Error generating static site:', error);
    throw error;
  }
}
