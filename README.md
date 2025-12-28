# Flipping Scarabs - Path of Exile Vendor Profitability Calculator

A single-page web application that helps Path of Exile players determine which Scarabs to vendor using the 3-to-1 recipe to maximize long-term profit.

## Features

- **Profitability Analysis**: View all Scarabs with clear visual indicators showing which ones are profitable to vendor
- **Economic Threshold**: See the calculated threshold value that separates profitable from unprofitable vendoring
- **Multiple Views**: Switch between List view (detailed comparison) and Grid view (in-game style stash layout)
- **Simulations**: Explore long-term outcomes with three strategies:
  - Optimized: Only vendor profitable Scarabs
  - User-Chosen: Select specific Scarabs to vendor
  - Random: Compare with random vendoring behavior
- **Currency Toggle**: Switch between Chaos Orbs and Divine Orbs
- **Offline Support**: Works offline after initial load

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Modern web browser (Chrome, Firefox, Safari, Edge - latest 2 versions)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

## Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Project Structure

```
src/
├── index.html           # Main HTML entry point
├── main.js              # Application entry point
├── styles/
│   └── main.css         # Global styles
├── js/
│   ├── models/         # Data models (Scarab, Threshold, Simulation)
│   ├── views/          # View components (List, Grid)
│   ├── services/       # Business logic (Data, Calculations)
│   ├── components/     # UI components (Threshold, Simulation, ViewSwitcher)
│   └── utils/          # Utilities (Canvas, Colors, Error Handling)
├── data/               # JSON data files
└── assets/             # Images and static assets

tests/
├── unit/               # Unit tests
├── integration/        # Integration tests
└── e2e/                # End-to-end tests
```

## How It Works

1. **Data Loading**: Loads Scarab details and market prices from JSON files
2. **Threshold Calculation**: Calculates expected value using weighted average of vendor outcomes
3. **Profitability Analysis**: Determines which Scarabs are profitable based on threshold
4. **Visual Display**: Shows results with color-coded indicators (green=profitable, red=not profitable, gray=unknown)
5. **Simulations**: Calculates expected profit/loss for different vendoring strategies

## Performance Targets

- Initial page load: <2s
- View switching: <100ms
- Calculations: <50ms
- Canvas rendering: 60fps

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## License

This project is part of the Scarab Hub application.

