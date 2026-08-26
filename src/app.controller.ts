import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';
import { MongooseHealthIndicator } from '@nestjs/terminus';
import { StorageHealthIndicator } from '@core/health/storage.health';
import { SkipThrottle } from '@nestjs/throttler';

@ApiExcludeController()
@SkipThrottle()
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly mongoose: MongooseHealthIndicator,
    private readonly storage: StorageHealthIndicator,
  ) {}

  @Get()
  getHello(): string {
    return 'Vishwasai Consultancy API is running';
  }

  @Get('test-connection')
  @ApiOperation({
    summary: 'Test backend connection and all dependent services',
  })
  async testConnection() {
    const services: any = {};
    const nodeEnv = process.env.NODE_ENV || 'development';

    // Check MongoDB
    try {
      await this.mongoose.pingCheck('database');
      const mongoUri = process.env.MONGODB_URI || '';
      const isLocal =
        mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1');
      const isAtlas = mongoUri.includes('mongodb.net');

      services.database = {
        status: 'up',
        type: isLocal ? 'local' : isAtlas ? 'atlas-cluster' : 'custom-server',
        environment: nodeEnv,
      };
    } catch (e) {
      services.database = { status: 'down', message: e.message };
    }

    // Check Storage (Bucket)
    try {
      await this.storage.isHealthy('storage');
      const storageProvider = process.env.STORAGE_PROVIDER || 'local';
      services.storage = {
        status: 'up',
        type: storageProvider.toLowerCase(),
      };
    } catch (e) {
      services.storage = { status: 'down', message: e.message };
    }

    const allUp = Object.values(services).every((s: any) => s.status === 'up');

    return {
      status: allUp ? 'online' : 'partial_outage',
      message: allUp
        ? 'Vishwasai Consultancy API and all services are fully operational.'
        : 'Vishwasai Consultancy API is reachable but some services are down.',
      services,
      serverTime: new Date().toISOString(),
      environment: nodeEnv,
      connectivity: true,
    };
  }
}
