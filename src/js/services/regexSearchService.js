/**
 * Regex search service: build a regex that exactly matches selected item names.
 * When length exceeds MAX_LENGTH (250), the full regex is still returned; UI shows a warning.
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
 * scarabs of one type are selected. Regex is never shortened; if over MAX_LENGTH the UI should show a warning.
 * @param {Set<string>} selectedIds
 * @param {{ categoryId: string, namesById: Map<string, string>, names: string[], susById?: Map<string, string>, groups?: Array<{ token: string, memberIds: string[] }> }} categoryNames
 * @returns {{ value: string, length: number, exceedsMaxLength?: boolean, selectedCount: number, categoryId: string } | null}
 */
export function generateRegex(selectedIds, categoryNames) {
  if (!selectedIds || selectedIds.size === 0) return null;
  if (!categoryNames?.namesById) return null;

  const categoryId = categoryNames.categoryId || '';
  const selectedPatterns = buildOptimizedPatterns(selectedIds, categoryNames);
  if (selectedPatterns.length === 0) return null;

  const value = buildAlternation(selectedPatterns);

  return {
    value,
    length: value.length,
    exceedsMaxLength: value.length > MAX_LENGTH || undefined,
    selectedCount: selectedIds.size,
    categoryId
  };
}

/**
 * Escape content for use inside a double-quoted string (escape \ and ").
 * @param {string} s
 * @returns {string}
 */
function escapeForQuotedString(s) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Build quoted alternation: "a|b|c" (no parentheses; whole pattern in quotes).
 * @param {string[]} names - tokens, each escaped for regex
 * @returns {string}
 */
function buildAlternation(names) {
  if (names.length === 0) return '';
  const inner = names.map(escapeRegex).join('|');
  return '"' + escapeForQuotedString(inner) + '"';
}

/**
 * Optimize regex by finding a set of tokens that cover all selected names with overlapping SUS
 * (one token can match multiple items). Uses greedy set-cover: candidates are group tokens and
 * prefix substrings that don't match any non-selected name; pick best coverage per character until all covered.
 * @param {Set<string>} selectedIds
 * @param {{ namesById: Map<string, string>, names: string[], groups?: Array<{ token: string, memberIds: string[] }> }} categoryNames
 * @param {string} currentRegexValue - current alternation string to beat
 * @returns {{ value: string, length: number } | null} shorter regex, or null if none found
 */
export function optimizeRegex(selectedIds, categoryNames, currentRegexValue) {
  if (!selectedIds?.size || !categoryNames?.namesById || !currentRegexValue) return null;

  const namesById = categoryNames.namesById;
  const allNames = categoryNames.names || [];
  const selectedNames = [];
  const selectedSet = new Set();
  for (const id of selectedIds) {
    const name = namesById.get(id);
    if (name) {
      selectedNames.push(name);
      selectedSet.add(name);
    }
  }
  if (selectedNames.length === 0) return null;

  const otherNames = allNames.filter(n => !selectedSet.has(n));
  const otherSet = new Set(otherNames);

  /** Token is valid if it doesn't appear in any non-selected name. */
  function tokenSafe(token) {
    if (!token) return false;
    return !otherSet.size || ![...otherSet].some(n => n.includes(token));
  }

  /** Which selected names contain this token? */
  function coveredNames(token) {
    return selectedNames.filter(n => n.includes(token));
  }

  const candidates = [];

  // Group tokens: from JSON groups or name-based groups
  const groups = categoryNames.groups || [];
  const groupToIds = buildGroupToIds(namesById);

  for (const group of groups) {
    const token = group?.token;
    const memberIds = group?.memberIds || [];
    if (!token || !tokenSafe(token)) continue;
    const namesInGroup = memberIds.map(id => namesById.get(id)).filter(Boolean);
    if (namesInGroup.length > 0 && namesInGroup.every(n => selectedSet.has(n))) {
      candidates.push({ token, names: namesInGroup });
    }
  }

  for (const [groupKey, idsInGroup] of groupToIds) {
    const namesInGroup = idsInGroup.map(id => namesById.get(id)).filter(Boolean);
    if (namesInGroup.length === 0 || !namesInGroup.every(n => selectedSet.has(n))) continue;
    const allOther = allNames.filter(n => !namesInGroup.includes(n));
    const token = getShortestCommonUniqueToken(namesInGroup, allOther, groupKey);
    if (token && tokenSafe(token)) {
      const already = candidates.some(c => c.token === token);
      if (!already) candidates.push({ token, names: namesInGroup });
    }
  }

  // Per-name prefix substrings that don't match any non-selected (overlapping SUS)
  const maxPrefixLen = 50;
  for (const name of selectedNames) {
    for (let len = 1; len <= Math.min(maxPrefixLen, name.length); len++) {
      const token = name.slice(0, len);
      if (!tokenSafe(token)) continue;
      const covered = coveredNames(token);
      if (covered.length > 0) {
        const existing = candidates.find(c => c.token === token);
        if (!existing) candidates.push({ token, names: covered });
      }
    }
  }

  // Greedy set cover: pick candidate that maximizes (new names covered) / (cost)
  const covered = new Set();
  const chosen = [];

  while (covered.size < selectedNames.length) {
    let best = null;
    let bestScore = -1;

    for (const c of candidates) {
      const newNames = c.names.filter(n => !covered.has(n));
      if (newNames.length === 0) continue;
      const cost = escapeRegex(c.token).length + (chosen.length > 0 ? 1 : 0);
      const score = newNames.length / Math.max(1, cost);
      if (score > bestScore) {
        bestScore = score;
        best = { ...c, newNames };
      }
    }

    if (!best) break;
    chosen.push(best.token);
    for (const n of best.names) covered.add(n);
  }

  if (chosen.length === 0) return null;

  const value = buildAlternation(chosen);
  if (value.length >= currentRegexValue.length) return null;

  return { value, length: value.length };
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
