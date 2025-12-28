/**
 * Cell Position Detector
 * Interactive tool to detect and export cell positions from the image
 * Can be run in browser console to analyze the image
 */

import { loadImage } from './canvasUtils.js';
import { analyzeImageCells, analyzeUsingTemplateMatching } from './imageCellAnalyzer.js';
import { analyzeIrregularGrid } from './irregularGridAnalyzer.js';

/**
 * Analyze the image and return cell positions
 * This function can be called from browser console for debugging
 * @param {string} imagePath - Path to image
 * @returns {Promise<Array>}
 */
export async function detectCellPositions(imagePath = './assets/Scarab-tab.png') {
  const image = await loadImage(imagePath);
  const canvas = document.createElement('canvas');
  
  console.log('Analyzing image:', image.width, 'x', image.height);
  
  // Try multiple methods
  let cells1, cells2, cells3;
  
  try {
    console.log('Method 1: Irregular grid analyzer (3-2-3, 3-3-3-3 pattern)...');
    cells1 = await analyzeIrregularGrid(image, canvas);
    console.log(`Found ${cells1.length} cells using irregular grid analyzer`);
  } catch (error) {
    console.error('Irregular grid analyzer failed:', error);
    cells1 = [];
  }
  
  try {
    console.log('Method 2: Edge detection...');
    cells2 = await analyzeImageCells(image, canvas);
    console.log(`Found ${cells2.length} cells using edge detection`);
  } catch (error) {
    console.error('Edge detection failed:', error);
    cells2 = [];
  }
  
  try {
    console.log('Method 3: Template matching...');
    cells3 = await analyzeUsingTemplateMatching(image, canvas);
    console.log(`Found ${cells3.length} cells using template matching`);
  } catch (error) {
    console.error('Template matching failed:', error);
    cells3 = [];
  }
  
  // Use the method that found the most cells
  const allResults = [
    { method: 'Irregular Grid', cells: cells1 },
    { method: 'Edge Detection', cells: cells2 },
    { method: 'Template Matching', cells: cells3 },
  ].filter(r => r.cells.length > 0);
  
  allResults.sort((a, b) => b.cells.length - a.cells.length);
  const bestResult = allResults[0];
  
  console.log(`\n✅ Best result: ${bestResult.method} with ${bestResult.cells.length} cells`);
  
  const cells = bestResult.cells;
  
  // Export cell positions as JSON for easy copying
  const cellConfig = formatCellsForConfig(cells);
  console.log('Cell positions (JSON):');
  console.log(JSON.stringify(cellConfig, null, 2));
  
  // Also log as JavaScript array for direct use
  console.log('Cell positions (JS array):');
  console.log(formatCellsAsJSArray(cells));
  
  return cells;
}

/**
 * Format cells for configuration file
 * @param {Array} cells
 * @returns {Array}
 */
function formatCellsForConfig(cells) {
  // Group cells by row
  const rows = {};
  cells.forEach(cell => {
    if (!rows[cell.row]) {
      rows[cell.row] = [];
    }
    rows[cell.row].push({
      x: cell.x,
      y: cell.y,
      width: cell.width,
      height: cell.height,
    });
  });
  
  // Convert to array of rows
  return Object.keys(rows)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map(row => rows[row]);
}

/**
 * Format cells as JavaScript array
 * @param {Array} cells
 * @returns {string}
 */
function formatCellsAsJSArray(cells) {
  const rows = {};
  cells.forEach(cell => {
    if (!rows[cell.row]) {
      rows[cell.row] = [];
    }
    rows[cell.row].push({
      x: cell.x,
      y: cell.y,
      width: cell.width,
      height: cell.height,
    });
  });
  
  const rowArrays = Object.keys(rows)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map(row => rows[row]);
  
  return `[\n${rowArrays.map(row => 
    `  [${row.map(cell => 
      `{ x: ${cell.x}, y: ${cell.y}, width: ${cell.width}, height: ${cell.height} }`
    ).join(', ')}]`
  ).join(',\n')}\n]`;
}

/**
 * Visualize detected cells on canvas
 * Useful for debugging and verification
 * @param {HTMLCanvasElement} canvas
 * @param {Array} cells
 */
export function visualizeCells(canvas, cells) {
  const ctx = canvas.getContext('2d');
  
  // Draw cells with different colors
  cells.forEach((cell, index) => {
    ctx.strokeStyle = `hsl(${(index * 137.5) % 360}, 70%, 50%)`;
    ctx.lineWidth = 2;
    ctx.strokeRect(cell.x, cell.y, cell.width, cell.height);
    
    // Draw cell ID
    ctx.fillStyle = 'white';
    ctx.font = '10px monospace';
    ctx.fillText(cell.id || `cell-${index}`, cell.x + 2, cell.y + 12);
  });
}

// Make available globally for console access
if (typeof window !== 'undefined') {
  window.detectCellPositions = detectCellPositions;
  window.visualizeCells = visualizeCells;
}

