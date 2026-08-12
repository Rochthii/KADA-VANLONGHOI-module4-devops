import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    // Cleanup users before test
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await prisma.user.deleteMany({});
    await app.close();
  });

  it('GET /users -> should return empty list initially', () => {
    return request(app.getHttpServer())
      .get('/users')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it('POST /users -> should fail without API Key', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({ name: 'Test User', email: 'test@example.com' })
      .expect(401);
  });

  it('POST /users -> should create user with valid API Key', () => {
    const apiKey = process.env.API_KEY || 'secret-api-key';
    return request(app.getHttpServer())
      .post('/users')
      .set('x-api-key', apiKey)
      .send({ name: 'Test User', email: 'test@example.com' })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.email).toBe('test@example.com');
      });
  });
});
