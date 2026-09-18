/**
 * Tiny, dependency-free in-memory rate limiter.
 * Per-IP token bucket: 5 submissions per 10 minutes.
 *
 * Vercel / serverless caveat: in-memory state is per-instance, so on a
 * truly high-traffic deployment this would under-count; for an MVP it is
 * sufficient (see spec §31: "Do not break legitimate customers uploading
 * projects.").
 */
const buckets = new Map();

const makeKey = (req) =>
  req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
  req.socket?.remoteAddress ||
  "unknown";

export const projectQuoteRateLimit = (req, res, next) => {
  const ip = makeKey(req);
  const now = Date.now();
  const WINDOW = 10 * 60 * 1000;
  const LIMIT = 5;
  const bucket = buckets.get(ip) || { hits: [], blockedUntil: 0 };

  if (bucket.blockedUntil > now) {
    res.set(
      "Retry-After",
      String(Math.ceil((bucket.blockedUntil - now) / 1000)),
    );
    return res.status(429).json({
      success: false,
      message: "Too many submissions. Please try again later.",
    });
  }
  bucket.hits = bucket.hits.filter((t) => now - t < WINDOW);
  if (bucket.hits.length >= LIMIT) {
    bucket.blockedUntil = now + WINDOW;
    buckets.set(ip, bucket);
    res.set("Retry-After", String(WINDOW / 1000));
    return res
      .status(429)
      .json({
        success: false,
        message: "Too many submissions. Please try again later.",
      });
  }
  bucket.hits.push(now);
  buckets.set(ip, bucket);
  next();
};
