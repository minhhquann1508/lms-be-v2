import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResetTokenColumnsToUser1780000000000 implements MigrationInterface {
  name = 'AddResetTokenColumnsToUser1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_token" character varying(255)
    `);
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_token_expires" timestamp with time zone
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "reset_token"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "reset_token_expires"`,
    );
  }
}
