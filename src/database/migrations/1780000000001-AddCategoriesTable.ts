import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoriesTable1780000000001 implements MigrationInterface {
  name = 'AddCategoriesTable1780000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "slug" character varying(255) NOT NULL,
        "description" text,
        "icon" character varying(500),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_categories" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "unique_categories_slug" ON "categories" ("slug")
    `);
    await queryRunner.query(`
      ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "category_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "courses" ADD CONSTRAINT "FK_courses_category"
      FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "courses" DROP CONSTRAINT IF EXISTS "FK_courses_category"`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" DROP COLUMN IF EXISTS "category_id"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "unique_categories_slug"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
  }
}
