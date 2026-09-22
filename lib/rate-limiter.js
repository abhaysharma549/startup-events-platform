/**
 * Simple in-memory rate limiter for API endpoints
 * Tracks requests per IP/user within a time window
 */

class RateLimiter {
    constructor(windowMs = 15 * 60 * 1000, maxRequests = 100) {
        this.windowMs = windowMs; // Time window in milliseconds (default: 15 min)
        this.maxRequests = maxRequests; // Max requests per window (default: 100)
        this.requests = new Map(); // Store request counts per key
    }

    getKey(req) {
        // Use IP address as the key, fallback to user ID if available
        return req.user?.id || req.ip || req.connection.remoteAddress || 'unknown';
    }

    isLimited(req) {
        const key = this.getKey(req);
        const now = Date.now();
        
        if (!this.requests.has(key)) {
            this.requests.set(key, { count: 1, resetTime: now + this.windowMs });
            return false;
        }
        
        const data = this.requests.get(key);
        
        // Check if window has expired
        if (now > data.resetTime) {
            this.requests.set(key, { count: 1, resetTime: now + this.windowMs });
            return false;
        }
        
        // Check if limit exceeded
        if (data.count >= this.maxRequests) {
            return true;
        }
        
        // Increment count
        data.count++;
        return false;
    }

    getRemainingRequests(req) {
        const key = this.getKey(req);
        const now = Date.now();
        
        if (!this.requests.has(key)) {
            return this.maxRequests;
        }
        
        const data = this.requests.get(key);
        
        if (now > data.resetTime) {
            return this.maxRequests;
        }
        
        return Math.max(0, this.maxRequests - data.count);
    }

    getResetTime(req) {
        const key = this.getKey(req);
        
        if (!this.requests.has(key)) {
            return null;
        }
        
        const data = this.requests.get(key);
        return new Date(data.resetTime);
    }

    middleware() {
        return (req, res, next) => {
            if (this.isLimited(req)) {
                const resetTime = this.getResetTime(req);
                return res.status(429).json({
                    error: 'Too many requests',
                    message: `Rate limit exceeded. Try again after ${resetTime.toISOString()}`,
                    retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
                });
            }
            
            // Add rate limit info to response headers
            res.set('X-RateLimit-Limit', this.maxRequests.toString());
            res.set('X-RateLimit-Remaining', this.getRemainingRequests(req).toString());
            res.set('X-RateLimit-Reset', this.getResetTime(req)?.toISOString() || 'N/A');
            
            next();
        };
    }

    // Cleanup old entries to prevent memory leak
    cleanup() {
        const now = Date.now();
        for (const [key, data] of this.requests.entries()) {
            if (now > data.resetTime + this.windowMs) {
                this.requests.delete(key);
            }
        }
    }
}

module.exports = RateLimiter;
