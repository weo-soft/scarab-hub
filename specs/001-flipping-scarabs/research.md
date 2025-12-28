# Research: Flipping Scarabs Page

**Date**: 2025-12-27  
**Feature**: Flipping Scarabs Page  
**Phase**: 0 - Outline & Research

## Technical Decisions

### Build Tool: Vite

**Decision**: Use Vite as the build tool and development server.

**Rationale**: 
- Fast HMR (Hot Module Replacement) for rapid development
- Minimal configuration required
- Native ES module support
- Optimized production builds
- Built-in dev server with fast refresh

**Alternatives considered**:
- Webpack: More complex configuration, slower HMR
- Parcel: Less control over build process
- Create React App / Next.js: Overkill for vanilla JS project, adds unnecessary dependencies

### Framework: Vanilla JavaScript

**Decision**: Use vanilla JavaScript (ES6+) without frameworks like React, Vue, or Angular.

**Rationale**:
- Minimal dependencies as specified
- Small bundle size
- Direct DOM manipulation sufficient for single-page app
- No framework learning curve
- Full control over rendering performance

**Alternatives considered**:
- React: Adds significant bundle size, unnecessary for simple page
- Vue: Lighter than React but still adds overhead
- Svelte: Good option but adds build complexity

### Data Storage: LocalStorage

**Decision**: Use browser LocalStorage for persisting user preferences and cached market data.

**Rationale**:
- No backend required (client-side only)
- Persistent across sessions
- Simple API
- Sufficient for user preferences and cached price data
- Works offline

**Alternatives considered**:
- IndexedDB: More complex, overkill for simple key-value storage
- SessionStorage: Doesn't persist across sessions
- Backend database: Adds infrastructure complexity, not needed for this use case

### Grid View: HTML5 Canvas

**Decision**: Use HTML5 Canvas for the grid view that mirrors in-game stash appearance.

**Rationale**:
- Required to display provided base image
- Precise control over cell highlighting
- Can overlay profitability indicators on existing image
- Good performance for static/interactive grid
- Native browser support

**Alternatives considered**:
- SVG: More complex for grid layout, harder to overlay on image
- CSS Grid with background images: Less precise control over highlighting
- WebGL: Overkill for 2D grid display

### Expected Value Calculation

**Decision**: Calculate expected value using weighted average of possible vendor outcomes.

**Rationale**:
- Each Scarab has a `dropWeight` that determines probability in 3-to-1 recipe
- Expected value = Σ(probability_i × value_i) for all possible outcomes
- Threshold = maximum input value where expected value > 3 × input value
- Standard probability calculation approach

**Formula**:
```
Expected Value = Σ(weight_i / total_weight × price_i)
Threshold = max input value where EV > 3 × input
```

**Alternatives considered**:
- Simple average: Doesn't account for probability weights
- Median value: Less accurate for skewed distributions

### Data Structure

**Decision**: Merge Scarab details and prices into unified data model.

**Rationale**:
- `scarabDetails.json` provides: name, id, dropWeight, description, dropLevel, limit
- `scarabPrices_Keepers.json` provides: name, chaosValue, divineValue, detailsId
- Merge by `detailsId` or `name` matching
- Handle missing prices gracefully (mark as unavailable)

**Data Flow**:
1. Load both JSON files on page load
2. Merge by matching identifier
3. Calculate expected value for each Scarab
4. Determine profitability status
5. Display in selected view

### Testing Strategy

**Decision**: Use Vitest for unit and integration tests, manual testing for E2E.

**Rationale**:
- Vitest is Vite-native, fast, and requires no additional configuration
- Unit tests for calculation logic (80%+ coverage target)
- Integration tests for view components
- Manual E2E testing for user scenarios (simpler than automated for single page)

**Alternatives considered**:
- Jest: Requires additional configuration, not Vite-native
- Playwright/Cypress: Overkill for single-page app, manual testing sufficient

### Performance Optimizations

**Decision**: Implement lazy loading, canvas optimization, and efficient data structures.

**Rationale**:
- Lazy load views (only render active view)
- Canvas: Use offscreen canvas for static elements, only redraw highlights
- Debounce simulation calculations
- Cache calculation results
- Use requestAnimationFrame for smooth animations

**Targets**:
- Initial load <2s (constitution requirement)
- View switching <100ms
- Calculations <50ms
- 60fps canvas rendering

## Unresolved Questions

None - all technical decisions made based on requirements and best practices.

## References

- Vite Documentation: https://vitejs.dev/
- HTML5 Canvas API: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- LocalStorage API: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
- Vitest Documentation: https://vitest.dev/

