# Implementation Plan: 3-to-1 Trade Simulation

**Branch**: `002-trade-simulation` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-trade-simulation/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Extend the existing Flipping Scarabs application to support large-scale 3-to-1 trade simulations with up to 1 million transactions. The feature enables users to configure simulation parameters (scarabs to use, breakeven point, number of trades), accurately simulate each individual transaction, track significant events (rare scarab returns, breakeven achievement), and visualize results in both Grid and List views with yield counts. Uses existing vanilla JavaScript architecture with performance optimizations for handling large-scale simulations efficiently.

**Technical Approach**: Extend existing simulation infrastructure to support transaction-by-transaction tracking, implement efficient data structures for 1 million transactions, add significant event detection, and integrate yield count visualization into existing Grid and List views. All technical decisions documented in research.md.

## Technical Context

**Language/Version**: JavaScript (ES6+), HTML5, CSS3  
**Primary Dependencies**: Vite (build tool and dev server), existing codebase from 001-flipping-scarabs  
**Storage**: LocalStorage (browser) for simulation results and configuration, in-memory for active simulation data  
**Testing**: Vitest (Vite-native testing), manual browser testing  
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)  
**Project Type**: Extension to existing single-page web application  
**Performance Goals**: 
- Simulation execution: Handle 1 million transactions efficiently (batch processing, progress updates)
- Transaction history navigation: <2s response time for pagination/search operations
- Memory management: Efficient storage of transaction data (streaming/chunked approach for large simulations)
- UI responsiveness: Non-blocking simulation execution with progress indication
**Constraints**: 
- Must work within existing architecture (no framework changes)
- Must handle 1 million transactions without browser crashes or excessive memory usage
- Must maintain existing Grid and List view functionality while adding yield counts
- Must integrate with existing simulation panel component
**Scale/Scope**: 
- Up to 1,000,000 transactions per simulation
- Transaction-by-transaction tracking and history
- Significant event detection and tracking
- Yield count visualization in Grid (150+ cells) and List views
- Multiple simulations per session (results persistence)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with constitution principles:

- **Code Quality**: ✅ Design follows established patterns and maintains readability
  - Extends existing module structure from 001-flipping-scarabs
  - Consistent naming conventions with existing codebase
  - Well-documented simulation logic and event tracking
- **Testing**: ✅ Testing strategy defined (unit, integration, contract, E2E as applicable)
  - Unit tests for simulation engine and event detection (80%+ coverage target)
  - Integration tests for transaction history and yield count visualization
  - Performance tests for large-scale simulations (1 million transactions)
  - Manual E2E testing for user scenarios
- **User Experience**: ✅ UX consistency maintained (if user-facing feature)
  - Consistent with existing simulation panel UI patterns
  - Progress indication for long-running simulations
  - Clear visualization of yield counts in existing views
  - Accessible navigation for transaction history
- **Performance**: ✅ Performance targets and constraints identified and measurable
  - Simulation execution with progress updates (non-blocking)
  - Transaction history navigation <2s response time
  - Memory-efficient storage for large simulations
  - UI remains responsive during simulation execution
- **Complexity**: ✅ Any deviations from simplicity justified (document in Complexity Tracking if needed)
  - Large-scale simulation complexity justified by requirement for up to 1 million transactions
  - Transaction-by-transaction tracking justified by requirement for detailed results
  - Event detection complexity justified by requirement for significant event tracking
  - Streaming/chunked data approach justified by memory constraints for 1 million transactions

## Project Structure

### Documentation (this feature)

```text
specs/002-trade-simulation/
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
├── js/
│   ├── models/
│   │   └── scarab.js    # Extend Simulation model, add SimulationTransaction, SignificantEvent
│   ├── services/
│   │   ├── calculationService.js  # Extend with transaction-by-transaction simulation
│   │   └── simulationService.js    # NEW: Core simulation engine with event tracking
│   ├── views/
│   │   ├── listView.js  # Extend to display yield counts
│   │   └── gridView.js  # Extend to display yield counts
│   ├── components/
│   │   ├── simulationPanel.js    # Extend with configuration UI and transaction history
│   │   └── transactionHistory.js # NEW: Transaction history viewer with pagination
│   └── utils/
│       └── simulationUtils.js    # NEW: Simulation helpers (rare scarab detection, etc.)
└── data/
    └── (existing scarab data files)

tests/
├── unit/
│   ├── models/
│   │   └── simulation.test.js    # NEW: Simulation model tests
│   └── services/
│       └── simulationService.test.js  # NEW: Simulation engine tests
├── integration/
│   ├── views/
│   │   ├── listView.test.js      # Extend: Yield count display tests
│   │   └── gridView.test.js      # Extend: Yield count display tests
│   └── components/
│       └── simulationPanel.test.js    # Extend: Configuration and history tests
└── performance/
    └── largeSimulation.test.js    # NEW: 1 million transaction performance tests
```

**Structure Decision**: Extend existing single-page web application structure. New simulation service handles core engine logic, transaction tracking, and event detection. Extend existing views and components to integrate yield counts and transaction history. Performance tests ensure large-scale simulations work efficiently.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - design extends existing architecture with justified complexity for:
- Large-scale simulation handling (1 million transactions) - required by specification
- Transaction-by-transaction tracking - required for detailed results and event detection
- Efficient memory management - required to handle large simulations without browser crashes
- Event detection system - required for significant event tracking feature

