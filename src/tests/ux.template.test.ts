import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { load } from 'cheerio';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const templatePath = resolve(__dirname, '../../src/template.html');
const templateHtml = readFileSync(templatePath, 'utf-8');
const $ = load(templateHtml);

describe('Template UX safeguards', () => {
  it('provides a working skip link to the main content', () => {
    const skipLink = $('a.skip-link');
    assert.ok(skipLink.length === 1, 'Skip link should exist once');
    assert.equal(skipLink.attr('href'), '#main-content');
    assert.match(skipLink.text().trim(), /skip to main content/i);
  });

  it('surfaces stale data warnings with alert semantics', () => {
    const warning = $('#stale-data-warning');
    assert.ok(warning.length === 1, 'Warning banner should exist');
    assert.equal(warning.attr('role'), 'alert');
    assert.ok(
      warning.find('#cache-timestamp').length === 1,
      'Warning banner should expose cache timestamp placeholder'
    );
  });

  it('exposes the playoff calculator control with accessible toggles', () => {
    const toggle = $('#calculator-toggle');
    const targetId = toggle.attr('aria-controls');
    assert.ok(toggle.length === 1, 'Calculator toggle should exist');
    assert.equal(toggle.attr('aria-expanded'), 'false');
    assert.equal(targetId, 'calculator-content');

    const drawer = $(`#${targetId}`);
    assert.ok(drawer.length === 1, 'Toggle target content should exist');
    assert.ok(drawer.attr('hidden') !== undefined, 'Drawer should be hidden by default');
    assert.equal(toggle.attr('aria-label'), 'Toggle playoff calculator');
  });

  it('ensures every standings table offers captions and titled abbreviations', () => {
    const tables = $('.standings-table');
    assert.ok(tables.length >= 6, 'Expect at least six standings tables');

    tables.each((_, table) => {
      const node = $(table);
      const caption = node.find('caption');
      assert.ok(caption.length === 1, 'Each table needs a caption');
      assert.ok(caption.hasClass('sr-only'), 'Caption should be visually hidden but present');

      node.find('thead abbr').each((__, abbr) => {
        const title = $(abbr).attr('title');
        assert.ok(title && title.trim().length > 0, '<abbr> needs an explicit title');
      });
    });
  });
});
