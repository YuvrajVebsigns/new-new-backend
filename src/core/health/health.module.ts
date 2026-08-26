import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { SystemHealthIndicator } from './system.health';
import { StorageHealthIndicator } from './storage.health';
import { FilesModule } from '@core/files/files.module';

@Module({
  imports: [TerminusModule, FilesModule],
  controllers: [HealthController],
  providers: [SystemHealthIndicator, StorageHealthIndicator],
  exports: [SystemHealthIndicator, StorageHealthIndicator, TerminusModule],
})
export class HealthModule {}
