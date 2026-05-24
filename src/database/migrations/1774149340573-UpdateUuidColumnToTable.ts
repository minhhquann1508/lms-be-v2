import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUuidColumnToTable1774149340573 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('chapters')) {
      await queryRunner.query(
        `ALTER TABLE "chapters" ALTER COLUMN "course_id" TYPE uuid USING "course_id"::uuid`,
      );
    }

    if (await queryRunner.hasTable('lectures')) {
      await queryRunner.query(
        `ALTER TABLE "lectures" ALTER COLUMN "chapter_id" TYPE uuid USING "chapter_id"::uuid`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('chapters')) {
      await queryRunner.query(
        `ALTER TABLE "chapters" ALTER COLUMN "course_id" TYPE uuid USING "course_id"::uuid`,
      );
    }

    if (await queryRunner.hasTable('lectures')) {
      await queryRunner.query(
        `ALTER TABLE "lectures" ALTER COLUMN "chapter_id" TYPE uuid USING "chapter_id"::uuid`,
      );
    }
  }
}
