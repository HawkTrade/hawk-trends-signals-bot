import TTLCache from "@isaacs/ttlcache";

const cache = new TTLCache<string, string>({
  max: 100,
  ttl: 10 * 60 * 1000,
});

export default cache;
