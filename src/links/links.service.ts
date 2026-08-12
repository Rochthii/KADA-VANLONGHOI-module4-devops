import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { ShortenDto } from './dto/shorten.dto';
import { Link } from '@prisma/client';

const CODE_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

@Injectable()
export class LinksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  private cacheKey(code: string): string {
    return `link:${code}`;
  }

  private generateCode(): string {
    const bytes = randomBytes(6);
    let out = '';
    for (const b of bytes) {
      out += CODE_CHARS[b % CODE_CHARS.length];
    }
    return out;
  }

  async shorten(dto: ShortenDto): Promise<Link> {
    let code = this.generateCode();
    while (await this.prisma.link.findUnique({ where: { code } })) {
      code = this.generateCode();
    }
    return this.prisma.link.create({
      data: { code, originalUrl: dto.originalUrl },
    });
  }

  async resolve(code: string): Promise<Link> {
    const cached = await this.cache.get<{ originalUrl: string }>(this.cacheKey(code));
    if (cached) {
      void this.prisma.link
        .update({ where: { code }, data: { clicks: { increment: 1 } } })
        .catch(() => {});
      return { id: '', code, originalUrl: cached.originalUrl, clicks: 0, createdAt: new Date() };
    }

    const link = await this.prisma.link.findUnique({ where: { code } });
    if (!link) {
      throw new NotFoundException(`Short link "${code}" not found`);
    }

    await this.cache.set(this.cacheKey(code), { originalUrl: link.originalUrl }, 60 * 60);
    await this.prisma.link.update({
      where: { code },
      data: { clicks: { increment: 1 } },
    });
    return link;
  }

  findAll(): Promise<Link[]> {
    return this.prisma.link.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(code: string): Promise<Link> {
    const link = await this.prisma.link.findUnique({ where: { code } });
    if (!link) {
      throw new NotFoundException(`Short link "${code}" not found`);
    }
    return link;
  }

  async remove(code: string): Promise<void> {
    await this.findOne(code);
    await this.prisma.link.delete({ where: { code } });
    await this.cache.del(this.cacheKey(code));
  }
}
