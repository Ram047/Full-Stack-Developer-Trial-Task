import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  retryAfter: number; // in seconds
}

/**
 * Token bucket rate limiter backed by SQLite database.
 * Key can be IP address, account email, or route identifier.
 * Default: 5 attempts per 15 minutes = 5 tokens capacity, refill rate of 5 tokens / 900 seconds.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = new Date();
  const fillRatePerMs = limit / windowMs; // tokens per ms

  try {
    // Transactional read/write to ensure atomicity in SQLite
    return await prisma.$transaction(async (tx) => {
      const bucket = await tx.rateLimitBucket.findUnique({
        where: { key },
      });

      if (!bucket) {
        // First request: create bucket with limit - 1 tokens
        await tx.rateLimitBucket.create({
          data: {
            key,
            tokens: limit - 1,
            lastRefilled: now,
          },
        });

        return {
          success: true,
          limit,
          remaining: limit - 1,
          retryAfter: 0,
        };
      }

      // Calculate how many tokens to add since last refill
      const elapsedMs = now.getTime() - new Date(bucket.lastRefilled).getTime();
      const tokensToAdd = elapsedMs * fillRatePerMs;
      const currentTokens = Math.min(limit, bucket.tokens + tokensToAdd);

      if (currentTokens >= 1) {
        const remainingTokens = currentTokens - 1;
        await tx.rateLimitBucket.update({
          where: { key },
          data: {
            tokens: remainingTokens,
            lastRefilled: now,
          },
        });

        return {
          success: true,
          limit,
          remaining: Math.floor(remainingTokens),
          retryAfter: 0,
        };
      } else {
        // Bucket is empty: calculate how long to wait until 1 token is available
        const missingTokens = 1 - currentTokens;
        const retryAfterMs = missingTokens / fillRatePerMs;
        const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));

        return {
          success: false,
          limit,
          remaining: 0,
          retryAfter: retryAfterSeconds,
        };
      }
    });
  } catch (error) {
    console.error('Rate limiting database error:', error);
    // Fallback to allow request on database error (fail-open)
    return {
      success: true,
      limit,
      remaining: 1,
      retryAfter: 0,
    };
  }
}
