/**
 * Navigation Component
 * Handles navigation between pages with a burger menu
 */

/**
 * Render navigation with burger menu
 * @param {HTMLElement} container - Container element
 * @param {string} currentPage - Current page ('flipping' or 'simulation')
 * @param {Function} onPageChange - Callback when page changes
 */
export function renderNavigation(container, currentPage = 'flipping', onPageChange) {
  if (!container) {
    console.error('Navigation: missing container');
    return;
  }

  container.innerHTML = `
    <nav class="main-navigation">
      <button class="burger-menu" id="burger-menu" aria-label="Toggle navigation menu">
        <span class="burger-line"></span>
        <span class="burger-line"></span>
        <span class="burger-line"></span>
      </button>
      <div class="nav-menu" id="nav-menu">
        <button class="nav-item ${currentPage === 'flipping' ? 'active' : ''}" 
                data-page="flipping" 
                aria-label="Flipping Scarabs page">
          <span>📋</span> Flipping Scarabs
        </button>
        <button class="nav-item ${currentPage === 'simulation' ? 'active' : ''}" 
                data-page="simulation" 
                aria-label="Vendor Simulation page">
          <span>⚙️</span> Vendor Simulation
        </button>
      </div>
    </nav>
  `;

  // Setup event listeners
  setupEventListeners(container, onPageChange);
}

/**
 * Setup event listeners for navigation
 * @param {HTMLElement} container
 * @param {Function} onPageChange
 */
function setupEventListeners(container, onPageChange) {
  const burgerMenu = container.querySelector('#burger-menu');
  const navMenu = container.querySelector('#nav-menu');
  const navItems = container.querySelectorAll('.nav-item');

  // Toggle burger menu
  burgerMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    navMenu.classList.toggle('open');
    burgerMenu.classList.toggle('active');
  });

  // Handle nav item clicks
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      if (page && onPageChange) {
        onPageChange(page);
        // Close menu after selection
        navMenu.classList.remove('open');
        burgerMenu.classList.remove('active');
      }
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      navMenu.classList.remove('open');
      burgerMenu.classList.remove('active');
    }
  });
}

/**
 * Update active page in navigation
 * @param {HTMLElement} container
 * @param {string} activePage
 */
export function updateNavigation(container, activePage) {
  const navItems = container.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    if (item.dataset.page === activePage) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}



