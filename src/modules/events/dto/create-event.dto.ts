import {
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  source!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  entity!: string;

  @IsIn(['CREATE', 'UPDATE', 'DELETE', 'QUERY'])
  action!: 'CREATE' | 'UPDATE' | 'DELETE' | 'QUERY';

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
