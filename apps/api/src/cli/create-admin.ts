import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { z } from "zod";
import { getConfig } from "../config";
import { createDatabase, type Database } from "../db/client";
import { upsertAdminWithPassword } from "../db/seed/users";
import { getLogger } from "../lib/logger";

export const CreateAdminInputSchema = z.object({
  email: z.string().trim().email("E-mail informado é inválido"),
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});

export type CreateAdminInput = z.infer<typeof CreateAdminInputSchema>;

export type CreateAdminResult = {
  adminId: string;
  email: string;
  name: string;
};

export function parseAdminCliArgs(
  argv: string[] = process.argv.slice(2),
  env: NodeJS.ProcessEnv = process.env,
): { input: CreateAdminInput | null; helpRequested: boolean; error?: string } {
  try {
    const { values } = parseArgs({
      args: argv,
      options: {
        email: { type: "string", short: "e" },
        name: { type: "string", short: "n" },
        password: { type: "string", short: "p" },
        help: { type: "boolean", short: "h" },
      },
      strict: false,
    });

    if (values.help) {
      return { input: null, helpRequested: true };
    }

    const email = (values.email as string | undefined) ?? env.ADMIN_EMAIL ?? env.EMAIL;
    const name =
      (values.name as string | undefined) ?? env.ADMIN_NAME ?? env.ADMIN_FULL_NAME ?? env.NAME;
    const password = (values.password as string | undefined) ?? env.ADMIN_PASSWORD ?? env.PASSWORD;

    if (!email || !name || !password) {
      const missing: string[] = [];
      if (!email) missing.push("--email (ou ADMIN_EMAIL)");
      if (!name) missing.push("--name (ou ADMIN_NAME)");
      if (!password) missing.push("--password (ou ADMIN_PASSWORD)");
      return {
        input: null,
        helpRequested: false,
        error: `Parâmetros obrigatórios ausentes: ${missing.join(", ")}`,
      };
    }

    const parsed = CreateAdminInputSchema.safeParse({ email, name, password });
    if (!parsed.success) {
      return {
        input: null,
        helpRequested: false,
        error: parsed.error.issues.map((i) => i.message).join("; "),
      };
    }

    return { input: parsed.data, helpRequested: false };
  } catch (err) {
    return {
      input: null,
      helpRequested: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createAdminUser(
  input: CreateAdminInput,
  externalDb?: Database,
): Promise<CreateAdminResult> {
  const validated = CreateAdminInputSchema.parse(input);

  if (externalDb) {
    const adminId = await upsertAdminWithPassword(externalDb, {
      fullName: validated.name,
      email: validated.email,
      password: validated.password,
    });
    return { adminId, email: validated.email, name: validated.name };
  }

  const config = getConfig();
  const { db, pool } = createDatabase({
    DATABASE_URL: config.DATABASE_URL,
    DATABASE_POOL_MAX: 1,
  });

  try {
    const adminId = await upsertAdminWithPassword(db, {
      fullName: validated.name,
      email: validated.email,
      password: validated.password,
    });
    return { adminId, email: validated.email, name: validated.name };
  } finally {
    await pool.end();
  }
}

function printUsage() {
  console.log(`
Uso do CLI create-admin:
  npm run admin:create -- --email <email> --name <nome> --password <senha>

Opções:
  -e, --email     E-mail do administrador
  -n, --name      Nome completo do administrador
  -p, --password  Senha (mínimo 8 caracteres)
  -h, --help      Exibe esta ajuda

Variáveis de ambiente alternativas:
  ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD
`);
}

async function main() {
  const { input, helpRequested, error } = parseAdminCliArgs();

  if (helpRequested) {
    printUsage();
    process.exit(0);
  }

  if (error || !input) {
    console.error(`Erro: ${error ?? "Entrada inválida"}`);
    printUsage();
    process.exit(1);
  }

  try {
    const result = await createAdminUser(input);
    getLogger().info(
      { adminId: result.adminId, email: result.email },
      "administrador criado com sucesso",
    );
    console.log(
      `Administrador cadastrado com sucesso: ${result.name} (${result.email}) [id: ${result.adminId}]`,
    );
    process.exit(0);
  } catch (err) {
    getLogger().error({ err }, "falha ao cadastrar administrador");
    console.error("Falha ao criar administrador:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
