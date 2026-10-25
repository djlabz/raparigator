import { CLIENT_ALIAS_TAKEN_MESSAGE, generateClientAlias } from "@sigillus/domain";
import { APIError } from "better-auth/api";
import { and, ne, sql } from "drizzle-orm";
import type { Database } from "../../db/client";
import { users } from "../../db/schema";

const CLIENT_ALIAS_MAX_ATTEMPTS = 20;

export function normalizeAlias(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function isAliasTaken(db: Database, alias: string, exceptUserId?: string) {
  const sameAlias = sql`lower(${users.alias}) = lower(${alias})`;
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(exceptUserId ? and(sameAlias, ne(users.id, exceptUserId)) : sameAlias)
    .limit(1);
  return Boolean(row);
}

export async function assertAliasAvailable(db: Database, alias: string, exceptUserId?: string) {
  if (await isAliasTaken(db, alias, exceptUserId)) {
    throw new APIError("BAD_REQUEST", {
      message: CLIENT_ALIAS_TAKEN_MESSAGE,
      code: "ALIAS_TAKEN",
    });
  }
}

export async function assignClientAlias(db: Database, random: () => number = Math.random) {
  for (let attempt = 0; attempt < CLIENT_ALIAS_MAX_ATTEMPTS; attempt += 1) {
    const candidate = generateClientAlias(random);
    if (!(await isAliasTaken(db, candidate))) {
      return candidate;
    }
  }
  throw new APIError("INTERNAL_SERVER_ERROR", {
    message: "Não foi possível gerar um apelido. Tente novamente.",
  });
}
