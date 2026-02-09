/**
 * Regex search service: build a regex that exactly matches selected item names, ≤250 chars.
 */

const MAX_LENGTH = 250;

/**
 * Escape special regex characters in a string for use in a regex alternation.
 * @param {string} s
 * @returns {string}
 */
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract group key from item name (e.g. "Betrayal Scarab of X" -> "Betrayal").
 * Used to collapse all scarabs of one type into a single token when all are selected.
 * @param {string} name
 * @returns {string}
 */
function getGroupKeyFromName(name) {
  if (!name || typeof name !== 'string') return '';
  const m = name.match(/^(.+?)\s+Scarab\b/);
  return m ? m[1].trim() : name;
}

/**
 * Build map: groupKey -> ids in that group (from namesById).
 * @param {Map<string, string>} namesById
 * @returns {Map<string, string[]>}
 */
function buildGroupToIds(namesById) {
  const groupToIds = new Map();
  for (const [id, name] of namesById) {
    const key = getGroupKeyFromName(name);
    if (!key) continue;
    if (!groupToIds.has(key)) groupToIds.set(key, []);
    groupToIds.get(key).push(id);
  }
  return groupToIds;
}

/**
 * Shortest substring of groupKey that appears in every nameInGroup and in no name in allOtherNames.
 * Tries full groupKey then shorter prefixes to save characters.
 * @param {string[]} namesInGroup - e.g. ["Betrayal Scarab", "Betrayal Scarab of Reinforcements"]
 * @param {string[]} allOtherNames - all names NOT in this group
 * @param {string} groupKey - e.g. "Betrayal"
 * @returns {string}
 */
function getShortestCommonUniqueToken(namesInGroup, allOtherNames, groupKey) {
  if (!groupKey || namesInGroup.length === 0) return groupKey;
  const otherSet = new Set(allOtherNames);
  for (let len = groupKey.length; len >= 1; len--) {
    const token = groupKey.slice(0, len);
    const inAll = namesInGroup.every(n => n.includes(token));
    const inNone = !otherSet.size || ![...otherSet].some(n => n.includes(token));
    if (inAll && inNone) return token;
  }
  return groupKey;
}

/**
 * Build patterns using JSON groups: when a group's memberIds are all selected, use the group's token
 * (greedy by group size). Remaining selected ids use per-item SUS.
 * @param {Set<string>} selectedIds
 * @param {{ namesById: Map<string, string>, susById?: Map<string, string>, groups?: Array<{ token: string, memberIds: string[] }> }} categoryNames
 * @returns {string[]}
 */
function buildOptimizedPatternsWithGroups(selectedIds, categoryNames) {
  const namesById = categoryNames.namesById;
  const susById = categoryNames.susById;
  const groups = categoryNames.groups || [];
  const coveredIds = new Set();
  const patterns = [];

  // Prefer larger groups first to maximize character savings
  const sortedGroups = [...groups].sort(
    (a, b) => (b.memberIds?.length ?? 0) - (a.memberIds?.length ?? 0)
  );

  for (const group of sortedGroups) {
    const token = group?.token;
    const memberIds = group?.memberIds;
    if (!token || !Array.isArray(memberIds) || memberIds.length === 0) continue;
    const allSelected = memberIds.every(id => selectedIds.has(id));
    const noneCovered = memberIds.every(id => !coveredIds.has(id));
    if (allSelected && noneCovered) {
      patterns.push(token);
      for (const id of memberIds) coveredIds.add(id);
    }
  }

  for (const id of selectedIds) {
    if (coveredIds.has(id)) continue;
    const name = namesById.get(id);
    if (!name) continue;
    const pattern = susById?.get(id) ?? name;
    patterns.push(pattern);
  }

  return patterns;
}

/**
 * Build list of patterns: when all scarabs in a name-based group are selected, use one common token;
 * otherwise use per-item SUS token. Used when no JSON groups are available.
 * @param {Set<string>} selectedIds
 * @param {{ namesById: Map<string, string>, names: string[], susById?: Map<string, string> }} categoryNames
 * @returns {string[]}
 */
function buildOptimizedPatternsFromNames(selectedIds, categoryNames) {
  const namesById = categoryNames.namesById;
  const susById = categoryNames.susById;
  const allNames = categoryNames.names || [];
  const groupToIds = buildGroupToIds(namesById);
  const addedGroupKeys = new Set();
  const patterns = [];

  for (const [groupKey, idsInGroup] of groupToIds) {
    const allSelected = idsInGroup.every(id => selectedIds.has(id));
    if (allSelected && idsInGroup.length > 0 && !addedGroupKeys.has(groupKey)) {
      const namesInGroup = idsInGroup.map(id => namesById.get(id)).filter(Boolean);
      const allOtherNames = allNames.filter(n => !namesInGroup.includes(n));
      const token = getShortestCommonUniqueToken(namesInGroup, allOtherNames, groupKey);
      patterns.push(token);
      addedGroupKeys.add(groupKey);
    }
  }

  for (const id of selectedIds) {
    const name = namesById.get(id);
    if (!name) continue;
    const groupKey = getGroupKeyFromName(name);
    if (addedGroupKeys.has(groupKey)) continue;
    const pattern = susById?.get(id) ?? name;
    patterns.push(pattern);
  }

  return patterns;
}

/**
 * Build list of patterns: use JSON groups when available (optimized); else fall back to name-based grouping.
 * @param {Set<string>} selectedIds
 * @param {{ namesById: Map<string, string>, names: string[], susById?: Map<string, string>, groups?: Array<{ token: string, memberIds: string[] }> }} categoryNames
 * @returns {string[]}
 */
function buildOptimizedPatterns(selectedIds, categoryNames) {
  if (categoryNames.groups && categoryNames.groups.length > 0) {
    return buildOptimizedPatternsWithGroups(selectedIds, categoryNames);
  }
  return buildOptimizedPatternsFromNames(selectedIds, categoryNames);
}

/**
 * Build alternation regex from selected items. Uses SUS tokens when available (from .sus.json).
 * When categoryNames.groups is present (e.g. scarabs.sus.json), uses group tokens when a matching
 * group of items is selected (greedy by group size). Otherwise uses name-based grouping when all
 * scarabs of one type are selected. If over MAX_LENGTH, uses fallback (shortened unique substrings).
 * @param {Set<string>} selectedIds
 * @param {{ categoryId: string, namesById: Map<string, string>, names: string[], susById?: Map<string, string>, groups?: Array<{ token: string, memberIds: string[] }> }} categoryNames
 * @returns {{ value: string, length: number, truncated?: boolean, selectedCount: number, categoryId: string } | null}
 */
export function generateRegex(selectedIds, categoryNames) {
  if (!selectedIds || selectedIds.size === 0) return null;
  if (!categoryNames?.namesById) return null;

  const categoryId = categoryNames.categoryId || '';
  const allNames = categoryNames.names || [];

  const selectedPatterns = buildOptimizedPatterns(selectedIds, categoryNames);
  if (selectedPatterns.length === 0) return null;

  let value = buildAlternation(selectedPatterns);
  let truncated = false;

  if (value.length > MAX_LENGTH) {
    const fallback = buildShortenedUniqueAlternationFromNames(selectedIds, categoryNames);
    value = fallback.value;
    truncated = fallback.truncated;
  }

  if (value.length > MAX_LENGTH) {
    value = value.slice(0, MAX_LENGTH);
    truncated = true;
  }

  return {
    value,
    length: value.length,
    truncated: truncated || undefined,
    selectedCount: selectedIds.size,
    categoryId
  };
}

/**
 * Simple alternation: (a|b|c) with escaped names.
 * @param {string[]} names
 * @returns {string}
 */
function buildAlternation(names) {
  if (names.length === 0) return '';
  if (names.length === 1) return escapeRegex(names[0]);
  const escaped = names.map(escapeRegex);
  return '(' + escaped.join('|') + ')';
}

/**
 * Fallback when SUS + alternation still exceeds MAX_LENGTH: use shortest unique substring per selected name.
 * @param {Set<string>} selectedIds
 * @param {{ namesById: Map<string, string>, names: string[], susById?: Map<string, string> }} categoryNames
 * @returns {{ value: string, truncated: boolean }}
 */
function buildShortenedUniqueAlternationFromNames(selectedIds, categoryNames) {
  const allNames = categoryNames.names || [];
  const allSet = new Set(allNames);
  const selectedNames = [];
  for (const id of selectedIds) {
    const name = categoryNames.namesById.get(id);
    if (name) selectedNames.push(name);
  }

  const substrings = selectedNames.map(name => {
    const sub = shortestUniqueSubstring(name, allSet);
    return escapeRegex(sub);
  });

  let value = '(' + substrings.join('|') + ')';
  let truncated = false;

  if (value.length > MAX_LENGTH) {
    const maxPart = Math.max(2, Math.floor(MAX_LENGTH / selectedNames.length) - 4);
    const shortened = selectedNames.map(n => {
      let s = shortestUniqueSubstring(n, allSet);
      if (s.length > maxPart) s = s.slice(0, maxPart);
      return escapeRegex(s);
    });
    value = '(' + shortened.join('|') + ')';
    if (value.length > MAX_LENGTH) {
      value = value.slice(0, MAX_LENGTH);
    }
    truncated = true;
  }

  return { value, truncated };
}

/**
 * Find shortest substring of `name` that is not a substring of any other string in `others` (and not equal to any).
 * Prefer full name, then try prefixes/suffixes, then sliding window.
 * @param {string} name
 * @param {Set<string>} others - all names in category (including name)
 * @returns {string}
 */
function shortestUniqueSubstring(name, others) {
  if (!name) return '';
  const rest = [...others].filter(n => n !== name);
  if (rest.length === 0) return name;

  if (!rest.some(n => n.includes(name))) return name;

  for (let len = 1; len <= name.length; len++) {
    for (let i = 0; i + len <= name.length; i++) {
      const sub = name.slice(i, i + len);
      const unique = !rest.some(n => n.includes(sub));
      if (unique) return sub;
    }
  }
  return name;
}

export { MAX_LENGTH };
