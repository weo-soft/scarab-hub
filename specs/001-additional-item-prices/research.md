# Research: Additional Item Price Data

**Date**: 2025-01-27  
**Feature**: Additional Item Price Data  
**Phase**: 0 - Outline & Research

## Research Questions

### Q1: Price Data Structure and URL Format

**Question**: What is the structure of price data files and URL patterns for additional item types?

**Decision**: Price data structure and URL patterns are identical to Scarab prices.

**Rationale**: 
- User confirmed: "The Structure of the prices and the urls is the same as for the scarabs"
- Verified by examining existing fallback files in `public/data/`:
  - Files follow pattern: `{itemType}Prices_{leagueSlug}.json`
  - Data structure matches: `[{name, chaosValue, divineValue, detailsId}]`
  - Remote URL pattern: `https://data.poeatlas.app/{itemType}Prices_{leagueSlug}.json`
  - Local fallback pattern: `/data/{itemType}Prices_{leagueSlug}.json`

**Alternatives considered**: 
- Creating new data structure: Rejected - unnecessary complexity, breaks consistency
- Different caching strategy: Rejected - same update intervals needed for consistency

**Implementation Impact**: Can reuse existing `dataFetcher.js` and `leagueService.js` patterns with item-type-specific file name generation.

---

### Q2: Item Type Naming Conventions

**Question**: What are the exact file name patterns for each item type?

**Decision**: Use standardized naming based on existing fallback files:
- Catalysts: `catalystPrices_{league}.json`
- Delirium Orbs: `deliriumOrbPrices_{league}.json`
- Emblems: `emblemPrices_{league}.json`
- Essences: `essencePrices_{league}.json`
- Fossils: `fossilPrices_{league}.json`
- Lifeforce: `lifeforcePrices_{league}.json`
- Oils: `oilPrices_{league}.json`
- Tattoos: `tattooPrices_{league}.json`
- Temple Uniques: `templeUniquePrices_{league}.json`
- Vials: `vialPrices_{league}.json`

**Rationale**: 
- All fallback files already exist in `public/data/` with these exact names
- Naming follows consistent pattern: lowercase item type + "Prices" + league slug
- Multi-word types use camelCase (e.g., `deliriumOrb`, `templeUnique`)

**Alternatives considered**: 
- Different naming convention: Rejected - would break existing fallback files
- Case variations: Rejected - must match existing file names exactly

**Implementation Impact**: Create item type configuration mapping to generate correct file names.

---

### Q3: Loading Strategy - Sequential vs Parallel

**Question**: Should price data for multiple item types be loaded sequentially or in parallel?

**Decision**: Load all item type prices in parallel using `Promise.all()` with individual error handling.

**Rationale**:
- Performance: Parallel loading reduces total load time (critical for 5-second success criteria)
- Error isolation: Individual item type failures don't block others (meets FR-012 requirement)
- User experience: Faster initial load, partial data available immediately
- Existing pattern: Current codebase uses parallel patterns where possible

**Alternatives considered**:
- Sequential loading: Rejected - would violate 5-second load time requirement with 10+ files
- Batched parallel (groups of 3-4): Rejected - unnecessary complexity, full parallel is simpler

**Implementation Impact**: Use `Promise.allSettled()` to handle partial failures gracefully, log errors per item type.

---

### Q4: Price Update Service Extension

**Question**: How should the price update service handle multiple item types?

**Decision**: Extend `PriceUpdateService` to track and refresh all item types simultaneously using the same interval.

**Rationale**:
- Consistency: All prices should update together (meets SC-002 requirement)
- Simplicity: Single update interval maintains existing behavior
- Performance: Single check cycle more efficient than separate intervals
- User expectation: Prices refresh together, not staggered

**Alternatives considered**:
- Separate intervals per item type: Rejected - violates requirement for simultaneous updates
- Separate service instances: Rejected - unnecessary complexity, single service can handle multiple types

**Implementation Impact**: Modify `checkAndUpdatePrices()` to iterate over all item types, use `Promise.allSettled()` for parallel refresh.

---

### Q5: Data Storage and Caching

**Question**: How should price data for additional item types be cached and stored?

**Decision**: Use the same caching strategy as Scarabs - LocalStorage with cache keys per file name, 1-hour expiration.

**Rationale**:
- Consistency: Same caching behavior across all item types
- Existing infrastructure: `dataFetcher.js` already handles per-file caching
- Performance: LocalStorage access is fast, cache keys already include file names
- User expectation: All prices cached the same way

**Alternatives considered**:
- Separate cache expiration per item type: Rejected - violates requirement for same intervals
- IndexedDB for larger storage: Rejected - unnecessary, JSON files are small, LocalStorage sufficient

**Implementation Impact**: No changes needed - existing `dataFetcher.js` cache mechanism works for all file names.

---

### Q6: Error Handling Strategy

**Question**: How should the system handle failures when loading some but not all item types?

**Decision**: Implement graceful degradation - load available item types, log errors for failed ones, continue operation with partial data.

**Rationale**:
- User experience: Partial data is better than no data (meets FR-012, SC-003)
- Reliability: Network issues shouldn't break entire application
- Observability: Errors logged for debugging while user can still use available data
- Specification requirement: FR-012 explicitly requires handling missing data gracefully

**Alternatives considered**:
- Fail fast (all or nothing): Rejected - violates FR-012 and SC-003 requirements
- Retry failed items: Considered but deferred - adds complexity, can be added later if needed

**Implementation Impact**: Use `Promise.allSettled()` instead of `Promise.all()`, check results individually, log errors without throwing.

---

### Q7: League Service Extension

**Question**: Should `leagueService` be extended to generate item-type-specific file names?

**Decision**: Add helper functions to `leagueService.js` for generating item-type-specific price file names and paths.

**Rationale**:
- Separation of concerns: League service already handles file name generation for Scarabs
- Reusability: Same pattern needed for all item types
- Consistency: Centralized file name logic prevents duplication
- Maintainability: Single place to update if naming convention changes

**Alternatives considered**:
- Inline file name generation in dataService: Rejected - violates DRY principle, harder to maintain
- Separate itemTypeService: Rejected - unnecessary abstraction, leagueService already handles file names

**Implementation Impact**: Add `getPriceFileName(itemType)` and `getPriceFileLocalPath(itemType)` functions to `leagueService.js`.

---

## Technical Decisions Summary

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Same structure as Scarabs | User confirmation, existing files verify | Reuse existing patterns |
| Parallel loading | Performance requirement (5s load) | Use Promise.allSettled() |
| Single update interval | Consistency requirement | Extend existing service |
| Same caching strategy | Consistency, existing infrastructure | No changes needed |
| Graceful degradation | FR-012, SC-003 requirements | Individual error handling |
| League service extension | DRY, maintainability | Add helper functions |

## Unresolved Questions

None - all research questions resolved based on user input and codebase analysis.

## Next Steps

Proceed to Phase 1: Design & Contracts
- Create data model for multi-item-type price management
- Define service contracts for extended functionality
- Document quickstart guide for implementation
