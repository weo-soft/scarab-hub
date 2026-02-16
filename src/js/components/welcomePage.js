/**
 * Welcome Page Component
 * Displays a welcome message and overview of the application
 */

/**
 * Render welcome page
 * @param {HTMLElement} container - Container element
 */
export function renderWelcomePage(container) {
  if (!container) {
    console.error('WelcomePage: missing container');
    return;
  }

  container.innerHTML = `
    <div class="welcome-page">
      <div class="welcome-header">
        <h1>Welcome to Scarab Hub</h1>
        <p class="welcome-subtitle">Path of Exile Vendor Profitability Calculator</p>
      </div>
      
      <div class="welcome-content">
        <section class="welcome-section">
          <h2>About This Tool</h2>
          <p>
            Scarab Hub helps you maximize your profits in Path of Exile by analyzing vendor recipe profitability 
            across multiple item categories. Whether you're flipping Scarabs, rerolling Essences, or evaluating 
            other vendor recipes, this tool provides real-time price data and profitability calculations to guide 
            your trading decisions.
          </p>
        </section>

        <section class="welcome-section">
          <h2>Features</h2>
          <ul class="welcome-features">
            <li>
              <strong>Real-time Price Data:</strong> Automatically fetches current market prices from the Path of Exile trade API
            </li>
            <li>
              <strong>Profitability Analysis:</strong> Calculates whether vendor recipes are profitable based on current market conditions
            </li>
            <li>
              <strong>Visual Grid View:</strong> See items organized in an intuitive grid layout matching their in-game appearance
            </li>
            <li>
              <strong>Detailed List View:</strong> Sort and filter items by profitability, price, and other metrics
            </li>
            <li>
              <strong>Vendor Simulation:</strong> Test different combinations and see expected outcomes before committing
            </li>
            <li>
              <strong>Multiple Categories:</strong> Support for Scarabs, Essences, Tattoos, Catalysts, Temple upgrades, Fossils, Oils, Delirium Orbs, and Emblems
            </li>
          </ul>
        </section>
      </div>
    </div>
  `;
}
