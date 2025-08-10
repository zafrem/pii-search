import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};
const WINDOW_SIZE = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30;

const cleanupOldEntries = () => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
};

setInterval(cleanupOldEntries, 60000);

export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  if (!store[clientIP] || store[clientIP].resetTime < now) {
    store[clientIP] = {
      count: 1,
      resetTime: now + WINDOW_SIZE
    };
  } else {
    store[clientIP].count++;
  }

  const { count, resetTime } = store[clientIP];
  
  res.set({
    'X-RateLimit-Limit': MAX_REQUESTS.toString(),
    'X-RateLimit-Remaining': Math.max(0, MAX_REQUESTS - count).toString(),
    'X-RateLimit-Reset': new Date(resetTime).toISOString()
  });

  if (count > MAX_REQUESTS) {
    res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again after ${new Date(resetTime).toISOString()}`,
      retryAfter: Math.ceil((resetTime - now) / 1000)
    });
    return;
  }

  next();
};