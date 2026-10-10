import type { AppConfig } from "../config";
import type { Logger } from "./logger";

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendEmailResult = {
  id?: string;
  ok: boolean;
};

export interface Mailer {
  send(message: EmailMessage): Promise<SendEmailResult>;
}

export function createLogMailer(logger: Logger): Mailer {
  return {
    async send(message: EmailMessage): Promise<SendEmailResult> {
      const id = `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      logger.info(
        {
          mailId: id,
          to: message.to,
          subject: message.subject,
        },
        "e-mail transacional registrado em log",
      );
      return { id, ok: true };
    },
  };
}

export type ResendMailerOptions = {
  apiKey: string;
  from: string;
  logger: Logger;
  fetchFn?: typeof fetch;
};

export function createResendMailer(options: ResendMailerOptions): Mailer {
  const { apiKey, from, logger, fetchFn = fetch } = options;
  return {
    async send(message: EmailMessage): Promise<SendEmailResult> {
      try {
        const response = await fetchFn("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from,
            to: [message.to],
            subject: message.subject,
            text: message.text,
            ...(message.html ? { html: message.html } : {}),
          }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          logger.error(
            {
              status: response.status,
              to: message.to,
              subject: message.subject,
              error: errorText,
            },
            "falha ao enviar e-mail via Resend",
          );
          return { ok: false };
        }

        const data = (await response.json().catch(() => ({}))) as { id?: string };
        logger.info(
          { mailId: data.id, to: message.to, subject: message.subject },
          "e-mail enviado com sucesso via Resend",
        );
        return { id: data.id, ok: true };
      } catch (error) {
        logger.error(
          { err: error, to: message.to, subject: message.subject },
          "erro inesperado ao enviar e-mail via Resend",
        );
        return { ok: false };
      }
    },
  };
}

export function createMailer(config: AppConfig, logger: Logger, fetchFn?: typeof fetch): Mailer {
  if (config.MAIL_PROVIDER === "resend") {
    if (config.RESEND_API_KEY) {
      return createResendMailer({
        apiKey: config.RESEND_API_KEY,
        from: config.MAIL_FROM,
        logger,
        fetchFn,
      });
    }
    logger.warn(
      "MAIL_PROVIDER=resend configurado, mas RESEND_API_KEY está ausente; fallback para LogMailer",
    );
  }
  return createLogMailer(logger);
}

export type MemoryMailer = Mailer & {
  sent: EmailMessage[];
  clear(): void;
};

export function createMemoryMailer(): MemoryMailer {
  const sent: EmailMessage[] = [];
  return {
    sent,
    clear() {
      sent.length = 0;
    },
    async send(message: EmailMessage): Promise<SendEmailResult> {
      sent.push(message);
      return { id: `mem_${Date.now()}_${sent.length}`, ok: true };
    },
  };
}
