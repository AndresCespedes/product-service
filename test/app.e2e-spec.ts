import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { LoggerService } from '../src/common/logger/logger.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  // Mock para el LoggerService
  const mockLoggerService = {
    context: 'AppControllerTest',
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    logRequest: jest.fn(),
    logResponse: jest.fn(),
    formatMessage: jest.fn(),
    setContext: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(LoggerService)
    .useValue(mockLoggerService)
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
