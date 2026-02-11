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
let resizeHandler = null;

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
    setupResizeHandler(canvas, adapter, config);
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

  // Determine if we need to scale based on screen width
  // Scale for mobile devices and small desktop screens (up to 1200px)
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const shouldScale = viewportWidth < width || viewportWidth <= 1200;
  
  let scaledWidth, scaledHeight;
  
  if (shouldScale) {
    // Get the actual container element
    const container = canvas.closest('.grid-container') || 
                     canvas.closest('#grid-view') || 
                     canvas.closest('.view-container') ||
                     canvas.parentElement;
    
    // Calculate available width
    let availableWidth;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      availableWidth = containerRect.width;
      
      // If container width is 0 or very small, fall back to viewport
      if (availableWidth < 100) {
        availableWidth = viewportWidth;
      }
    } else {
      availableWidth = viewportWidth;
    }
    
    // Account for padding and margins
    // #app has 20px padding on each side, plus some margin for the grid container
    const appPadding = 20 * 2; // Left + right padding from #app
    const containerMargin = 20; // Additional margin for grid container
    const totalHorizontalPadding = appPadding + containerMargin;
    
    // Calculate available width, ensuring minimum usable size
    availableWidth = Math.max(availableWidth - totalHorizontalPadding, 280);
    
    // Calculate available height (use up to 70% of viewport height for better visibility)
    // Account for header, navigation, and other UI elements
    const reservedHeight = 200; // Space for header, nav, filters, etc.
    const availableHeight = Math.max(viewportHeight - reservedHeight, 300);
    
    // Calculate scale based on both width and height constraints
    const scaleX = availableWidth / width;
    const scaleY = availableHeight / height;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond original size
    
    scaledWidth = width * scale;
    scaledHeight = height * scale;
    
    // Ensure minimum size for usability
    const minSize = 200;
    if (scaledWidth < minSize || scaledHeight < minSize) {
      const minScale = Math.max(minSize / width, minSize / height);
      const finalScale = Math.max(scale, minScale);
      scaledWidth = width * finalScale;
      scaledHeight = height * finalScale;
    }
  } else {
    // On larger screens, use original dimensions
    scaledWidth = width;
    scaledHeight = height;
  }

  canvas.style.width = `${scaledWidth}px`;
  canvas.style.height = `${scaledHeight}px`;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = scaledWidth * dpr;
  canvas.height = scaledHeight * dpr;
  ctx.scale(dpr, dpr);
  canvas._scaleFactor = dpr;
  canvas._originalWidth = width;
  canvas._originalHeight = height;
}

/**
 * Setup window resize handler for canvas recalculation on orientation change
 */
function setupResizeHandler(canvas, adapter, config) {
  // Remove existing resize handler if any
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
    resizeHandler = null;
  }

  // Debounce resize events
  let resizeTimeout;
  resizeHandler = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (currentCanvas === canvas && currentAdapter === adapter) {
        setupCanvas(canvas, config);
        renderGrid(canvas, adapter);
      }
    }, 250); // 250ms debounce
  };

  window.addEventListener('resize', resizeHandler);
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
    drawCellHighlight(ctx, cell.x, cell.y, cell.width, cell.height, '#4a9eff', 0.35);
    drawCellBorder(ctx, cell.x, cell.y, cell.width, cell.height, '#4a9eff', 3);
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
  if (tooltipHandlers.touchmove) {
    canvas.removeEventListener('touchmove', tooltipHandlers.touchmove);
  }
  if (tooltipHandlers.touchend) {
    canvas.removeEventListener('touchend', tooltipHandlers.touchend);
  }
  if (tooltipHandlers.touchstart) {
    canvas.removeEventListener('touchstart', tooltipHandlers.touchstart);
  }
  if (typeof canvas._selectionClick === 'function') {
    canvas.removeEventListener('click', canvas._selectionClick);
    canvas._selectionClick = null;
  }
  if (typeof canvas._selectionTouchEnd === 'function') {
    canvas.removeEventListener('touchend', canvas._selectionTouchEnd);
    canvas._selectionTouchEnd = null;
  }
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
    resizeHandler = null;
  }
  if (selectionUnsubscribe) {
    selectionUnsubscribe();
    selectionUnsubscribe = null;
  }
  tooltipHandlers = null;
  tooltipCanvas = null;
  hideTooltip();
}

/**
 * Normalize touch or mouse event to get coordinates
 * @param {Event} e - TouchEvent or MouseEvent
 * @param {DOMRect} rect - Canvas bounding rect
 * @param {Object} dims - Image dimensions
 * @returns {{x: number, y: number}}
 */
function getNormalizedCoords(e, rect, dims) {
  const w = baseImage ? baseImage.width : dims.width;
  const h = baseImage ? baseImage.height : dims.height;
  
  // Handle touch events
  let clientX, clientY;
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else if (e.changedTouches && e.changedTouches.length > 0) {
    // Handle touchend events
    clientX = e.changedTouches[0].clientX;
    clientY = e.changedTouches[0].clientY;
  } else {
    // Mouse event
    clientX = e.clientX;
    clientY = e.clientY;
  }
  
  return {
    x: ((clientX - rect.left) / rect.width) * w,
    y: ((clientY - rect.top) / rect.height) * h
  };
}

function setupSelectionHandlers(canvas, adapter) {
  if (!canvas || !adapter) return;
  const rect = canvas.getBoundingClientRect();
  const dims = adapter.getGridConfig()?.imageDimensions || { width: 825, height: 787 };
  
  function getCoords(e) {
    return getNormalizedCoords(e, canvas.getBoundingClientRect(), dims);
  }
  
  const onClick = (e) => {
    const { x, y } = getCoords(e);
    const item = getItemAtPositionInternal(x, y);
    if (item) {
      const id = adapter.getItemId(item);
      selectionToggle(id);
    }
  };
  
  // Handle click (mouse) and touchend (touch)
  canvas._selectionClick = onClick;
  canvas.addEventListener('click', onClick);
  
  // Add touch event support
  const onTouchEnd = (e) => {
    e.preventDefault(); // Prevent default touch behaviors
    onClick(e);
  };
  canvas._selectionTouchEnd = onTouchEnd;
  canvas.addEventListener('touchend', onTouchEnd);
}

function setupTooltipHandlers(canvas, adapter) {
  if (!canvas) return;
  teardownGenericGridView(canvas);
  tooltipCanvas = canvas;

  let currentItem = null;
  let tooltipTimeout = null;
  const rect = canvas.getBoundingClientRect();
  const { width, height } = getDisplayDimensions(adapter);

  function getCoords(e) {
    const currentRect = canvas.getBoundingClientRect();
    // Handle touch events
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: ((clientX - currentRect.left) / currentRect.width) * width,
      y: ((clientY - currentRect.top) / currentRect.height) * height
    };
  }

  function getClientCoords(e) {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  function onMousemove(e) {
    const { x, y } = getCoords(e);
    const item = getItemAtPositionInternal(x, y);
    const { x: clientX, y: clientY } = getClientCoords(e);
    if (currentItem) updateTooltipPosition(clientX, clientY);
    if (item && item !== currentItem) {
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
      }
      currentItem = item;
      adapter.showItemTooltip(item, clientX, clientY);
    } else if (!item && currentItem) {
      if (tooltipTimeout) clearTimeout(tooltipTimeout);
      tooltipTimeout = setTimeout(() => {
        hideTooltip();
        currentItem = null;
        tooltipTimeout = null;
      }, 100);
    }
  }

  function onTouchmove(e) {
    e.preventDefault(); // Prevent scrolling during touch move
    onMousemove(e);
  }

  function onMouseleave() {
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout);
      tooltipTimeout = null;
    }
    hideTooltip();
    currentItem = null;
  }

  function onTouchend() {
    // Hide tooltip when touch ends
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout);
      tooltipTimeout = null;
    }
    setTimeout(() => {
      hideTooltip();
      currentItem = null;
    }, 200); // Small delay to allow for tap
  }

  function onMouseenter(e) {
    const { x, y } = getCoords(e);
    const item = getItemAtPositionInternal(x, y);
    const { x: clientX, y: clientY } = getClientCoords(e);
    if (item) {
      currentItem = item;
      adapter.showItemTooltip(item, clientX, clientY);
    }
  }

  function onTouchstart(e) {
    e.preventDefault(); // Prevent default touch behaviors
    const { x, y } = getCoords(e);
    const item = getItemAtPositionInternal(x, y);
    const { x: clientX, y: clientY } = getClientCoords(e);
    if (item) {
      currentItem = item;
      adapter.showItemTooltip(item, clientX, clientY);
    }
  }

  tooltipHandlers = { 
    mousemove: onMousemove, 
    mouseleave: onMouseleave, 
    mouseenter: onMouseenter,
    touchmove: onTouchmove,
    touchend: onTouchend,
    touchstart: onTouchstart
  };
  canvas.addEventListener('mousemove', onMousemove);
  canvas.addEventListener('mouseleave', onMouseleave);
  canvas.addEventListener('mouseenter', onMouseenter);
  canvas.addEventListener('touchmove', onTouchmove);
  canvas.addEventListener('touchend', onTouchend);
  canvas.addEventListener('touchstart', onTouchstart);
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
