import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSiteSettings1760000000001 implements MigrationInterface {
  name = 'AddSiteSettings1760000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "site_settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "logo_url" character varying(500),
        "logo_alt" character varying(255),
        "hero_title" character varying(500) NOT NULL DEFAULT '',
        "hero_subtitle" character varying(255),
        "hero_description" text,
        "hero_image_url" character varying(500),
        "hero_show_stats" boolean NOT NULL DEFAULT true,
        "cta_title" character varying(500),
        "cta_description" text,
        "cta_button_text" character varying(100),
        "footer_brand_name" character varying(255) NOT NULL DEFAULT '',
        "footer_copyright" character varying(500),
        "footer_links" jsonb DEFAULT '[]',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_site_settings" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `INSERT INTO "site_settings" (
        "hero_title", "hero_subtitle", "hero_description", "hero_show_stats",
        "cta_title", "cta_description", "cta_button_text",
        "footer_brand_name", "footer_copyright", "footer_links"
      ) VALUES (
        'Phát triển bản thân mỗi ngày\nvới khoá học chất lượng',
        'Nền tảng học tập số 1 Việt Nam',
        'Hàng trăm khoá học online từ cơ bản đến nâng cao, giúp bạn thành thạo kỹ năng mới một cách nhanh chóng và hiệu quả.',
        true,
        'Sẵn sàng bắt đầu hành trình học tập?',
        'Tham gia cùng hàng ngàn học viên đang nâng cao kỹ năng mỗi ngày.\nTất cả hoàn toàn miễn phí — không rủi ro, không cam kết.',
        'Khám phá ngay',
        'LMS Platform',
        '© {year} LMS Platform. All rights reserved.',
        '[{"label": "Trang chủ", "url": "/"}, {"label": "Khoá học", "url": "/"}]'
      )`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "site_settings"`);
  }
}
