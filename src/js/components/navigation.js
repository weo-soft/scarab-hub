/**
 * Navigation Component
 * Handles navigation between different item categories and pages
 */

import { getRouteUrl } from '../services/router.js';

/**
 * Get icon image path for a category
 * @param {string} categoryId - Category ID
 * @returns {string} Image path
 */
function getCategoryIconPath(categoryId) {
  const iconMap = {
    'scarabs': '/assets/images/scarabs/abyss-scarab.png',
    'essences': '/assets/images/essences/muttering-essence-of-anger.png',
    'tattoos': '/assets/images/tattoos/journey-tattoo-of-the-body.png',
    'catalysts': '/assets/images/catalysts/abrasive-catalyst.png',
    'temple': '/assets/images/Chronicle_of_Atzoatl.png',
    'fossils': '/assets/images/fossils/aberrant-fossil.png',
    'oils': '/assets/images/oils/clear-oil.png',
    'delirium-orbs': '/assets/images/deliriumOrbs/abyssal-delirium-orb.png',
    'emblems': '/assets/images/legionEmblems/timeless-eternal-emblem.png'
  };
  return iconMap[categoryId] || '';
}

/**
 * Render horizontal navigation bar
 * @param {HTMLElement} container - Container element
 * @param {string|null} currentCategory - Current category ('scarabs', 'essences', 'tattoos', 'catalysts', 'temple', 'fossils', 'oils', 'delirium-orbs', 'emblems') or null for root
 * @param {string} currentPage - Current page ('flipping' or 'simulation')
 * @param {Function} onLeagueSelectorReady - Callback when league selector container is ready
 */
export function renderNavigation(container, currentCategory = 'scarabs', currentPage = 'flipping', onLeagueSelectorReady) {
  if (!container) {
    console.error('Navigation: missing container');
    return;
  }

  // Home link (active when currentCategory is null)
  const isHomeActive = currentCategory === null;
  const homeLink = `
    <a href="#" class="nav-link nav-link-home ${isHomeActive ? 'active' : ''}" 
       aria-label="Home">
      <svg class="home-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 1L2 6.5V14H6V10H10V14H14V6.5L8 1Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </svg>
    </a>
  `;

  // Generate URLs for each category using the current page
  const categories = [
    { id: 'scarabs', label: 'Scarabs' },
    { id: 'essences', label: 'Essences' },
    { id: 'tattoos', label: 'Tattoos' },
    { id: 'catalysts', label: 'Catalysts' },
    { id: 'temple', label: 'Temple' },
    { id: 'fossils', label: 'Fossils' },
    { id: 'oils', label: 'Oils' },
    { id: 'delirium-orbs', label: 'Delirium Orbs' },
    { id: 'emblems', label: 'Emblems' }
  ];

  const navLinks = categories.map(cat => {
    const url = getRouteUrl(cat.id, currentPage);
    const isActive = currentCategory === cat.id;
    const iconPath = getCategoryIconPath(cat.id);
    return `<a href="${url}" class="nav-link ${isActive ? 'active' : ''}" 
           aria-label="${cat.label}">
          <img src="${iconPath}" alt="${cat.label}" class="nav-link-icon" onerror="this.style.display='none'">
          ${cat.label}
        </a>`;
  }).join('');

  container.innerHTML = `
    <nav class="main-navigation">
      <button class="nav-menu-toggle" id="nav-menu-toggle" aria-label="Toggle navigation menu" aria-expanded="false">
        <span class="hamburger-icon">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>
      <div class="nav-bar">
        ${homeLink}
        ${navLinks}
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

  // Setup event listeners (only for action buttons now, links handle navigation naturally)
  setupEventListeners(container);
  
  // Setup hamburger menu toggle
  setupMenuToggle(container);
  
  // Setup home link click handler
  const homeLinkElement = container.querySelector('.nav-link-home');
  if (homeLinkElement) {
    homeLinkElement.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = '#';
      // Close mobile menu when navigating
      closeMobileMenu(container);
    });
  }
  
  // Close mobile menu when clicking on nav links
  const navLinkElements = container.querySelectorAll('.nav-link');
  navLinkElements.forEach(link => {
    link.addEventListener('click', () => {
      closeMobileMenu(container);
    });
  });

  // Notify that league selector container is ready
  if (onLeagueSelectorReady) {
    const leagueSelectorContainer = container.querySelector('#league-selector-container');
    if (leagueSelectorContainer) {
      onLeagueSelectorReady(leagueSelectorContainer);
    }
  }
}

// Store handler references to avoid duplicates
let menuClickHandler = null;
let menuResizeHandler = null;
let resizeTimeout = null;

/**
 * Setup hamburger menu toggle functionality
 * @param {HTMLElement} container
 */
function setupMenuToggle(container) {
  const toggleBtn = container.querySelector('#nav-menu-toggle');
  const navBar = container.querySelector('.nav-bar');
  const navActions = container.querySelector('.nav-actions');
  
  if (!toggleBtn || !navBar) return;
  
  // Setup toggle button click handler
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    
    if (isExpanded) {
      closeMobileMenu(container);
    } else {
      openMobileMenu(container);
    }
  });
  
  // Close menu when clicking outside (only add once globally)
  if (!menuClickHandler) {
    menuClickHandler = (e) => {
      const nav = document.querySelector('.main-navigation');
      if (nav) {
        const navBar = nav.querySelector('.nav-bar.mobile-open');
        if (navBar && !nav.contains(e.target)) {
          const navContainer = nav.parentElement;
          closeMobileMenu(navContainer);
        }
      }
    };
    document.addEventListener('click', menuClickHandler);
  }
  
  // Close menu on window resize if switching to desktop (only add once globally)
  if (!menuResizeHandler) {
    menuResizeHandler = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const navBar = document.querySelector('.nav-bar.mobile-open');
        if (navBar && window.innerWidth > 1024) {
          const nav = navBar.closest('.main-navigation');
          if (nav) {
            closeMobileMenu(nav.parentElement);
          }
        }
      }, 250);
    };
    window.addEventListener('resize', menuResizeHandler);
  }
}

/**
 * Open mobile navigation menu
 * @param {HTMLElement} container
 */
function openMobileMenu(container) {
  const toggleBtn = container.querySelector('#nav-menu-toggle');
  const navBar = container.querySelector('.nav-bar');
  const navActions = container.querySelector('.nav-actions');
  const mainNav = container.querySelector('.main-navigation');
  
  if (toggleBtn) {
    toggleBtn.setAttribute('aria-expanded', 'true');
    toggleBtn.classList.add('active');
  }
  if (navBar && mainNav) {
    // Calculate top position based on actual navigation bar height
    const navRect = mainNav.getBoundingClientRect();
    navBar.style.top = `${navRect.height}px`;
    navBar.classList.add('mobile-open');
  }
  if (navActions) {
    navActions.classList.add('mobile-open');
  }
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

/**
 * Close mobile navigation menu
 * @param {HTMLElement} container
 */
function closeMobileMenu(container) {
  const toggleBtn = container.querySelector('#nav-menu-toggle');
  const navBar = container.querySelector('.nav-bar');
  const navActions = container.querySelector('.nav-actions');
  
  if (toggleBtn) {
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.classList.remove('active');
  }
  if (navBar) {
    navBar.classList.remove('mobile-open');
    navBar.style.top = '0'; // Reset top position
  }
  if (navActions) {
    navActions.classList.remove('mobile-open');
  }
  document.body.style.overflow = ''; // Restore scrolling
}

/**
 * Setup event listeners for navigation
 * @param {HTMLElement} container
 */
function setupEventListeners(container) {
  const navActionBtns = container.querySelectorAll('.nav-action-btn');

  // Handle action buttons (data status)
  navActionBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (btn.id === 'data-status-nav-item') {
        // Handle data status overlay
        import('./dataStatusOverlay.js').then(module => {
          module.openDataStatusOverlay();
        });
        // Close mobile menu when opening overlay
        closeMobileMenu(container);
      }
    });
  });
}

/**
 * Update active category and page in navigation
 * @param {HTMLElement} container
 * @param {string} activeCategory
 * @param {string} activePage
 * @param {Function} onLeagueSelectorReady
 */
export function updateNavigation(container, activeCategory, activePage, onLeagueSelectorReady) {
  // Re-render navigation to update active state and URLs
  renderNavigation(container, activeCategory, activePage, onLeagueSelectorReady);
}



