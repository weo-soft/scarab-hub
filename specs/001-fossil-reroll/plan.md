# Implementation Plan: Fossil Rerolling

**Branch**: `001-fossil-reroll` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-fossil-reroll/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a Fossil rerolling feature that helps Path of Exile players determine which Fossils are profitable to reroll using Wild Crystallised Lifeforce. The feature calculates expected value thresholds based on Fossil market prices with equal weighting for all Fossils (single reroll group), displays profitability indicators, and provides a list view similar to the Essence rerolling feature. Uses the existing Vite-based architecture, vanilla JavaScript, and follows the same data loading patterns as the Essence feature. Expected value calculated using equal-weighted probabilities for all Fossils accounting for the cost of 30 Wild Crystallised Lifeforce.

**Technical Approach**: Extend existing Essence infrastructure with Fossil-specific models, services, and views. Reuse calculation patterns but adapt for single reroll group (all Fossils can reroll into each other). All technical decisions documented in research.md.

## Technical Context

**Language/Version**: JavaScript (ES6+), HTML5, CSS3  
**Primary Dependencies**: Vite (build tool and dev server), existing codebase infrastructure  
**Storage**: LocalStorage (browser) for user preferences and cached market data, same as Essence feature  
**Testing**: Vitest (Vite-native testing), manual browser testing  
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)  
**Project Type**: Single-page web application (extension of existing Essence feature)  
**Performance Goals**: 
- Initial page load <2s (constitution requirement)
- List view rendering <100ms perceived latency
- Expected value calculations <50ms
- Fossil selection/deselection <50ms
**Constraints**: 
- Must work offline after initial load (static assets)
- Minimal bundle size impact (<100KB additional)
- No backend dependencies (client-side only)
- Must handle ~23 Fossil items efficiently
- Must integrate seamlessly with existing Essence feature
**Scale/Scope**: 
- Extension of existing single page application
- ~23 Fossil items to display
- 1 view mode (List view, similar to Essences)
- Single reroll group (all Fossils can reroll into each other)
- Target: 1000+ concurrent users (shared with Essence feature)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with constitution principles:

- **Code Quality**: ✅ Design follows established patterns and maintains readability
  - Reuses existing Essence model/service patterns
  - Consistent naming conventions with existing codebase
  - Well-documented reroll group logic and calculation methods
- **Testing**: ✅ Testing strategy defined (unit, integration, contract, E2E as applicable)
  - Unit tests for expected value calculations with equal weighting (80%+ coverage target)
  - Unit tests for Fossil model and validation logic
  - Integration tests for list view and selection functionality
  - Manual E2E testing for user scenarios
- **User Experience**: ✅ UX consistency maintained (if user-facing feature)
  - Consistent visual indicators with Essence feature
  - Same list view styling and interaction patterns
  - Accessible color coding and labels
  - Clear threshold and cost display
- **Performance**: ✅ Performance targets and constraints identified and measurable
  - Initial render <2s (constitution requirement)
  - List interactions <100ms perceived latency
  - Calculations <50ms
  - Efficient single reroll group handling
- **Complexity**: ✅ Any deviations from simplicity justified (document in Complexity Tracking if needed)
  - Single reroll group simpler than Essence's multiple groups
  - Equal weighting calculation simpler than Scarab weighted approach
  - Reusing existing infrastructure reduces overall complexity

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
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
├── index.html           # Main HTML entry point (shared with Essence feature)
├── main.js              # Application entry point (extend for Fossil support)
├── styles/
│   └── main.css         # Global styles (extend for Fossil list view)
├── js/
│   ├── models/
│   │   ├── scarab.js    # Existing Scarab model
│   │   ├── essence.js   # Existing Essence model
│   │   └── fossil.js    # NEW: Fossil data model
│   ├── views/
│   │   ├── listView.js  # Existing list view (extend for Fossil support)
│   │   ├── essenceListView.js  # Existing Essence list view
│   │   └── fossilListView.js   # NEW: Fossil-specific list view
│   ├── services/
│   │   ├── dataService.js    # Existing data service (extend for Fossil loading)
│   │   ├── calculationService.js  # Existing calculation service
│   │   ├── essenceCalculationService.js  # Existing Essence calculations
│   │   └── fossilCalculationService.js  # NEW: Fossil-specific calculations
│   ├── components/
│   │   ├── thresholdDisplay.js    # Existing threshold display (reuse)
│   │   ├── essenceSelectionPanel.js  # Existing Essence selection (reuse pattern)
│   │   ├── fossilSelectionPanel.js  # NEW: Fossil selection controls
│   │   └── viewSwitcher.js       # Existing view switcher (extend if needed)
│   └── utils/
│       ├── colorUtils.js         # Existing color utilities (reuse)
│       └── fossilGroupUtils.js  # NEW: Reroll group utilities (simpler than Essence)
├── data/
│   ├── scarabDetails.json        # Existing Scarab metadata
│   ├── scarabPrices_Keepers.json # Existing Scarab prices
│   ├── essencePrices_Keepers.json # Existing Essence prices
│   └── fossilPrices_Keepers.json  # Existing Fossil prices (already in public/data/)
└── assets/
    └── [existing assets]

tests/
├── unit/
│   ├── models/
│   │   ├── scarab.test.js        # Existing tests
│   │   ├── essence.test.js       # Existing tests
│   │   └── fossil.test.js        # NEW: Fossil model tests
│   └── services/
│       ├── calculationService.test.js  # Existing tests
│       ├── essenceCalculationService.test.js  # Existing tests
│       └── fossilCalculationService.test.js  # NEW: Fossil calculation tests
├── integration/
│   ├── views/
│   │   ├── listView.test.js      # Existing tests
│   │   ├── essenceListView.test.js  # Existing tests
│   │   └── fossilListView.test.js  # NEW: Fossil list view tests
│   └── dataService.test.js       # Extend existing tests for Fossil loading
└── e2e/
    └── user-scenarios.test.js    # Extend existing scenarios for Fossil rerolling
```

**Structure Decision**: Extension of existing single-page web application structure. New Fossil-specific files follow the same patterns as Essence implementation. Code organized in `src/js/` with clear separation: models for data structures, views for UI rendering, services for business logic, components for reusable UI elements, and utils for shared functionality. Tests mirror source structure for easy navigation. Reuses existing infrastructure where possible to minimize complexity. Single reroll group simplifies implementation compared to Essence's multiple groups.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - design follows simplicity principles with justified complexity for reroll group logic and equal-weighted calculations. Single reroll group (all Fossils) is simpler than Essence's multiple groups. Reuses existing infrastructure to minimize overall complexity.
