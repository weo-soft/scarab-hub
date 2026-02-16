/**
 * Debug Cell Analyzer
 * Interactive tool to analyze and export cell positions
 * Run this in browser console: window.analyzeCells()
 */

import { loadImage } from './canvasUtils.js';
import { detectCellPositions, visualizeCells } from './cellPositionDetector.js';

/**
 * Analyze cells and display results
 * This function is exposed globally for console access
 */
export async function analyzeCells() {
  console.log('Starting cell analysis...');
  console.log('This may take a few seconds...');
  
  try {
    const cells = await detectCellPositions('./assets/Scarab-tab.png');
    
    console.log(`\n✅ Analysis complete! Found ${cells.length} cells`);
    console.log('\nTo use these positions, copy the JS array output above');
    console.log('and paste it into src/js/config/gridConfig.js as GRID_CELL_CONFIG');
    
    // Also visualize on the canvas if available
    const canvas = document.getElementById('scarab-grid-canvas');
    if (canvas) {
      visualizeCells(canvas, cells);
      console.log('\n✅ Cells visualized on canvas (colored borders)');
    }
    
    return cells;
  } catch (error) {
    console.error('Analysis failed:', error);
    console.log('\n💡 Tip: Make sure the image is loaded first');
    throw error;
  }
}

/**
 * Export cell positions as configuration code
 * @param {Array} cells
 * @returns {string}
 */
export function exportCellConfig(cells) {
  // Group by row
  const rows = {};
  cells.forEach(cell => {
    const row = cell.row || Math.floor(cell.y / 70); // Approximate row
    if (!rows[row]) rows[row] = [];
    rows[row].push({
      x: Math.round(cell.x),
      y: Math.round(cell.y),
      width: Math.round(cell.width),
      height: Math.round(cell.height),
    });
  });
  
  // Sort rows
  const sortedRows = Object.keys(rows)
    .map(Number)
    .sort((a, b) => a - b)
    .map(row => rows[row]);
  
  // Format as JavaScript array
  const config = sortedRows.map(row => 
    `  [${row.map(cell => 
      `{ x: ${cell.x}, y: ${cell.y}, width: ${cell.width}, height: ${cell.height} }`
    ).join(', ')}]`
  ).join(',\n');
  
  return `export const GRID_CELL_CONFIG = [\n${config}\n];`;
}

// Make available globally
if (typeof window !== 'undefined') {
  window.analyzeCells = analyzeCells;
  window.exportCellConfig = exportCellConfig;
}


