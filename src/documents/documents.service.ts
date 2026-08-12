import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Document } from '@prisma/client';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class DocumentsService {
  private readonly cacheTtlSeconds = 300;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly cache: CacheService,
  ) {}

  async upload(userId: string, file: Express.Multer.File): Promise<Document> {
    await this.ensureUserExists(userId);
    const storageKey = `${userId}/${randomUUID()}`;

    await this.storage.uploadFile(storageKey, file.buffer, file.mimetype);
    try {
      const document = await this.prisma.document.create({
        data: {
          userId,
          originalFilename: file.originalname,
          storageKey,
          mimeType: file.mimetype || 'application/octet-stream',
          size: file.size,
        },
      });
      await this.cache.del(this.cacheKey(userId));
      return document;
    } catch (error) {
      await this.storage.deleteFile(storageKey).catch(() => undefined);
      throw error;
    }
  }

  async findByUser(userId: string): Promise<Document[]> {
    await this.ensureUserExists(userId);
    const key = this.cacheKey(userId);
    const cached = await this.cache.get<Document[]>(key);
    if (cached) {
      return cached;
    }

    const documents = await this.prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    await this.cache.set(key, documents, this.cacheTtlSeconds);
    return documents;
  }

  async findById(id: string): Promise<Document> {
    const document = await this.prisma.document.findUnique({ where: { id } });
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    return document;
  }

  async download(
    id: string,
  ): Promise<{ document: Document; body: Uint8Array }> {
    const document = await this.findById(id);
    const body = await this.storage.downloadFile(document.storageKey);
    return { document, body };
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const document = await this.findById(id);
    await this.storage.deleteFile(document.storageKey);
    await this.prisma.document.delete({ where: { id } });
    await this.cache.del(this.cacheKey(document.userId));
    return { deleted: true };
  }

  private async ensureUserExists(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  private cacheKey(userId: string): string {
    return `documents:user:${userId}`;
  }
}
