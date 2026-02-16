/**
 * Essence Selection Panel
 * Component for managing Essence selection (bulk operations, filtering)
 */

/**
 * Render selection panel with bulk operation controls
 * @param {HTMLElement} container - Container element
 * @param {Array<Essence>} essences - All Essences
 * @param {Set<string>} selectedIds - Set of selected Essence IDs
 * @param {Function} onSelectAll - Callback for select all
 * @param {Function} onDeselectAll - Callback for deselect all
 * @param {Function} onFilterByGroup - Callback for filter by group
 */
export function renderSelectionPanel(
  container,
  essences,
  selectedIds,
  onSelectAll,
  onDeselectAll,
  onFilterByGroup
) {
  if (!container) {
    console.error('Essence selection panel: missing container');
    return;
  }

  const selectedCount = selectedIds.size;
  const totalCount = essences.length;

  const html = `
    <div class="essence-selection-panel">
      <div class="selection-stats">
        <span>Selected: ${selectedCount} / ${totalCount}</span>
      </div>
      <div class="selection-actions">
        <button class="btn-select-all" data-action="select-all">Select All</button>
        <button class="btn-deselect-all" data-action="deselect-all">Deselect All</button>
        <button class="btn-filter-deafening" data-action="filter-deafening">Filter: Deafening</button>
        <button class="btn-filter-shrieking" data-action="filter-shrieking">Filter: Shrieking</button>
        <button class="btn-filter-special" data-action="filter-special">Filter: Special</button>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Attach event listeners
  setupSelectionPanelListeners(container, onSelectAll, onDeselectAll, onFilterByGroup);
}

/**
 * Setup event listeners for selection panel
 * @param {HTMLElement} container
 * @param {Function} onSelectAll
 * @param {Function} onDeselectAll
 * @param {Function} onFilterByGroup
 */
function setupSelectionPanelListeners(container, onSelectAll, onDeselectAll, onFilterByGroup) {
  const selectAllBtn = container.querySelector('.btn-select-all');
  const deselectAllBtn = container.querySelector('.btn-deselect-all');
  const filterDeafeningBtn = container.querySelector('.btn-filter-deafening');
  const filterShriekingBtn = container.querySelector('.btn-filter-shrieking');
  const filterSpecialBtn = container.querySelector('.btn-filter-special');

  if (selectAllBtn && onSelectAll) {
    selectAllBtn.addEventListener('click', onSelectAll);
  }

  if (deselectAllBtn && onDeselectAll) {
    deselectAllBtn.addEventListener('click', onDeselectAll);
  }

  if (filterDeafeningBtn && onFilterByGroup) {
    filterDeafeningBtn.addEventListener('click', () => onFilterByGroup('deafening'));
  }

  if (filterShriekingBtn && onFilterByGroup) {
    filterShriekingBtn.addEventListener('click', () => onFilterByGroup('shrieking'));
  }

  if (filterSpecialBtn && onFilterByGroup) {
    filterSpecialBtn.addEventListener('click', () => onFilterByGroup('special'));
  }
}
