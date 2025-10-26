/**
 * Comprehensive Rate Limiting System for MetaPulse
 * Handles rate limiting for all external APIs: Twitter, Groq, Google, DexScreener, etc.
 */
export class RateLimiter {
    limits = new Map();
    configs = new Map();
    constructor() {
        this.setupDefaultConfigs();
    }
    setupDefaultConfigs() {
        // Twitter API v2 Rate Limits
        this.configs.set('twitter:search', {
            maxRequests: 300,
            windowMs: 15 * 60 * 1000, // 15 minutes
            retryAfterMs: 15 * 60 * 1000,
            burstLimit: 10
        });
        this.configs.set('twitter:user_lookup', {
            maxRequests: 300,
            windowMs: 15 * 60 * 1000,
            retryAfterMs: 15 * 60 * 1000
        });
        // Groq API Rate Limits
        this.configs.set('groq:chat', {
            maxRequests: 30,
            windowMs: 60 * 1000, // 1 minute
            retryAfterMs: 60 * 1000,
            burstLimit: 5
        });
        // Google APIs (various services)
        this.configs.set('google:search', {
            maxRequests: 100,
            windowMs: 24 * 60 * 60 * 1000, // 24 hours
            retryAfterMs: 60 * 60 * 1000 // 1 hour
        });
        this.configs.set('google:translate', {
            maxRequests: 1000,
            windowMs: 60 * 1000, // 1 minute
            retryAfterMs: 60 * 1000
        });
        // DexScreener API
        this.configs.set('dexscreener:search', {
            maxRequests: 300,
            windowMs: 60 * 1000, // 1 minute
            retryAfterMs: 60 * 1000,
            burstLimit: 10
        });
        this.configs.set('dexscreener:pairs', {
            maxRequests: 300,
            windowMs: 60 * 1000,
            retryAfterMs: 60 * 1000
        });
        // PumpPortal API
        this.configs.set('pumpportal:token', {
            maxRequests: 100,
            windowMs: 60 * 1000,
            retryAfterMs: 60 * 1000
        });
        // CoinGecko API
        this.configs.set('coingecko:price', {
            maxRequests: 50,
            windowMs: 60 * 1000,
            retryAfterMs: 60 * 1000
        });
        // Internal API rate limits
        this.configs.set('internal:analysis', {
            maxRequests: 1000,
            windowMs: 60 * 1000,
            retryAfterMs: 1000
        });
    }
    /**
     * Check if a request is allowed for the given service
     */
    async checkLimit(service) {
        const config = this.configs.get(service);
        if (!config) {
            console.warn(`No rate limit config found for service: ${service}`);
            return { allowed: true };
        }
        const now = Date.now();
        const entry = this.limits.get(service) || {
            count: 0,
            resetTime: now + config.windowMs,
            lastRequest: 0
        };
        // Reset window if expired
        if (now >= entry.resetTime) {
            entry.count = 0;
            entry.resetTime = now + config.windowMs;
        }
        // Check burst limit (requests too close together)
        if (config.burstLimit && now - entry.lastRequest < (config.windowMs / config.burstLimit)) {
            return {
                allowed: false,
                retryAfter: Math.ceil((config.windowMs / config.burstLimit) - (now - entry.lastRequest)),
                remaining: Math.max(0, config.maxRequests - entry.count)
            };
        }
        // Check main rate limit
        if (entry.count >= config.maxRequests) {
            return {
                allowed: false,
                retryAfter: entry.resetTime - now,
                remaining: 0
            };
        }
        // Request allowed
        entry.count++;
        entry.lastRequest = now;
        this.limits.set(service, entry);
        return {
            allowed: true,
            remaining: Math.max(0, config.maxRequests - entry.count)
        };
    }
    /**
     * Execute a function with rate limiting
     */
    async execute(service, fn, options = {}) {
        const { maxRetries = 3, backoffMs = 1000 } = options;
        let retries = 0;
        while (retries <= maxRetries) {
            const limitCheck = await this.checkLimit(service);
            if (limitCheck.allowed) {
                try {
                    return await fn();
                }
                catch (error) {
                    // Handle rate limit errors from the API itself
                    if (this.isRateLimitError(error)) {
                        const retryAfter = this.extractRetryAfter(error) || backoffMs * Math.pow(2, retries);
                        console.warn(`Rate limited by ${service} API, retrying after ${retryAfter}ms`);
                        await this.sleep(retryAfter);
                        retries++;
                        continue;
                    }
                    throw error;
                }
            }
            else {
                if (retries >= maxRetries) {
                    throw new Error(`Rate limit exceeded for ${service}. Max retries reached.`);
                }
                const waitTime = limitCheck.retryAfter || backoffMs * Math.pow(2, retries);
                console.warn(`Rate limited for ${service}, waiting ${waitTime}ms before retry ${retries + 1}/${maxRetries}`);
                await this.sleep(waitTime);
                retries++;
            }
        }
        throw new Error(`Rate limit exceeded for ${service} after ${maxRetries} retries`);
    }
    /**
     * Get current status for a service
     */
    getStatus(service) {
        const config = this.configs.get(service);
        const entry = this.limits.get(service);
        if (!config || !entry) {
            return { remaining: -1, resetTime: 0, isLimited: false };
        }
        const now = Date.now();
        const remaining = Math.max(0, config.maxRequests - entry.count);
        const isLimited = remaining === 0 && now < entry.resetTime;
        return {
            remaining,
            resetTime: entry.resetTime,
            isLimited
        };
    }
    /**
     * Get all service statuses
     */
    getAllStatuses() {
        const statuses = {};
        for (const service of this.configs.keys()) {
            statuses[service] = this.getStatus(service);
        }
        return statuses;
    }
    /**
     * Update rate limit config for a service
     */
    updateConfig(service, config) {
        this.configs.set(service, config);
    }
    /**
     * Reset limits for a service (useful for testing)
     */
    resetLimits(service) {
        if (service) {
            this.limits.delete(service);
        }
        else {
            this.limits.clear();
        }
    }
    isRateLimitError(error) {
        if (!error)
            return false;
        // HTTP status codes
        if (error.status === 429 || error.statusCode === 429)
            return true;
        // Common rate limit error messages
        const message = (error.message || '').toLowerCase();
        return message.includes('rate limit') ||
            message.includes('too many requests') ||
            message.includes('quota exceeded') ||
            message.includes('rate exceeded');
    }
    extractRetryAfter(error) {
        // Try to extract Retry-After header
        if (error.headers && error.headers['retry-after']) {
            const retryAfter = parseInt(error.headers['retry-after']);
            return isNaN(retryAfter) ? null : retryAfter * 1000; // Convert to ms
        }
        // Try to extract from error message
        const message = error.message || '';
        const match = message.match(/retry.*?(\d+).*?(second|minute|hour)/i);
        if (match) {
            const value = parseInt(match[1]);
            const unit = match[2].toLowerCase();
            switch (unit) {
                case 'second': return value * 1000;
                case 'minute': return value * 60 * 1000;
                case 'hour': return value * 60 * 60 * 1000;
            }
        }
        return null;
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
// Export singleton instance
export const rateLimiter = new RateLimiter();
