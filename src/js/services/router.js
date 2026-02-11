/**
 * Router Service
 * Handles client-side routing using hash-based URLs
 */

const VALID_CATEGORIES = [
  'scarabs',
  'essences',
  'tattoos',
  'catalysts',
  'temple',
  'fossils',
  'oils',
  'delirium-orbs',
  'emblems'
];

const VALID_PAGES = ['flipping', 'simulation'];

/**
 * Parse current route from URL
 * @returns {{category: string|null, page: string|null}} Route object with category and page, or null for root
 */
export function parseRoute() {
  const hash = window.location.hash.slice(1); // Remove #
  const parts = hash.split('/').filter(Boolean);
  
  // Root route (empty hash or just #)
  if (parts.length === 0) {
    return { category: null, page: null };
  }
  
  let category = null;
  let page = 'flipping';
  
  // Parse category (first part)
  if (parts.length > 0 && VALID_CATEGORIES.includes(parts[0])) {
    category = parts[0];
  }
  
  // Parse page (second part, optional)
  if (parts.length > 1 && VALID_PAGES.includes(parts[1])) {
    page = parts[1];
  }
  
  return { category, page };
}

/**
 * Navigate to a route
 * @param {string} category - Category name
 * @param {string} page - Page name (optional, defaults to 'flipping')
 */
export function navigateTo(category, page = 'flipping') {
  if (!VALID_CATEGORIES.includes(category)) {
    console.warn(`Invalid category: ${category}`);
    return;
  }
  
  if (!VALID_PAGES.includes(page)) {
    console.warn(`Invalid page: ${page}`);
    return;
  }
  
  // Update URL hash
  window.location.hash = `/${category}${page !== 'flipping' ? `/${page}` : ''}`;
}

/**
 * Get URL for a category and page
 * @param {string} category - Category name
 * @param {string} page - Page name (optional, defaults to 'flipping')
 * @returns {string} URL hash
 */
export function getRouteUrl(category, page = 'flipping') {
  if (!VALID_CATEGORIES.includes(category)) {
    return '#/scarabs';
  }
  
  if (!VALID_PAGES.includes(page)) {
    return `#/${category}`;
  }
  
  return `#/${category}${page !== 'flipping' ? `/${page}` : ''}`;
}

/**
 * Initialize router and set up event listeners
 * @param {Function} onRouteChange - Callback when route changes: (category, page) => void
 */
export function initRouter(onRouteChange) {
  if (!onRouteChange || typeof onRouteChange !== 'function') {
    console.error('Router: onRouteChange callback is required');
    return;
  }
  
  // Set root route if no hash exists (don't auto-redirect to scarabs)
  if (!window.location.hash || window.location.hash === '#') {
    window.location.hash = '#';
  }
  
  // Handle initial route
  const initialRoute = parseRoute();
  onRouteChange(initialRoute.category, initialRoute.page);
  
  // Handle hash changes (back/forward buttons, direct navigation)
  window.addEventListener('hashchange', () => {
    const route = parseRoute();
    onRouteChange(route.category, route.page);
  });
}
