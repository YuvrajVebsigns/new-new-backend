import { ConfigService } from '@nestjs/config';
import { resolveMongoConnectionConfig } from './database.module';

describe('resolveMongoConnectionConfig', () => {
  it('uses a local in-memory MongoDB instance when memory fallback is enabled', async () => {
    const configService = {
      get: (key: string) => {
        switch (key) {
          case 'MONGODB_URI':
            return '';
          case 'NODE_ENV':
            return 'development';
          case 'USE_MEMORY_DB':
            return 'true';
          default:
            return undefined;
        }
      },
    } as unknown as ConfigService;

    const result = await resolveMongoConnectionConfig(configService);

    expect(result.uri).toBeDefined();
    expect(result.uri).toContain('mongodb://');
    expect(result.autoIndex).toBe(true);
  });
});
