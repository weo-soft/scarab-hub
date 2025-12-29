/**
 * Grid View
 * Displays Scarabs in a grid layout using HTML5 Canvas, mirroring in-game stash appearance
 * Uses the provided Scarab-tab.png image with cell overlay system
 */

import { loadImage, drawCellHighlight, drawCellBorder, clearCanvas } from '../utils/canvasUtils.js';
import { getProfitabilityColor, getProfitabilityBorderColor } from '../utils/colorUtils.js';
import { getCellAtPosition, getCellById } from '../utils/cellMapper.js';
import { createCellsFromGroups, IMAGE_DIMENSIONS, CELL_SIZE, CELL_GROUP_CONFIG, SCARAB_ORDER_CONFIG } from '../config/gridConfig.js';
import { showTooltip, hideTooltip, updateTooltipPosition, cleanupTooltip } from '../utils/tooltip.js';

let baseImage = null;
let scarabData = [];
let cellDefinitions = []; // Array of cell definitions with IDs
let cellToScarabMap = new Map(); // Maps cell ID to Scarab
let scarabToCellMap = new Map(); // Maps Scarab ID to cell ID
let scarabImageCache = new Map(); // Maps scarab ID to loaded image
let currentCanvas = null; // Store canvas reference for re-rendering
let highlightedScarabId = null; // Currently highlighted scarab ID
let filteredScarabIds = new Set(); // Set of scarab IDs that match current filters

/**
 * Initialize grid view
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Array<Scarab>} scarabs - Array of Scarab objects
 * @param {string} imagePath - Path to base grid image
 */
export async function initGridView(canvas, scarabs, imagePath = null) {
  if (!canvas) {
    console.error('Grid view: missing canvas element');
    return;
  }

  currentCanvas = canvas; // Store canvas reference
  scarabData = scarabs || [];
  
  try {
    // Load base image
    if (imagePath) {
      baseImage = await loadImage(imagePath);
      console.log('Grid image loaded:', baseImage.width, 'x', baseImage.height);
    }
    
    // Setup canvas to match image dimensions
    setupCanvas(canvas);
    
    // Create cell definitions from image (async)
    await createCellDefinitions();
    
    // Map Scarabs to cells
    mapScarabsToCells();
    
    // Preload scarab images
    await preloadScarabImages();
    
    // Render grid
    renderGrid(canvas);
    
    // Setup tooltip event handlers
    setupTooltipHandlers(canvas);
  } catch (error) {
    console.error('Error initializing grid view:', error);
    // Render grid without base image if image fails to load
    renderGrid(canvas);
    // Setup tooltip handlers even if image fails
    setupTooltipHandlers(canvas);
  }
}

/**
 * Setup canvas dimensions to match image
 * @param {HTMLCanvasElement} canvas
 */
function setupCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  
  // Use image dimensions if available, otherwise use defaults
  const width = baseImage ? baseImage.width : IMAGE_DIMENSIONS.width;
  const height = baseImage ? baseImage.height : IMAGE_DIMENSIONS.height;
  
  // Set display size
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  
  // Set actual canvas size (for high DPI displays)
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
  
  // Store the scale factor for coordinate conversion
  canvas._scaleFactor = dpr;
}

/**
 * Create cell definitions from configuration
 * Uses the exact coordinates provided for cell groups
 */
async function createCellDefinitions() {
  // Use the configuration-based approach with exact coordinates
  cellDefinitions = createCellsFromGroups();
  console.log(`Created ${cellDefinitions.length} cell definitions from configuration`);
  
  // Log cell distribution by row for verification
  const rowDistribution = cellDefinitions.reduce((acc, cell) => {
    acc[cell.row] = (acc[cell.row] || 0) + 1;
    return acc;
  }, {});
  console.log('Cell distribution by row:', rowDistribution);
  
  // Log first few cells for debugging
  if (cellDefinitions.length > 0) {
    console.log('First 5 cells:', cellDefinitions.slice(0, 5).map(c => ({
      id: c.id,
      x: c.x,
      y: c.y,
      row: c.row,
      col: c.col
    })));
  }
}

/**
 * Map Scarabs to cells using explicit mapping
 * Groups scarabs by type, sorts by value (low to high), and assigns left to right
 */
function mapScarabsToCells() {
  cellToScarabMap.clear();
  scarabToCellMap.clear();
  
  // Group cells by their group type
  const cellsByGroupType = new Map();
  cellDefinitions.forEach(cell => {
    if (cell.groupType) {
      if (!cellsByGroupType.has(cell.groupType)) {
        cellsByGroupType.set(cell.groupType, []);
      }
      cellsByGroupType.get(cell.groupType).push(cell);
    }
  });
  
  // Sort cells within each group by their position (left to right)
  cellsByGroupType.forEach((cells, groupType) => {
    cells.sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.x - b.x; // Sort by x position (left to right)
    });
  });
  
  // Group scarabs by type and sort by value
  const scarabsByType = new Map();
  scarabData.forEach(scarab => {
    const scarabType = getScarabType(scarab);
    if (scarabType) {
      if (!scarabsByType.has(scarabType)) {
        scarabsByType.set(scarabType, []);
      }
      scarabsByType.get(scarabType).push(scarab);
    }
  });
  
  // Sort scarabs within each type
  // Use explicit order if configured, otherwise sort by value (low to high)
  scarabsByType.forEach((scarabs, type) => {
    const explicitOrder = SCARAB_ORDER_CONFIG[type];
    
    if (explicitOrder && Array.isArray(explicitOrder)) {
      // Use explicit ordering
      scarabs.sort((a, b) => {
        const indexA = explicitOrder.indexOf(a.id);
        const indexB = explicitOrder.indexOf(b.id);
        
        // If both are in the order list, sort by their position
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        // If only one is in the list, prioritize it
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        // If neither is in the list, sort by value as fallback
        const valueA = a.chaosValue ?? (a.divineValue ? a.divineValue * 200 : Infinity);
        const valueB = b.chaosValue ?? (b.divineValue ? b.divineValue * 200 : Infinity);
        return valueA - valueB;
      });
    } else {
      // Default: sort by value (low to high)
      // Use chaosValue as primary, divineValue as fallback
      scarabs.sort((a, b) => {
        const valueA = a.chaosValue ?? (a.divineValue ? a.divineValue * 200 : Infinity);
        const valueB = b.chaosValue ?? (b.divineValue ? b.divineValue * 200 : Infinity);
        return valueA - valueB; // Sort low to high
      });
    }
  });
  
  // Map scarabs to cells within each group
  cellsByGroupType.forEach((cells, groupType) => {
    const scarabs = scarabsByType.get(groupType) || [];
    
    // Assign scarabs to cells left to right (sorted by value)
    const maxAssignments = Math.min(cells.length, scarabs.length);
    for (let i = 0; i < maxAssignments; i++) {
      const cell = cells[i];
      const scarab = scarabs[i];
      
      if (cell && scarab) {
        cellToScarabMap.set(cell.id, scarab);
        scarabToCellMap.set(scarab.id, cell.id);
      }
    }
  });
  
  // Log unmapped cells/scarabs for debugging
  if (process.env.NODE_ENV === 'development') {
    const unmappedCells = cellDefinitions.filter(cell => !cellToScarabMap.has(cell.id));
    const unmappedScarabs = scarabData.filter(scarab => !scarabToCellMap.has(scarab.id));
    
    if (unmappedCells.length > 0) {
      console.log(`Unmapped cells: ${unmappedCells.length}`, unmappedCells.map(c => c.groupType || 'no-type'));
    }
    if (unmappedScarabs.length > 0) {
      console.log(`Unmapped scarabs: ${unmappedScarabs.length}`, unmappedScarabs.map(s => `${s.name} (${getScarabType(s) || 'unknown-type'})`));
    }
  }
}

/**
 * Determine scarab type from scarab id or name
 * Matches against group types defined in gridConfig
 * @param {Scarab} scarab
 * @returns {string|null} Group type or null if no match
 */
function getScarabType(scarab) {
  if (!scarab || !scarab.id) return null;
  
  const idLower = scarab.id.toLowerCase();
  const nameLower = (scarab.name || '').toLowerCase();
  
  // Special handling for misc and misc2 groups (IDs start with "scarab-of-")
  // Check misc2 first (more specific)
  const misc2Order = SCARAB_ORDER_CONFIG['misc2'] || [];
  if (misc2Order.includes(scarab.id)) {
    return 'misc2';
  }
  
  // Check misc group
  const miscOrder = SCARAB_ORDER_CONFIG['misc'] || [];
  if (miscOrder.includes(scarab.id)) {
    return 'misc';
  }
  
  // Special handling for horned scarabs - distinguish between horned and horned2
  const horned2Order = SCARAB_ORDER_CONFIG['horned2'] || [];
  if (horned2Order.includes(scarab.id)) {
    return 'horned2';
  }
  
  const hornedOrder = SCARAB_ORDER_CONFIG['horned'] || [];
  if (hornedOrder.includes(scarab.id)) {
    return 'horned';
  }
  
  // Extract type from ID pattern: "{type}-scarab" or "{type}-scarab-of-..."
  // Example: "abyss-scarab" -> "abyss", "titanic-scarab-of-x" -> "titanic"
  const idMatch = idLower.match(/^([^-]+)-scarab/);
  if (idMatch) {
    const extractedType = idMatch[1];
    
    // Get all group types
    const groupTypes = CELL_GROUP_CONFIG
      .map(g => g.type)
      .filter(t => t);
    
    // Try exact match first
    if (groupTypes.includes(extractedType)) {
      return extractedType;
    }
    
    // Try partial match (e.g., "kalguuran" might match "kalguuran" in ID)
    for (const type of groupTypes) {
      if (extractedType.includes(type.toLowerCase()) || type.toLowerCase().includes(extractedType)) {
        return type;
      }
    }
  }
  
  // Fallback: check name for type keywords
  const groupTypes = CELL_GROUP_CONFIG
    .map(g => g.type)
    .filter(t => t);
  
  for (const type of groupTypes) {
    if (nameLower.includes(type.toLowerCase())) {
      return type;
    }
  }
  
  // If no match, return null (will be unmapped)
  return null;
}

/**
 * Render the grid
 * @param {HTMLCanvasElement} canvas
 */
function renderGrid(canvas) {
  const ctx = canvas.getContext('2d');
  
  // Clear canvas
  const displayWidth = baseImage ? baseImage.width : IMAGE_DIMENSIONS.width;
  const displayHeight = baseImage ? baseImage.height : IMAGE_DIMENSIONS.height;
  clearCanvas(ctx, displayWidth, displayHeight);
  
  // Draw base image if available
  if (baseImage) {
    ctx.drawImage(baseImage, 0, 0, displayWidth, displayHeight);
  } else {
    // Draw dark background with subtle texture if no image
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    
    // Add subtle grid pattern
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < displayWidth; i += CELL_SIZE.width + 2) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, displayHeight);
      ctx.stroke();
    }
    for (let i = 0; i < displayHeight; i += CELL_SIZE.height + 2) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(displayWidth, i);
      ctx.stroke();
    }
  }
  
  // Draw cell overlays with profitability indicators
  cellDefinitions.forEach((cell, index) => {
    const scarab = cellToScarabMap.get(cell.id);
    if (scarab) {
      drawCellOverlay(ctx, cell, scarab);
      
      // Gray out cells that don't match the filter (inverse highlighting)
      if (filteredScarabIds.size > 0 && !filteredScarabIds.has(scarab.id)) {
        // Draw a dark overlay to gray out non-matching cells
        drawCellHighlight(ctx, cell.x, cell.y, cell.width, cell.height, '#000000', 0.7);
      }
      
      // Draw hover highlight if this cell is highlighted (on top of filter grayout)
      if (highlightedScarabId === scarab.id) {
        drawCellHighlight(ctx, cell.x, cell.y, cell.width, cell.height, '#ffd700', 0.6);
        drawCellBorder(ctx, cell.x, cell.y, cell.width, cell.height, '#ffd700', 3);
      }
    } else if (process.env.NODE_ENV === 'development') {
      // Draw empty cells in debug mode
      ctx.strokeStyle = 'rgba(128, 128, 128, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cell.x, cell.y, cell.width, cell.height);
    }
  });
  
  // In development, log cell positions for debugging
  if (process.env.NODE_ENV === 'development' && cellDefinitions.length > 0) {
    console.log('Cell positions detected:', cellDefinitions.length);
    console.log('First few cells:', cellDefinitions.slice(0, 6));
  }
}

/**
 * Get image path for a scarab
 * @param {Scarab} scarab - Scarab object
 * @returns {string} Image path
 */
function getScarabImagePath(scarab) {
  if (!scarab || !scarab.id) return null;
  // Image path matches scarab ID: {id}.png
  return `/assets/scarabs/${scarab.id}.png`;
}

/**
 * Load scarab image with caching
 * @param {Scarab} scarab - Scarab object
 * @returns {Promise<HTMLImageElement|null>} Loaded image or null if failed
 */
async function loadScarabImage(scarab) {
  if (!scarab || !scarab.id) return null;
  
  // Check cache first
  if (scarabImageCache.has(scarab.id)) {
    return scarabImageCache.get(scarab.id);
  }
  
  // Load image
  try {
    const imagePath = getScarabImagePath(scarab);
    const image = await loadImage(imagePath);
    scarabImageCache.set(scarab.id, image);
    return image;
  } catch (error) {
    console.warn(`Failed to load image for scarab ${scarab.id}:`, error);
    // Cache null to avoid repeated failed attempts
    scarabImageCache.set(scarab.id, null);
    return null;
  }
}

/**
 * Preload all scarab images for mapped scarabs
 */
async function preloadScarabImages() {
  const scarabsToLoad = Array.from(cellToScarabMap.values());
  const loadPromises = scarabsToLoad.map(scarab => loadScarabImage(scarab));
  await Promise.allSettled(loadPromises);
  console.log(`Preloaded ${scarabImageCache.size} scarab images`);
}

/**
 * Draw a cell overlay with profitability indicator and scarab image
 * @param {CanvasRenderingContext2D} ctx
 * @param {CellDefinition} cell - Cell definition with position and dimensions
 * @param {Scarab} scarab - Scarab assigned to this cell
 */
function drawCellOverlay(ctx, cell, scarab) {
  const status = scarab.profitabilityStatus;
  const color = getProfitabilityColor(status);
  const borderColor = getProfitabilityBorderColor(status);
  
  // Draw highlight overlay first (as background)
  if (status !== 'unknown') {
    drawCellHighlight(ctx, cell.x, cell.y, cell.width, cell.height, color, 0.4);
  }
  
  // Draw scarab image on top (foreground)
  const scarabImage = scarabImageCache.get(scarab.id);
  if (scarabImage) {
    // Calculate image dimensions to fit within cell with padding
    const padding = 2;
    const imageX = cell.x + padding;
    const imageY = cell.y + padding;
    const imageWidth = cell.width - (padding * 2);
    const imageHeight = cell.height - (padding * 2);
    
    // Draw image
    ctx.drawImage(scarabImage, imageX, imageY, imageWidth, imageHeight);
  }
  
  // Draw border
  drawCellBorder(ctx, cell.x, cell.y, cell.width, cell.height, borderColor, 2);
}

/**
 * Update grid view with new data
 * @param {HTMLCanvasElement} canvas
 * @param {Array<Scarab>} scarabs
 */
export async function updateGridView(canvas, scarabs) {
  scarabData = scarabs || [];
  mapScarabsToCells();
  await preloadScarabImages();
  renderGrid(canvas);
  // Tooltip handlers are already set up, no need to re-setup
}

/**
 * Get Scarab at grid position (for hover/tooltip)
 * @param {number} x - Mouse X position (in display coordinates)
 * @param {number} y - Mouse Y position (in display coordinates)
 * @returns {Scarab|null}
 */
export function getScarabAtPosition(x, y) {
  const cell = getCellAtPosition(cellDefinitions, x, y);
  if (!cell) return null;
  
  return cellToScarabMap.get(cell.id) || null;
}

/**
 * Get cell definition for a Scarab
 * @param {string} scarabId - Scarab ID
 * @returns {CellDefinition|null}
 */
export function getCellForScarab(scarabId) {
  const cellId = scarabToCellMap.get(scarabId);
  if (!cellId) return null;
  
  return getCellById(cellDefinitions, cellId);
}

/**
 * Get all cell definitions
 * @returns {Array<CellDefinition>}
 */
export function getAllCells() {
  return [...cellDefinitions];
}

/**
 * Highlight a cell for a specific scarab
 * @param {string} scarabId - Scarab ID to highlight
 */
export function highlightCellForScarab(scarabId) {
  if (!scarabId) {
    clearHighlight();
    return;
  }
  
  highlightedScarabId = scarabId;
  
  // Re-render grid with highlight
  if (currentCanvas) {
    renderGrid(currentCanvas);
  }
}

/**
 * Clear the current highlight
 */
export function clearHighlight() {
  highlightedScarabId = null;
  
  // Re-render grid without highlight
  if (currentCanvas) {
    renderGrid(currentCanvas);
  }
}

/**
 * Set filtered scarab IDs for highlighting
 * @param {Array<string>|Set<string>} scarabIds - Array or Set of scarab IDs that match filters
 */
export function setFilteredScarabs(scarabIds) {
  filteredScarabIds.clear();
  if (Array.isArray(scarabIds)) {
    scarabIds.forEach(id => filteredScarabIds.add(id));
  } else if (scarabIds instanceof Set) {
    scarabIds.forEach(id => filteredScarabIds.add(id));
  }
  
  // Re-render grid with filter highlights
  if (currentCanvas) {
    renderGrid(currentCanvas);
  }
}

/**
 * Clear filtered scarab highlights
 */
export function clearFilteredScarabs() {
  filteredScarabIds.clear();
  
  // Re-render grid without filter highlights
  if (currentCanvas) {
    renderGrid(currentCanvas);
  }
}

/**
 * Optimize rendering using requestAnimationFrame
 * @param {HTMLCanvasElement} canvas
 */
export function renderGridOptimized(canvas) {
  requestAnimationFrame(() => {
    renderGrid(canvas);
  });
}

/**
 * Setup tooltip event handlers for canvas
 * @param {HTMLCanvasElement} canvas
 */
function setupTooltipHandlers(canvas) {
  if (!canvas) return;
  
  let currentScarab = null;
  let tooltipTimeout = null;
  
  // Get canvas bounding rect for coordinate conversion
  function getCanvasCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    
    // Canvas display size (CSS size)
    const displayWidth = baseImage ? baseImage.width : IMAGE_DIMENSIONS.width;
    const displayHeight = baseImage ? baseImage.height : IMAGE_DIMENSIONS.height;
    
    // Get mouse position relative to canvas display size
    const x = ((e.clientX - rect.left) / rect.width) * displayWidth;
    const y = ((e.clientY - rect.top) / rect.height) * displayHeight;
    
    return { x, y };
  }
  
  // Mouse move handler
  canvas.addEventListener('mousemove', (e) => {
    const { x, y } = getCanvasCoordinates(e);
    const scarab = getScarabAtPosition(x, y);
    
    // Update tooltip position if showing
    if (currentScarab) {
      updateTooltipPosition(e.clientX, e.clientY);
    }
    
    // If hovering over a different scarab
    if (scarab && scarab !== currentScarab) {
      // Clear any pending timeout
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
      }
      
      currentScarab = scarab;
      showTooltip(scarab, e.clientX, e.clientY);
    } else if (!scarab && currentScarab) {
      // Moved away from scarab, hide tooltip after a short delay
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
      }
      
      tooltipTimeout = setTimeout(() => {
        hideTooltip();
        currentScarab = null;
        tooltipTimeout = null;
      }, 100);
    }
  });
  
  // Mouse leave handler
  canvas.addEventListener('mouseleave', () => {
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout);
      tooltipTimeout = null;
    }
    hideTooltip();
    currentScarab = null;
  });
  
  // Mouse enter handler (to show tooltip immediately if over a scarab)
  canvas.addEventListener('mouseenter', (e) => {
    const { x, y } = getCanvasCoordinates(e);
    const scarab = getScarabAtPosition(x, y);
    
    if (scarab) {
      currentScarab = scarab;
      showTooltip(scarab, e.clientX, e.clientY);
    }
  });
}

