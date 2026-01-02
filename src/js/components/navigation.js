/**
 * Navigation Component
 * Handles navigation between different item categories and pages
 */

/**
 * Render horizontal navigation bar
 * @param {HTMLElement} container - Container element
 * @param {string} currentCategory - Current category ('scarabs', 'essences', 'tattoos', 'catalysts', 'temple', 'fossils', 'oils', 'delirium-orbs', 'emblems')
 * @param {string} currentPage - Current page ('flipping' or 'simulation')
 * @param {Function} onCategoryChange - Callback when category changes
 * @param {Function} onPageChange - Callback when page changes
 * @param {Function} onLeagueSelectorReady - Callback when league selector container is ready
 */
export function renderNavigation(container, currentCategory = 'scarabs', currentPage = 'flipping', onCategoryChange, onPageChange, onLeagueSelectorReady) {
  if (!container) {
    console.error('Navigation: missing container');
    return;
  }

  container.innerHTML = `
    <nav class="main-navigation">
      <div class="nav-bar">
        <a href="#" class="nav-link ${currentCategory === 'scarabs' ? 'active' : ''}" 
           data-category="scarabs" 
           aria-label="Scarabs">
          Scarabs
        </a>
        <a href="#" class="nav-link ${currentCategory === 'essences' ? 'active' : ''}" 
           data-category="essences" 
           aria-label="Essences">
          Essences
        </a>
        <a href="#" class="nav-link ${currentCategory === 'tattoos' ? 'active' : ''}" 
           data-category="tattoos" 
           aria-label="Tattoos">
          Tattoos
        </a>
        <a href="#" class="nav-link ${currentCategory === 'catalysts' ? 'active' : ''}" 
           data-category="catalysts" 
           aria-label="Catalysts">
          Catalysts
        </a>
        <a href="#" class="nav-link ${currentCategory === 'temple' ? 'active' : ''}" 
           data-category="temple" 
           aria-label="Temple">
          Temple
        </a>
        <a href="#" class="nav-link ${currentCategory === 'fossils' ? 'active' : ''}" 
           data-category="fossils" 
           aria-label="Fossils">
          Fossils
        </a>
        <a href="#" class="nav-link ${currentCategory === 'oils' ? 'active' : ''}" 
           data-category="oils" 
           aria-label="Oils">
          Oils
        </a>
        <a href="#" class="nav-link ${currentCategory === 'delirium-orbs' ? 'active' : ''}" 
           data-category="delirium-orbs" 
           aria-label="Delirium Orbs">
          Delirium Orbs
        </a>
        <a href="#" class="nav-link ${currentCategory === 'emblems' ? 'active' : ''}" 
           data-category="emblems" 
           aria-label="Emblems">
          Emblems
        </a>
      </div>
      <div class="nav-actions">
        <div id="league-selector-container"></div>
        <button class="nav-action-btn" 
                id="data-status-nav-item"
                aria-label="Data Status">
          Data Status
        </button>
      </div>
    </nav>
  `;

  // Setup event listeners
  setupEventListeners(container, onCategoryChange, onPageChange);

  // Notify that league selector container is ready
  if (onLeagueSelectorReady) {
    const leagueSelectorContainer = container.querySelector('#league-selector-container');
    if (leagueSelectorContainer) {
      onLeagueSelectorReady(leagueSelectorContainer);
    }
  }
}

/**
 * Setup event listeners for navigation
 * @param {HTMLElement} container
 * @param {Function} onCategoryChange
 * @param {Function} onPageChange
 */
function setupEventListeners(container, onCategoryChange, onPageChange) {
  const navLinks = container.querySelectorAll('.nav-link');
  const navActionBtns = container.querySelectorAll('.nav-action-btn');

  // Handle category navigation links
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const category = link.dataset.category;
      if (category && onCategoryChange) {
        onCategoryChange(category);
      }
    });
  });

  // Handle action buttons (data status)
  navActionBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (btn.id === 'data-status-nav-item') {
        // Handle data status overlay
        import('./dataStatusOverlay.js').then(module => {
          module.openDataStatusOverlay();
        });
      }
    });
  });
}

/**
 * Update active category and page in navigation
 * @param {HTMLElement} container
 * @param {string} activeCategory
 * @param {string} activePage
 * @param {Function} onCategoryChange
 * @param {Function} onPageChange
 * @param {Function} onLeagueSelectorReady
 */
export function updateNavigation(container, activeCategory, activePage, onCategoryChange, onPageChange, onLeagueSelectorReady) {
  // Re-render navigation to update submenu visibility
  renderNavigation(container, activeCategory, activePage, onCategoryChange, onPageChange, onLeagueSelectorReady);
}



