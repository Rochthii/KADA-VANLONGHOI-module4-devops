import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Check application, Postgres, and Redis health' })
  async check() {
    const postgresUp = await this.checkPostgres();
    const redisUp = await this.cache.checkConnection();

    return {
      status: postgresUp && redisUp ? 'ok' : 'degraded',
      postgres: postgresUp ? 'up' : 'down',
      redis: redisUp ? 'up' : 'down',
    };
  }

  private async checkPostgres(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
