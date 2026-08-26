import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as dns from 'dns';

export async function resolveMongoConnectionConfig(
  configService: ConfigService,
): Promise<any> {
  const configuredUri = configService.get<string>('MONGODB_URI');

  if (configuredUri?.startsWith('mongodb+srv://')) {
    try {
      dns.setServers(['1.1.1.1', '8.8.8.8']);
    } catch (err) {
      // If setting DNS servers fails, continue and allow Mongoose to use system DNS.
    }
  }

  const useMemoryDb =
    configService.get<string>('USE_MEMORY_DB') === 'true' ||
    configService.get('USE_MEMORY_DB') === true;
  const nodeEnv = configService.get<string>('NODE_ENV');

  if (nodeEnv !== 'production' && (!configuredUri || useMemoryDb)) {
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    return {
      uri,
      serverSelectionTimeoutMS: 3000,
      autoIndex: true,
      dbName: 'core-media-local',
      connectionFactory: (connection: any) => connection,
      retryWrites: false,
    };
  }

  return {
    uri: configuredUri,
    serverSelectionTimeoutMS: 3000,
    autoIndex: true,
    connectionFactory: (connection: any) => connection,
  };
}

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return resolveMongoConnectionConfig(configService);
      },
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
