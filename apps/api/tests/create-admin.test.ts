import { verifyPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createAdminUser, parseAdminCliArgs } from "../src/cli/create-admin";
import { adminAccounts, adminUsers } from "../src/db/schema";
import { createTestHarness } from "./helpers/app";

const harness = createTestHarness();

describe("CLI create-admin", () => {
  describe("parseAdminCliArgs", () => {
    it("extrai parâmetros fornecidos por flags longas", () => {
      const result = parseAdminCliArgs(
        ["--email", "novo.admin@sigillus.dev", "--name", "Novo Admin", "--password", "Admin@12345"],
        {},
      );
      expect(result.helpRequested).toBe(false);
      expect(result.error).toBeUndefined();
      expect(result.input).toEqual({
        email: "novo.admin@sigillus.dev",
        name: "Novo Admin",
        password: "Admin@12345",
      });
    });

    it("extrai parâmetros fornecidos por flags curtas", () => {
      const result = parseAdminCliArgs(
        ["-e", "curto@sigillus.dev", "-n", "Admin Curto", "-p", "SenhaForte123"],
        {},
      );
      expect(result.helpRequested).toBe(false);
      expect(result.error).toBeUndefined();
      expect(result.input).toEqual({
        email: "curto@sigillus.dev",
        name: "Admin Curto",
        password: "SenhaForte123",
      });
    });

    it("extrai parâmetros fornecidos por variáveis de ambiente", () => {
      const result = parseAdminCliArgs([], {
        ADMIN_EMAIL: "env.admin@sigillus.dev",
        ADMIN_NAME: "Admin Por Env",
        ADMIN_PASSWORD: "SuperSegura@123",
      } as NodeJS.ProcessEnv);
      expect(result.helpRequested).toBe(false);
      expect(result.error).toBeUndefined();
      expect(result.input).toEqual({
        email: "env.admin@sigillus.dev",
        name: "Admin Por Env",
        password: "SuperSegura@123",
      });
    });

    it("flags de linha de comando têm precedência sobre variáveis de ambiente", () => {
      const result = parseAdminCliArgs(["--email", "flag@sigillus.dev"], {
        ADMIN_EMAIL: "env@sigillus.dev",
        ADMIN_NAME: "Nome Env",
        ADMIN_PASSWORD: "SenhaEnv@123",
      } as NodeJS.ProcessEnv);
      expect(result.error).toBeUndefined();
      expect(result.input?.email).toBe("flag@sigillus.dev");
      expect(result.input?.name).toBe("Nome Env");
    });

    it("identifica pedido de ajuda", () => {
      const result = parseAdminCliArgs(["--help"], {});
      expect(result.helpRequested).toBe(true);
      expect(result.input).toBeNull();
    });

    it("retorna erro quando faltam parâmetros obrigatórios", () => {
      const result = parseAdminCliArgs(["--email", "admin@sigillus.dev"], {});
      expect(result.input).toBeNull();
      expect(result.error).toContain("Parâmetros obrigatórios ausentes");
    });

    it("retorna erro quando o e-mail é inválido", () => {
      const result = parseAdminCliArgs(
        ["--email", "email-invalido", "--name", "Admin", "--password", "Admin@123"],
        {},
      );
      expect(result.input).toBeNull();
      expect(result.error).toContain("E-mail informado é inválido");
    });

    it("retorna erro quando a senha tem menos de 8 caracteres", () => {
      const result = parseAdminCliArgs(
        ["--email", "admin@sigillus.dev", "--name", "Admin", "--password", "12345"],
        {},
      );
      expect(result.input).toBeNull();
      expect(result.error).toContain("Senha deve ter pelo menos 8 caracteres");
    });

    it("retorna erro quando o nome tem menos de 2 caracteres", () => {
      const result = parseAdminCliArgs(
        ["--email", "admin@sigillus.dev", "--name", "A", "--password", "Admin@123"],
        {},
      );
      expect(result.input).toBeNull();
      expect(result.error).toContain("Nome deve ter pelo menos 2 caracteres");
    });
  });

  describe("createAdminUser", () => {
    it("cadastra um novo administrador no banco com credencial criptografada", async () => {
      const result = await createAdminUser(
        {
          email: "super.admin@sigillus.dev",
          name: "Super Administrador",
          password: "SenhaSuperSegura@123",
        },
        harness.db,
      );

      expect(result.adminId).toBeDefined();
      expect(result.email).toBe("super.admin@sigillus.dev");
      expect(result.name).toBe("Super Administrador");

      const [storedUser] = await harness.db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.id, result.adminId));
      expect(storedUser).toBeDefined();
      expect(storedUser!.email).toBe("super.admin@sigillus.dev");
      expect(storedUser!.name).toBe("Super Administrador");
      expect(storedUser!.emailVerified).toBe(true);

      const [storedAccount] = await harness.db
        .select()
        .from(adminAccounts)
        .where(eq(adminAccounts.userId, result.adminId));
      expect(storedAccount).toBeDefined();
      expect(storedAccount!.providerId).toBe("credential");

      const passwordValid = await verifyPassword({
        hash: storedAccount!.password!,
        password: "SenhaSuperSegura@123",
      });
      expect(passwordValid).toBe(true);
    });

    it("atualiza senha e nome caso o administrador já exista pelo e-mail", async () => {
      const first = await createAdminUser(
        {
          email: "idempotente@sigillus.dev",
          name: "Primeiro Nome",
          password: "PrimeiraSenha@123",
        },
        harness.db,
      );

      const updated = await createAdminUser(
        {
          email: "idempotente@sigillus.dev",
          name: "Nome Atualizado",
          password: "SegundaSenha@456",
        },
        harness.db,
      );

      expect(updated.adminId).toBe(first.adminId);
      expect(updated.name).toBe("Nome Atualizado");

      const [storedUser] = await harness.db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.id, first.adminId));
      expect(storedUser).toBeDefined();
      expect(storedUser!.name).toBe("Nome Atualizado");

      const [storedAccount] = await harness.db
        .select()
        .from(adminAccounts)
        .where(eq(adminAccounts.userId, first.adminId));
      expect(storedAccount).toBeDefined();

      const oldPasswordValid = await verifyPassword({
        hash: storedAccount!.password!,
        password: "PrimeiraSenha@123",
      });
      expect(oldPasswordValid).toBe(false);

      const newPasswordValid = await verifyPassword({
        hash: storedAccount!.password!,
        password: "SegundaSenha@456",
      });
      expect(newPasswordValid).toBe(true);
    });
  });
});
