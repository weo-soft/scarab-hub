/**
 * Regex search display: show generated regex and Copy button for in-game search.
 */

import { generateRegex } from '../services/regexSearchService.js';
import { getSelectedIds } from '../services/selectionState.js';

/**
 * Render regex display into container. Call when selection or category changes.
 * @param {HTMLElement} container
 * @param {{ categoryId: string, namesById: Map<string, string>, names: string[] }} categoryNames
 */
export function renderRegexSearchDisplay(container, categoryNames) {
  if (!container) return;
  if (!categoryNames?.namesById) {
    container.innerHTML = '<div class="regex-search-display"><div class="regex-search-label">No item data</div></div>';
    return;
  }

  const selectedIds = getSelectedIds();
  let result = null;
  try {
    result = generateRegex(selectedIds, categoryNames);
  } catch (err) {
    console.warn('Regex generation failed:', err);
  }

  let message = 'Select at least one item';
  let regexValue = '';
  let truncated = false;
  let copyDisabled = true;

  if (result) {
    regexValue = result.value;
    truncated = !!result.truncated;
    copyDisabled = !result.value;
    message = result.value
      ? `Regex (${result.length}/250 chars)${truncated ? ' — truncated' : ''}`
      : 'Select at least one item';
  }

  const truncatedNote = truncated
    ? '<p class="regex-search-truncated-note">Not all selected items could fit in 250 characters. Regex matches a subset or uses shortened patterns.</p>'
    : '';

  container.innerHTML = `
    <div class="regex-search-display">
      <div class="regex-search-label">${message}</div>
      <div class="regex-search-value" title="${escapeAttr(regexValue)}">${escapeHtml(regexValue) || '—'}</div>
      ${truncatedNote}
      <button type="button" class="regex-search-copy-btn" ${copyDisabled ? 'disabled' : ''}>Copy regex</button>
    </div>
  `;

  const btn = container.querySelector('.regex-search-copy-btn');
  if (btn && !copyDisabled) {
    btn.addEventListener('click', () => copyRegex(regexValue, btn));
  }
}

function escapeHtml(s) {
  if (!s) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function escapeAttr(s) {
  if (!s) return '';
  return s.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Copy regex to clipboard and show feedback on button.
 * @param {string} value
 * @param {HTMLButtonElement} btn
 */
async function copyRegex(value, btn) {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = orig;
      btn.disabled = false;
    }, 1500);
  } catch (err) {
    console.warn('Copy failed:', err);
    btn.textContent = 'Copy failed';
    setTimeout(() => { btn.textContent = 'Copy regex'; }, 2000);
  }
}
