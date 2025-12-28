/**
 * Irregular Grid Analyzer
 * Specifically designed for the Scarab-tab.png irregular grid pattern:
 * Row 0: 3-2-3 cells (3 cells, gap, 2 cells, gap, 3 cells)
 * Row 1: 3-3-3-3 cells (3 cells, gap, 3 cells, gap, 3 cells, gap, 3 cells)
 * Subsequent rows follow similar patterns
 */

/**
 * Analyze image with known irregular grid pattern
 * @param {HTMLImageElement} image
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<Array>}
 */
export async function analyzeIrregularGrid(image, canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Step 1: Find the grid start position
  const gridStart = findGridStart(imageData);
  console.log('Grid starts at:', gridStart);
  
  // Step 2: Detect cell size and spacing
  const metrics = detectCellMetrics(imageData, gridStart);
  console.log('Cell metrics:', metrics);
  
  // Step 3: Detect cells row by row with known patterns
  const cells = detectCellsByRowPattern(imageData, gridStart, metrics);
  
  console.log(`Detected ${cells.length} cells in irregular grid`);
  return cells;
}

/**
 * Find the grid start position (top-left of first cell)
 * @param {ImageData} imageData
 * @returns {{x: number, y: number}}
 */
function findGridStart(imageData) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // Look for the first cell by finding a pattern:
  // Dark border with lighter interior
  
  let bestX = 10;
  let bestY = 10;
  let bestScore = 0;
  
  // Scan top-left area for cell-like patterns
  for (let y = 5; y < Math.min(height, 100); y++) {
    for (let x = 5; x < Math.min(width, 200); x++) {
      const score = scoreCellPosition(imageData, x, y);
      if (score > bestScore) {
        bestScore = score;
        bestX = x;
        bestY = y;
      }
    }
  }
  
  return { x: bestX, y: bestY };
}

/**
 * Score a potential cell position
 * Higher score = more likely to be a cell
 * @param {ImageData} imageData
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function scoreCellPosition(imageData, x, y) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  if (x + 70 >= width || y + 70 >= height) return 0;
  
  let score = 0;
  const cellSize = 64;
  
  // Check for dark borders
  const borderCheckSize = 3;
  for (let i = 0; i < borderCheckSize; i++) {
    // Top border
    if (y + i < height) {
      const idx = ((y + i) * width + (x + cellSize / 2)) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      if (brightness < 100) score += 2;
    }
    
    // Left border
    if (x + i < width) {
      const idx = ((y + cellSize / 2) * width + (x + i)) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      if (brightness < 100) score += 2;
    }
  }
  
  // Check for lighter center (cell content)
  const centerX = x + cellSize / 2;
  const centerY = y + cellSize / 2;
  if (centerX < width && centerY < height) {
    const idx = (centerY * width + centerX) * 4;
    const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
    if (brightness > 80) score += 1;
  }
  
  return score;
}

/**
 * Detect cell size and spacing
 * @param {ImageData} imageData
 * @param {{x: number, y: number}} start
 * @returns {{cellSize: number, cellSpacing: number, groupSpacing: number}}
 */
function detectCellMetrics(imageData, start) {
  const data = imageData.data;
  const width = imageData.width;
  
  // Find right edge of first cell
  let cellSize = 64;
  for (let x = start.x + 50; x < start.x + 80; x++) {
    let darkCount = 0;
    for (let y = start.y; y < start.y + 70; y++) {
      const idx = (y * width + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      if (brightness < 80) darkCount++;
    }
    if (darkCount > 40) {
      cellSize = x - start.x;
      break;
    }
  }
  
  // Find spacing between cells (small gap)
  let cellSpacing = 2;
  for (let x = start.x + cellSize; x < start.x + cellSize + 10; x++) {
    let lightCount = 0;
    for (let y = start.y; y < start.y + cellSize; y++) {
      const idx = (y * width + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      if (brightness > 100) lightCount++;
    }
    if (lightCount > cellSize * 0.3) {
      cellSpacing++;
    } else {
      break;
    }
  }
  
  // Find spacing between groups (larger gap)
  // Look for the gap after 3 cells in first row
  let groupSpacing = cellSpacing * 2;
  const firstGroupEnd = start.x + (cellSize + cellSpacing) * 3;
  for (let x = firstGroupEnd; x < firstGroupEnd + 20; x++) {
    let lightCount = 0;
    for (let y = start.y; y < start.y + cellSize; y++) {
      const idx = (y * width + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      if (brightness > 120) lightCount++;
    }
    if (lightCount > cellSize * 0.5) {
      groupSpacing++;
    } else {
      break;
    }
  }
  
  return { cellSize, cellSpacing, groupSpacing };
}

/**
 * Detect cells row by row with known patterns
 * @param {ImageData} imageData
 * @param {{x: number, y: number}} start
 * @param {{cellSize: number, cellSpacing: number, groupSpacing: number}} metrics
 * @returns {Array}
 */
function detectCellsByRowPattern(imageData, start, metrics) {
  const cells = [];
  const { cellSize, cellSpacing, groupSpacing } = metrics;
  
  // Known row patterns
  const rowPatterns = [
    [3, 2, 3],      // Row 0: 3 cells, gap, 2 cells, gap, 3 cells
    [3, 3, 3, 3],  // Row 1: 3 cells, gap, 3 cells, gap, 3 cells, gap, 3 cells
  ];
  
  let currentY = start.y;
  let rowIndex = 0;
  let cellId = 0;
  const maxRows = 25;
  
  while (rowIndex < maxRows && currentY < imageData.height - cellSize) {
    // Get pattern for this row, or detect it
    let pattern = rowIndex < rowPatterns.length 
      ? rowPatterns[rowIndex] 
      : detectRowPattern(imageData, start.x, currentY, metrics, rowIndex);
    
    if (!pattern || pattern.length === 0) {
      // No pattern detected, try to find cells manually
      pattern = detectCellsInRow(imageData, start.x, currentY, metrics);
      if (pattern.length === 0) {
        // No more rows found
        break;
      }
    }
    
    // Create cells based on pattern
    let currentX = start.x;
    let colIndex = 0;
    
    for (let groupIndex = 0; groupIndex < pattern.length; groupIndex++) {
      const cellsInGroup = pattern[groupIndex];
      
      // Create cells in this group
      for (let i = 0; i < cellsInGroup; i++) {
        // Verify cell exists at this position
        if (isCellAtPosition(imageData, currentX, currentY, cellSize)) {
          cells.push({
            id: `cell-${cellId++}`,
            x: currentX,
            y: currentY,
            width: cellSize,
            height: cellSize,
            row: rowIndex,
            col: colIndex++,
            group: groupIndex,
          });
        }
        
        // Move to next cell
        currentX += cellSize + cellSpacing;
      }
      
      // Add gap between groups (except after last group)
      if (groupIndex < pattern.length - 1) {
        currentX += groupSpacing;
      }
    }
    
    // Move to next row
    // Find the bottom of cells in this row
    const rowCells = cells.filter(c => c.row === rowIndex);
    if (rowCells.length > 0) {
      const maxBottom = Math.max(...rowCells.map(c => c.y + c.height));
      currentY = maxBottom + cellSpacing;
    } else {
      currentY += cellSize + cellSpacing;
    }
    
    rowIndex++;
  }
  
  return cells;
}

/**
 * Detect pattern for a specific row
 * @param {ImageData} imageData
 * @param {number} startX
 * @param {number} y
 * @param {object} metrics
 * @param {number} rowIndex
 * @returns {Array<number>} Pattern array (e.g., [3, 2, 3])
 */
function detectRowPattern(imageData, startX, y, metrics, rowIndex) {
  const { cellSize, cellSpacing, groupSpacing } = metrics;
  const pattern = [];
  
  let currentX = startX;
  let cellsInCurrentGroup = 0;
  let inGroup = false;
  let consecutiveEmpty = 0;
  
  while (currentX < imageData.width - cellSize) {
    if (isCellAtPosition(imageData, currentX, y, cellSize)) {
      if (!inGroup) {
        inGroup = true;
        cellsInCurrentGroup = 0;
      }
      cellsInCurrentGroup++;
      consecutiveEmpty = 0;
      currentX += cellSize + cellSpacing;
    } else {
      if (inGroup) {
        // End of group
        pattern.push(cellsInCurrentGroup);
        inGroup = false;
        cellsInCurrentGroup = 0;
      }
      
      consecutiveEmpty++;
      currentX += 1;
      
      // If we've found a large gap, it might be between groups
      if (consecutiveEmpty > groupSpacing) {
        // Check if we're at end of row
        if (currentX > imageData.width * 0.8) {
          break;
        }
      }
      
      // If we've moved too far without finding anything, stop
      if (consecutiveEmpty > cellSize * 2) {
        break;
      }
    }
  }
  
  // Add last group if we were in one
  if (inGroup && cellsInCurrentGroup > 0) {
    pattern.push(cellsInCurrentGroup);
  }
  
  return pattern.length > 0 ? pattern : null;
}

/**
 * Detect all cells in a row without pattern
 * @param {ImageData} imageData
 * @param {number} startX
 * @param {number} y
 * @param {object} metrics
 * @returns {Array<number>} Pattern array
 */
function detectCellsInRow(imageData, startX, y, metrics) {
  const { cellSize, cellSpacing } = metrics;
  const pattern = [];
  
  let currentX = startX;
  let cellsInCurrentGroup = 0;
  let inGroup = false;
  let consecutiveEmpty = 0;
  
  while (currentX < imageData.width - cellSize) {
    if (isCellAtPosition(imageData, currentX, y, cellSize)) {
      if (!inGroup) {
        inGroup = true;
        cellsInCurrentGroup = 0;
      }
      cellsInCurrentGroup++;
      consecutiveEmpty = 0;
      currentX += cellSize + cellSpacing;
    } else {
      if (inGroup) {
        pattern.push(cellsInCurrentGroup);
        inGroup = false;
        cellsInCurrentGroup = 0;
      }
      
      consecutiveEmpty++;
      currentX += 1;
      
      if (consecutiveEmpty > cellSize) {
        break;
      }
    }
  }
  
  if (inGroup && cellsInCurrentGroup > 0) {
    pattern.push(cellsInCurrentGroup);
  }
  
  return pattern;
}

/**
 * Check if a cell exists at position (from imageCellAnalyzer.js)
 * @param {ImageData} imageData
 * @param {number} x
 * @param {number} y
 * @param {number} cellSize
 * @returns {boolean}
 */
function isCellAtPosition(imageData, x, y, cellSize) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  if (x + cellSize >= width || y + cellSize >= height) {
    return false;
  }
  
  let borderScore = 0;
  let centerScore = 0;
  
  const borderCheckSize = Math.min(5, cellSize / 4);
  for (let i = 0; i < borderCheckSize; i++) {
    // Top border
    if (y + i < height) {
      const topIdx = ((y + i) * width + (x + cellSize / 2)) * 4;
      const topBrightness = (data[topIdx] + data[topIdx + 1] + data[topIdx + 2]) / 3;
      if (topBrightness < 100) borderScore++;
    }
    
    // Bottom border
    if (y + cellSize - i < height) {
      const bottomIdx = ((y + cellSize - i) * width + (x + cellSize / 2)) * 4;
      const bottomBrightness = (data[bottomIdx] + data[bottomIdx + 1] + data[bottomIdx + 2]) / 3;
      if (bottomBrightness < 100) borderScore++;
    }
    
    // Left border
    if (x + i < width) {
      const leftIdx = ((y + cellSize / 2) * width + (x + i)) * 4;
      const leftBrightness = (data[leftIdx] + data[leftIdx + 1] + data[leftIdx + 2]) / 3;
      if (leftBrightness < 100) borderScore++;
    }
    
    // Right border
    if (x + cellSize - i < width) {
      const rightIdx = ((y + cellSize / 2) * width + (x + cellSize - i)) * 4;
      const rightBrightness = (data[rightIdx] + data[rightIdx + 1] + data[rightIdx + 2]) / 3;
      if (rightBrightness < 100) borderScore++;
    }
  }
  
  // Check center
  const centerX = x + cellSize / 2;
  const centerY = y + cellSize / 2;
  if (centerX < width && centerY < height) {
    const centerIdx = (centerY * width + centerX) * 4;
    const centerBrightness = (data[centerIdx] + data[centerIdx + 1] + data[centerIdx + 2]) / 3;
    if (centerBrightness > 50) centerScore++;
  }
  
  return borderScore > borderCheckSize * 2 && centerScore > 0;
}


