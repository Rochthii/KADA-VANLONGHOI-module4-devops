import { NotFoundException } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { DocumentsService } from './documents.service';

describe('DocumentsService', () => {
  const userId = '11111111-1111-4111-8111-111111111111';
  const documentId = '22222222-2222-4222-8222-222222222222';
  const document = {
    id: documentId,
    userId,
    originalFilename: 'report.pdf',
    storageKey: `${userId}/stored-file`,
    mimeType: 'application/pdf',
    size: 7,
    createdAt: new Date(),
  };

  const prisma = {
    user: { findUnique: jest.fn() },
    document: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };
  const storage = {
    uploadFile: jest.fn(),
    downloadFile: jest.fn(),
    deleteFile: jest.fn(),
  };
  const cache = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  let service: DocumentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DocumentsService(
      prisma as unknown as PrismaService,
      storage as unknown as StorageService,
      cache as unknown as CacheService,
    );
    prisma.user.findUnique.mockResolvedValue({ id: userId });
  });

  it('uploads metadata and invalidates the user cache', async () => {
    prisma.document.create.mockResolvedValue(document);
    const file = {
      buffer: Buffer.from('content'),
      mimetype: 'application/pdf',
      originalname: 'report.pdf',
      size: 7,
    } as Express.Multer.File;

    await expect(service.upload(userId, file)).resolves.toEqual(document);
    expect(storage.uploadFile).toHaveBeenCalled();
    expect(cache.del).toHaveBeenCalledWith(`documents:user:${userId}`);
  });

  it('returns cached documents without querying Document storage', async () => {
    cache.get.mockResolvedValue([document]);

    await expect(service.findByUser(userId)).resolves.toEqual([document]);
    expect(prisma.document.findMany).not.toHaveBeenCalled();
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('queries Prisma and caches a cache miss', async () => {
    cache.get.mockResolvedValue(null);
    prisma.document.findMany.mockResolvedValue([document]);

    await expect(service.findByUser(userId)).resolves.toEqual([document]);
    expect(prisma.document.findMany).toHaveBeenCalledWith({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    expect(cache.set).toHaveBeenCalledWith(
      `documents:user:${userId}`,
      [document],
      300,
    );
  });

  it('throws when the user does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.findByUser(userId)).rejects.toThrow(NotFoundException);
  });

  it('deletes the stored object, metadata and cache entry', async () => {
    prisma.document.findUnique.mockResolvedValue(document);
    prisma.document.delete.mockResolvedValue(document);

    await expect(service.remove(documentId)).resolves.toEqual({
      deleted: true,
    });
    expect(storage.deleteFile).toHaveBeenCalledWith(document.storageKey);
    expect(prisma.document.delete).toHaveBeenCalledWith({
      where: { id: documentId },
    });
    expect(cache.del).toHaveBeenCalledWith(`documents:user:${userId}`);
  });
});
