import { isNotNull } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { isValidCpf } from "@sigillus/domain";
import { users } from "../src/db/schema";
import { seedDevData } from "../src/db/seed/dev-data";
import { seedDevUsers } from "../src/db/seed/users";
import { createTestHarness } from "./helpers/app";

const harness = createTestHarness();

describe("seed de desenvolvimento", () => {
  it("grava só CPFs válidos", async () => {
    await seedDevUsers(harness.db);
    await seedDevData(harness.db);
    const rows = await harness.db
      .select({ email: users.email, cpf: users.cpf })
      .from(users)
      .where(isNotNull(users.cpf));
    expect(rows.length).toBe(10);
    const invalid = rows.filter((row) => !isValidCpf(row.cpf!));
    expect(invalid).toEqual([]);
  });
});
