/**
 * Transaction History Component
 * Displays transaction-by-transaction history with pagination, search, and filtering
 */

import { SimulationTransaction } from '../models/scarab.js';

/**
 * Render transaction history
 * @param {HTMLElement} container - Container element
 * @param {Array<SimulationTransaction>} transactions - Array of transactions to display
 * @param {Object} pagination - Pagination info
 * @param {number} pagination.page - Current page
 * @param {number} pagination.pageSize - Transactions per page
 * @param {number} pagination.totalPages - Total pages
 * @param {boolean} pagination.hasNextPage - Has next page
 * @param {boolean} pagination.hasPreviousPage - Has previous page
 */
export function renderTransactionHistory(container, transactions, pagination) {
  if (!container) {
    console.error('Transaction history: missing container');
    return;
  }
  
  container.innerHTML = `
    <div class="transaction-history">
      <h3>Transaction History</h3>
      <div class="transaction-controls">
        <div class="search-controls">
          <input type="text" id="transaction-search" placeholder="Search by scarab name or ID..." />
          <input type="number" id="min-transaction" placeholder="Min #" min="1" />
          <input type="number" id="max-transaction" placeholder="Max #" min="1" />
          <button id="clear-filters">Clear Filters</button>
        </div>
        <div class="pagination-controls">
          <button id="prev-page" ${!pagination.hasPreviousPage ? 'disabled' : ''}>Previous</button>
          <span>Page ${pagination.page} of ${pagination.totalPages} (${pagination.totalTransactions.toLocaleString()} total)</span>
          <button id="next-page" ${!pagination.hasNextPage ? 'disabled' : ''}>Next</button>
        </div>
        <div class="page-size-selector">
          <label>Page Size:</label>
          <select id="page-size">
            <option value="100" ${pagination.pageSize === 100 ? 'selected' : ''}>100</option>
            <option value="500" ${pagination.pageSize === 500 ? 'selected' : ''}>500</option>
            <option value="1000" ${pagination.pageSize === 1000 ? 'selected' : ''}>1000</option>
          </select>
        </div>
      </div>
      <div class="transaction-list" id="transaction-list"></div>
    </div>
  `;
  
  // Render transaction list
  const listContainer = container.querySelector('#transaction-list');
  if (listContainer && transactions.length > 0) {
    listContainer.innerHTML = transactions.map(t => {
      // Use returnedScarabId (name lookup would require passing scarabs array)
      const scarabDisplay = t.returnedScarabId;
      return `
        <div class="transaction-item" data-transaction-number="${t.transactionNumber}" data-scarab-id="${t.returnedScarabId}">
          <span class="transaction-number">#${t.transactionNumber.toLocaleString()}</span>
          <span class="returned-scarab">${scarabDisplay}</span>
          <span class="profit-loss ${t.profitLoss >= 0 ? 'profit' : 'loss'}">
            ${t.profitLoss >= 0 ? '+' : ''}${t.profitLoss.toFixed(2)}c
          </span>
          <span class="cumulative">Cumulative: ${t.cumulativeProfitLoss >= 0 ? '+' : ''}${t.cumulativeProfitLoss.toFixed(2)}c</span>
        </div>
      `;
    }).join('');
  } else {
    listContainer.innerHTML = '<p>No transactions to display</p>';
  }
}

/**
 * Setup event listeners for transaction history
 * @param {HTMLElement} container - Container element
 * @param {Function} onPageChange - Callback for page changes (page: number, pageSize: number)
 * @param {Function} onTransactionClick - Callback for transaction clicks (transactionNumber: number)
 */
export function setupTransactionHistoryListeners(container, onPageChange, onTransactionClick) {
  if (!container) return;
  
  const prevButton = container.querySelector('#prev-page');
  const nextButton = container.querySelector('#next-page');
  const pageSizeSelect = container.querySelector('#page-size');
  
  if (prevButton) {
    prevButton.addEventListener('click', () => {
      const currentPage = parseInt(container.dataset.currentPage || '1');
      if (currentPage > 1 && onPageChange) {
        onPageChange(currentPage - 1, parseInt(pageSizeSelect?.value || '100'));
      }
    });
  }
  
  if (nextButton) {
    nextButton.addEventListener('click', () => {
      const currentPage = parseInt(container.dataset.currentPage || '1');
      const totalPages = parseInt(container.dataset.totalPages || '1');
      if (currentPage < totalPages && onPageChange) {
        onPageChange(currentPage + 1, parseInt(pageSizeSelect?.value || '100'));
      }
    });
  }
  
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener('change', (e) => {
      if (onPageChange) {
        onPageChange(1, parseInt(e.target.value));
      }
    });
  }
  
  // Transaction click handlers
  const transactionItems = container.querySelectorAll('.transaction-item');
  transactionItems.forEach(item => {
    item.addEventListener('click', () => {
      const transactionNumber = parseInt(item.dataset.transactionNumber);
      if (onTransactionClick) {
        onTransactionClick(transactionNumber);
      }
    });
  });
}

