/**
 * Image Cell Analyzer
 * Analyzes the Scarab-tab.png image to detect actual cell positions
 * Uses edge detection and pattern recognition to identify cell boundaries
 */

/**
 * Analyze image to detect cell positions
 * @param {HTMLImageElement} image - The loaded image
 * @param {HTMLCanvasElement} canvas - Canvas element for processing
 * @returns {Promise<Array<{x: number, y: number, width: number, height: number}>>}
 */
export async function analyzeImageCells(image, canvas) {
  const ctx = canvas.getContext('2d');
  
  // Set canvas to image dimensions
  canvas.width = image.width;
  canvas.height = image.height;
  
  // Draw image to canvas
  ctx.drawImage(image, 0, 0);
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Detect cell boundaries using edge detection
  const edges = detectEdges(imageData);
  
  // Find rectangular regions (cells)
  const cells = findRectangularRegions(edges, canvas.width, canvas.height);
  
  // Sort cells by position (top to bottom, left to right)
  cells.sort((a, b) => {
    if (Math.abs(a.y - b.y) < 10) { // Same row (within 10px tolerance)
      return a.x - b.x;
    }
    return a.y - b.y;
  });
  
  // Assign IDs to cells
  cells.forEach((cell, index) => {
    cell.id = `cell-${index}`;
    cell.row = Math.floor(index / 6); // Assuming 6 columns
    cell.col = index % 6;
  });
  
  return cells;
}

/**
 * Detect edges in the image using Sobel operator
 * @param {ImageData} imageData
 * @returns {Uint8Array} Edge map (1 = edge, 0 = no edge)
 */
function detectEdges(imageData) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const edges = new Uint8Array(width * height);
  
  // Sobel kernels
  const sobelX = [
    -1, 0, 1,
    -2, 0, 2,
    -1, 0, 1
  ];
  
  const sobelY = [
    -1, -2, -1,
     0,  0,  0,
     1,  2,  1
  ];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;
      
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          const kernelIdx = (ky + 1) * 3 + (kx + 1);
          gx += gray * sobelX[kernelIdx];
          gy += gray * sobelY[kernelIdx];
        }
      }
      
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      const edgeIdx = y * width + x;
      edges[edgeIdx] = magnitude > 30 ? 1 : 0; // Threshold for edge detection
    }
  }
  
  return edges;
}

/**
 * Find rectangular regions (cells) from edge map
 * Uses Hough transform and rectangle detection
 * @param {Uint8Array} edges
 * @param {number} width
 * @param {number} height
 * @returns {Array<{x: number, y: number, width: number, height: number}>}
 */
function findRectangularRegions(edges, width, height) {
  const cells = [];
  
  // Find horizontal and vertical lines
  const horizontalLines = findHorizontalLines(edges, width, height);
  const verticalLines = findVerticalLines(edges, width, height);
  
  // Find intersections to form rectangles
  for (let i = 0; i < horizontalLines.length - 1; i++) {
    for (let j = 0; j < verticalLines.length - 1; j++) {
      const x = verticalLines[j];
      const y = horizontalLines[i];
      const cellWidth = verticalLines[j + 1] - x;
      const cellHeight = horizontalLines[i + 1] - y;
      
      // Validate cell size (typical cells are 60-70px)
      if (cellWidth > 50 && cellWidth < 80 && cellHeight > 50 && cellHeight < 80) {
        // Check if this region has content (not empty)
        if (hasContent(edges, width, x, y, cellWidth, cellHeight)) {
          cells.push({
            x: x,
            y: y,
            width: cellWidth,
            height: cellHeight,
          });
        }
      }
    }
  }
  
  return cells;
}

/**
 * Find horizontal lines in edge map
 * @param {Uint8Array} edges
 * @param {number} width
 * @param {number} height
 * @returns {Array<number>} Y coordinates of horizontal lines
 */
function findHorizontalLines(edges, width, height) {
  const lines = [];
  const lineStrength = new Array(height).fill(0);
  
  // Calculate line strength for each row
  for (let y = 0; y < height; y++) {
    let strength = 0;
    for (let x = 0; x < width; x++) {
      if (edges[y * width + x]) {
        strength++;
      }
    }
    lineStrength[y] = strength;
  }
  
  // Find peaks (strong horizontal lines)
  const threshold = width * 0.1; // At least 10% of width should be edges
  for (let y = 1; y < height - 1; y++) {
    if (lineStrength[y] > threshold && 
        lineStrength[y] > lineStrength[y - 1] && 
        lineStrength[y] > lineStrength[y + 1]) {
      lines.push(y);
    }
  }
  
  return lines;
}

/**
 * Find vertical lines in edge map
 * @param {Uint8Array} edges
 * @param {number} width
 * @param {number} height
 * @returns {Array<number>} X coordinates of vertical lines
 */
function findVerticalLines(edges, width, height) {
  const lines = [];
  const lineStrength = new Array(width).fill(0);
  
  // Calculate line strength for each column
  for (let x = 0; x < width; x++) {
    let strength = 0;
    for (let y = 0; y < height; y++) {
      if (edges[y * width + x]) {
        strength++;
      }
    }
    lineStrength[x] = strength;
  }
  
  // Find peaks (strong vertical lines)
  const threshold = height * 0.1; // At least 10% of height should be edges
  for (let x = 1; x < width - 1; x++) {
    if (lineStrength[x] > threshold && 
        lineStrength[x] > lineStrength[x - 1] && 
        lineStrength[x] > lineStrength[x + 1]) {
      lines.push(x);
    }
  }
  
  return lines;
}

/**
 * Check if a region has content (not empty)
 * @param {Uint8Array} edges
 * @param {number} width
 * @param {number} x
 * @param {number} y
 * @param {number} cellWidth
 * @param {number} cellHeight
 * @returns {boolean}
 */
function hasContent(edges, width, x, y, cellWidth, cellHeight) {
  let edgeCount = 0;
  for (let dy = 0; dy < cellHeight; dy++) {
    for (let dx = 0; dx < cellWidth; dx++) {
      const idx = (y + dy) * width + (x + dx);
      if (edges[idx]) {
        edgeCount++;
      }
    }
  }
  
  // Region has content if it has some edges (at least 1% of area)
  return edgeCount > (cellWidth * cellHeight * 0.01);
}

/**
 * Alternative method: Use template matching for known cell patterns
 * This is more reliable if we know the cell appearance
 * @param {HTMLImageElement} image
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<Array>}
 */
export async function analyzeUsingTemplateMatching(image, canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const cells = [];
  
  // Look for cell-like patterns (dark borders, content in center)
  // This is a simplified approach - in practice, you'd use more sophisticated pattern matching
  
  const cellSize = 64; // Approximate cell size
  const spacing = 2; // Approximate spacing
  
  // Try to detect the actual grid structure by looking for repeating patterns
  const detectedCells = detectGridPattern(imageData, cellSize, spacing);
  
  return detectedCells;
}

/**
 * Detect irregular grid pattern
 * First row: 3-2-3 cells
 * Second row: 3-3-3-3 cells
 * @param {ImageData} imageData
 * @param {number} expectedCellSize
 * @param {number} expectedSpacing
 * @returns {Array}
 */
function detectGridPattern(imageData, expectedCellSize, expectedSpacing) {
  const cells = [];
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  
  // Find the first cell by looking for a pattern
  // Cells typically have darker borders and lighter centers
  let startX = findGridStartX(imageData);
  let startY = findGridStartY(imageData, startX);
  
  console.log(`Grid starts at: ${startX}, ${startY}`);
  
  // Detect actual cell size and spacing by analyzing first few cells
  const cellMetrics = detectCellMetrics(imageData, startX, startY);
  const actualCellSize = cellMetrics.size || expectedCellSize;
  const actualSpacing = cellMetrics.spacing || expectedSpacing;
  
  console.log(`Detected cell size: ${actualCellSize}, spacing: ${actualSpacing}`);
  
  // Detect cells row by row with irregular patterns
  let currentY = startY;
  let cellId = 0;
  let rowIndex = 0;
  const maxCells = 200;
  
  // Known row patterns
  const rowPatterns = [
    [3, 2, 3],      // Row 0: 3 cells, gap, 2 cells, gap, 3 cells
    [3, 3, 3, 3],  // Row 1: 3 cells, gap, 3 cells, gap, 3 cells, gap, 3 cells
    // After row 1, we'll detect patterns dynamically
  ];
  
  while (currentY < height - actualCellSize && cellId < maxCells) {
    let currentX = startX;
    let rowCells = [];
    let cellsInRow = 0;
    
    // Determine expected pattern for this row
    let expectedPattern = null;
    if (rowIndex < rowPatterns.length) {
      expectedPattern = rowPatterns[rowIndex];
    }
    
    // Scan horizontally for cells in this row
    let groupIndex = 0;
    let cellsInCurrentGroup = 0;
    let expectedInGroup = expectedPattern ? expectedPattern[groupIndex] : null;
    
    while (currentX < width - actualCellSize && cellId < maxCells) {
      // Check if this position contains a cell
      if (isCellAtPosition(imageData, currentX, currentY, actualCellSize)) {
        const cell = {
          id: `cell-${cellId++}`,
          x: currentX,
          y: currentY,
          width: actualCellSize,
          height: actualCellSize,
          row: rowIndex,
          col: cellsInRow,
        };
        
        cells.push(cell);
        rowCells.push(cell);
        cellsInRow++;
        cellsInCurrentGroup++;
        
        // Move to next cell position
        currentX += actualCellSize + actualSpacing;
        
        // Check if we've completed a group
        if (expectedInGroup && cellsInCurrentGroup >= expectedInGroup) {
          groupIndex++;
          cellsInCurrentGroup = 0;
          expectedInGroup = expectedPattern && groupIndex < expectedPattern.length 
            ? expectedPattern[groupIndex] 
            : null;
          
          // Add gap between groups (larger spacing)
          currentX += actualSpacing * 2; // Extra spacing between groups
        }
      } else {
        // Try next position
        currentX += 1;
        
        // If we've moved too far without finding a cell, check for group gap
        if (expectedInGroup && cellsInCurrentGroup > 0) {
          // We found some cells in this group, might be a gap
          const gapSize = currentX - (rowCells[rowCells.length - 1]?.x + actualCellSize || startX);
          if (gapSize > actualSpacing * 3) {
            // Large gap, move to next group
            groupIndex++;
            cellsInCurrentGroup = 0;
            expectedInGroup = expectedPattern && groupIndex < expectedPattern.length 
              ? expectedPattern[groupIndex] 
              : null;
          }
        }
        
        // If we've moved too far without finding anything, skip to next row
        if (currentX - startX > actualCellSize * 15) {
          break;
        }
      }
    }
    
    // Move to next row
    if (rowCells.length > 0) {
      // Calculate next row Y position
      // Find the bottom of the tallest cell in this row
      const maxCellBottom = Math.max(...rowCells.map(c => c.y + c.height));
      currentY = maxCellBottom + actualSpacing;
      rowIndex++;
    } else {
      // If no cells found, try next pixel down
      currentY += 1;
      
      // If we've moved too far down, stop
      if (currentY - startY > actualCellSize * 30) {
        break;
      }
    }
  }
  
  return cells;
}

/**
 * Find the X coordinate where the grid starts
 * @param {ImageData} imageData
 * @returns {number}
 */
function findGridStartX(imageData) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // Look for a vertical line of dark pixels (grid border)
  for (let x = 0; x < width - 10; x++) {
    let darkPixelCount = 0;
    
    for (let y = 0; y < Math.min(height, 100); y++) {
      const idx = (y * width + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      
      if (brightness < 80) { // Dark pixel (border)
        darkPixelCount++;
      }
    }
    
    // If we found a vertical line of dark pixels, this might be the start
    if (darkPixelCount > 20) {
      return x;
    }
  }
  
  return 10; // Default
}

/**
 * Find the Y coordinate where the grid starts
 * @param {ImageData} imageData
 * @param {number} startX
 * @returns {number}
 */
function findGridStartY(imageData, startX) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // Look for a horizontal line of dark pixels
  for (let y = 0; y < height - 10; y++) {
    let darkPixelCount = 0;
    
    for (let x = startX; x < Math.min(width, startX + 100); x++) {
      const idx = (y * width + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      
      if (brightness < 80) {
        darkPixelCount++;
      }
    }
    
    if (darkPixelCount > 20) {
      return y;
    }
  }
  
  return 10; // Default
}

/**
 * Detect actual cell size and spacing by analyzing first few cells
 * @param {ImageData} imageData
 * @param {number} startX
 * @param {number} startY
 * @returns {{size: number, spacing: number}}
 */
function detectCellMetrics(imageData, startX, startY) {
  const data = imageData.data;
  const width = imageData.width;
  
  // Analyze first cell to determine size
  // Look for the right edge (vertical dark line)
  let cellWidth = 64; // Default
  for (let x = startX + 50; x < startX + 80; x++) {
    let darkCount = 0;
    for (let y = startY; y < startY + 64; y++) {
      const idx = (y * width + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      if (brightness < 80) darkCount++;
    }
    if (darkCount > 30) {
      cellWidth = x - startX;
      break;
    }
  }
  
  // Analyze spacing by finding next cell
  let spacing = 2; // Default
  for (let x = startX + cellWidth; x < startX + cellWidth + 10; x++) {
    let lightCount = 0;
    for (let y = startY; y < startY + cellWidth; y++) {
      const idx = (y * width + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      if (brightness > 100) lightCount++;
    }
    if (lightCount > cellWidth * 0.5) {
      spacing++;
    } else {
      break;
    }
  }
  
  return { size: cellWidth, spacing };
}

/**
 * Check if a cell exists at the given position
 * Improved version with better pattern matching
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
  
  // Check for cell-like structure:
  // 1. Dark borders (top, bottom, left, right)
  // 2. Lighter center area
  // 3. Some content in the middle
  
  let borderScore = 0;
  let centerScore = 0;
  
  // Check borders
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
  
  // Check center (should be lighter/have content)
  const centerX = x + cellSize / 2;
  const centerY = y + cellSize / 2;
  if (centerX < width && centerY < height) {
    const centerIdx = (centerY * width + centerX) * 4;
    const centerBrightness = (data[centerIdx] + data[centerIdx + 1] + data[centerIdx + 2]) / 3;
    if (centerBrightness > 50) centerScore++;
  }
  
  // Cell is valid if it has borders and some center content
  return borderScore > borderCheckSize * 2 && centerScore > 0;
}

/**
 * Find the X position of the first cell
 * @param {ImageData} imageData
 * @param {number} startX
 * @param {number} startY
 * @returns {number}
 */
function findFirstCellX(imageData, startX, startY) {
  const data = imageData.data;
  const width = imageData.width;
  
  // Look for a vertical edge (dark to light transition)
  for (let x = startX; x < width - 10; x++) {
    const idx1 = (startY * width + x) * 4;
    const idx2 = (startY * width + (x + 1)) * 4;
    
    const brightness1 = (data[idx1] + data[idx1 + 1] + data[idx1 + 2]) / 3;
    const brightness2 = (data[idx2] + data[idx2 + 1] + data[idx2 + 2]) / 3;
    
    // Look for edge (significant brightness change)
    if (Math.abs(brightness1 - brightness2) > 30) {
      return x;
    }
  }
  
  return startX;
}

/**
 * Find the Y position of the first cell
 * @param {ImageData} imageData
 * @param {number} startX
 * @param {number} startY
 * @returns {number}
 */
function findFirstCellY(imageData, startX, startY) {
  const data = imageData.data;
  const width = imageData.width;
  
  // Look for a horizontal edge
  for (let y = startY; y < imageData.height - 10; y++) {
    const idx1 = (y * width + startX) * 4;
    const idx2 = ((y + 1) * width + startX) * 4;
    
    const brightness1 = (data[idx1] + data[idx1 + 1] + data[idx1 + 2]) / 3;
    const brightness2 = (data[idx2] + data[idx2 + 1] + data[idx2 + 2]) / 3;
    
    // Look for edge
    if (Math.abs(brightness1 - brightness2) > 30) {
      return y;
    }
  }
  
  return startY;
}

/**
 * Check if a position looks like a cell
 * @param {ImageData} imageData
 * @param {number} x
 * @param {number} y
 * @param {number} cellSize
 * @returns {boolean}
 */
function isCellPosition(imageData, x, y, cellSize) {
  const data = imageData.data;
  const width = imageData.width;
  
  // Check if we have borders (edges) around this position
  let edgeCount = 0;
  
  // Check top and bottom edges
  for (let dx = 0; dx < cellSize; dx++) {
    if (x + dx < width) {
      const topIdx = (y * width + (x + dx)) * 4;
      const bottomIdx = ((y + cellSize - 1) * width + (x + dx)) * 4;
      
      const topBrightness = (data[topIdx] + data[topIdx + 1] + data[topIdx + 2]) / 3;
      const bottomBrightness = (data[bottomIdx] + data[bottomIdx + 1] + data[bottomIdx + 2]) / 3;
      
      // Dark borders indicate cell boundaries
      if (topBrightness < 100 || bottomBrightness < 100) {
        edgeCount++;
      }
    }
  }
  
  // Check left and right edges
  for (let dy = 0; dy < cellSize; dy++) {
    if (y + dy < imageData.height) {
      const leftIdx = ((y + dy) * width + x) * 4;
      const rightIdx = ((y + dy) * width + (x + cellSize - 1)) * 4;
      
      const leftBrightness = (data[leftIdx] + data[leftIdx + 1] + data[leftIdx + 2]) / 3;
      const rightBrightness = (data[rightIdx] + data[rightIdx + 1] + data[rightIdx + 2]) / 3;
      
      if (leftBrightness < 100 || rightBrightness < 100) {
        edgeCount++;
      }
    }
  }
  
  // If we have enough edge indicators, this is likely a cell
  return edgeCount > (cellSize * 0.3);
}

