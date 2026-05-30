export function createLRUCache(maxEntries = 100) {
  const entries = new Map();
  const limit = Math.max(Number(maxEntries) || 100, 1);

  const touch = (key, value) => {
    entries.delete(key);
    entries.set(key, value);
    return value;
  };

  return {
    get(key) {
      if (!entries.has(key)) {
        return undefined;
      }

      return touch(key, entries.get(key));
    },
    set(key, value) {
      touch(key, value);

      while (entries.size > limit) {
        const oldestKey = entries.keys().next().value;
        entries.delete(oldestKey);
      }

      return value;
    },
    delete(key) {
      return entries.delete(key);
    },
    clear() {
      entries.clear();
    },
    has(key) {
      return entries.has(key);
    },
    keys() {
      return [...entries.keys()];
    },
    get size() {
      return entries.size;
    }
  };
}
