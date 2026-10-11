import pino from "pino";
import { getConfig } from "../config";

const PII_PATHS = [
  "cpf",
  "*.cpf",
  "email",
  "*.email",
  "phone",
  "*.phone",
  "whatsappNumber",
  "*.whatsappNumber",
  "telegramUsername",
  "*.telegramUsername",
  "password",
  "*.password",
  "content",
  "*.content",
  "greeting",
  "*.greeting",
  "to",
  "*.to",
  "name",
  "*.name",
  "alias",
  "*.alias",
  "ip",
  "*.ip",
  "body",
  "*.body",
  "req.headers.authorization",
  "req.headers.cookie",
  'res.headers["set-cookie"]',
];

export function createLogger(options?: {
  level?: string;
  pretty?: boolean;
  destination?: pino.DestinationStream;
}) {
  const config = getConfig();
  const level = options?.level ?? config.LOG_LEVEL;
  const pretty = options?.pretty ?? (!config.isProduction && !config.isTest);
  const base = {
    level,
    redact: { paths: PII_PATHS, censor: "[redacted]" },
    base: { service: "sigillus-api" },
  };
  if (options?.destination) {
    return pino(base, options.destination);
  }
  return pino({
    ...base,
    ...(pretty
      ? {
          transport: {
            target: "pino-pretty",
            options: { colorize: true, translateTime: "HH:MM:ss" },
          },
        }
      : {}),
  });
}

let root: pino.Logger | null = null;

export function getLogger(): pino.Logger {
  if (!root) {
    root = createLogger();
  }
  return root;
}

export type Logger = pino.Logger;
