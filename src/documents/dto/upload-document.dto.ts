import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class UploadDocumentDto {
  @ApiProperty({ description: 'ID of the document owner', format: 'uuid' })
  @IsUUID()
  userId: string;
}
