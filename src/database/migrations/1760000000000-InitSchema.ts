import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1760000000000 implements MigrationInterface {
  name = 'InitSchema1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TABLE "question_options" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "question_id" uuid NOT NULL, "content" text NOT NULL, "is_correct" boolean NOT NULL DEFAULT false, "order" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_13be20e51c0738def32f00cf7d5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_question_options_question_id" ON "question_options" ("question_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "questions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quiz_id" uuid NOT NULL, "content" text NOT NULL, "type" character varying(50) NOT NULL DEFAULT 'multiple_choice', "order" integer NOT NULL, "points" integer NOT NULL DEFAULT '1', "code_template" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_08a6d4b0f49ff300bf3a0ca60ac" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_questions_quiz_id" ON "questions" ("quiz_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "quizzes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(255) NOT NULL, "description" text, "type" character varying(50) NOT NULL DEFAULT 'multiple_choice', "duration" integer, "passing_score" integer, "is_published" boolean NOT NULL DEFAULT false, "slug" character varying(255) NOT NULL, "course_id" uuid, "chapter_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_b24f0f7662cf6b3a0e7dba0a1b4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "unique_quizzes_slug" ON "quizzes" ("slug") `,
    );
    await queryRunner.query(
      `CREATE TABLE "lectures" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" text, "order" integer NOT NULL, "is_published" boolean NOT NULL DEFAULT false, "slug" character varying(255) NOT NULL, "video_url" character varying(512) NOT NULL, "chapter_id" uuid NOT NULL, "duration" integer NOT NULL DEFAULT '0', "quiz_id" uuid, "attributes" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_0fbf04287eb4e401af19caf7677" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "chapters" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" text, "order" integer NOT NULL, "is_published" boolean NOT NULL DEFAULT false, "slug" character varying(255) NOT NULL, "course_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_a2bbdbb4bdc786fe0cb0fcfc4a0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "description" text, "icon" character varying(500), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "unique_categories_slug" ON "categories" ("slug") `,
    );
    await queryRunner.query(
      `CREATE TABLE "courses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "thumbnail" character varying, "description" character varying, "duration" integer NOT NULL DEFAULT '0', "price" integer NOT NULL DEFAULT '0', "rating" double precision NOT NULL DEFAULT '0', "review_count" integer NOT NULL DEFAULT '0', "discussion_count" integer NOT NULL DEFAULT '0', "is_published" boolean NOT NULL DEFAULT false, "slug" character varying NOT NULL, "author_id" uuid NOT NULL, "category_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "lectureCount" integer, CONSTRAINT "PK_3f70a487cc718ad8eda4e6d58c9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "unique_courses_slug" ON "courses" ("slug") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."enrollments_status_enum" AS ENUM('pending', 'active', 'rejected', 'inactive', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "enrollments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "course_id" uuid NOT NULL, "status" "public"."enrollments_status_enum" NOT NULL, "notes" text, "learning_state" text, "full_name" character varying(255), "phone" character varying(20), "progress" integer NOT NULL DEFAULT '0', "start_at" TIMESTAMP NOT NULL, "completed_at" TIMESTAMP, "approved_at" TIMESTAMP, "reviewed_at" TIMESTAMP, "reviewed_by_id" uuid, "review_note" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7c0f752f9fb68bf6ed7367ab00f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "full_name" character varying(255) NOT NULL, "avatar" character varying(1000), "role_code" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "reset_token" character varying(255), "reset_token_expires" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "device_id" uuid NOT NULL, "refresh_token_hash" character varying NOT NULL, "status" character varying NOT NULL, "login_at" TIMESTAMP NOT NULL, "expired_at" TIMESTAMP NOT NULL, "logout_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sessions_user_status" ON "sessions" ("user_id", "status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "quiz_answers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "attempt_id" uuid NOT NULL, "question_id" uuid NOT NULL, "selected_option_id" uuid, "is_correct" boolean, "points_earned" double precision, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3fefbc8a840a41b6a15a4f9ca5e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_quiz_answers_attempt_id" ON "quiz_answers" ("attempt_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."quiz_attempts_status_enum" AS ENUM('in_progress', 'completed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "quiz_attempts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "quiz_id" uuid NOT NULL, "status" "public"."quiz_attempts_status_enum" NOT NULL DEFAULT 'in_progress', "score" double precision, "total_points" integer NOT NULL DEFAULT '0', "score_percentage" double precision, "started_at" TIMESTAMP NOT NULL, "completed_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a84a93fb092359516dc5b325b90" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_quiz_attempts_quiz_id" ON "quiz_attempts" ("quiz_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_quiz_attempts_user_id" ON "quiz_attempts" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "title" character varying(255) NOT NULL, "message" text NOT NULL, "type" character varying(50) NOT NULL, "link" character varying(500), "is_read" boolean NOT NULL DEFAULT false, "related_enrollment_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_user_id_is_read" ON "notifications" ("user_id", "is_read") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_user_id_created_at" ON "notifications" ("user_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "lecture_progresses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "enrollment_id" uuid NOT NULL, "lecture_id" uuid NOT NULL, "is_completed" boolean NOT NULL DEFAULT false, "watched_seconds" integer NOT NULL DEFAULT '0', "duration" integer NOT NULL DEFAULT '0', "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_773eb92f1de87154166cc83d6d3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."jobs_status_enum" AS ENUM('PENDING', 'PROCESSING', 'DONE', 'FAILED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "jobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying NOT NULL, "payload" jsonb NOT NULL, "status" "public"."jobs_status_enum" NOT NULL DEFAULT 'PENDING', "attempts" integer NOT NULL DEFAULT '0', "error" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cf0a6c42b72fcc7f7c237def345" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "devices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "device_uid" uuid NOT NULL, "device_name" character varying NOT NULL, "device_type" character varying NOT NULL, "os" character varying NOT NULL, "browser" character varying NOT NULL, "ip_address" character varying NOT NULL, "user_agent" character varying NOT NULL, "last_login_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b1514758245c12daf43486dd1f0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_devices_user_device_uid" ON "devices" ("user_id", "device_uid") `,
    );
    await queryRunner.query(
      `ALTER TABLE "question_options" ADD CONSTRAINT "FK_f0b7aaabd3f88e700daf0fe681c" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" ADD CONSTRAINT "FK_46b3c125e02f7242662e4ccb307" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" ADD CONSTRAINT "FK_e460dcb813c2cc28c93c95f2504" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" ADD CONSTRAINT "FK_a09d7fd8682390a16b9b3978a27" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lectures" ADD CONSTRAINT "FK_5ca7fcccae6a30edeee5bfa02c7" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lectures" ADD CONSTRAINT "FK_4732f41edbd67c8061608d8067d" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chapters" ADD CONSTRAINT "FK_9909a69a63f1d064b42ef35ab04" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" ADD CONSTRAINT "FK_cce7a734fa75f9f3051c50d3283" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" ADD CONSTRAINT "FK_e4c260fe6bb1131707c4617f745" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD CONSTRAINT "FK_b79d0bf01779fdf9cfb6b092af3" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD CONSTRAINT "FK_ff997f5a39cd24a491b9aca45c9" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_answers" ADD CONSTRAINT "FK_6fe76f6b4d4953d99e1672d1084" FOREIGN KEY ("attempt_id") REFERENCES "quiz_attempts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_answers" ADD CONSTRAINT "FK_fbe5e1758631924a83c73b521d9" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_answers" ADD CONSTRAINT "FK_edb0c9367fffab67a28fc988760" FOREIGN KEY ("selected_option_id") REFERENCES "question_options"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_attempts" ADD CONSTRAINT "FK_1701aaf48f6a78e96bfe08dd395" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_attempts" ADD CONSTRAINT "FK_a720e260138b64fcff2fca19b2d" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_4bf92790b7f9965a8da1f3f8944" FOREIGN KEY ("related_enrollment_id") REFERENCES "enrollments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_4bf92790b7f9965a8da1f3f8944"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_attempts" DROP CONSTRAINT "FK_a720e260138b64fcff2fca19b2d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_attempts" DROP CONSTRAINT "FK_1701aaf48f6a78e96bfe08dd395"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_answers" DROP CONSTRAINT "FK_edb0c9367fffab67a28fc988760"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_answers" DROP CONSTRAINT "FK_fbe5e1758631924a83c73b521d9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_answers" DROP CONSTRAINT "FK_6fe76f6b4d4953d99e1672d1084"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP CONSTRAINT "FK_ff997f5a39cd24a491b9aca45c9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP CONSTRAINT "FK_b79d0bf01779fdf9cfb6b092af3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" DROP CONSTRAINT "FK_e4c260fe6bb1131707c4617f745"`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" DROP CONSTRAINT "FK_cce7a734fa75f9f3051c50d3283"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chapters" DROP CONSTRAINT "FK_9909a69a63f1d064b42ef35ab04"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lectures" DROP CONSTRAINT "FK_4732f41edbd67c8061608d8067d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lectures" DROP CONSTRAINT "FK_5ca7fcccae6a30edeee5bfa02c7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" DROP CONSTRAINT "FK_a09d7fd8682390a16b9b3978a27"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" DROP CONSTRAINT "FK_e460dcb813c2cc28c93c95f2504"`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" DROP CONSTRAINT "FK_46b3c125e02f7242662e4ccb307"`,
    );
    await queryRunner.query(
      `ALTER TABLE "question_options" DROP CONSTRAINT "FK_f0b7aaabd3f88e700daf0fe681c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_devices_user_device_uid"`,
    );
    await queryRunner.query(`DROP TABLE "devices"`);
    await queryRunner.query(`DROP TABLE "jobs"`);
    await queryRunner.query(`DROP TYPE "public"."jobs_status_enum"`);
    await queryRunner.query(`DROP TABLE "lecture_progresses"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_notifications_user_id_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_notifications_user_id_is_read"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_quiz_attempts_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_quiz_attempts_quiz_id"`);
    await queryRunner.query(`DROP TABLE "quiz_attempts"`);
    await queryRunner.query(`DROP TYPE "public"."quiz_attempts_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_quiz_answers_attempt_id"`,
    );
    await queryRunner.query(`DROP TABLE "quiz_answers"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_sessions_user_status"`);
    await queryRunner.query(`DROP TABLE "sessions"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "enrollments"`);
    await queryRunner.query(`DROP TYPE "public"."enrollments_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."unique_courses_slug"`);
    await queryRunner.query(`DROP TABLE "courses"`);
    await queryRunner.query(`DROP INDEX "public"."unique_categories_slug"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TABLE "chapters"`);
    await queryRunner.query(`DROP TABLE "lectures"`);
    await queryRunner.query(`DROP INDEX "public"."unique_quizzes_slug"`);
    await queryRunner.query(`DROP TABLE "quizzes"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_questions_quiz_id"`);
    await queryRunner.query(`DROP TABLE "questions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_question_options_question_id"`,
    );
    await queryRunner.query(`DROP TABLE "question_options"`);
  }
}
