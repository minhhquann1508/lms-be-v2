import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FooterLinkDto } from './footer-link.dto';

export class UpdateSiteSettingDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  logoAlt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  heroTitle?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  heroSubtitle?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  heroDescription?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  heroImageUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  heroShowStats?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  ctaTitle?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ctaDescription?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ctaButtonText?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  footerBrandName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  footerCopyright?: string;

  @ApiProperty({ required: false, type: [FooterLinkDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FooterLinkDto)
  footerLinks?: { label: string; url: string }[];
}
