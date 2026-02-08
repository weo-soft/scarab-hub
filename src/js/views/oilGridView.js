/**
 * Oil Grid View
 * Displays Oils in a grid layout using the generic grid view and oil adapter.
 * Uses oils-tab.png background; item order from OILS_GRID_CONFIG (tier / itemOrderConfig).
 */

import { oilGridAdapter } from '../adapters/oilGridAdapter.js';
import {
  initGenericGridView,
  teardownGenericGridView,
  updateGenericGridView,
  getItemAtPosition,
  highlightCell,
  clearHighlight
} from './genericGridView.js';

/**
 * Initialize oil grid view
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Array<Object>} oils - Array of oil objects (from loadFullOilData)
 * @param {string} [imagePath] - Path to oils-tab background image (optional)
 */
export async function initOilGridView(canvas, oils, imagePath = null) {
  await initGenericGridView(canvas, oils, oilGridAdapter, imagePath);
}

/**
 * Remove oil grid tooltip listeners. Call before initializing another grid on the same canvas.
 * @param {HTMLCanvasElement} canvas
 */
export function teardownOilGridView(canvas) {
  teardownGenericGridView(canvas);
}

/**
 * Update oil grid view with new data
 * @param {HTMLCanvasElement} canvas
 * @param {Array<Object>} oils
 */
export async function updateOilGridView(canvas, oils) {
  await updateGenericGridView(canvas, oils);
}

/**
 * Get oil at grid position (for hover/tooltip)
 * @param {number} x - Display X coordinate
 * @param {number} y - Display Y coordinate
 * @returns {Object|null}
 */
export function getOilAtPosition(x, y) {
  return getItemAtPosition(x, y);
}

/**
 * Highlight cell for an oil
 * @param {string} oilId - Oil ID to highlight
 */
export function highlightCellForOil(oilId) {
  highlightCell(oilId);
}

/**
 * Clear oil highlight
 */
export function clearOilHighlight() {
  clearHighlight();
}
