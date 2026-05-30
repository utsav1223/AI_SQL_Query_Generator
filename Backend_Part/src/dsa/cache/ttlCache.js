class TTLCache {
  constructor({ ttlMs = 30000, maxEntries = 100 } = {}) {
    this.ttlMs = Math.max(Number(ttlMs) || 30000, 1);
    this.maxEntries = Math.max(Number(maxEntries) || 100, 1);
    this.entries = new Map();
  }

  get(key) {
    const entry = this.entries.get(key);

    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }

    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value;
  }

  set(key, value, ttlMs = this.ttlMs) {
    this.entries.delete(key);
    this.entries.set(key, {
      value,
      expiresAt: Date.now() + Math.max(Number(ttlMs) || this.ttlMs, 1)
    });

    while (this.entries.size > this.maxEntries) {
      const oldestKey = this.entries.keys().next().value;
      this.entries.delete(oldestKey);
    }

    return value;
  }

  delete(key) {
    return this.entries.delete(key);
  }

  clear() {
    this.entries.clear();
  }

  async getOrSet(key, loader, ttlMs = this.ttlMs) {
    const cachedValue = this.get(key);

    if (cachedValue !== undefined) {
      return cachedValue;
    }

    const value = await loader();
    this.set(key, value, ttlMs);
    return value;
  }
}

const createTTLCache = (options) => new TTLCache(options);

module.exports = {
  TTLCache,
  createTTLCache
};
