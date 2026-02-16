/**
 * Legion Emblem Grid View
 */

import { emblemGridAdapter } from '../adapters/emblemGridAdapter.js';
import {
  initGenericGridView,
  teardownGenericGridView,
  updateGenericGridView,
  getItemAtPosition,
  highlightCell,
  clearHighlight
} from './genericGridView.js';

export async function initEmblemGridView(canvas, items, imagePath = null) {
  await initGenericGridView(canvas, items, emblemGridAdapter, imagePath);
}

export function teardownEmblemGridView(canvas) {
  teardownGenericGridView(canvas);
}

export async function updateEmblemGridView(canvas, items) {
  await updateGenericGridView(canvas, items);
}

export function getEmblemAtPosition(x, y) {
  return getItemAtPosition(x, y);
}

export function highlightCellForEmblem(itemId) {
  highlightCell(itemId);
}

export function clearEmblemHighlight() {
  clearHighlight();
}
