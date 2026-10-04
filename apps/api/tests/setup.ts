import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

process.env.NODE_ENV = "test";
process.env.LOG_LEVEL ??= "fatal";
const rootEnvFile = fileURLToPath(new URL("../../../.env", import.meta.url));
if (existsSync(rootEnvFile)) process.loadEnvFile(rootEnvFile);
const pgPort = process.env.SIGILLUS_PG_PORT ?? "5432";
const minioPort = process.env.SIGILLUS_MINIO_PORT ?? "9000";
process.env.DATABASE_URL ??= `postgres://sigillus:sigillus@localhost:${pgPort}/sigillus_test`;
process.env.AUTH_SECRET ??= "test-secret-0123456789abcdef0123456789abcdef";
process.env.S3_ENDPOINT ??= `http://localhost:${minioPort}`;
process.env.S3_BUCKET ??= "sigillus-test";
process.env.S3_ACCESS_KEY_ID ??= "test";
process.env.S3_SECRET_ACCESS_KEY ??= "test";
process.env.BILLING_WEBHOOK_SECRET ??= "test-webhook-secret-0123456789";
process.env.RATE_LIMIT_ENABLED ??= "false";
process.env.JOBS_ENABLED ??= "false";
process.env.MIGRATE_ON_BOOT ??= "false";
