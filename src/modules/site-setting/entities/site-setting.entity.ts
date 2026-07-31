import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('site_settings')
export class SiteSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'logo_url', length: 500, nullable: true })
  logoUrl: string;

  @Column({ name: 'logo_alt', length: 255, nullable: true })
  logoAlt: string;

  @Column({ name: 'hero_title', length: 500, default: '' })
  heroTitle: string;

  @Column({ name: 'hero_subtitle', length: 255, nullable: true })
  heroSubtitle: string;

  @Column({ name: 'hero_description', type: 'text', nullable: true })
  heroDescription: string;

  @Column({ name: 'hero_image_url', length: 500, nullable: true })
  heroImageUrl: string;

  @Column({ name: 'hero_show_stats', type: 'boolean', default: true })
  heroShowStats: boolean;

  @Column({ name: 'cta_title', length: 500, nullable: true })
  ctaTitle: string;

  @Column({ name: 'cta_description', type: 'text', nullable: true })
  ctaDescription: string;

  @Column({ name: 'cta_button_text', length: 100, nullable: true })
  ctaButtonText: string;

  @Column({ name: 'footer_brand_name', length: 255, default: '' })
  footerBrandName: string;

  @Column({ name: 'footer_copyright', length: 500, nullable: true })
  footerCopyright: string;

  @Column({ name: 'footer_links', type: 'jsonb', nullable: true, default: '[]' })
  footerLinks: { label: string; url: string }[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
