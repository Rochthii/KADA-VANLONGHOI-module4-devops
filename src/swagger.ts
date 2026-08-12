import { NestFactory } from '@nestjs/core';
import { writeFileSync } from 'fs';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function exportSwaggerJson(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Document Management API')
    .setDescription('A small NestJS backend for learning Docker and DevOps')
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  writeFileSync('swagger.json', JSON.stringify(swaggerDocument, null, 2));

  process.exit(0);
}

void exportSwaggerJson();
