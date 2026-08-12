import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { LinksService } from './links.service';
import { ShortenDto } from './dto/shorten.dto';
import { ApiKeyGuard } from '../auth/api-key.guard';

@ApiTags('links')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('api')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post('shorten')
  @ApiOperation({ summary: 'Rút gọn một URL' })
  async shorten(@Body() dto: ShortenDto, @Req() req: Request) {
    const link = await this.linksService.shorten(dto);
    const base = `${req.protocol}://${req.get('host')}`;
    return { ...link, shortUrl: `${base}/${link.code}` };
  }

  @Get('links')
  @ApiOperation({ summary: 'Danh sách link + lượt truy cập' })
  findAll() {
    return this.linksService.findAll();
  }

  @Get('links/:code')
  @ApiOperation({ summary: 'Thống kê một link' })
  findOne(@Param('code') code: string) {
    return this.linksService.findOne(code);
  }

  @Delete('links/:code')
  @HttpCode(204)
  @ApiOperation({ summary: 'Xoá một link' })
  remove(@Param('code') code: string) {
    return this.linksService.remove(code);
  }
}
