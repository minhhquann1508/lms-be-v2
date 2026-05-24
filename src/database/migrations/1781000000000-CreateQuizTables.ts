import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateQuizTables1781000000000 implements MigrationInterface {
  name = 'CreateQuizTables1781000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'quiz_attempts_status_enum' AND n.nspname = 'public'
        ) THEN
          CREATE TYPE "public"."quiz_attempts_status_enum" AS ENUM ('in_progress', 'completed');
        END IF;
      END
      $$;
    `);

    const tablesExist = await queryRunner.hasTable('quizzes');
    if (!tablesExist) {
      await queryRunner.query(`
        CREATE TABLE "quizzes" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "title" character varying(255) NOT NULL,
          "description" text,
          "type" character varying(50) NOT NULL DEFAULT 'multiple_choice',
          "duration" integer,
          "passing_score" integer,
          "is_published" boolean NOT NULL DEFAULT false,
          "slug" character varying(255) NOT NULL,
          "course_id" uuid,
          "chapter_id" uuid,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          "deleted_at" TIMESTAMP,
          CONSTRAINT "PK_quizzes_id" PRIMARY KEY ("id")
        )
      `);

      await queryRunner.query(`
        CREATE UNIQUE INDEX "unique_quizzes_slug" ON "quizzes" ("slug")
      `);

      await queryRunner.query(`
        ALTER TABLE "quizzes"
          ADD CONSTRAINT "FK_quizzes_course_id"
          FOREIGN KEY ("course_id") REFERENCES "courses"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION
      `);

      await queryRunner.query(`
        ALTER TABLE "quizzes"
          ADD CONSTRAINT "FK_quizzes_chapter_id"
          FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION
      `);
    }

    const questionsTableExist = await queryRunner.hasTable('questions');
    if (!questionsTableExist) {
      await queryRunner.query(`
        CREATE TABLE "questions" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "quiz_id" uuid NOT NULL,
          "content" text NOT NULL,
          "type" character varying(50) NOT NULL DEFAULT 'multiple_choice',
          "order" integer NOT NULL,
          "points" integer NOT NULL DEFAULT 1,
          "code_template" text,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          "deleted_at" TIMESTAMP,
          CONSTRAINT "PK_questions_id" PRIMARY KEY ("id")
        )
      `);

      await queryRunner.query(`
        ALTER TABLE "questions"
          ADD CONSTRAINT "FK_questions_quiz_id"
          FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_questions_quiz_id" ON "questions" ("quiz_id")
      `);
    }

    const optionsTableExist = await queryRunner.hasTable('question_options');
    if (!optionsTableExist) {
      await queryRunner.query(`
        CREATE TABLE "question_options" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "question_id" uuid NOT NULL,
          "content" text NOT NULL,
          "is_correct" boolean NOT NULL DEFAULT false,
          "order" integer NOT NULL,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_question_options_id" PRIMARY KEY ("id")
        )
      `);

      await queryRunner.query(`
        ALTER TABLE "question_options"
          ADD CONSTRAINT "FK_question_options_question_id"
          FOREIGN KEY ("question_id") REFERENCES "questions"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_question_options_question_id" ON "question_options" ("question_id")
      `);
    }

    const attemptsTableExist = await queryRunner.hasTable('quiz_attempts');
    if (!attemptsTableExist) {
      await queryRunner.query(`
        CREATE TABLE "quiz_attempts" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "user_id" uuid NOT NULL,
          "quiz_id" uuid NOT NULL,
          "status" "public"."quiz_attempts_status_enum" NOT NULL DEFAULT 'in_progress',
          "score" double precision,
          "total_points" integer NOT NULL DEFAULT 0,
          "score_percentage" double precision,
          "started_at" TIMESTAMP NOT NULL,
          "completed_at" TIMESTAMP,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_quiz_attempts_id" PRIMARY KEY ("id")
        )
      `);

      await queryRunner.query(`
        ALTER TABLE "quiz_attempts"
          ADD CONSTRAINT "FK_quiz_attempts_user_id"
          FOREIGN KEY ("user_id") REFERENCES "users"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      `);

      await queryRunner.query(`
        ALTER TABLE "quiz_attempts"
          ADD CONSTRAINT "FK_quiz_attempts_quiz_id"
          FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_quiz_attempts_user_id" ON "quiz_attempts" ("user_id")
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_quiz_attempts_quiz_id" ON "quiz_attempts" ("quiz_id")
      `);
    }

    const answersTableExist = await queryRunner.hasTable('quiz_answers');
    if (!answersTableExist) {
      await queryRunner.query(`
        CREATE TABLE "quiz_answers" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "attempt_id" uuid NOT NULL,
          "question_id" uuid NOT NULL,
          "selected_option_id" uuid,
          "is_correct" boolean,
          "points_earned" double precision,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_quiz_answers_id" PRIMARY KEY ("id")
        )
      `);

      await queryRunner.query(`
        ALTER TABLE "quiz_answers"
          ADD CONSTRAINT "FK_quiz_answers_attempt_id"
          FOREIGN KEY ("attempt_id") REFERENCES "quiz_attempts"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      `);

      await queryRunner.query(`
        ALTER TABLE "quiz_answers"
          ADD CONSTRAINT "FK_quiz_answers_question_id"
          FOREIGN KEY ("question_id") REFERENCES "questions"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      `);

      await queryRunner.query(`
        ALTER TABLE "quiz_answers"
          ADD CONSTRAINT "FK_quiz_answers_selected_option_id"
          FOREIGN KEY ("selected_option_id") REFERENCES "question_options"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_quiz_answers_attempt_id" ON "quiz_answers" ("attempt_id")
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "quiz_answers"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_quiz_attempts_quiz_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_quiz_attempts_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "quiz_attempts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "question_options"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "questions"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "unique_quizzes_slug"`);
    await queryRunner.query(
      `ALTER TABLE "quizzes" DROP CONSTRAINT IF EXISTS "FK_quizzes_chapter_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" DROP CONSTRAINT IF EXISTS "FK_quizzes_course_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "quizzes"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."quiz_attempts_status_enum"`,
    );
  }
}
