import { Injectable, Inject } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.cacheManager.set('health_check', 'ok', 1000);
      const val = await this.cacheManager.get('health_check');
      const isHealthy = val === 'ok';

      if (!isHealthy) {
        throw new Error('Cache verification failed');
      }

      return this.getStatus(key, true, {
        type: 'in-memory',
        message: 'Running with in-memory cache',
      });
    } catch (error: any) {
      const result = this.getStatus(key, false, {
        message: error.message || 'Cache service unavailable',
      });
      throw new HealthCheckError('Cache check failed', result);
    }
  }
}
