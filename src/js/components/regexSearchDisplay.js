/**
 * Regex search display: show generated regex and Copy button for in-game search.
 */

import { generateRegex, optimizeRegex, MAX_LENGTH } from '../services/regexSearchService.js';
import { getSelectedIds, selectAll, clear } from '../services/selectionState.js';

// When regex goes over limit we auto-run optimization; keep result until selection changes.
let lastOptimizedValue = null;
let lastOptimizedForIdsKey = null;
// So we only attempt once per selection state; retry when user selects/deselects (new idKey).
let lastOptimizeAttemptedForIdsKey = null;

function selectionKey(selectedIds) {
  return Array.from(selectedIds).sort().join('\0');
}

/**
 * Render regex display into container. Call when selection or category changes.
 * When regex exceeds the limit, optimization runs automatically; if none found, it runs again after selection change.
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
  const idKey = selectionKey(selectedIds);

  // Selection changed: clear optimized value and allow optimization to run again for new selection
  if (lastOptimizedForIdsKey !== idKey) {
    lastOptimizedValue = null;
    lastOptimizedForIdsKey = null;
    lastOptimizeAttemptedForIdsKey = null;
  }

  let result = null;
  try {
    result = generateRegex(selectedIds, categoryNames);
  } catch (err) {
    console.warn('Regex generation failed:', err);
  }

  // Auto-run optimizer when over limit and we haven't tried for this selection yet
  if (result?.value && result.length > MAX_LENGTH && lastOptimizeAttemptedForIdsKey !== idKey) {
    lastOptimizeAttemptedForIdsKey = idKey;
    const optimized = optimizeRegex(selectedIds, categoryNames, result.value);
    if (optimized) {
      lastOptimizedValue = optimized.value;
      lastOptimizedForIdsKey = idKey;
    }
  }

  let message = 'Select at least one item';
  let regexValue = '';
  let regexLength = 0;
  let exceedsMaxLength = false;
  let copyDisabled = true;

  if (result) {
    const useOptimized = lastOptimizedValue != null && lastOptimizedForIdsKey === idKey && lastOptimizedValue.length < result.length;
    regexValue = useOptimized ? lastOptimizedValue : result.value;
    regexLength = regexValue.length;
    exceedsMaxLength = regexLength > MAX_LENGTH;
    copyDisabled = !regexValue;
    message = regexValue
      ? `Regex (${regexLength}/${MAX_LENGTH} chars)${exceedsMaxLength ? ' — over limit' : ''}`
      : 'Select at least one item';
  }

  const lengthWarning = exceedsMaxLength
    ? `<p class="regex-search-exceeds-max-note">Regex exceeds ${MAX_LENGTH} characters. In-game search may not accept it.</p>`
    : '';

  const allIds = categoryNames.namesById ? Array.from(categoryNames.namesById.keys()) : [];

  container.innerHTML = `
    <div class="regex-search-display">
      <div class="regex-search-label">${message}</div>
      <div class="regex-search-value" title="${escapeAttr(regexValue)}">${escapeHtml(regexValue) || '—'}</div>
      ${lengthWarning}
      <div class="regex-search-actions">
        <button type="button" class="regex-search-select-all-btn" ${allIds.length === 0 ? 'disabled' : ''}>Select all</button>
        <button type="button" class="regex-search-unselect-all-btn">Unselect all</button>
        <button type="button" class="regex-search-copy-btn" ${copyDisabled ? 'disabled' : ''}>Copy regex</button>
      </div>
    </div>
  `;

  const copyBtn = container.querySelector('.regex-search-copy-btn');
  if (copyBtn && !copyDisabled) {
    copyBtn.addEventListener('click', () => copyRegex(regexValue, copyBtn));
  }

  const selectAllBtn = container.querySelector('.regex-search-select-all-btn');
  if (selectAllBtn && allIds.length > 0) {
    selectAllBtn.addEventListener('click', () => selectAll(allIds));
  }

  const unselectAllBtn = container.querySelector('.regex-search-unselect-all-btn');
  if (unselectAllBtn) {
    unselectAllBtn.addEventListener('click', () => clear());
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
