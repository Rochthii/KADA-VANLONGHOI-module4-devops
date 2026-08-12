import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { LinksService } from './links/links.service';
import { ShortenDto } from './links/dto/shorten.dto';

@ApiTags('web')
@Controller('web')
export class WebController {
  constructor(private readonly linksService: LinksService) {}

  @Post('shorten')
  @ApiOperation({ summary: 'Rút gọn URL (dành cho trang web, không cần API key)' })
  async shorten(@Body() dto: ShortenDto, @Req() req: Request) {
    const link = await this.linksService.shorten(dto);
    const base = `${req.protocol}://${req.get('host')}`;
    return { ...link, shortUrl: `${base}/${link.code}` };
  }

  @Get('links')
  @ApiOperation({ summary: 'Danh sách link (dành cho trang web)' })
  findAll() {
    return this.linksService.findAll();
  }

  @Get('links/:code')
  @ApiOperation({ summary: 'Thống kê một link (dành cho trang web)' })
  findOne(@Param('code') code: string) {
    return this.linksService.findOne(code);
  }

  @Delete('links/:code')
  @HttpCode(204)
  @ApiOperation({ summary: 'Xoá link (dành cho trang web)' })
  remove(@Param('code') code: string) {
    return this.linksService.remove(code);
  }
}
