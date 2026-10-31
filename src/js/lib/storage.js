/** Namespaced, failure-tolerant localStorage helpers (private mode, quota…). */
export const KEYS = {
  bag: 'tiziri.bag.v1',
  newsletter: 'tiziri.newsletter.v1',
};

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable — the session still works in memory */
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};
