/**
 * Delirium Orb Grid Adapter
 * Maps Delirium Orb data and config to the generic grid view interface.
 */

import { showDeliriumOrbTooltip } from '../utils/tooltip.js';
import {
  DELIRIUM_ORBS_GRID_CONFIG,
  createCellsFromGroupsForCategory
} from '../config/gridConfig.js';

/**
 * Map delirium orbs to cells by itemOrderConfig then by id.
 */
async function mapDeliriumOrbsToCells(items, cellDefinitions) {
  const cellToItem = new Map();
  const itemToCellId = new Map();

  const cells = cellDefinitions
    .filter((c) => c.groupType === 'delirium-orb')
    .sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.x - b.x;
    });

  const orderConfig = DELIRIUM_ORBS_GRID_CONFIG.itemOrderConfig?.['delirium-orb'] || [];
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

export const deliriumOrbGridAdapter = {
  getGridConfig() {
    return {
      tabImagePath: DELIRIUM_ORBS_GRID_CONFIG.tabImagePath,
      imageDimensions: { ...DELIRIUM_ORBS_GRID_CONFIG.imageDimensions },
      createCells: () => createCellsFromGroupsForCategory(DELIRIUM_ORBS_GRID_CONFIG)
    };
  },

  mapItemsToCells(items, cellDefinitions) {
    return mapDeliriumOrbsToCells(items, cellDefinitions);
  },

  getImagePath(item) {
    if (!item || !item.id) return null;
    return `/assets/images/deliriumOrbs/${item.id}.png`;
  },

  getItemId(item) {
    return item?.id ?? null;
  },

  showItemTooltip(item, x, y) {
    showDeliriumOrbTooltip(item, x, y);
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
