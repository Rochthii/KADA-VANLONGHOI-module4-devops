import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class DocumentQueryDto {
  @ApiProperty({ description: 'ID of the document owner', format: 'uuid' })
  @IsUUID()
  userId: string;
}
