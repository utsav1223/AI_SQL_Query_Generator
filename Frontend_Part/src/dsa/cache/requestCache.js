import { createLRUCache } from "./lruCache";

const DEFAULT_TTL_MS = 4_000;
const responseCache = createLRUCache(80);
const inFlightRequests = new Map();

const cloneValue = (value) => {
  if (value === null || typeof value !== "object") {
    return value;
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
};

export function buildRequestCacheKey({ authScope = "public", method = "GET", endpoint = "" }) {
  return `${authScope}:${String(method).toUpperCase()}:${endpoint}`;
}

export function clearRequestCache(prefix = "") {
  if (!prefix) {
    responseCache.clear();
    return;
  }

  const keysToDelete = responseCache.keys().filter((key) => key.startsWith(prefix));
  for (const key of inFlightRequests.keys()) {
    if (key.startsWith(prefix)) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach((key) => {
    inFlightRequests.delete(key);
    responseCache.delete(key);
  });
}

export async function getCachedRequest({ key, ttlMs = DEFAULT_TTL_MS, request }) {
  const now = Date.now();
  const cached = responseCache.get(key);

  if (cached && cached.expiresAt > now) {
    return cloneValue(cached.value);
  }

  if (inFlightRequests.has(key)) {
    return cloneValue(await inFlightRequests.get(key));
  }

  const pending = request()
    .then((value) => {
      responseCache.set(key, {
        value,
        expiresAt: Date.now() + ttlMs
      });
      return value;
    })
    .finally(() => {
      inFlightRequests.delete(key);
    });

  inFlightRequests.set(key, pending);
  return cloneValue(await pending);
}
