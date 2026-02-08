/**
 * Delirium Orb Grid View
 */

import { deliriumOrbGridAdapter } from '../adapters/deliriumOrbGridAdapter.js';
import {
  initGenericGridView,
  teardownGenericGridView,
  updateGenericGridView,
  getItemAtPosition,
  highlightCell,
  clearHighlight
} from './genericGridView.js';

export async function initDeliriumOrbGridView(canvas, items, imagePath = null) {
  await initGenericGridView(canvas, items, deliriumOrbGridAdapter, imagePath);
}

export function teardownDeliriumOrbGridView(canvas) {
  teardownGenericGridView(canvas);
}

export async function updateDeliriumOrbGridView(canvas, items) {
  await updateGenericGridView(canvas, items);
}

export function getDeliriumOrbAtPosition(x, y) {
  return getItemAtPosition(x, y);
}

export function highlightCellForDeliriumOrb(itemId) {
  highlightCell(itemId);
}

export function clearDeliriumOrbHighlight() {
  clearHighlight();
}
