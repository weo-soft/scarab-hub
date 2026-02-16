/**
 * Unit tests for regexSearchService
 */

import { describe, it, expect } from 'vitest';
import { generateRegex, MAX_LENGTH } from '../../../src/js/services/regexSearchService.js';

function buildCategoryNames(namesById) {
  const entries = Object.entries(namesById);
  const names = entries.map(([, n]) => n);
  return {
    categoryId: 'test',
    namesById: new Map(entries),
    names
  };
}

describe('regexSearchService', () => {
  describe('generateRegex', () => {
    it('returns null for empty selection', () => {
      const categoryNames = buildCategoryNames({ a: 'Alpha', b: 'Beta' });
      expect(generateRegex(new Set(), categoryNames)).toBeNull();
    });

    it('returns null when categoryNames has no namesById', () => {
      expect(generateRegex(new Set(['a']), null)).toBeNull();
      expect(generateRegex(new Set(['a']), { categoryId: 'x', namesById: new Map(), names: [] })).toBeNull();
    });

    it('returns escaped regex for one selected item', () => {
      const categoryNames = buildCategoryNames({ a: 'Alpha (Special)' });
      const result = generateRegex(new Set(['a']), categoryNames);
      expect(result).not.toBeNull();
      expect(result.value).toBe('Alpha \\(Special\\)');
      expect(result.length).toBeLessThanOrEqual(MAX_LENGTH);
      expect(result.selectedCount).toBe(1);
    });

    it('returns alternation for multiple selected items', () => {
      const categoryNames = buildCategoryNames({ a: 'Alpha', b: 'Beta', c: 'Gamma' });
      const result = generateRegex(new Set(['a', 'c']), categoryNames);
      expect(result).not.toBeNull();
      expect(result.value).toMatch(/^\(.*\|.*\)$/);
      expect(result.value).toContain('Alpha');
      expect(result.value).toContain('Gamma');
      expect(result.length).toBeLessThanOrEqual(MAX_LENGTH);
      expect(result.selectedCount).toBe(2);
    });

    it('regex length never exceeds MAX_LENGTH (250)', () => {
      const namesById = {};
      const names = [];
      for (let i = 0; i < 50; i++) {
        const id = `id${i}`;
        const name = `Item ${i} with a longer name for testing`;
        namesById[id] = name;
        names.push(name);
      }
      const categoryNames = buildCategoryNames(namesById);
      const selectedIds = new Set(Object.keys(namesById));
      const result = generateRegex(selectedIds, categoryNames);
      expect(result).not.toBeNull();
      expect(result.length).toBeLessThanOrEqual(MAX_LENGTH);
      expect(result.value.length).toBeLessThanOrEqual(MAX_LENGTH);
    });

    it('exact match: regex matches only selected names', () => {
      const categoryNames = buildCategoryNames({
        a: 'Abyss Scarab',
        b: 'Ambush Scarab',
        c: 'Anarchy Scarab'
      });
      const result = generateRegex(new Set(['a', 'c']), categoryNames);
      expect(result).not.toBeNull();
      const re = new RegExp(result.value);
      expect(re.test('Abyss Scarab')).toBe(true);
      expect(re.test('Anarchy Scarab')).toBe(true);
      expect(re.test('Ambush Scarab')).toBe(false);
    });

    it('ignores selected ids not in categoryNames', () => {
      const categoryNames = buildCategoryNames({ a: 'Alpha' });
      const result = generateRegex(new Set(['a', 'missing']), categoryNames);
      expect(result).not.toBeNull();
      expect(result.selectedCount).toBe(1);
      expect(result.value).toBe('Alpha');
    });

    it('fallback: large selection produces regex ≤250 and exact match', () => {
      const namesById = {};
      const names = [];
      for (let i = 0; i < 30; i++) {
        const id = `id${i}`;
        const name = `Very Long Item Name ${i} For Testing Regex Fallback`;
        namesById[id] = name;
        names.push(name);
      }
      const categoryNames = buildCategoryNames(namesById);
      const selectedIds = new Set(Object.keys(namesById));
      const result = generateRegex(selectedIds, categoryNames);
      expect(result).not.toBeNull();
      expect(result.value.length).toBeLessThanOrEqual(MAX_LENGTH);
      const re = new RegExp(result.value);
      names.forEach((n, i) => {
        expect(re.test(n)).toBe(true);
      });
    });
  });

  describe('MAX_LENGTH', () => {
    it('is 250', () => {
      expect(MAX_LENGTH).toBe(250);
    });
  });
});
