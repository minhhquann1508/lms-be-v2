import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDashboardAnalyticsColumnsToCourses1777000000000 implements MigrationInterface {
  name = 'AddDashboardAnalyticsColumnsToCourses1777000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "courses"
      ADD COLUMN IF NOT EXISTS "price" integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "rating" double precision NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "review_count" integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "discussion_count" integer NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "courses"
      DROP COLUMN IF EXISTS "discussion_count",
      DROP COLUMN IF EXISTS "review_count",
      DROP COLUMN IF EXISTS "rating",
      DROP COLUMN IF EXISTS "price"
    `);
  }
}
