/**
 * Integration tests: selection state and regex search (list/grid sync and regex update).
 * Run with vitest (requires jsdom for full DOM tests).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  setCategory,
  getSelectedIds,
  toggle,
  has,
  clear
} from '../../../src/js/services/selectionState.js';
import { buildCategoryItemNames } from '../../../src/js/utils/categoryItemNames.js';
import { generateRegex } from '../../../src/js/services/regexSearchService.js';

describe('selectionAndRegex integration', () => {
  beforeEach(() => {
    setCategory('scarabs', true);
  });

  it('selection state and regex stay in sync', () => {
    setCategory('scarabs', true);
    const items = [
      { id: 'a', name: 'Alpha' },
      { id: 'b', name: 'Beta' },
      { id: 'c', name: 'Gamma' }
    ];
    const categoryNames = buildCategoryItemNames('scarabs', items);

    expect(getSelectedIds().size).toBe(0);
    expect(generateRegex(getSelectedIds(), categoryNames)).toBeNull();

    toggle('a');
    expect(has('a')).toBe(true);
    expect(getSelectedIds().size).toBe(1);
    const r1 = generateRegex(getSelectedIds(), categoryNames);
    expect(r1).not.toBeNull();
    expect(r1.value).toBe('Alpha');

    toggle('c');
    expect(has('c')).toBe(true);
    const r2 = generateRegex(getSelectedIds(), categoryNames);
    expect(r2).not.toBeNull();
    expect(r2.selectedCount).toBe(2);

    toggle('a');
    expect(has('a')).toBe(false);
    const r3 = generateRegex(getSelectedIds(), categoryNames);
    expect(r3.selectedCount).toBe(1);
    expect(r3.value).toContain('Gamma');
  });

  it('category switch clears selection', () => {
    setCategory('scarabs', true);
    toggle('a');
    expect(getSelectedIds().size).toBe(1);
    setCategory('essences', true);
    expect(getSelectedIds().size).toBe(0);
  });
});
