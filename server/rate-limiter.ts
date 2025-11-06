import { Request, Response, NextFunction } from "express";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_REQUESTS = 3; // Maximum 3 requests per hour

function cleanupExpiredEntries() {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}

setInterval(cleanupExpiredEntries, 5 * 60 * 1000); // Clean up every 5 minutes

export function rateLimitPasswordReset(req: Request, res: Response, next: NextFunction) {
  const email = req.body.email?.toLowerCase();
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  
  const keyEmail = `email:${email}`;
  const keyIp = `ip:${ip}`;
  
  const now = Date.now();
  
  if (!email) {
    return next();
  }
  
  // Check email-based rate limit
  if (store[keyEmail]) {
    if (store[keyEmail].resetTime > now) {
      if (store[keyEmail].count >= MAX_REQUESTS) {
        return res.json({ 
          message: "If that email exists, a reset link has been sent" 
        });
      }
      store[keyEmail].count++;
    } else {
      store[keyEmail] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
    }
  } else {
    store[keyEmail] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
  }
  
  // Check IP-based rate limit
  if (store[keyIp]) {
    if (store[keyIp].resetTime > now) {
      if (store[keyIp].count >= MAX_REQUESTS * 2) {
        return res.status(429).json({ 
          error: "Too many password reset requests. Please try again later." 
        });
      }
      store[keyIp].count++;
    } else {
      store[keyIp] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
    }
  } else {
    store[keyIp] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
  }
  
  next();
}
