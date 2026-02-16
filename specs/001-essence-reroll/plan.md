# Implementation Plan: Essence Rerolling

**Branch**: `001-essence-reroll` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-essence-reroll/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build an Essence rerolling feature that helps Path of Exile players determine which Essences are profitable to reroll using Primal Crystallised Lifeforce. The feature calculates expected value thresholds based on Essence market prices with equal weighting within reroll groups, displays profitability indicators, and provides a list view similar to the Scarabs feature. Uses the existing Vite-based architecture, vanilla JavaScript, and follows the same data loading patterns as the Scarab feature. Expected value calculated using equal-weighted probabilities within reroll groups (Deafening, Shrieking, Special group) accounting for the cost of 30 Primal Crystallised Lifeforce.

**Technical Approach**: Extend existing Scarab infrastructure with Essence-specific models, services, and views. Reuse calculation patterns but adapt for equal weighting and reroll group logic. All technical decisions documented in research.md.

## Technical Context

**Language/Version**: JavaScript (ES6+), HTML5, CSS3  
**Primary Dependencies**: Vite (build tool and dev server), existing codebase infrastructure  
**Storage**: LocalStorage (browser) for user preferences and cached market data, same as Scarab feature  
**Testing**: Vitest (Vite-native testing), manual browser testing  
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)  
**Project Type**: Single-page web application (extension of existing Scarab feature)  
**Performance Goals**: 
- Initial page load <2s (constitution requirement)
- List view rendering <100ms perceived latency
- Expected value calculations <50ms
- Essence selection/deselection <50ms
**Constraints**: 
- Must work offline after initial load (static assets)
- Minimal bundle size impact (<100KB additional)
- No backend dependencies (client-side only)
- Must handle ~400 Essence items efficiently
- Must integrate seamlessly with existing Scarab feature
**Scale/Scope**: 
- Extension of existing single page application
- ~400 Essence items to display
- 1 view mode (List view, similar to Scarabs)
- Reroll group logic (Deafening, Shrieking, Special group)
- Target: 1000+ concurrent users (shared with Scarab feature)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with constitution principles:

- **Code Quality**: ✅ Design follows established patterns and maintains readability
  - Reuses existing Scarab model/service patterns
  - Consistent naming conventions with existing codebase
  - Well-documented reroll group logic and calculation methods
- **Testing**: ✅ Testing strategy defined (unit, integration, contract, E2E as applicable)
  - Unit tests for expected value calculations with equal weighting (80%+ coverage target)
  - Unit tests for reroll group classification logic
  - Integration tests for list view and selection functionality
  - Manual E2E testing for user scenarios
- **User Experience**: ✅ UX consistency maintained (if user-facing feature)
  - Consistent visual indicators with Scarab feature
  - Same list view styling and interaction patterns
  - Accessible color coding and labels
  - Clear threshold and cost display
- **Performance**: ✅ Performance targets and constraints identified and measurable
  - Initial render <2s (constitution requirement)
  - List interactions <100ms perceived latency
  - Calculations <50ms
  - Efficient reroll group lookups
- **Complexity**: ✅ Any deviations from simplicity justified (document in Complexity Tracking if needed)
  - Reroll group logic complexity justified by game mechanics requirements
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
├── index.html           # Main HTML entry point (shared with Scarab feature)
├── main.js              # Application entry point (extend for Essence support)
├── styles/
│   └── main.css         # Global styles (extend for Essence list view)
├── js/
│   ├── models/
│   │   ├── scarab.js    # Existing Scarab model
│   │   └── essence.js   # NEW: Essence data model and reroll group logic
│   ├── views/
│   │   ├── listView.js  # Existing list view (extend for Essence support)
│   │   └── essenceListView.js  # NEW: Essence-specific list view
│   ├── services/
│   │   ├── dataService.js    # Existing data service (extend for Essence loading)
│   │   ├── calculationService.js  # Existing calculation service (extend for Essence threshold)
│   │   └── essenceCalculationService.js  # NEW: Essence-specific calculations
│   ├── components/
│   │   ├── thresholdDisplay.js    # Existing threshold display (reuse)
│   │   ├── essenceSelectionPanel.js  # NEW: Essence selection controls
│   │   └── viewSwitcher.js       # Existing view switcher (extend if needed)
│   └── utils/
│       ├── colorUtils.js         # Existing color utilities (reuse)
│       └── essenceGroupUtils.js  # NEW: Reroll group classification utilities
├── data/
│   ├── scarabDetails.json        # Existing Scarab metadata
│   ├── scarabPrices_Keepers.json # Existing Scarab prices
│   └── essencePrices_Keepers.json # Existing Essence prices (already in public/data/)
└── assets/
    └── [existing assets]

tests/
├── unit/
│   ├── models/
│   │   ├── scarab.test.js        # Existing tests
│   │   └── essence.test.js       # NEW: Essence model and reroll group tests
│   └── services/
│       ├── calculationService.test.js  # Existing tests
│       └── essenceCalculationService.test.js  # NEW: Essence calculation tests
├── integration/
│   ├── views/
│   │   ├── listView.test.js      # Existing tests
│   │   └── essenceListView.test.js  # NEW: Essence list view tests
│   └── dataService.test.js       # Extend existing tests for Essence loading
└── e2e/
    └── user-scenarios.test.js    # Extend existing scenarios for Essence rerolling
```

**Structure Decision**: Extension of existing single-page web application structure. New Essence-specific files follow the same patterns as Scarab implementation. Code organized in `src/js/` with clear separation: models for data structures, views for UI rendering, services for business logic, components for reusable UI elements, and utils for shared functionality. Tests mirror source structure for easy navigation. Reuses existing infrastructure where possible to minimize complexity.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - design follows simplicity principles with justified complexity for reroll group logic and equal-weighted calculations. Reuses existing infrastructure to minimize overall complexity.
