import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAttributeColumnIntoLectureTable1769877978680 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "lectures"
      ADD COLUMN IF NOT EXISTS "attributes" JSONB,
      ADD COLUMN IF NOT EXISTS "duration" INTEGER DEFAULT 0;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "lectures"
      DROP COLUMN IF EXISTS "attributes",
      DROP COLUMN IF EXISTS "duration";
    `);
  }
}
