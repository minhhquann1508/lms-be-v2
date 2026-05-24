import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNoteColumnToEnrollment1774778664807 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "enrollments"
              ADD "notes" TEXT,
              ADD "phone" VARCHAR(20),
              ADD "full_name" VARCHAR(255)
              `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "enrollments"
        DROP COLUMN "notes",
        DROP COLUMN "phone",
        DROP COLUMN "full_name"
        `,
    );
  }
}
