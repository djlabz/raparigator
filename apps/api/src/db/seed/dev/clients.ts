import type { Database } from "../../client";
import { users } from "../../schema";
import { fixtures } from "./fixtures";

export async function seedClients(db: Database) {
  for (const client of fixtures.seedClients) {
    await db
      .insert(users)
      .values({
        id: `client-${client.id}`,
        name: client.fullName,
        email: client.email,
        emailVerified: true,
        role: "cliente",
        cpf: client.cpf,
        city: `${client.city}, ${client.state}`,
        status: client.status,
        suspensionReason: client.suspensionReason ?? null,
        createdAt: new Date(client.registeredAt),
      })
      .onConflictDoNothing();
  }
}
