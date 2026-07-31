import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteSetting } from './entities/site-setting.entity';
import { UpdateSiteSettingDto } from './dto/update-site-setting.dto';

const DEFAULT_SETTINGS: Partial<SiteSetting> = {
  heroTitle: 'Phát triển bản thân mỗi ngày\nvới khoá học chất lượng',
  heroSubtitle: 'Nền tảng học tập số 1 Việt Nam',
  heroDescription:
    'Hàng trăm khoá học online từ cơ bản đến nâng cao, giúp bạn thành thạo kỹ năng mới một cách nhanh chóng và hiệu quả.',
  heroShowStats: true,
  ctaTitle: 'Sẵn sàng bắt đầu hành trình học tập?',
  ctaDescription:
    'Tham gia cùng hàng ngàn học viên đang nâng cao kỹ năng mỗi ngày.\nTất cả hoàn toàn miễn phí — không rủi ro, không cam kết.',
  ctaButtonText: 'Khám phá ngay',
  footerBrandName: 'LMS Platform',
  footerCopyright: '© {year} LMS Platform. All rights reserved.',
  footerLinks: [
    { label: 'Trang chủ', url: '/' },
    { label: 'Khoá học', url: '/' },
  ],
};

@Injectable()
export class SiteSettingService {
  constructor(
    @InjectRepository(SiteSetting)
    private readonly siteSettingRepository: Repository<SiteSetting>,
  ) {}

  async getSettings(): Promise<SiteSetting> {
    const existing = await this.siteSettingRepository
      .createQueryBuilder('site_settings')
      .orderBy('site_settings.createdAt', 'ASC')
      .getOne();

    if (existing) {
      return existing;
    }

    const created = this.siteSettingRepository.create(DEFAULT_SETTINGS);
    return this.siteSettingRepository.save(created);
  }

  async updateSettings(dto: UpdateSiteSettingDto): Promise<SiteSetting> {
    const settings = await this.getSettings();

    if (dto.logoUrl !== undefined) settings.logoUrl = dto.logoUrl;
    if (dto.logoAlt !== undefined) settings.logoAlt = dto.logoAlt;
    if (dto.heroTitle !== undefined) settings.heroTitle = dto.heroTitle;
    if (dto.heroSubtitle !== undefined) settings.heroSubtitle = dto.heroSubtitle;
    if (dto.heroDescription !== undefined) settings.heroDescription = dto.heroDescription;
    if (dto.heroImageUrl !== undefined) settings.heroImageUrl = dto.heroImageUrl;
    if (dto.heroShowStats !== undefined) settings.heroShowStats = dto.heroShowStats;
    if (dto.ctaTitle !== undefined) settings.ctaTitle = dto.ctaTitle;
    if (dto.ctaDescription !== undefined) settings.ctaDescription = dto.ctaDescription;
    if (dto.ctaButtonText !== undefined) settings.ctaButtonText = dto.ctaButtonText;
    if (dto.footerBrandName !== undefined) settings.footerBrandName = dto.footerBrandName;
    if (dto.footerCopyright !== undefined) settings.footerCopyright = dto.footerCopyright;
    if (dto.footerLinks !== undefined) settings.footerLinks = dto.footerLinks;

    return this.siteSettingRepository.save(settings);
  }
}
