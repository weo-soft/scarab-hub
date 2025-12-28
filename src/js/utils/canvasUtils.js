/**
 * Canvas Utilities
 * Provides helper functions for canvas drawing operations
 */

/**
 * Draw a rectangle with rounded corners
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Width
 * @param {number} height - Height
 * @param {number} radius - Corner radius
 */
export function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Draw a highlighted cell overlay
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Cell width
 * @param {number} height - Cell height
 * @param {string} color - Highlight color
 * @param {number} opacity - Opacity (0-1)
 */
export function drawCellHighlight(ctx, x, y, width, height, color, opacity = 0.3) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  drawRoundedRect(ctx, x, y, width, height, 4);
  ctx.fill();
  ctx.restore();
}

/**
 * Draw a border around a cell
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Cell width
 * @param {number} height - Cell height
 * @param {string} color - Border color
 * @param {number} lineWidth - Border width
 */
export function drawCellBorder(ctx, x, y, width, height, color, lineWidth = 2) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  drawRoundedRect(ctx, x, y, width, height, 4);
  ctx.stroke();
  ctx.restore();
}

/**
 * Load an image from a URL
 * @param {string} url - Image URL
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Clear canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 */
export function clearCanvas(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
}

