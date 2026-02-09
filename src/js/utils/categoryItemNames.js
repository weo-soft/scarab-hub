/**
 * Build CategoryItemNames from an items array for regex search feature.
 * Items must have id and name (or baseType) for display name.
 * Optional SUS (short unique substring) tokens from .sus.json can be merged for shorter regex.
 */

/**
 * Load SUS tokens for a category from public/data/items/{categoryId}.sus.json.
 * Returns Map<id, sus>; empty Map if file missing or invalid.
 * @param {string} categoryId - e.g. 'scarabs'
 * @returns {Promise<Map<string, string>>}
 */
export async function loadSusById(categoryId) {
  if (!categoryId) return new Map();
  try {
    const res = await fetch(`/data/items/${categoryId}.sus.json`);
    if (!res.ok) return new Map();
    const data = await res.json();
    if (!Array.isArray(data)) return new Map();
    const m = new Map();
    for (const entry of data) {
      if (entry?.id != null && entry?.sus != null) {
        m.set(String(entry.id), String(entry.sus).trim());
      }
    }
    return m;
  } catch {
    return new Map();
  }
}

/**
 * Build category item names structure from items array.
 * @param {string} categoryId - e.g. 'scarabs', 'vials'
 * @param {Array<{id: string, name?: string, baseType?: string}>} items - Items with id and name or baseType
 * @param {Map<string, string>} [susById] - Optional id → SUS token from loadSusById()
 * @returns {{ categoryId: string, namesById: Map<string, string>, names: string[], susById?: Map<string, string> }}
 */
export function buildCategoryItemNames(categoryId, items, susById = null) {
  const namesById = new Map();
  const names = [];

  if (!categoryId || !Array.isArray(items)) {
    return { categoryId: categoryId || '', namesById, names, susById: susById || undefined };
  }

  for (const item of items) {
    const id = item?.id ?? item?.detailsId;
    if (!id) continue;
    const name = (item.name ?? item.baseType ?? '').trim();
    if (!name) continue;
    namesById.set(id, name);
    names.push(name);
  }

  return { categoryId, namesById, names, susById: susById || undefined };
}
