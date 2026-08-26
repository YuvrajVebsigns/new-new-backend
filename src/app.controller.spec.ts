import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseHealthIndicator } from '@nestjs/terminus';
import { StorageHealthIndicator } from '@core/health/storage.health';

describe('AppController', () => {
  let appController: AppController;

  const mockMongooseHealthIndicator = {
    pingCheck: jest.fn(),
  };

  const mockStorageHealthIndicator = {
    isHealthy: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: MongooseHealthIndicator,
          useValue: mockMongooseHealthIndicator,
        },
        {
          provide: StorageHealthIndicator,
          useValue: mockStorageHealthIndicator,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return status message', () => {
      expect(appController.getHello()).toBe('Vishwasai Consultancy API is running');
    });
  });
});
