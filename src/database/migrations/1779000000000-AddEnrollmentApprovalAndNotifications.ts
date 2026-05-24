import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnrollmentApprovalAndNotifications1779000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "public"."enrollments_status_enum"
      ADD VALUE IF NOT EXISTS 'rejected'
    `);

    await queryRunner.query(`
      ALTER TABLE "enrollments"
      ADD COLUMN "learning_state" TEXT,
      ADD COLUMN "approved_at" TIMESTAMP,
      ADD COLUMN "reviewed_at" TIMESTAMP,
      ADD COLUMN "reviewed_by_id" UUID,
      ADD COLUMN "review_note" TEXT
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "title" character varying(255) NOT NULL,
        "message" text NOT NULL,
        "type" character varying(50) NOT NULL,
        "link" character varying(500),
        "is_read" boolean NOT NULL DEFAULT false,
        "related_enrollment_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications"
      ADD CONSTRAINT "FK_notifications_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications"
      ADD CONSTRAINT "FK_notifications_related_enrollment_id"
      FOREIGN KEY ("related_enrollment_id") REFERENCES "enrollments"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_user_id_created_at"
      ON "notifications" ("user_id", "created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_user_id_is_read"
      ON "notifications" ("user_id", "is_read")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_notifications_user_id_is_read"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_notifications_user_id_created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_related_enrollment_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);

    await queryRunner.query(`
      ALTER TABLE "enrollments"
      DROP COLUMN "review_note",
      DROP COLUMN "reviewed_by_id",
      DROP COLUMN "reviewed_at",
      DROP COLUMN "approved_at",
      DROP COLUMN "learning_state"
    `);
  }
}
