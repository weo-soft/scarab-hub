/**
 * Cell Mapper
 * Analyzes the grid image and creates cell overlays with IDs
 */

/**
 * Analyze image and create cell definitions
 * This will be populated by analyzing the actual image structure
 * @param {HTMLImageElement} image - The grid image
 * @returns {Array<CellDefinition>} Array of cell definitions
 */
export function analyzeImageCells(image) {
  // Image dimensions: 825 x 787
  // Based on the image description, we need to identify cell positions
  // This is a complex grid with irregular spacing
  
  // Cell size estimation (will need to be adjusted based on actual image analysis)
  const estimatedCellSize = 64; // Approximate cell size in pixels
  const cellSpacing = 2; // Spacing between cells
  
  const cells = [];
  let cellId = 0;
  
  // Analyze the image to find cell positions
  // For now, we'll create a flexible system that can be configured
  // The actual cell positions should be determined by analyzing the image
  
  // Create a canvas to analyze the image
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);
  
  // Sample approach: detect cell-like structures
  // This is a placeholder - actual implementation would analyze pixel patterns
  // to find cell boundaries
  
  return cells;
}

/**
 * Cell Definition
 * @typedef {Object} CellDefinition
 * @property {string} id - Unique cell ID (e.g., "cell-0", "cell-1")
 * @property {number} x - X position of cell top-left corner
 * @property {number} y - Y position of cell top-left corner
 * @property {number} width - Cell width
 * @property {number} height - Cell height
 * @property {number} row - Logical row position (for sorting)
 * @property {number} col - Logical column position (for sorting)
 */

/**
 * Create cell definitions from a configuration
 * This allows manual configuration of cell positions based on image analysis
 * @param {Array<Array<{x: number, y: number, width?: number, height?: number}>>} cellConfig - Cell configuration
 * @returns {Array<CellDefinition>}
 */
export function createCellsFromConfig(cellConfig) {
  const cells = [];
  let cellId = 0;
  
  const defaultCellSize = 64;
  
  cellConfig.forEach((row, rowIndex) => {
    row.forEach((cellPos, colIndex) => {
      cells.push({
        id: `cell-${cellId++}`,
        x: cellPos.x,
        y: cellPos.y,
        width: cellPos.width || defaultCellSize,
        height: cellPos.height || defaultCellSize,
        row: rowIndex,
        col: colIndex,
      });
    });
  });
  
  return cells;
}

/**
 * Get cell at position (for click/hover detection)
 * @param {Array<CellDefinition>} cells
 * @param {number} x - Mouse X position
 * @param {number} y - Mouse Y position
 * @returns {CellDefinition|null}
 */
export function getCellAtPosition(cells, x, y) {
  return cells.find(cell => 
    x >= cell.x && 
    x <= cell.x + cell.width &&
    y >= cell.y && 
    y <= cell.y + cell.height
  ) || null;
}

/**
 * Get cell by ID
 * @param {Array<CellDefinition>} cells
 * @param {string} cellId
 * @returns {CellDefinition|null}
 */
export function getCellById(cells, cellId) {
  return cells.find(cell => cell.id === cellId) || null;
}


