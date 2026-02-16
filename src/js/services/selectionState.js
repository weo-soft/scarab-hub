/**
 * Selection state for regex search feature.
 * Single source of truth for which items are selected in the current category.
 * Shared between list view and grid view.
 */

const MAX_REGEX_LENGTH = 250;

/** @type {Map<string, Set<string>>} per-category selected IDs */
const selectionByCategory = new Map();

/** @type {string} current category id */
let currentCategoryId = '';

/** @type {Array<() => void>} subscribers notified on selection change */
const subscribers = [];

/**
 * Set the current category (e.g. when user switches tabs).
 * Optionally clear selection for the new category (per data-model: clear on switch).
 * @param {string} categoryId
 * @param {boolean} [clearSelection=true] - If true, clear selection when switching category
 */
export function setCategory(categoryId, clearSelection = true) {
  if (currentCategoryId === categoryId) return;
  currentCategoryId = categoryId || '';
  if (clearSelection) {
    selectionByCategory.set(categoryId, new Set());
  } else if (!selectionByCategory.has(categoryId)) {
    selectionByCategory.set(categoryId, new Set());
  }
  notify();
}

/**
 * Get current category id
 * @returns {string}
 */
export function getCategoryId() {
  return currentCategoryId;
}

/**
 * Get the set of selected item IDs for the current category.
 * @returns {Set<string>}
 */
export function getSelectedIds() {
  if (!currentCategoryId) return new Set();
  if (!selectionByCategory.has(currentCategoryId)) {
    selectionByCategory.set(currentCategoryId, new Set());
  }
  return selectionByCategory.get(currentCategoryId);
}

/**
 * Toggle selection for an item id in the current category.
 * @param {string} id - Item id
 */
export function toggle(id) {
  if (!id || !currentCategoryId) return;
  if (!selectionByCategory.has(currentCategoryId)) {
    selectionByCategory.set(currentCategoryId, new Set());
  }
  const set = selectionByCategory.get(currentCategoryId);
  if (set.has(id)) {
    set.delete(id);
  } else {
    set.add(id);
  }
  notify();
}

/**
 * Add an item to selection
 * @param {string} id
 */
export function add(id) {
  if (!id || !currentCategoryId) return;
  if (!selectionByCategory.has(currentCategoryId)) {
    selectionByCategory.set(currentCategoryId, new Set());
  }
  selectionByCategory.get(currentCategoryId).add(id);
  notify();
}

/**
 * Remove an item from selection
 * @param {string} id
 */
export function remove(id) {
  if (!id || !currentCategoryId) return;
  const set = selectionByCategory.get(currentCategoryId);
  if (set) set.delete(id);
  notify();
}

/**
 * Clear selection for the current category
 */
export function clear() {
  if (currentCategoryId && selectionByCategory.has(currentCategoryId)) {
    selectionByCategory.get(currentCategoryId).clear();
  }
  notify();
}

/**
 * Set selection to all given IDs (e.g. "select all").
 * @param {string[]} ids
 */
export function selectAll(ids) {
  if (!currentCategoryId) return;
  if (!Array.isArray(ids)) return;
  selectionByCategory.set(currentCategoryId, new Set(ids));
  notify();
}

/**
 * Check if an item is selected in the current category
 * @param {string} id
 * @returns {boolean}
 */
export function has(id) {
  if (!currentCategoryId) return false;
  const set = selectionByCategory.get(currentCategoryId);
  return set ? set.has(id) : false;
}

/**
 * Subscribe to selection changes. Call the returned function to unsubscribe.
 * @param {() => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribe(callback) {
  if (typeof callback !== 'function') return () => {};
  subscribers.push(callback);
  return () => {
    const i = subscribers.indexOf(callback);
    if (i !== -1) subscribers.splice(i, 1);
  };
}

function notify() {
  subscribers.forEach(fn => {
    try {
      fn();
    } catch (e) {
      console.warn('Selection state subscriber error:', e);
    }
  });
}

export { MAX_REGEX_LENGTH };
