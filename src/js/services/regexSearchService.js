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
 * Shortest substring of groupKey that appears in every nameInGroup and in no other item's searchable text.
 * Tries full groupKey then shorter prefixes to save characters.
 * @param {string[]} namesInGroup - display names for items in the group
 * @param {string[]} allOtherSearchTexts - full searchable text per item NOT in this group (same shape as compute-sus)
 * @param {string} groupKey - e.g. "Betrayal"
 * @returns {string}
 */
function getShortestCommonUniqueToken(namesInGroup, allOtherSearchTexts, groupKey) {
  if (!groupKey || namesInGroup.length === 0) return groupKey;
  for (let len = groupKey.length; len >= 1; len--) {
    const token = groupKey.slice(0, len);
    const inAll = namesInGroup.every(n => n.includes(token));
    const inNone =
      !allOtherSearchTexts.length || !allOtherSearchTexts.some(t => t.includes(token));
    if (inAll && inNone) return token;
  }
  return groupKey;
}

/**
 * Ensure every selected item matches at least one alternation branch in PoE (searchable blob contains the substring).
 * Needed for {@link generateRegex}: it runs for all lengths, while {@link optimizeRegex} only runs when over MAX_LENGTH.
 * @param {string[]} patterns
 * @param {Set<string>} selectedIds
 * @param {{ namesById: Map<string, string>, searchTextById?: Map<string, string>, susById?: Map<string, string> }} categoryNames
 * @returns {string[]}
 */
function ensureEverySelectedIdHasMatchingPattern(patterns, selectedIds, categoryNames) {
  const namesById = categoryNames.namesById;
  const susById = categoryNames.susById;
  const getText = id => categoryNames.searchTextById?.get(id) ?? namesById.get(id) ?? '';
  const list = [...patterns];
  for (const id of selectedIds) {
    if (!namesById.has(id)) continue;
    const blob = getText(id);
    if (list.some(p => p && blob.includes(p))) continue;
    const sus = susById?.get(id);
    if (sus && blob.includes(sus)) list.push(sus);
    else list.push(namesById.get(id) ?? '');
  }
  return [...new Set(list.filter(Boolean))];
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

  function getText(id) {
    return categoryNames.searchTextById?.get(id) ?? namesById.get(id) ?? '';
  }

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
    if (!allSelected || !noneCovered) continue;
    // Token must appear in every member's searchable text (same bug as optimizeRegex: JSON groups can be wrong for some items).
    const everyMemberHasToken = memberIds.every(id => getText(id).includes(token));
    if (!everyMemberHasToken) continue;
    patterns.push(token);
    for (const id of memberIds) coveredIds.add(id);
  }

  for (const id of selectedIds) {
    if (coveredIds.has(id)) continue;
    const name = namesById.get(id);
    if (!name) continue;
    const pattern = susById?.get(id) ?? name;
    patterns.push(pattern);
  }

  return ensureEverySelectedIdHasMatchingPattern(patterns, selectedIds, categoryNames);
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
  const groupToIds = buildGroupToIds(namesById);
  const addedGroupKeys = new Set();
  const patterns = [];

  function getText(id) {
    return categoryNames.searchTextById?.get(id) ?? namesById.get(id) ?? '';
  }

  for (const [groupKey, idsInGroup] of groupToIds) {
    const allSelected = idsInGroup.every(id => selectedIds.has(id));
    if (allSelected && idsInGroup.length > 0 && !addedGroupKeys.has(groupKey)) {
      const namesInGroup = idsInGroup.map(id => namesById.get(id)).filter(Boolean);
      const allOtherSearchTexts = [...namesById.keys()]
        .filter(id => !idsInGroup.includes(id))
        .map(id => categoryNames.searchTextById?.get(id) ?? namesById.get(id))
        .filter(Boolean);
      const token = getShortestCommonUniqueToken(namesInGroup, allOtherSearchTexts, groupKey);
      const everyHasToken = idsInGroup.every(id => getText(id).includes(token));
      if (!everyHasToken) continue;
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

  return ensureEverySelectedIdHasMatchingPattern(patterns, selectedIds, categoryNames);
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
 * Escape content for use inside a double-quoted PoE-style regex string.
 * Only `"` is doubled-escaped; regex escapes from escapeRegex (e.g. `\?`, `\(`, `\\`) stay as one backslash.
 * @param {string} s
 * @returns {string}
 */
function escapeForQuotedString(s) {
  return s.replace(/"/g, '\\"');
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
 * @param {{ namesById: Map<string, string>, names: string[], searchTextById?: Map<string, string>, susById?: Map<string, string>, groups?: Array<{ token: string, memberIds: string[] }> }} categoryNames
 * @param {string} currentRegexValue - current alternation string to beat
 * @returns {{ value: string, length: number } | null} shorter regex, or null if none found
 */
export function optimizeRegex(selectedIds, categoryNames, currentRegexValue) {
  if (!selectedIds?.size || !categoryNames?.namesById || !currentRegexValue) return null;

  const namesById = categoryNames.namesById;
  const searchTextById = categoryNames.searchTextById;
  const susById = categoryNames.susById;

  /** Full PoE-searchable blob per id (matches compute-sus segments). */
  function getText(id) {
    return searchTextById?.get(id) ?? namesById.get(id) ?? '';
  }

  const allCategoryIds = [...namesById.keys()];
  const selectedIdList = [...selectedIds].filter(id => namesById.has(id));
  if (selectedIdList.length === 0) return null;

  const otherIds = allCategoryIds.filter(id => !selectedIds.has(id));

  /** Token must not appear in any non-selected item's searchable text. */
  function tokenSafe(token) {
    if (!token) return false;
    return otherIds.every(oid => !getText(oid).includes(token));
  }

  /** Which selected ids' search text contains this token? */
  function coveredIdsForToken(token) {
    return selectedIdList.filter(id => getText(id).includes(token));
  }

  /** Token must appear in this id's blob (group entries from .sus.json can be wrong if JSON/runtime text diverge). */
  function idsWithTokenInText(token, ids) {
    return ids.filter(id => getText(id).includes(token));
  }

  /** When greedy / groups fail, pick a branch guaranteed to match this item in PoE (name last). */
  function pickFallbackToken(id) {
    const blob = getText(id);
    const sus = susById?.get(id);
    if (sus && blob.includes(sus) && tokenSafe(sus)) return sus;
    const otherTexts = allCategoryIds.filter(oid => oid !== id).map(oid => getText(oid));
    const u = shortestUniqueSubstring(blob, new Set(otherTexts));
    if (u && blob.includes(u) && tokenSafe(u)) return u;
    return namesById.get(id) ?? '';
  }

  const candidates = [];

  // Group tokens: from JSON groups or name-based groups
  const groups = categoryNames.groups || [];
  const groupToIds = buildGroupToIds(namesById);

  for (const group of groups) {
    const token = group?.token;
    const memberIds = group?.memberIds || [];
    if (!token || !Array.isArray(memberIds) || memberIds.length === 0) continue;
    if (!memberIds.every(id => selectedIds.has(id))) continue;
    if (!tokenSafe(token)) continue;
    const ids = idsWithTokenInText(token, memberIds);
    if (ids.length === 0) continue;
    candidates.push({ token, ids });
  }

  for (const [groupKey, idsInGroup] of groupToIds) {
    if (!idsInGroup.every(id => selectedIds.has(id))) continue;
    const namesInGroup = idsInGroup.map(id => namesById.get(id)).filter(Boolean);
    if (namesInGroup.length === 0) continue;
    const allOtherSearchTexts = allCategoryIds
      .filter(id => !idsInGroup.includes(id))
      .map(id => getText(id));
    const token = getShortestCommonUniqueToken(namesInGroup, allOtherSearchTexts, groupKey);
    if (token && tokenSafe(token)) {
      const already = candidates.some(c => c.token === token);
      if (!already) {
        const ids = idsWithTokenInText(token, idsInGroup);
        if (ids.length > 0) candidates.push({ token, ids });
      }
    }
  }

  // Prefix substrings of each selected item's searchable text (not name-only)
  const maxPrefixLen = 50;
  for (const id of selectedIdList) {
    const blob = getText(id);
    for (let len = 1; len <= Math.min(maxPrefixLen, blob.length); len++) {
      const token = blob.slice(0, len);
      if (!tokenSafe(token)) continue;
      const covered = coveredIdsForToken(token);
      if (covered.length > 0) {
        const existing = candidates.find(c => c.token === token);
        if (!existing) candidates.push({ token, ids: covered });
      }
    }
  }

  // Per-item SUS from .sus.json (may come from flavour/description; must match getText for coverage)
  if (susById) {
    for (const id of selectedIds) {
      const name = namesById.get(id);
      if (!name) continue;
      const token = susById.get(id);
      if (!token) continue;
      if (!tokenSafe(token)) continue;
      const covered = coveredIdsForToken(token);
      if (covered.length === 0) continue;
      const existing = candidates.find(c => c.token === token);
      if (!existing) candidates.push({ token, ids: covered });
    }
  }

  const covered = new Set();
  const chosen = [];

  while (covered.size < selectedIdList.length) {
    let best = null;
    let bestScore = -1;

    for (const c of candidates) {
      const newIds = c.ids.filter(id => !covered.has(id));
      if (newIds.length === 0) continue;
      const cost = escapeRegex(c.token).length + (chosen.length > 0 ? 1 : 0);
      const score = newIds.length / Math.max(1, cost);
      if (score > bestScore) {
        bestScore = score;
        best = { ...c, newIds };
      }
    }

    if (!best) break;
    chosen.push(best.token);
    for (const id of best.ids) {
      if (getText(id).includes(best.token)) covered.add(id);
    }
  }

  // Append a guaranteed-matching token for any item not covered by greedy (fixes false "covered" from group ids).
  for (const id of selectedIdList) {
    const blob = getText(id);
    if (chosen.some(tok => tok && blob.includes(tok))) continue;
    chosen.push(pickFallbackToken(id));
  }

  const chosenDeduped = [...new Set(chosen.filter(Boolean))];
  if (chosenDeduped.length === 0) return null;

  for (const id of selectedIdList) {
    const blob = getText(id);
    if (!chosenDeduped.some(tok => tok && blob.includes(tok))) {
      return null;
    }
  }

  const value = buildAlternation(chosenDeduped);
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
