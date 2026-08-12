import { StorageService } from './storage.service';

describe('StorageService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      S3_ENDPOINT: 'http://localhost:9000',
      S3_ACCESS_KEY: 'test-access-key',
      S3_SECRET_KEY: 'test-secret-key',
      S3_BUCKET: 'test-documents',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(new StorageService()).toBeDefined();
  });
});
