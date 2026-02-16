# Research: Temple Upgrade Display

**Date**: 2026-02-09  
**Feature**: Temple Upgrade Display  
**Purpose**: Resolve technical unknowns and establish implementation approach

## Data Structure Analysis

### Upgrade Combination Extraction

**Decision**: Extract upgrade combinations from `uniques.json` flavourText field.

**Rationale**: 
- Base unique items contain flavourText with pattern: `"This item can be transformed on the Altar of Sacrifice along with Vial of [Name]"`
- Upgraded unique items do not contain this pattern in their flavourText
- This pattern reliably identifies base uniques and their required vials

**Alternatives Considered**:
- Separate mapping file: Rejected - would require manual maintenance and duplication
- API endpoint: Rejected - data is static and available in JSON files
- Database: Rejected - overkill for static game data

**Implementation Approach**:
1. Parse `uniques.json` to find items with "Altar of Sacrifice" in flavourText
2. Extract vial name from flavourText using regex pattern
3. Match base unique to upgraded unique by:
   - Same baseType (e.g., "Vaal Spirit Shield")
   - Related names (e.g., "Apep's Slumber" → "Apep's Supremacy")
   - Item type consistency

### Temple Room Identification

**Decision**: Use Chronicle of Atzoatl (the itemized temple) as the required temple component for all upgrades. Display the single Chronicle_of_Atzoatl.png image for all combinations.

**Rationale**:
- All upgrade flavourText mentions "Altar of Sacrifice" which is a room within the Incursion Temple
- The Chronicle of Atzoatl is the itemized temple that contains rooms
- All upgrades require the same temple item (Chronicle of Atzoatl)
- Single image asset exists: `/assets/images/Chronicle_of_Atzoatl.png`

**Alternatives Considered**:
- Multiple temple rooms per upgrade: Rejected - flavourText consistently mentions only "Altar of Sacrifice" as the room, but all require Chronicle of Atzoatl
- Dynamic temple room selection: Rejected - no evidence of multiple valid temple items

**Implementation Approach**:
1. Use Chronicle of Atzoatl as the temple component for all upgrade combinations
2. Display Chronicle_of_Atzoatl.png image (single image for all combinations)
3. Note: "Altar of Sacrifice" is the room name mentioned in flavourText, but the actual requirement is the Chronicle of Atzoatl item

### Image Path Resolution

**Decision**: Use consistent naming convention based on `detailsId` field.

**Rationale**:
- Unique items: `detailsId` maps to image filename (e.g., "apeps-slumber-vaal-spirit-shield" → "apeps-slumber.png")
- Vials: `detailsId` maps to image filename (e.g., "vial-of-awakening" → "vial-of-awakening.png")
- Temple: Single image at `/assets/images/Chronicle_of_Atzoatl.png`

**Alternatives Considered**:
- Direct name-to-filename mapping: Rejected - inconsistent naming conventions
- Image API lookup: Rejected - images are static assets

**Implementation Approach**:
1. For uniques: Convert `detailsId` to kebab-case filename (already in correct format)
2. For vials: Use `detailsId` directly as filename
3. For temple: Use static path `/assets/images/Chronicle_of_Atzoatl.png`
4. Handle missing images with fallback (hide image or show placeholder)

### View Integration

**Decision**: Create new `renderTempleUpgradeUI()` function following existing pattern (similar to `renderFossilUI()`, `renderEssenceUI()`).

**Rationale**:
- Application already has "temple" category in navigation
- Existing pattern: each category has dedicated render function
- Consistent with codebase architecture

**Alternatives Considered**:
- Modify existing temple view: Rejected - no existing temple view implementation found
- Generic item renderer: Rejected - upgrade combinations require specialized display

**Implementation Approach**:
1. Add `renderTempleUpgradeUI()` function in `main.js`
2. Handle "temple" category in `handleCategoryChange()` function
3. Create dedicated list view component for upgrade combinations
4. Reuse existing tooltip infrastructure

### Tooltip Implementation

**Decision**: Extend existing tooltip system (`src/js/utils/tooltip.js`) with new functions for unique items, vials, and temple rooms.

**Rationale**:
- Tooltip system already exists and is extensible
- Pattern established: `showCatalystTooltip()`, `showFossilTooltip()`, etc.
- Consistent UX across item types

**Alternatives Considered**:
- New tooltip system: Rejected - unnecessary duplication
- Inline tooltips: Rejected - inconsistent with existing patterns

**Implementation Approach**:
1. Create `showUniqueTooltip()`, `showVialTooltip()`, `showTempleRoomTooltip()` functions
2. Build HTML content functions: `buildUniqueTooltipContent()`, `buildVialTooltipContent()`, `buildTempleRoomTooltipContent()`
3. Display relevant properties: modifiers, level requirement, flavour text, etc.

## Upgrade Combination Mapping

Based on analysis of `uniques.json`, the following combinations are identified:

1. **Vial of Awakening** + **Apep's Slumber** = **Apep's Supremacy**
2. **Vial of Consequence** + **Coward's Chains** = **Coward's Legacy**
3. **Vial of Dominance** + **Architect's Hand** = **Slavedriver's Hand**
4. **Vial of Fate** + **Story of the Vaal** = **Fate of the Vaal**
5. **Vial of Summoning** + **Mask of the Spirit Drinker** = **Mask of the Stitched Demon**
6. **Vial of the Ritual** + **Dance of the Offered** = **Omeyocan**
7. **Vial of Transcendence** + **Tempered Flesh** = **Transcendent Flesh**
8. **Vial of Transcendence** + **Tempered Spirit** = **Transcendent Spirit**
9. **Vial of Transcendence** + **Tempered Mind** = **Transcendent Mind**
10. **Vial of Sacrifice** + **Sacrificial Heart** = **Zerphi's Heart**
11. **Vial of the Ghost** + **Soul Catcher** = **Soul Ripper**

**Note**: All combinations require **Altar of Sacrifice** temple room (Chronicle of Atzoatl).

## Performance Considerations

**Decision**: Load and parse JSON files once on category selection, cache parsed combinations.

**Rationale**:
- JSON files are static and relatively small
- Parsing overhead is minimal for ~760 unique items
- Caching prevents redundant parsing

**Alternatives Considered**:
- Lazy loading: Rejected - data is needed immediately for display
- Web Workers: Rejected - parsing overhead doesn't justify complexity

## Error Handling

**Decision**: Gracefully handle missing data with fallbacks:
- Missing images: Hide image element or show placeholder
- Missing tooltip data: Show available information, indicate missing data
- Missing upgrade combinations: Skip invalid entries, log warnings

**Rationale**:
- User experience should not break on data inconsistencies
- Logging helps identify data quality issues
- Progressive enhancement approach
