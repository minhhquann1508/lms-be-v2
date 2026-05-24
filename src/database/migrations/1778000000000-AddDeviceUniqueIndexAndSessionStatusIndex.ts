import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeviceUniqueIndexAndSessionStatusIndex1778000000000 implements MigrationInterface {
  name = 'AddDeviceUniqueIndexAndSessionStatusIndex1778000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Fail-fast: detect duplicate (user_id, device_uid) pairs — R13.AC3
    const duplicates: { user_id: string; device_uid: string; cnt: string }[] =
      await queryRunner.query(`
        SELECT user_id, device_uid, COUNT(*) AS cnt
        FROM devices
        GROUP BY user_id, device_uid
        HAVING COUNT(*) > 1
        LIMIT 50
      `);

    if (duplicates.length > 0) {
      const summary = duplicates
        .map(
          (r) =>
            `user_id=${r.user_id}, device_uid=${r.device_uid}, count=${r.cnt}`,
        )
        .join('; ');
      throw new Error(
        `[Migration aborted] Duplicate (user_id, device_uid) detected. ` +
          `Please dedupe manually before re-running. Examples: ${summary}`,
      );
    }

    // 2. UNIQUE index on devices (user_id, device_uid) — R13.AC2
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_devices_user_device_uid"
      ON "devices" ("user_id", "device_uid")
    `);

    // 3. Composite index on sessions (user_id, status) — R13.AC4
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_sessions_user_status"
      ON "sessions" ("user_id", "status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sessions_user_status"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_devices_user_device_uid"`,
    );
  }
}
