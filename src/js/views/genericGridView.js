/**
 * Generic Grid View
 * Canvas-based grid display driven by an adapter. Supports Scarabs, Essences, and future item types.
 *
 * Adapter interface:
 * - getGridConfig() → { tabImagePath?, imageDimensions, createCells() }
 * - mapItemsToCells(items, cellDefinitions) → Promise<{ cellToItem: Map, itemToCellId: Map }>
 * - getImagePath(item) → string
 * - getItemId(item) → string
 * - showItemTooltip(item, x, y) → void
 * - getProfitabilityStatus(item) → 'profitable' | 'not_profitable' | 'unknown'
 * - options → { supportsYieldCounts?, supportsFilteredIds?, supportsCellBackgrounds?, isSimulationCanvas?(canvas) }
 */

import { loadImage, drawCellHighlight, drawCellBorder, clearCanvas } from '../utils/canvasUtils.js';
import { getProfitabilityColor, getProfitabilityBorderColor } from '../utils/colorUtils.js';
import { getCellAtPosition, getCellById } from '../utils/cellMapper.js';
import { hideTooltip, updateTooltipPosition } from '../utils/tooltip.js';
import { has as selectionHas, toggle as selectionToggle, subscribe as subscribeSelection } from '../services/selectionState.js';

let currentAdapter = null;
let baseImage = null;
let itemData = [];
let cellDefinitions = [];
let cellToItemMap = new Map();
let itemToCellMap = new Map();
let itemImageCache = new Map();
let currentCanvas = null;
let highlightedItemId = null;
let filteredItemIds = new Set();
let yieldCounts = new Map();
let showCellBackgrounds = true;
let tooltipHandlers = null;
let tooltipCanvas = null;
let selectionUnsubscribe = null;

/**
 * Initialize the generic grid view with an adapter
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Array} items - Array of item objects (e.g. Scarab, Essence)
 * @param {Object} adapter - Grid adapter implementing the interface
 * @param {string} [imagePath] - Override tab image path (optional)
 */
export async function initGenericGridView(canvas, items, adapter, imagePath = null) {
  if (!canvas) {
    console.error('Generic grid view: missing canvas element');
    return;
  }
  if (!adapter) {
    console.error('Generic grid view: missing adapter');
    return;
  }

  currentCanvas = canvas;
  currentAdapter = adapter;
  itemData = items || [];
  itemImageCache = new Map();

  const opts = adapter.options || {};
  const isSimulation = opts.isSimulationCanvas ? opts.isSimulationCanvas(canvas) : false;

  if (isSimulation) {
    showCellBackgrounds = false;
  } else {
    yieldCounts.clear();
    showCellBackgrounds = true;
  }

  try {
    const config = adapter.getGridConfig();
    const path = imagePath || config.tabImagePath;
    if (path) {
      baseImage = await loadImage(path);
    } else {
      baseImage = null;
    }

    setupCanvas(canvas, config);
    const createCells = config.createCells;
    cellDefinitions = typeof createCells === 'function' ? createCells() : [];
    if (cellDefinitions && typeof cellDefinitions.then === 'function') {
      cellDefinitions = await cellDefinitions;
    }

    const mapping = await adapter.mapItemsToCells(itemData, cellDefinitions);
    cellToItemMap = mapping.cellToItem || new Map();
    itemToCellMap = mapping.itemToCellId || new Map();

    await preloadImages(adapter);
    renderGrid(canvas, adapter);
    setupTooltipHandlers(canvas, adapter);
    setupSelectionHandlers(canvas, adapter);
    selectionUnsubscribe = subscribeSelection(() => {
      if (currentCanvas === canvas && currentAdapter) renderGrid(canvas, currentAdapter);
    });
  } catch (error) {
    console.error('Error initializing generic grid view:', error);
    renderGrid(canvas, adapter);
    if (canvas) setupTooltipHandlers(canvas, adapter);
  }
}

function setupCanvas(canvas, config) {
  const ctx = canvas.getContext('2d');
  const dims = config.imageDimensions || { width: 825, height: 787 };
  const width = baseImage ? baseImage.width : dims.width;
  const height = baseImage ? baseImage.height : dims.height;

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
  canvas._scaleFactor = dpr;
}

async function preloadImages(adapter) {
  const toLoad = Array.from(cellToItemMap.values());
  const load = async (item) => {
    const id = adapter.getItemId(item);
    if (itemImageCache.has(id)) return itemImageCache.get(id);
    try {
      const path = adapter.getImagePath(item);
      const img = await loadImage(path);
      itemImageCache.set(id, img);
      return img;
    } catch (e) {
      itemImageCache.set(id, null);
      return null;
    }
  };
  await Promise.allSettled(toLoad.map(load));
}

function getDisplayDimensions(adapter) {
  const config = adapter ? adapter.getGridConfig() : null;
  const dims = config?.imageDimensions || { width: 825, height: 787 };
  return {
    width: baseImage ? baseImage.width : dims.width,
    height: baseImage ? baseImage.height : dims.height
  };
}

function drawCellOverlay(ctx, cell, item, adapter) {
  const status = adapter.getProfitabilityStatus(item);
  const color = getProfitabilityColor(status);
  const borderColor = getProfitabilityBorderColor(status);
  const opts = adapter.options || {};
  const supportsBackgrounds = opts.supportsCellBackgrounds !== false;
  const supportsYield = opts.supportsYieldCounts && yieldCounts.size > 0;
  const itemId = adapter.getItemId(item);
  const yieldCount = yieldCounts.get(itemId);
  const isSimulation = currentCanvas && opts.isSimulationCanvas && opts.isSimulationCanvas(currentCanvas);
  const hasYieldCount = yieldCount !== undefined && yieldCount !== null && yieldCount > 0;
  const shouldShowImage = !isSimulation || hasYieldCount;

  if (showCellBackgrounds && supportsBackgrounds && status !== 'unknown') {
    drawCellHighlight(ctx, cell.x, cell.y, cell.width, cell.height, color, 0.4);
  }

  if (shouldShowImage) {
    const img = itemImageCache.get(itemId);
    if (img) {
      const pad = 2;
      ctx.drawImage(img, cell.x + pad, cell.y + pad, cell.width - pad * 2, cell.height - pad * 2);
    }
  }

  if (supportsYield && yieldCount !== undefined && yieldCount !== null) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    const textX = cell.x + cell.width - 3;
    const textY = cell.y + cell.height - 3;
    const text = yieldCount > 0 ? yieldCount.toLocaleString() : '0';
    ctx.strokeText(text, textX, textY);
    ctx.fillText(text, textX, textY);
    ctx.restore();
  }

  if (showCellBackgrounds && supportsBackgrounds) {
    drawCellBorder(ctx, cell.x, cell.y, cell.width, cell.height, borderColor, 2);
  }

  if (highlightedItemId === itemId) {
    drawCellHighlight(ctx, cell.x, cell.y, cell.width, cell.height, '#ffd700', 0.6);
    drawCellBorder(ctx, cell.x, cell.y, cell.width, cell.height, '#ffd700', 3);
  }

  if (selectionHas(itemId)) {
    drawCellBorder(ctx, cell.x, cell.y, cell.width, cell.height, 'rgba(200, 170, 110, 0.9)', 2);
  }
}

function renderGrid(canvas, adapter) {
  if (!adapter) adapter = currentAdapter;
  if (!adapter) return;

  const ctx = canvas.getContext('2d');
  const { width, height } = getDisplayDimensions(adapter);
  clearCanvas(ctx, width, height);

  if (baseImage) {
    ctx.drawImage(baseImage, 0, 0, width, height);
  } else {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);
    const cellW = 49;
    const cellH = 48;
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += cellW + 2) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i < height; i += cellH + 2) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }
  }

  const opts = adapter.options || {};
  const supportsFiltered = opts.supportsFilteredIds;

  cellDefinitions.forEach((cell) => {
    const item = cellToItemMap.get(cell.id);
    if (item) {
      drawCellOverlay(ctx, cell, item, adapter);
      if (supportsFiltered && filteredItemIds.size > 0) {
        const itemId = adapter.getItemId(item);
        if (!filteredItemIds.has(itemId)) {
          drawCellHighlight(ctx, cell.x, cell.y, cell.width, cell.height, '#000000', 0.7);
        }
      }
    }
  });
}

/**
 * Teardown: remove tooltip listeners and clear reference. Call before initializing another grid on the same canvas.
 * @param {HTMLCanvasElement} canvas
 */
export function teardownGenericGridView(canvas) {
  if (!canvas || !tooltipHandlers || tooltipCanvas !== canvas) return;
  canvas.removeEventListener('mousemove', tooltipHandlers.mousemove);
  canvas.removeEventListener('mouseleave', tooltipHandlers.mouseleave);
  canvas.removeEventListener('mouseenter', tooltipHandlers.mouseenter);
  if (typeof canvas._selectionClick === 'function') {
    canvas.removeEventListener('click', canvas._selectionClick);
    canvas._selectionClick = null;
  }
  if (selectionUnsubscribe) {
    selectionUnsubscribe();
    selectionUnsubscribe = null;
  }
  tooltipHandlers = null;
  tooltipCanvas = null;
  hideTooltip();
}

function setupSelectionHandlers(canvas, adapter) {
  if (!canvas || !adapter) return;
  function getCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const dims = adapter.getGridConfig()?.imageDimensions || { width: 825, height: 787 };
    const w = baseImage ? baseImage.width : dims.width;
    const h = baseImage ? baseImage.height : dims.height;
    return {
      x: ((e.clientX - rect.left) / rect.width) * w,
      y: ((e.clientY - rect.top) / rect.height) * h
    };
  }
  const onClick = (e) => {
    const { x, y } = getCoords(e);
    const item = getItemAtPositionInternal(x, y);
    if (item) {
      const id = adapter.getItemId(item);
      selectionToggle(id);
    }
  };
  canvas._selectionClick = onClick;
  canvas.addEventListener('click', onClick);
}

function setupTooltipHandlers(canvas, adapter) {
  if (!canvas) return;
  teardownGenericGridView(canvas);
  tooltipCanvas = canvas;

  let currentItem = null;
  let tooltipTimeout = null;

  function getCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const { width, height } = getDisplayDimensions(adapter);
    return {
      x: ((e.clientX - rect.left) / rect.width) * width,
      y: ((e.clientY - rect.top) / rect.height) * height
    };
  }

  function onMousemove(e) {
    const { x, y } = getCoords(e);
    const item = getItemAtPositionInternal(x, y);
    if (currentItem) updateTooltipPosition(e.clientX, e.clientY);
    if (item && item !== currentItem) {
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
      }
      currentItem = item;
      adapter.showItemTooltip(item, e.clientX, e.clientY);
    } else if (!item && currentItem) {
      if (tooltipTimeout) clearTimeout(tooltipTimeout);
      tooltipTimeout = setTimeout(() => {
        hideTooltip();
        currentItem = null;
        tooltipTimeout = null;
      }, 100);
    }
  }

  function onMouseleave() {
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout);
      tooltipTimeout = null;
    }
    hideTooltip();
    currentItem = null;
  }

  function onMouseenter(e) {
    const { x, y } = getCoords(e);
    const item = getItemAtPositionInternal(x, y);
    if (item) {
      currentItem = item;
      adapter.showItemTooltip(item, e.clientX, e.clientY);
    }
  }

  tooltipHandlers = { mousemove: onMousemove, mouseleave: onMouseleave, mouseenter: onMouseenter };
  canvas.addEventListener('mousemove', onMousemove);
  canvas.addEventListener('mouseleave', onMouseleave);
  canvas.addEventListener('mouseenter', onMouseenter);
}

function getItemAtPositionInternal(x, y) {
  const cell = getCellAtPosition(cellDefinitions, x, y);
  if (!cell) return null;
  return cellToItemMap.get(cell.id) || null;
}

/**
 * Get item at display coordinates (for use by adapters or wrappers)
 */
export function getItemAtPosition(x, y) {
  return getItemAtPositionInternal(x, y);
}

/**
 * Update grid with new items (reuses current adapter and canvas)
 */
export async function updateGenericGridView(canvas, items) {
  if (!currentAdapter) return;
  itemData = items || [];
  const mapping = await currentAdapter.mapItemsToCells(itemData, cellDefinitions);
  cellToItemMap = mapping.cellToItem || new Map();
  itemToCellMap = mapping.itemToCellId || new Map();
  await preloadImages(currentAdapter);
  renderGrid(canvas, currentAdapter);
}

/**
 * Set yield counts (no-op if adapter does not support)
 */
export function setYieldCounts(counts) {
  if (currentAdapter?.options?.supportsYieldCounts !== true) return;
  if (counts instanceof Map) {
    yieldCounts = new Map(counts);
  } else if (counts && typeof counts === 'object') {
    yieldCounts = new Map(Object.entries(counts));
  } else {
    yieldCounts = new Map();
  }
  if (currentCanvas) renderGrid(currentCanvas, currentAdapter);
}

/**
 * Clear yield counts
 */
export function clearYieldCounts() {
  yieldCounts = new Map();
  if (currentCanvas && currentAdapter) renderGrid(currentCanvas, currentAdapter);
}

/**
 * Set filtered item IDs for dimming non-matching cells (no-op if adapter does not support)
 */
export function setFilteredItemIds(ids) {
  if (currentAdapter?.options?.supportsFilteredIds !== true) return;
  filteredItemIds.clear();
  if (Array.isArray(ids)) ids.forEach((id) => filteredItemIds.add(id));
  else if (ids instanceof Set) ids.forEach((id) => filteredItemIds.add(id));
  if (currentCanvas) renderGrid(currentCanvas, currentAdapter);
}

/**
 * Clear filtered highlights
 */
export function clearFilteredItemIds() {
  filteredItemIds.clear();
  if (currentCanvas && currentAdapter) renderGrid(currentCanvas, currentAdapter);
}

/**
 * Highlight cell for item ID
 */
export function highlightCell(itemId) {
  if (!itemId) {
    clearHighlight();
    return;
  }
  highlightedItemId = itemId;
  if (currentCanvas && currentAdapter) renderGrid(currentCanvas, currentAdapter);
}

/**
 * Clear highlight
 */
export function clearHighlight() {
  highlightedItemId = null;
  if (currentCanvas && currentAdapter) renderGrid(currentCanvas, currentAdapter);
}

/**
 * Get cell definition for item ID
 */
export function getCellForItem(itemId) {
  const cellId = itemToCellMap.get(itemId);
  if (!cellId) return null;
  return getCellById(cellDefinitions, cellId);
}

/**
 * Get all cell definitions
 */
export function getAllCells() {
  return [...cellDefinitions];
}

/**
 * Toggle cell background visibility
 */
export function setShowCellBackgrounds(show) {
  if (currentAdapter?.options?.supportsCellBackgrounds === false) return;
  showCellBackgrounds = show;
  if (currentCanvas && currentAdapter) renderGrid(currentCanvas, currentAdapter);
}

/**
 * Get current cell background visibility
 */
export function getShowCellBackgrounds() {
  return showCellBackgrounds;
}

/**
 * Re-render grid (e.g. after external state change)
 */
export function renderGridOptimized(canvas) {
  requestAnimationFrame(() => {
    if (currentAdapter) renderGrid(canvas || currentCanvas, currentAdapter);
  });
}

/**
 * Check if the generic grid is currently showing the given adapter type (e.g. for conditional teardown)
 */
export function isCurrentAdapter(adapter) {
  return currentAdapter === adapter;
}
