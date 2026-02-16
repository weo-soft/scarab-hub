/**
 * Legion Emblem Grid Adapter
 * Maps Emblem data and config to the generic grid view (fragments-tab, emblem row).
 */

import { showEmblemTooltip } from '../utils/tooltip.js';
import {
  EMBLEMS_GRID_CONFIG,
  createCellsFromGroupsForCategory
} from '../config/gridConfig.js';

/**
 * Map emblems to cells by itemOrderConfig.
 */
async function mapEmblemsToCells(items, cellDefinitions) {
  const cellToItem = new Map();
  const itemToCellId = new Map();

  const cells = cellDefinitions
    .filter((c) => c.groupType === 'emblem')
    .sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.x - b.x;
    });

  const orderConfig = EMBLEMS_GRID_CONFIG.itemOrderConfig?.emblem || [];
  const sortedItems = [...(items || [])].sort((a, b) => {
    if (orderConfig.length > 0) {
      const indexA = orderConfig.indexOf(a.id);
      const indexB = orderConfig.indexOf(b.id);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
    }
    return (a.id || '').localeCompare(b.id || '');
  });

  const maxAssignments = Math.min(cells.length, sortedItems.length);
  for (let i = 0; i < maxAssignments; i++) {
    const cell = cells[i];
    const item = sortedItems[i];
    if (cell && item) {
      cellToItem.set(cell.id, item);
      itemToCellId.set(item.id, cell.id);
    }
  }

  return { cellToItem, itemToCellId };
}

export const emblemGridAdapter = {
  getGridConfig() {
    return {
      tabImagePath: EMBLEMS_GRID_CONFIG.tabImagePath,
      imageDimensions: { ...EMBLEMS_GRID_CONFIG.imageDimensions },
      createCells: () => createCellsFromGroupsForCategory(EMBLEMS_GRID_CONFIG)
    };
  },

  mapItemsToCells(items, cellDefinitions) {
    return mapEmblemsToCells(items, cellDefinitions);
  },

  getImagePath(item) {
    if (!item || !item.id) return null;
    return `/assets/images/legionEmblems/${item.id}.png`;
  },

  getItemId(item) {
    return item?.id ?? null;
  },

  showItemTooltip(item, x, y) {
    showEmblemTooltip(item, x, y);
  },

  getProfitabilityStatus(item) {
    return item?.profitabilityStatus ?? 'unknown';
  },

  options: {
    supportsYieldCounts: false,
    supportsFilteredIds: false,
    supportsCellBackgrounds: true,
    isSimulationCanvas: () => false
  }
};
