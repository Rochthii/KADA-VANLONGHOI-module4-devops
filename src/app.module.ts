import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CacheModule } from './cache/cache.module';
import { HealthModule } from './health/health.module';
import { LinksModule } from './links/links.module';

@Module({
  imports: [PrismaModule, CacheModule, HealthModule, LinksModule],
})
export class AppModule {}