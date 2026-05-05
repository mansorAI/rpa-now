const store = new Map();
const TTL = 10 * 60 * 1000; // 10 minutes

module.exports = {
  set(key, value) {
    store.set(key, { value, expires: Date.now() + TTL });
    setTimeout(() => store.delete(key), TTL);
  },
  get(key) {
    const item = store.get(key);
    if (!item || item.expires < Date.now()) { store.delete(key); return null; }
    return item.value;
  },
  del(key) { store.delete(key); },
};
