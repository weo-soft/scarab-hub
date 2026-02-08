/**
 * Scarab Grid View
 * Displays Scarabs in a grid layout using the generic grid view and scarab adapter.
 * Uses Scarab-tab.png image with cell overlay system.
 */

import { scarabGridAdapter } from '../adapters/scarabGridAdapter.js';
import {
  initGenericGridView,
  teardownGenericGridView,
  updateGenericGridView,
  getItemAtPosition,
  highlightCell,
  clearHighlight,
  getCellForItem,
  getAllCells,
  setYieldCounts as setGenericYieldCounts,
  clearYieldCounts as clearGenericYieldCounts,
  setFilteredItemIds,
  clearFilteredItemIds,
  setShowCellBackgrounds as setGenericShowCellBackgrounds,
  getShowCellBackgrounds as getGenericShowCellBackgrounds,
  renderGridOptimized as genericRenderGridOptimized
} from './genericGridView.js';

/**
 * Initialize scarab grid view
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Array<Scarab>} scarabs - Array of Scarab objects
 * @param {string} [imagePath] - Path to base grid image (optional)
 */
export async function initGridView(canvas, scarabs, imagePath = null) {
  await initGenericGridView(canvas, scarabs, scarabGridAdapter, imagePath);
}

/**
 * Remove scarab grid tooltip listeners. Call before initializing another grid (e.g. essence) on the same canvas.
 * @param {HTMLCanvasElement} canvas
 */
export function teardownGridView(canvas) {
  teardownGenericGridView(canvas);
}

/**
 * Update grid view with new scarab data
 * @param {HTMLCanvasElement} canvas
 * @param {Array<Scarab>} scarabs
 */
export async function updateGridView(canvas, scarabs) {
  await updateGenericGridView(canvas, scarabs);
}

/**
 * Get Scarab at grid position (for hover/tooltip)
 * @param {number} x - Mouse X position (display coordinates)
 * @param {number} y - Mouse Y position (display coordinates)
 * @returns {Scarab|null}
 */
export function getScarabAtPosition(x, y) {
  return getItemAtPosition(x, y);
}

/**
 * Get cell definition for a Scarab
 * @param {string} scarabId - Scarab ID
 * @returns {Object|null}
 */
export function getCellForScarab(scarabId) {
  return getCellForItem(scarabId);
}

/**
 * Get all cell definitions
 * @returns {Array<Object>}
 */
export { getAllCells };

/**
 * Highlight cell for a scarab
 * @param {string} scarabId - Scarab ID to highlight
 */
export function highlightCellForScarab(scarabId) {
  highlightCell(scarabId);
}

export { clearHighlight };

/**
 * Set filtered scarab IDs for highlighting
 * @param {Array<string>|Set<string>} scarabIds - Array or Set of scarab IDs that match filters
 */
export function setFilteredScarabs(scarabIds) {
  setFilteredItemIds(scarabIds);
}

/**
 * Clear filtered scarab highlights
 */
export function clearFilteredScarabs() {
  clearFilteredItemIds();
}

/**
 * Set yield counts for display in grid view
 * @param {Map<string, number>|Object} counts - Map or object of scarab ID to yield count
 */
export function setYieldCounts(counts) {
  setGenericYieldCounts(counts);
}

/**
 * Clear yield counts from grid view
 */
export function clearYieldCounts() {
  clearGenericYieldCounts();
}

/**
 * Optimized re-render using requestAnimationFrame
 * @param {HTMLCanvasElement} canvas
 */
export function renderGridOptimized(canvas) {
  genericRenderGridOptimized(canvas);
}

/**
 * Toggle cell background visibility
 * @param {boolean} show - Whether to show cell backgrounds
 */
export function setShowCellBackgrounds(show) {
  setGenericShowCellBackgrounds(show);
}

/**
 * Get current cell background visibility state
 * @returns {boolean}
 */
export function getShowCellBackgrounds() {
  return getGenericShowCellBackgrounds();
}
