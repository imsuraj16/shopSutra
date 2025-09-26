// Simple in-memory mock for ioredis used in tests to avoid hitting a real Redis instance.
// Supports a minimal subset of commands commonly used: get, set, del, exists, expire.

class RedisMock {
  constructor() {
    this._store = new Map();
    this._expiry = new Map(); // key -> timestamp(ms)
  }

  _isExpired(key) {
    const exp = this._expiry.get(key);
    if (exp && Date.now() > exp) {
      this._store.delete(key);
      this._expiry.delete(key);
      return true;
    }
    return false;
  }

  async set(key, value, mode, duration) {
    this._store.set(String(key), String(value));
    if (mode && (mode.toUpperCase() === 'EX' || mode.toUpperCase() === 'PX') && duration) {
      const ms = mode.toUpperCase() === 'EX' ? Number(duration) * 1000 : Number(duration);
      this._expiry.set(String(key), Date.now() + ms);
    } else {
      this._expiry.delete(String(key));
    }
    return 'OK';
  }

  async get(key) {
    if (this._isExpired(String(key))) return null;
    const v = this._store.get(String(key));
    return v === undefined ? null : v;
  }

  async del(...keys) {
    let count = 0;
    for (const k of keys) {
      if (!this._isExpired(String(k)) && this._store.has(String(k))) {
        this._store.delete(String(k));
        this._expiry.delete(String(k));
        count++;
      }
    }
    return count;
  }

  async exists(...keys) {
    let count = 0;
    for (const k of keys) {
      if (!this._isExpired(String(k)) && this._store.has(String(k))) count++;
    }
    return count;
  }

  async expire(key, seconds) {
    if (!this._store.has(String(key))) return 0;
    this._expiry.set(String(key), Date.now() + Number(seconds) * 1000);
    return 1;
  }

  on() { return this; }
  connect() { return Promise.resolve(); }
  quit() { return Promise.resolve('OK'); }
  disconnect() { /* no-op */ }
}

module.exports = RedisMock;
module.exports.Cluster = RedisMock;
