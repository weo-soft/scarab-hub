# Implementation Plan: Flipping Scarabs Page

**Branch**: `001-flipping-scarabs` | **Date**: 2025-12-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-flipping-scarabs/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a single-page web application that helps Path of Exile players determine which Scarabs to vendor using the 3-to-1 recipe to maximize long-term profit. The application calculates expected value thresholds based on Scarab market prices and vendor probability weights, displays profitability indicators, and provides both list and grid views. Uses Vite for fast development setup, vanilla JavaScript for minimal dependencies, LocalStorage for data persistence, and HTML5 Canvas for the in-game style grid visualization.

**Technical Approach**: Vanilla JavaScript with Vite build tool, HTML5 Canvas for grid visualization, LocalStorage for persistence. Expected value calculated using weighted average of vendor outcomes. All technical decisions documented in research.md.

## Technical Context

**Language/Version**: JavaScript (ES6+), HTML5, CSS3  
**Primary Dependencies**: Vite (build tool and dev server), minimal external libraries  
**Storage**: LocalStorage (browser) for user preferences and cached market data  
**Testing**: Vitest (Vite-native testing), manual browser testing  
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)  
**Project Type**: Single-page web application  
**Performance Goals**: 
- Initial page load <2s (constitution requirement)
- View switching <100ms perceived latency
- Expected value calculations <50ms
- Canvas rendering at 60fps during interactions
**Constraints**: 
- Must work offline after initial load (static assets)
- Minimal bundle size (<500KB total)
- No backend dependencies (client-side only)
- Must handle ~150 Scarab items efficiently
**Scale/Scope**: 
- Single page application
- ~150 Scarab items to display
- 2 view modes (List, Grid)
- 3 simulation strategies
- Target: 1000+ concurrent users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with constitution principles:

- **Code Quality**: ✅ Design follows established patterns and maintains readability
  - Vanilla JavaScript with clear module structure
  - Consistent naming conventions
  - Well-documented calculation logic
- **Testing**: ✅ Testing strategy defined (unit, integration, contract, E2E as applicable)
  - Unit tests for expected value calculations (80%+ coverage target)
  - Integration tests for view switching and data flow
  - Manual E2E testing for user scenarios
- **User Experience**: ✅ UX consistency maintained (if user-facing feature)
  - Consistent visual indicators across views
  - Accessible color coding and labels
  - Clear threshold display
- **Performance**: ✅ Performance targets and constraints identified and measurable
  - Initial render <2s (constitution requirement)
  - Interactions <100ms perceived latency
  - Canvas rendering optimized for 60fps
- **Complexity**: ✅ Any deviations from simplicity justified (document in Complexity Tracking if needed)
  - Canvas-based grid view justified by requirement to mirror in-game appearance
  - Expected value calculation complexity justified by business logic requirements

## Project Structure

### Documentation (this feature)

```text
specs/001-flipping-scarabs/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── index.html           # Main HTML entry point
├── main.js              # Application entry point
├── styles/
│   └── main.css         # Global styles
├── js/
│   ├── models/
│   │   └── scarab.js    # Scarab data model and expected value calculations
│   ├── views/
│   │   ├── listView.js  # List view implementation
│   │   └── gridView.js  # Canvas-based grid view implementation
│   ├── services/
│   │   ├── dataService.js    # Data loading and LocalStorage management
│   │   └── calculationService.js  # Expected value and threshold calculations
│   ├── components/
│   │   ├── thresholdDisplay.js    # Threshold value display component
│   │   ├── simulationPanel.js    # Simulation controls and results
│   │   └── viewSwitcher.js       # View mode toggle
│   └── utils/
│       ├── canvasUtils.js        # Canvas drawing utilities
│       └── colorUtils.js         # Color coding for profitability
├── data/
│   ├── scarabDetails.json        # Scarab metadata (weights, descriptions)
│   └── scarabPrices_Keepers.json # Market prices (chaos/divine values)
└── assets/
    └── scarab-grid-image.png     # Base image for grid view canvas

tests/
├── unit/
│   ├── models/
│   │   └── scarab.test.js        # Scarab model and calculation tests
│   └── services/
│       └── calculationService.test.js
├── integration/
│   ├── views/
│   │   ├── listView.test.js      # List view integration tests
│   │   └── gridView.test.js      # Grid view integration tests
│   └── dataService.test.js       # Data loading and storage tests
└── e2e/
    └── user-scenarios.test.js    # Manual test scenarios
```

**Structure Decision**: Single-page web application structure. All code in `src/` with clear separation of concerns: models for data structures, views for UI rendering, services for business logic, components for reusable UI elements, and utils for shared functionality. Tests mirror source structure for easy navigation.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - design follows simplicity principles with justified complexity for canvas-based grid view and expected value calculations.
