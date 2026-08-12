import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { CacheService } from '../src/cache/cache.service';
import { DocumentsService } from '../src/documents/documents.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { StorageService } from '../src/storage/storage.service';

describe('DocumentsController (e2e)', () => {
  const userId = '11111111-1111-4111-8111-111111111111';
  const documentId = '22222222-2222-4222-8222-222222222222';
  const document = {
    id: documentId,
    userId,
    originalFilename: 'hello.txt',
    storageKey: `${userId}/stored-file`,
    mimeType: 'text/plain',
    size: 5,
    createdAt: new Date('2026-08-12T00:00:00.000Z'),
  };
  const documentsService = {
    upload: jest.fn().mockResolvedValue(document),
    findByUser: jest.fn().mockResolvedValue([document]),
    findById: jest.fn().mockResolvedValue(document),
    download: jest.fn().mockResolvedValue({
      document,
      body: new Uint8Array(Buffer.from('hello')),
    }),
    remove: jest.fn().mockResolvedValue({ deleted: true }),
  };

  let app: INestApplication;

  beforeAll(async () => {
    process.env.API_KEY = 'test-api-key';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DocumentsService)
      .useValue(documentsService)
      .overrideProvider(StorageService)
      .useValue({ ensureBucketExists: jest.fn() })
      .overrideProvider(CacheService)
      .useValue({ get: jest.fn(), set: jest.fn(), del: jest.fn() })
      .overrideProvider(PrismaService)
      .useValue({ $connect: jest.fn(), $disconnect: jest.fn() })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /documents/upload uploads a multipart file', () =>
    request(app.getHttpServer())
      .post('/documents/upload')
      .set('x-api-key', 'test-api-key')
      .field('userId', userId)
      .attach('file', Buffer.from('hello'), 'hello.txt')
      .expect(201)
      .expect(({ body }) => expect(body.id).toBe(documentId)));

  it('GET /documents?userId= returns documents', () =>
    request(app.getHttpServer())
      .get('/documents')
      .query({ userId })
      .expect(200)
      .expect(({ body }) => expect(body).toHaveLength(1)));

  it('GET /documents/:id/download returns the stored file', () =>
    request(app.getHttpServer())
      .get(`/documents/${documentId}/download`)
      .expect(200)
      .expect('Content-Type', /text\/plain/)
      .expect('hello'));

  it('DELETE /documents/:id requires an API key', () =>
    request(app.getHttpServer())
      .delete(`/documents/${documentId}`)
      .expect(401));

  it('DELETE /documents/:id deletes the document', () =>
    request(app.getHttpServer())
      .delete(`/documents/${documentId}`)
      .set('x-api-key', 'test-api-key')
      .expect(200)
      .expect({ deleted: true }));
});
