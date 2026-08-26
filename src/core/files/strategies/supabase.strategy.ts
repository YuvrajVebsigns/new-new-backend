import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  IStorageProvider,
  UploadResult,
} from '@core/files/interfaces/storage-provider.interface';
import { FileVisibility } from '@core/files/enums/visibility.enum';

/**
 * Supabase Storage strategy — uses Supabase's S3-compatible backend.
 *
 * Supabase provides a managed PostgreSQL + Storage solution.
 * This strategy leverages its Storage API for file operations.
 */
@Injectable()
export class SupabaseStrategy implements IStorageProvider {
  private readonly logger = new Logger(SupabaseStrategy.name);
  private readonly supabase: SupabaseClient;
  private readonly bucket: string;
  private readonly cdnUrl: string;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');
    this.bucket = this.configService.get<string>(
      'SUPABASE_BUCKET',
      'media',
    );
    this.cdnUrl = this.configService.get<string>(
      'SUPABASE_CDN_URL',
      `${supabaseUrl}/storage/v1/object/public/${this.bucket}`,
    );

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_KEY must be set in environment variables',
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async upload(
    key: string,
    buffer: Buffer,
    mimeType: string,
    visibility: FileVisibility,
  ): Promise<UploadResult> {
    try {
      this.logger.log(
        `Uploading to Supabase: bucket=${this.bucket}, key=${key}, size=${buffer.length}`,
      );

      const { data, error } = await this.supabase.storage
        .from(this.bucket)
        .upload(key, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) {
        this.logger.error(
          `Supabase upload error: ${error.message} (bucket: ${this.bucket}, key: ${key})`,
        );
        throw new Error(`Supabase upload failed: ${error.message}`);
      }

      this.logger.log(`Successfully uploaded to Supabase: ${key}`);

      return {
        key,
        bucket: this.bucket,
        size: buffer.length,
      };
    } catch (error) {
      this.logger.error(
        `Supabase upload exception: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucket)
        .remove([key]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }

      this.logger.log(`Deleted from Supabase: ${key}`);
    } catch (error) {
      this.logger.error(`Supabase delete error: ${error.message}`);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucket)
        .list('', {
          limit: 1,
          search: key.split('/').pop(), // Just search by filename
        });

      if (error) {
        this.logger.warn(`Supabase exists check error: ${error.message}`);
        return false;
      }

      return data?.some((file) => file.name === key.split('/').pop()) ?? false;
    } catch (error) {
      this.logger.warn(`Supabase exists error: ${error.message}`);
      return false;
    }
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucket)
        .createSignedUrl(key, expiresInSeconds);

      if (error || !data) {
        throw new Error(`Failed to create signed URL: ${error?.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      this.logger.error(`Supabase signed URL error: ${error.message}`);
      throw error;
    }
  }

  async getPublicUrl(key: string): Promise<string> {
    // For public files, construct the URL directly
    return `${this.cdnUrl}/${key}`;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage.listBuckets();

      if (error) {
        this.logger.error(`Supabase Health Check Failed: ${error.message}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Supabase Health Check Error: ${error.message}`);
      return false;
    }
  }
}
