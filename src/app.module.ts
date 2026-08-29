import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard, seconds } from '@nestjs/throttler';
import { CacheModule, CacheInterceptor } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '@core/auth/auth.module';
import { SystemUsersModule } from '@core/system-users/system-users.module';
import { RolesModule } from '@core/roles/roles.module';
import { SeedModule } from '@database/seed.module';
import { HealthModule } from '@core/health/health.module';
import { JobsModule } from '@core/jobs/jobs.module';
import { EventsModule } from '@modules/events/events.module';
import { FeatureFlagModule } from '@core/feature-flags/feature-flag.module';
import { DatabaseModule } from '@database/database.module';
import { EventManagementModule } from '@modules/event-management/event-management.module';
import { AttendeesModule } from '@modules/attendees/attendees.module';
import { SidebarMenuModule } from '@core/sidebar-menu/sidebar-menu.module';
import { WebsitesModule } from '@modules/websites/websites.module';
import { BlogsModule } from '@modules/blogs/blogs.module';
import { FilesModule } from '@core/files/files.module';
import { SponsorsModule } from '@modules/sponsors/sponsors.module';
import { ContactsModule } from '@modules/contacts/contacts.module';
import { NominationsModule } from '@modules/nominations/nominations.module';
import { ReportsModule } from '@modules/reports/reports.module';
import { ClsModule } from 'nestjs-cls';
import { WebhookModule } from './webhook/webhook.module';
import { CommunicationsModule } from '@modules/communications/communications.module';
import { DeploymentsModule } from '@modules/deployments/deployments.module';
import { AnalyticsModule } from '@modules/analytics/analytics.module';
import { randomUUID } from 'crypto';
import { RoleCacheInterceptor } from '@common/interceptors/role-cache.interceptor';
import { ResponseInterceptor } from '@common/interceptors/response.interceptor';

const nodeEnv = process.env.NODE_ENV || 'development';
const envFilePath = fs.existsSync(`.env.${nodeEnv}`)
  ? `.env.${nodeEnv}`
  : fs.existsSync('.env.local')
    ? '.env.local'
    : '.env';

const envConfig = fs.existsSync(envFilePath)
  ? dotenv.parse(fs.readFileSync(envFilePath))
  : {};

const redisQueueImports = [];

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      envFilePath,
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(5051),
        HOST: Joi.string().default('0.0.0.0'),
        JWT_SECRET: Joi.string().required(),
        MONGODB_URI: Joi.string().uri().required(),
        STORAGE_PROVIDER: Joi.string().optional().default('local'),
        STORAGE_ENV: Joi.string().optional(),
        S3_ENDPOINT: Joi.string().optional(),
        S3_ACCESS_KEY_ID: Joi.string().optional(),
        S3_SECRET_ACCESS_KEY: Joi.string().optional(),
        S3_BUCKET: Joi.string().optional(),
        S3_REGION: Joi.string().optional(),
        S3_FORCE_PATH_STYLE: Joi.boolean().optional(),
        UPLOADS_DIR: Joi.string().optional().default('./uploads'),
        CDN_URL: Joi.string().optional(),
      }),
    }),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req: any) =>
          req.headers['x-correlation-id'] || randomUUID(),
      },
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'short',
          ttl: seconds(1),
          limit: 10,
        },
        {
          name: 'medium',
          ttl: seconds(60),
          limit: 100,
        },
        {
          name: 'long',
          ttl: seconds(3600),
          limit: 5000,
        },
      ],
      // Enable rate-limit response headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)
      setHeaders: true,
      // Custom 429 error message
      errorMessage:
        'Rate limit exceeded. Please slow down and try again later.',
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async () => ({
        ttl: 60 * 1000,
      }),
    }),
    DatabaseModule,
    AuthModule,
    SystemUsersModule,
    RolesModule,
    SeedModule,
    HealthModule,
    EventsModule,
    EventManagementModule,
    AttendeesModule,
    FeatureFlagModule,
    SidebarMenuModule,
    WebsitesModule,
    BlogsModule,
    FilesModule,
    SponsorsModule,
    ContactsModule,
    NominationsModule,
    ReportsModule,
    WebhookModule,
    CommunicationsModule,
    DeploymentsModule,
    AnalyticsModule,
    ...redisQueueImports,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RoleCacheInterceptor,
    },
  ],
})
export class AppModule {}
