/**
 * Toast Notification Utility
 * Displays temporary notification messages to the user
 */

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in milliseconds (default: 5000)
 */
export function showToast(message, type = 'info', duration = 5000) {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  
  // Add icon based on type
  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  };
  
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" aria-label="Close notification">×</button>
  `;

  // Add to container
  toastContainer.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Setup close button
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    removeToast(toast);
  });

  // Auto-remove after duration
  const timeoutId = setTimeout(() => {
    removeToast(toast);
  }, duration);

  // Store timeout ID on toast element for cleanup
  toast._timeoutId = timeoutId;
}

/**
 * Remove a toast notification
 * @param {HTMLElement} toast - Toast element to remove
 */
function removeToast(toast) {
  if (!toast) return;
  
  // Clear timeout if exists
  if (toast._timeoutId) {
    clearTimeout(toast._timeoutId);
  }
  
  // Remove with animation
  toast.classList.remove('show');
  toast.classList.add('hide');
  
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

/**
 * Show success toast
 * @param {string} message
 */
export function showSuccessToast(message) {
  showToast(message, 'success');
}

/**
 * Show error toast
 * @param {string} message
 */
export function showErrorToast(message) {
  showToast(message, 'error', 6000);
}

/**
 * Show warning toast
 * @param {string} message
 */
export function showWarningToast(message) {
  showToast(message, 'warning', 6000);
}

/**
 * Show info toast
 * @param {string} message
 */
export function showInfoToast(message) {
  showToast(message, 'info');
}

