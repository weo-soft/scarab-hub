/**
 * Essence Grid View
 * Displays Essences in a grid layout using the generic grid view and essence adapter.
 * Uses essence-tab background; slot order from public/data/essences.json.
 */

import { essenceGridAdapter } from '../adapters/essenceGridAdapter.js';
import {
  initGenericGridView,
  teardownGenericGridView,
  updateGenericGridView,
  getItemAtPosition,
  highlightCell,
  clearHighlight
} from './genericGridView.js';

/**
 * Initialize essence grid view
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Array<Essence>} essences - Array of Essence objects
 * @param {string} [imagePath] - Path to essence-tab background image (optional)
 */
export async function initEssenceGridView(canvas, essences, imagePath = null) {
  await initGenericGridView(canvas, essences, essenceGridAdapter, imagePath);
}

/**
 * Remove essence grid tooltip listeners. Call before initializing another grid (e.g. scarab) on the same canvas.
 * @param {HTMLCanvasElement} canvas
 */
export function teardownEssenceGridView(canvas) {
  teardownGenericGridView(canvas);
}

/**
 * Update essence grid view with new data
 * @param {HTMLCanvasElement} canvas
 * @param {Array<Essence>} essences
 */
export async function updateEssenceGridView(canvas, essences) {
  await updateGenericGridView(canvas, essences);
}

/**
 * Get Essence at grid position (for hover/tooltip)
 * @param {number} x - Display X coordinate
 * @param {number} y - Display Y coordinate
 * @returns {Essence|null}
 */
export function getEssenceAtPosition(x, y) {
  return getItemAtPosition(x, y);
}

/**
 * Highlight cell for an essence
 * @param {string} essenceId - Essence ID to highlight
 */
export function highlightCellForEssence(essenceId) {
  highlightCell(essenceId);
}

/**
 * Clear essence highlight
 */
export function clearEssenceHighlight() {
  clearHighlight();
}
