/**
 * Scarab Grid Adapter
 * Maps Scarab data and config to the generic grid view interface.
 */

import { showTooltip } from '../utils/tooltip.js';
import {
  createCellsFromGroups,
  IMAGE_DIMENSIONS,
  CELL_GROUP_CONFIG,
  SCARAB_ORDER_CONFIG
} from '../config/gridConfig.js';

const DEFAULT_TAB_IMAGE = '/assets/images/stashTabs/scarab-tab.png';

function getScarabType(scarab) {
  if (!scarab || !scarab.id) return null;

  const idLower = scarab.id.toLowerCase();
  const nameLower = (scarab.name || '').toLowerCase();

  const misc2Order = SCARAB_ORDER_CONFIG['misc2'] || [];
  if (misc2Order.includes(scarab.id)) return 'misc2';

  const miscOrder = SCARAB_ORDER_CONFIG['misc'] || [];
  if (miscOrder.includes(scarab.id)) return 'misc';

  const horned2Order = SCARAB_ORDER_CONFIG['horned2'] || [];
  if (horned2Order.includes(scarab.id)) return 'horned2';

  const hornedOrder = SCARAB_ORDER_CONFIG['horned'] || [];
  if (hornedOrder.includes(scarab.id)) return 'horned';

  const idMatch = idLower.match(/^([^-]+)-scarab/);
  if (idMatch) {
    const extractedType = idMatch[1];
    const groupTypes = CELL_GROUP_CONFIG.map((g) => g.type).filter(Boolean);
    if (groupTypes.includes(extractedType)) return extractedType;
    for (const type of groupTypes) {
      if (
        extractedType.includes(type.toLowerCase()) ||
        type.toLowerCase().includes(extractedType)
      ) {
        return type;
      }
    }
  }

  const groupTypes = CELL_GROUP_CONFIG.map((g) => g.type).filter(Boolean);
  for (const type of groupTypes) {
    if (nameLower.includes(type.toLowerCase())) return type;
  }
  return null;
}

/**
 * Map scarabs to cells: group by type, sort by order/value, assign to cells left-to-right.
 * @param {Array} items - Scarab objects
 * @param {Array} cellDefinitions - Cell definitions from createCellsFromGroups
 * @returns {Promise<{ cellToItem: Map, itemToCellId: Map }>}
 */
async function mapScarabsToCells(items, cellDefinitions) {
  const cellToItem = new Map();
  const itemToCellId = new Map();

  const cellsByGroupType = new Map();
  cellDefinitions.forEach((cell) => {
    if (cell.groupType) {
      if (!cellsByGroupType.has(cell.groupType)) {
        cellsByGroupType.set(cell.groupType, []);
      }
      cellsByGroupType.get(cell.groupType).push(cell);
    }
  });

  cellsByGroupType.forEach((cells, groupType) => {
    cells.sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.x - b.x;
    });
  });

  const scarabsByType = new Map();
  (items || []).forEach((scarab) => {
    const scarabType = getScarabType(scarab);
    if (scarabType) {
      if (!scarabsByType.has(scarabType)) {
        scarabsByType.set(scarabType, []);
      }
      scarabsByType.get(scarabType).push(scarab);
    }
  });

  scarabsByType.forEach((scarabs, type) => {
    const explicitOrder = SCARAB_ORDER_CONFIG[type];
    if (explicitOrder && Array.isArray(explicitOrder)) {
      scarabs.sort((a, b) => {
        const indexA = explicitOrder.indexOf(a.id);
        const indexB = explicitOrder.indexOf(b.id);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        const valueA = a.chaosValue ?? (a.divineValue ? a.divineValue * 200 : Infinity);
        const valueB = b.chaosValue ?? (b.divineValue ? b.divineValue * 200 : Infinity);
        return valueA - valueB;
      });
    } else {
      scarabs.sort((a, b) => {
        const valueA = a.chaosValue ?? (a.divineValue ? a.divineValue * 200 : Infinity);
        const valueB = b.chaosValue ?? (b.divineValue ? b.divineValue * 200 : Infinity);
        return valueA - valueB;
      });
    }
  });

  cellsByGroupType.forEach((cells, groupType) => {
    const scarabs = scarabsByType.get(groupType) || [];
    const maxAssignments = Math.min(cells.length, scarabs.length);
    for (let i = 0; i < maxAssignments; i++) {
      const cell = cells[i];
      const scarab = scarabs[i];
      if (cell && scarab) {
        cellToItem.set(cell.id, scarab);
        itemToCellId.set(scarab.id, cell.id);
      }
    }
  });

  return { cellToItem, itemToCellId };
}

export const scarabGridAdapter = {
  getGridConfig() {
    return {
      tabImagePath: DEFAULT_TAB_IMAGE,
      imageDimensions: { ...IMAGE_DIMENSIONS },
      createCells: () => createCellsFromGroups()
    };
  },

  mapItemsToCells(items, cellDefinitions) {
    return mapScarabsToCells(items, cellDefinitions);
  },

  getImagePath(item) {
    if (!item || !item.id) return null;
    return `/assets/images/scarabs/${item.id}.png`;
  },

  getItemId(item) {
    return item?.id ?? null;
  },

  showItemTooltip(item, x, y) {
    showTooltip(item, x, y);
  },

  getProfitabilityStatus(item) {
    return item?.profitabilityStatus ?? 'unknown';
  },

  options: {
    supportsYieldCounts: true,
    supportsFilteredIds: true,
    supportsCellBackgrounds: true,
    isSimulationCanvas(canvas) {
      return canvas?.id === 'simulation-grid-canvas';
    }
  }
};
