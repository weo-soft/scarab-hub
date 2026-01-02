# Implementation Plan: Additional Item Price Data

**Branch**: `001-additional-item-prices` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-additional-item-prices/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Extend the existing price data loading and update system to support 10 additional item types (Catalysts, Delirium Orbs, Emblems, Essences, Fossils, Lifeforce, Oils, Tattoos, Temple Uniques, and Vials) using the same structure, naming conventions, and update intervals as Scarab prices. The implementation will reuse existing services (`dataService`, `priceUpdateService`, `leagueService`) and extend them to handle multiple item types simultaneously.

## Technical Context

**Language/Version**: JavaScript (ES6 modules)  
**Primary Dependencies**: Vite 5.0.0, Vitest 1.0.0  
**Storage**: LocalStorage (browser), JSON files in `/public/data`  
**Testing**: Vitest with jsdom environment  
**Target Platform**: Modern web browsers (ES6+ support)  
**Project Type**: Single-page web application  
**Performance Goals**: Load all 10 additional item type prices within 5 seconds of page load, refresh all prices simultaneously without performance degradation  
**Constraints**: Must maintain existing 1-hour cache expiration, support graceful degradation when some item types fail to load  
**Scale/Scope**: 10 additional item types × multiple leagues = ~10-30 price files to manage

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 (Initial)

Verify compliance with constitution principles:

- **Code Quality**: ✅ Design follows established patterns (reusing existing services), maintains readability through consistent naming and structure
- **Testing**: ✅ Testing strategy defined: unit tests for new service functions, integration tests for multi-item-type loading, existing tests remain valid
- **User Experience**: ✅ UX consistency maintained - no UI changes required, price data loading is transparent to users
- **Performance**: ✅ Performance targets identified: 5-second load time for all item types, simultaneous refresh without degradation, measurable via timing logs
- **Complexity**: ✅ Minimal complexity increase - extending existing patterns rather than creating new ones, justified by requirement to support multiple item types

### Post-Phase 1 (After Design)

Re-evaluation after completing design artifacts:

- **Code Quality**: ✅ Design artifacts (data-model.md, contracts, quickstart.md) demonstrate clear patterns, consistent with existing codebase structure
- **Testing**: ✅ Test strategy documented in quickstart.md with specific unit and integration test examples, covers error scenarios
- **User Experience**: ✅ No UX changes required - price loading is transparent, maintains existing user experience
- **Performance**: ✅ Performance contracts defined in data-contracts.md with specific timing requirements (5s load, <100ms cache hits, 10s timeouts)
- **Complexity**: ✅ Design maintains simplicity - reuses existing services, no new architectural patterns introduced, complexity justified by requirement

## Project Structure

### Documentation (this feature)

```text
specs/001-additional-item-prices/
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
│   ├── services/
│   │   ├── dataService.js          # Extend: Add multi-item-type loading
│   │   ├── priceUpdateService.js   # Extend: Add multi-item-type refresh
│   │   └── leagueService.js        # Extend: Add item-type-specific file name helpers
│   ├── utils/
│   │   └── dataFetcher.js          # Reuse: No changes needed
│   └── models/
│       └── scarab.js               # Reuse: No changes needed
└── main.js                         # Extend: Initialize additional item type prices

public/
└── data/
    ├── catalystPrices_Keepers.json         # ✅ Exists
    ├── deliriumOrbPrices_Keepers.json       # ✅ Exists
    ├── emblemPrices_Keepers.json           # ✅ Exists
    ├── essencePrices_Keepers.json          # ✅ Exists
    ├── fossilPrices_Keepers.json           # ✅ Exists
    ├── lifeforcePrices_Keepers.json        # ✅ Exists
    ├── oilPrices_Keepers.json              # ✅ Exists
    ├── tattooPrices_Keepers.json           # ✅ Exists
    ├── templeUniquePrices_Keepers.json     # ✅ Exists
    └── vialPrices_Keepers.json             # ✅ Exists

tests/
├── integration/
│   └── dataService.test.js         # Extend: Add multi-item-type tests
└── unit/
    └── services/
        └── priceUpdateService.test.js  # Extend: Add multi-item-type refresh tests
```

**Structure Decision**: Single-page web application structure maintained. Extensions to existing services rather than new modules. All fallback price files already exist in `public/data/`.

## Complexity Tracking

> **No violations - design follows existing patterns and extends rather than replaces**
