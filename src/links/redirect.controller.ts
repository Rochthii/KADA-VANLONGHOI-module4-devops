import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { LinksService } from './links.service';

@ApiTags('redirect')
@Controller()
export class RedirectController {
  constructor(private readonly linksService: LinksService) {}

  @Get(':code')
  @ApiOperation({ summary: 'Mở link ngắn (302 redirect, không cần API key)' })
  async redirect(@Param('code') code: string, @Res() res: Response) {
    const link = await this.linksService.resolve(code);
    res.redirect(302, link.originalUrl);
  }
}
