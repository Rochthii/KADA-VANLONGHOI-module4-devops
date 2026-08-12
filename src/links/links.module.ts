import { Module } from '@nestjs/common';
import { CacheModule } from '../cache/cache.module';
import { LinksService } from './links.service';
import { LinksController } from './links.controller';
import { RedirectController } from './redirect.controller';
import { WebController } from '../web.controller';

@Module({
  imports: [CacheModule],
  controllers: [LinksController, RedirectController, WebController],
  providers: [LinksService],
})
export class LinksModule {}
