# Implementation Plan: Temple Upgrade Display

**Branch**: `003-temple-upgrade-display` | **Date**: 2026-02-09 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/003-temple-upgrade-display/spec.md`

## Summary

Display unique item upgrade combinations in the Temple view, showing base unique + vial + Chronicle of Atzoatl = upgraded unique. Each component displays with image and name, with tooltips on hover showing detailed item information. Data is loaded from existing JSON files (`uniques.json`, `vials.json`, `incursionTemples.json`) and images from asset directories.

## Technical Context

**Language/Version**: JavaScript (ES6+), HTML5, CSS3  
**Primary Dependencies**: Vanilla JavaScript (no external frameworks), Canvas API for grid views (if needed)  
**Storage**: Static JSON files in `/public/data/items/`, images in `/public/assets/images/`  
**Testing**: Manual testing, browser DevTools for debugging  
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge)  
**Project Type**: Single-page web application  
**Performance Goals**: Page load < 2 seconds, tooltip display < 500ms  
**Constraints**: Must reuse existing tooltip infrastructure, follow existing view patterns  
**Scale/Scope**: ~11 upgrade combinations, ~760 unique items, ~8 vials, 1 temple item

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with constitution principles:

- **Code Quality**: ✅ Design follows established patterns (`renderFossilUI`, `renderEssenceUI`), maintains readability, reuses existing tooltip system
- **Testing**: ✅ Manual testing strategy defined (verify combinations display, tooltips work, images load), follows existing testing approach (no unit tests in codebase)
- **User Experience**: ✅ UX consistency maintained (follows existing list/grid view patterns, reuses tooltip system, consistent with other item type views)
- **Performance**: ✅ Performance targets identified: page load < 2s (SC-001), tooltip < 500ms (SC-003), measurable via browser DevTools
- **Complexity**: ✅ No deviations from simplicity - straightforward data parsing and display, reuses existing infrastructure

## Project Structure

### Documentation (this feature)

```text
specs/003-temple-upgrade-display/
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
├── main.js                    # Add renderTempleUpgradeUI() function
├── js/
│   ├── services/
│   │   └── dataService.js     # Add loadTempleUpgradeData() function
│   ├── views/
│   │   └── templeUpgradeListView.js  # New: List view for upgrade combinations
│   └── utils/
│       └── tooltip.js         # Extend with unique/vial/temple tooltip functions
└── styles/
    └── main.css               # Add styles for temple upgrade view

public/
├── data/
│   └── items/
│       ├── uniques.json       # Source: base and upgraded unique items
│       ├── vials.json          # Source: vial items
│       └── incursionTemples.json  # Source: temple rooms (reference)
└── assets/
    └── images/
        ├── Chronicle_of_Atzoatl.png  # Temple image (single)
        ├── uniques/            # Unique item images
        └── vials/              # Vial images
```

**Structure Decision**: Single-page web application structure. New view component follows existing pattern (similar to `essenceListView.js`, `fossilListView.js`). Data loading service extends existing `dataService.js`. Tooltip utilities extend existing `tooltip.js`.

## Complexity Tracking

> **No violations** - Design follows existing patterns and reuses infrastructure.

## Phase 0: Research Complete

See [research.md](./research.md) for detailed findings:
- Upgrade combination extraction from `uniques.json` flavourText
- Image path resolution using `detailsId` field
- View integration following existing patterns
- Tooltip extension approach
- 11 identified upgrade combinations

## Phase 1: Design & Contracts

### Data Model

See [data-model.md](./data-model.md) for entity definitions:
- `UpgradeCombination`: Base unique + vial + temple + upgraded unique
- `UniqueItem`: Properties from `uniques.json`
- `Vial`: Properties from `vials.json`
- `TempleItem`: Chronicle of Atzoatl representation

### API Contracts

See [contracts/data-contracts.md](./contracts/data-contracts.md) for:
- Data loading functions
- View rendering functions
- Tooltip display functions

### Quick Start

See [quickstart.md](./quickstart.md) for implementation steps and code examples.
