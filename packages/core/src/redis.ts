import { Redis } from '@upstash/redis';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

export interface TokenBucketConfig {
  capacity: number;
  refillRate: number; // tokens per second
  keyPrefix?: string;
}

export class RedisClient {
  private redis: Redis;

  constructor(url: string, token: string) {
    this.redis = new Redis({
      url,
      token,
    });
  }

  // Basic Redis operations
  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.redis.setex(key, ttlSeconds, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async incr(key: string): Promise<number> {
    return await this.redis.incr(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.redis.expire(key, seconds);
  }

  // Rate limiting with sliding window
  async checkRateLimit(identifier: string, config: RateLimitConfig): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const key = `${config.keyPrefix || 'rate_limit'}:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Use Redis pipeline for atomic operations
    const pipeline = this.redis.pipeline();
    
    // Remove old entries
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // Count current requests
    pipeline.zcard(key);
    
    // Add current request
    pipeline.zadd(key, { score: now, member: `${now}-${Math.random()}` });
    
    // Set expiration
    pipeline.expire(key, Math.ceil(config.windowMs / 1000));

    const results = await pipeline.exec();
    const currentCount = results[1] as number;

    if (currentCount >= config.maxRequests) {
      // Remove the request we just added since it's not allowed
      await this.redis.zremrangebyrank(key, -1, -1);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + config.windowMs
      };
    }

    return {
      allowed: true,
      remaining: config.maxRequests - currentCount - 1,
      resetTime: now + config.windowMs
    };
  }

  // Token bucket rate limiting
  async checkTokenBucket(identifier: string, config: TokenBucketConfig, tokensRequested = 1): Promise<{
    allowed: boolean;
    tokensRemaining: number;
    retryAfter?: number;
  }> {
    const key = `${config.keyPrefix || 'token_bucket'}:${identifier}`;
    const now = Date.now();

    // Get current bucket state
    const bucketData = await this.redis.hmget(key, 'tokens', 'lastRefill');
    let tokens = bucketData?.[0] ? parseFloat(bucketData[0] as string) : config.capacity;
    let lastRefill = bucketData?.[1] ? parseInt(bucketData[1] as string) : now;

    // Calculate tokens to add based on time elapsed
    const timeDiff = (now - lastRefill) / 1000; // seconds
    const tokensToAdd = timeDiff * config.refillRate;
    tokens = Math.min(config.capacity, tokens + tokensToAdd);

    if (tokens >= tokensRequested) {
      // Allow request
      tokens -= tokensRequested;
      
      await this.redis.hmset(key, {
        tokens: tokens.toString(),
        lastRefill: now.toString()
      });
      
      await this.redis.expire(key, 3600); // 1 hour TTL

      return {
        allowed: true,
        tokensRemaining: Math.floor(tokens)
      };
    } else {
      // Deny request
      await this.redis.hmset(key, {
        tokens: tokens.toString(),
        lastRefill: now.toString()
      });
      
      await this.redis.expire(key, 3600);

      // Calculate retry after time
      const tokensNeeded = tokensRequested - tokens;
      const retryAfter = Math.ceil(tokensNeeded / config.refillRate);

      return {
        allowed: false,
        tokensRemaining: Math.floor(tokens),
        retryAfter
      };
    }
  }

  // Caching utilities
  async cache<T>(key: string, fetcher: () => Promise<T>, ttlSeconds = 300): Promise<T> {
    const cached = await this.get(key);
    
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // If parsing fails, continue to fetch fresh data
      }
    }

    const data = await fetcher();
    await this.set(key, JSON.stringify(data), ttlSeconds);
    return data;
  }

  async invalidateCache(pattern: string): Promise<void> {
    // Note: Upstash Redis doesn't support SCAN, so we'll use a simple approach
    // In production, you might want to maintain a set of cache keys
    await this.del(pattern);
  }

  // Distributed locking
  async acquireLock(lockKey: string, ttlSeconds = 30, retryDelayMs = 100, maxRetries = 10): Promise<string | null> {
    const lockValue = `${Date.now()}-${Math.random()}`;
    
    for (let i = 0; i < maxRetries; i++) {
      const result = await this.redis.set(lockKey, lockValue, {
        nx: true, // Only set if not exists
        ex: ttlSeconds // Expiration in seconds
      });

      if (result === 'OK') {
        return lockValue;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelayMs));
    }

    return null;
  }

  async releaseLock(lockKey: string, lockValue: string): Promise<boolean> {
    // Lua script to ensure we only delete the lock if we own it
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    const result = await this.redis.eval(script, [lockKey], [lockValue]);
    return result === 1;
  }

  // Queue operations (simple implementation)
  async enqueue(queueName: string, item: any): Promise<void> {
    await this.redis.lpush(queueName, JSON.stringify(item));
  }

  async dequeue(queueName: string): Promise<any | null> {
    const result = await this.redis.rpop(queueName);
    if (result) {
      try {
        return JSON.parse(result);
      } catch (e) {
        return result;
      }
    }
    return null;
  }

  async queueLength(queueName: string): Promise<number> {
    return await this.redis.llen(queueName);
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (e) {
      return false;
    }
  }

  // Cleanup
  async cleanup(): Promise<void> {
    // This would typically clean up expired keys, but Upstash handles this automatically
    // We can implement custom cleanup logic here if needed
  }
}

// Singleton instance
let redisClient: RedisClient | null = null;

export function createRedisClient(url: string, token: string): RedisClient {
  if (!redisClient) {
    redisClient = new RedisClient(url, token);
  }
  return redisClient;
}

export function getRedisClient(): RedisClient {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call createRedisClient first.');
  }
  return redisClient;
}

// Rate limiting middleware factory
export function createRateLimiter(config: RateLimitConfig) {
  return async (identifier: string): Promise<boolean> => {
    const client = getRedisClient();
    const result = await client.checkRateLimit(identifier, config);
    return result.allowed;
  };
}

// Token bucket middleware factory
export function createTokenBucket(config: TokenBucketConfig) {
  return async (identifier: string, tokensRequested = 1): Promise<{
    allowed: boolean;
    retryAfter?: number;
  }> => {
    const client = getRedisClient();
    const result = await client.checkTokenBucket(identifier, config, tokensRequested);
    return {
      allowed: result.allowed,
      retryAfter: result.retryAfter
    };
  };
}