/**
 * Catalyst Grid View
 * Displays Catalysts in a grid layout using the generic grid view and catalyst adapter.
 * Uses catalysts-tab.png background; item order from MLE weight (poedata.dev).
 */

import { catalystGridAdapter } from '../adapters/catalystGridAdapter.js';
import {
  initGenericGridView,
  teardownGenericGridView,
  updateGenericGridView,
  getItemAtPosition,
  highlightCell,
  clearHighlight
} from './genericGridView.js';

/**
 * Initialize catalyst grid view
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Array<Object>} catalysts - Array of catalyst objects (from loadAndMergeCatalystData)
 * @param {string} [imagePath] - Path to catalysts-tab background image (optional)
 */
export async function initCatalystGridView(canvas, catalysts, imagePath = null) {
  await initGenericGridView(canvas, catalysts, catalystGridAdapter, imagePath);
}

/**
 * Remove catalyst grid tooltip listeners. Call before initializing another grid on the same canvas.
 * @param {HTMLCanvasElement} canvas
 */
export function teardownCatalystGridView(canvas) {
  teardownGenericGridView(canvas);
}

/**
 * Update catalyst grid view with new data
 * @param {HTMLCanvasElement} canvas
 * @param {Array<Object>} catalysts
 */
export async function updateCatalystGridView(canvas, catalysts) {
  await updateGenericGridView(canvas, catalysts);
}

/**
 * Get catalyst at grid position (for hover/tooltip)
 * @param {number} x - Display X coordinate
 * @param {number} y - Display Y coordinate
 * @returns {Object|null}
 */
export function getCatalystAtPosition(x, y) {
  return getItemAtPosition(x, y);
}

/**
 * Highlight cell for a catalyst
 * @param {string} catalystId - Catalyst ID to highlight
 */
export function highlightCellForCatalyst(catalystId) {
  highlightCell(catalystId);
}

/**
 * Clear catalyst highlight
 */
export function clearCatalystHighlight() {
  clearHighlight();
}
