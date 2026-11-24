import { RequestHandler } from 'express';
// Process-local; use a shared atomic store before running multiple replicas.
export function rateLimit(max: number, windowMs: number): RequestHandler {
  const buckets = new Map<string, { count: number; expires: number }>();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    let bucket = buckets.get(key);
    if (!bucket || bucket.expires <= now) {
      if (buckets.size >= 10000) {
        for (const [id, entry] of buckets) if (entry.expires <= now) buckets.delete(id);
      }
      if (!buckets.has(key) && buckets.size >= 10000) {
        res.status(429).json({ error: { message: '请求过于频繁，请稍后重试' } }); return;
      }
      bucket = { count: 0, expires: now + windowMs };
      buckets.set(key, bucket);
    }
    if (bucket.count >= max) {
      res.set('Retry-After', String(Math.ceil((bucket.expires - now) / 1000)));
      res.status(429).json({ error: { message: '请求过于频繁，请稍后重试' } }); return;
    }
    bucket.count++;
    next();
  };
}
