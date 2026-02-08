/**
 * Fossil Grid View
 * Displays Fossils in a grid layout using the generic grid view and fossil adapter.
 * Uses fossils-tab.png background; item order from FOSSILS_GRID_CONFIG (poeData / MLE).
 */

import { fossilGridAdapter } from '../adapters/fossilGridAdapter.js';
import {
  initGenericGridView,
  teardownGenericGridView,
  updateGenericGridView,
  getItemAtPosition,
  highlightCell,
  clearHighlight
} from './genericGridView.js';

/**
 * Initialize fossil grid view
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Array<Object>} fossils - Array of fossil objects (from loadFullFossilData)
 * @param {string} [imagePath] - Path to fossils-tab background image (optional)
 */
export async function initFossilGridView(canvas, fossils, imagePath = null) {
  await initGenericGridView(canvas, fossils, fossilGridAdapter, imagePath);
}

/**
 * Remove fossil grid tooltip listeners. Call before initializing another grid on the same canvas.
 * @param {HTMLCanvasElement} canvas
 */
export function teardownFossilGridView(canvas) {
  teardownGenericGridView(canvas);
}

/**
 * Update fossil grid view with new data
 * @param {HTMLCanvasElement} canvas
 * @param {Array<Object>} fossils
 */
export async function updateFossilGridView(canvas, fossils) {
  await updateGenericGridView(canvas, fossils);
}

/**
 * Get fossil at grid position (for hover/tooltip)
 * @param {number} x - Display X coordinate
 * @param {number} y - Display Y coordinate
 * @returns {Object|null}
 */
export function getFossilAtPosition(x, y) {
  return getItemAtPosition(x, y);
}

/**
 * Highlight cell for a fossil
 * @param {string} fossilId - Fossil ID to highlight
 */
export function highlightCellForFossil(fossilId) {
  highlightCell(fossilId);
}

/**
 * Clear fossil highlight
 */
export function clearFossilHighlight() {
  clearHighlight();
}
