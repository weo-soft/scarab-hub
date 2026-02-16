# Data Model: Temple Upgrade Display

**Feature**: Temple Upgrade Display  
**Date**: 2026-02-09

## Entities

### UpgradeCombination

Represents a single upgrade path: base unique + vial + Chronicle of Atzoatl = upgraded unique.

**Properties**:
- `baseUnique`: UniqueItem - The base unique item that can be upgraded
- `vial`: Vial - The vial required for the upgrade
- `temple`: TempleItem - The Chronicle of Atzoatl (always the same for all upgrades)
- `upgradedUnique`: UniqueItem - The resulting upgraded unique item

**Relationships**:
- References `UniqueItem` (base and upgraded)
- References `Vial`
- References `TempleItem`

**Validation Rules**:
- All four components must be present
- Base unique must have "Altar of Sacrifice" in flavourText
- Upgraded unique must not have "Altar of Sacrifice" in flavourText
- Base and upgraded unique must share same baseType or have related names

### UniqueItem

Represents a unique item from `uniques.json`.

**Properties** (from JSON):
- `name`: string - Item name
- `levelRequired`: number - Required character level
- `baseType`: string - Base item type (e.g., "Magistrate Crown")
- `itemClass`: number - Item class identifier
- `implicitModifiers`: Array<Modifier> - Implicit modifiers
- `explicitModifiers`: Array<Modifier> - Explicit modifiers
- `mutatedModifiers`: Array<Modifier> - Mutated modifiers (empty for base items)
- `flavourText`: string - Flavour text, may contain upgrade requirement
- `itemType`: string - Item category (e.g., "Helmet", "Shield")
- `detailsId`: string - Identifier for image lookup (e.g., "apeps-slumber-vaal-spirit-shield")

**Image Path**: `/assets/images/uniques/{detailsId-to-filename}.png`

**Relationships**:
- Can be base unique in `UpgradeCombination`
- Can be upgraded unique in `UpgradeCombination`

**State**:
- `isBaseUnique`: boolean - Has "Altar of Sacrifice" in flavourText
- `isUpgradedUnique`: boolean - Does not have "Altar of Sacrifice" in flavourText, matches upgraded pattern

### Vial

Represents a vial from `vials.json`.

**Properties** (from JSON):
- `name`: string - Vial name (e.g., "Vial of Awakening")
- `baseType`: string - Base type (same as name)
- `stackSize`: number - Stack size (always 10)
- `itemClass`: number - Item class identifier
- `implicitModifiers`: Array - Empty array
- `explicitModifiers`: Array - Empty array
- `mutatedModifiers`: Array - Empty array
- `flavourText`: string - Flavour text description
- `detailsId`: string - Identifier for image lookup (e.g., "vial-of-awakening")

**Image Path**: `/assets/images/vials/{detailsId}.png`

**Relationships**:
- Required component in `UpgradeCombination`

### TempleItem

Represents the Chronicle of Atzoatl (itemized temple).

**Properties**:
- `name`: string - "Chronicle of Atzoatl" (or "Altar of Sacrifice" as referenced in flavourText)
- `imagePath`: string - `/assets/images/Chronicle_of_Atzoatl.png`

**Relationships**:
- Required component in all `UpgradeCombination` instances

**Note**: This is a single, static item used for all upgrade combinations. The "Altar of Sacrifice" mentioned in unique item flavourText refers to a room within the temple, but the actual requirement is the Chronicle of Atzoatl item itself.

## Data Flow

1. **Load Data**:
   - Parse `uniques.json` → Array<UniqueItem>
   - Parse `vials.json` → Array<Vial>
   - Create single `TempleItem` instance

2. **Extract Combinations**:
   - Filter uniques with "Altar of Sacrifice" in flavourText → base uniques
   - Extract vial name from flavourText using regex
   - Match base unique to upgraded unique by:
     - Same baseType + related name pattern, OR
     - Known mapping (e.g., "Apep's Slumber" → "Apep's Supremacy")
   - Create `UpgradeCombination` instances

3. **Display**:
   - Render list of `UpgradeCombination` objects
   - For each combination, display:
     - Base unique image + name
     - Vial image + name
     - Temple image + name
     - Upgraded unique image + name
   - Attach tooltip handlers to each component

## Validation Rules

### UpgradeCombination Validation

- Base unique must exist and have valid `detailsId`
- Vial must exist and match extracted name from flavourText
- Upgraded unique must exist and match base unique's upgrade pattern
- All images must be resolvable (handle missing images gracefully)

### Image Resolution

- Unique images: Convert `detailsId` to kebab-case filename
  - Example: "apeps-slumber-vaal-spirit-shield" → "apeps-slumber.png"
- Vial images: Use `detailsId` directly
  - Example: "vial-of-awakening" → "vial-of-awakening.png"
- Temple image: Static path `/assets/images/Chronicle_of_Atzoatl.png`

## Known Upgrade Combinations

Based on analysis of `uniques.json`:

1. Vial of Awakening + Apep's Slumber = Apep's Supremacy
2. Vial of Consequence + Coward's Chains = Coward's Legacy
3. Vial of Dominance + Architect's Hand = Slavedriver's Hand
4. Vial of Fate + Story of the Vaal = Fate of the Vaal
5. Vial of Summoning + Mask of the Spirit Drinker = Mask of the Stitched Demon
6. Vial of the Ritual + Dance of the Offered = Omeyocan
7. Vial of Transcendence + Tempered Flesh = Transcendent Flesh
8. Vial of Transcendence + Tempered Spirit = Transcendent Spirit
9. Vial of Transcendence + Tempered Mind = Transcendent Mind
10. Vial of Sacrifice + Sacrificial Heart = Zerphi's Heart
11. Vial of the Ghost + Soul Catcher = Soul Ripper

All combinations require Chronicle of Atzoatl.
