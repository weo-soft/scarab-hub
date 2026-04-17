/**
 * Build CategoryItemNames from an items array for regex search feature.
 * Items must have id and name (or baseType) for display name.
 * Optional SUS (short unique substring) tokens from .sus.json can be merged for shorter regex.
 */

/**
 * Same searchable text as scripts/compute-sus.js (name + description + flavour + helpText).
 * PoE search matches across this full tooltip text, not the name line alone.
 * @param {{ name?: string, baseType?: string, description?: string, flavourText?: string, flavourtext?: string, helpText?: string }} item
 * @returns {string}
 */
export function getItemSearchText(item) {
  if (!item) return '';
  const name = (item.name ?? item.baseType ?? '').trim();
  if (!name) return '';
  const parts = [name];
  if (typeof item.description === 'string') parts.push(item.description);
  const flavour = item.flavourText ?? item.flavourtext;
  if (typeof flavour === 'string') parts.push(flavour);
  if (typeof item.helpText === 'string') parts.push(item.helpText);
  return parts.join('\n');
}

/**
 * Load SUS data for a category from public/data/items/{categoryId}.sus.json.
 * Supports legacy array format or new structure { entries, groups }.
 * @param {string} categoryId - e.g. 'scarabs'
 * @returns {Promise<{ susById: Map<string, string>, groups: Array<{ token: string, memberIds: string[] }> }>}
 */
export async function loadSusById(categoryId) {
  const empty = { susById: new Map(), groups: [] };
  if (!categoryId) return empty;
  try {
    const res = await fetch(`/data/items/${categoryId}.sus.json`);
    if (!res.ok) return empty;
    const data = await res.json();
    let entries = [];
    let groups = [];
    if (Array.isArray(data)) {
      entries = data;
    } else if (data && typeof data === 'object' && Array.isArray(data.entries)) {
      entries = data.entries;
      if (Array.isArray(data.groups)) {
        groups = data.groups.filter(
          g => g && typeof g.token === 'string' && Array.isArray(g.memberIds)
        );
      }
    }
    const susById = new Map();
    for (const entry of entries) {
      if (entry?.id != null && entry?.sus != null) {
        susById.set(String(entry.id), String(entry.sus).trim());
      }
    }
    return { susById, groups };
  } catch {
    return empty;
  }
}

/**
 * Build category item names structure from items array.
 * @param {string} categoryId - e.g. 'scarabs', 'vials'
 * @param {Array<{id: string, name?: string, baseType?: string}>} items - Items with id and name or baseType
 * @param {Map<string, string>} [susById] - Optional id → SUS token from loadSusById()
 * @param {Array<{ token: string, memberIds: string[] }>} [groups] - Optional groups for regex optimization (from .sus.json)
 * @returns {{ categoryId: string, namesById: Map<string, string>, names: string[], searchTextById?: Map<string, string>, susById?: Map<string, string>, groups?: Array<{ token: string, memberIds: string[] }> }}
 */
export function buildCategoryItemNames(categoryId, items, susById = null, groups = null) {
  const namesById = new Map();
  const searchTextById = new Map();
  const names = [];

  if (!categoryId || !Array.isArray(items)) {
    return {
      categoryId: categoryId || '',
      namesById,
      names,
      searchTextById: undefined,
      susById: susById || undefined,
      groups: groups && groups.length ? groups : undefined
    };
  }

  for (const item of items) {
    const id = item?.id ?? item?.detailsId;
    if (!id) continue;
    const name = (item.name ?? item.baseType ?? '').trim();
    if (!name) continue;
    namesById.set(id, name);
    searchTextById.set(id, getItemSearchText(item));
    names.push(name);
  }

  return {
    categoryId,
    namesById,
    names,
    searchTextById,
    susById: susById || undefined,
    groups: groups && groups.length ? groups : undefined
  };
}
