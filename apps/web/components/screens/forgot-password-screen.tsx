"use client";

import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { AuthHeroMobile } from "@/components/ui/auth-hero-mobile";
import { BrandWordmark } from "@/components/ui/brand-wordmark";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/api/auth-client";
import { translateAuthError } from "@/lib/auth-errors";

const forgotHeroImage = {
  src: "/images/personas/persona2/persona2-elegant-look.webp",
  heroPosition: "center",
};

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Informe seu endereço de e-mail.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await (
        authClient as unknown as {
          requestPasswordReset: (data: { email: string; redirectTo?: string }) => Promise<{
            error?: { message?: string; statusText?: string };
          }>;
        }
      ).requestPasswordReset({
        email: trimmed,
        redirectTo: "/auth/redefinir-senha",
      });

      if (res?.error) {
        setError(translateAuthError(res.error.message || res.error.statusText));
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setSubmitting(false);
    } catch (err: unknown) {
      setError(translateAuthError(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-dvh flex-col bg-zinc-50 md:grid md:h-auto md:min-h-screen md:grid-cols-2 md:items-start">
      <section className="flex min-h-0 flex-1 flex-col md:min-h-screen">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] sm:px-6 md:flex md:items-center md:justify-center md:overflow-y-auto md:px-12 md:py-10">
          <AuthHeroMobile
            images={[forgotHeroImage]}
            eyebrow="Segurança e privacidade"
            unoptimized
          />

          <div className="mx-auto mt-5 w-full max-w-md space-y-5 md:mt-0 md:space-y-8">
            <header>
              <div className="mb-6 hidden items-center gap-2 md:flex">
                <BackButton />
                <BrandWordmark />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-wine-200" />
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-wine-700">
                  Recuperação
                </span>
                <div className="h-px flex-1 bg-wine-200" />
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 sm:mt-4 sm:text-3xl">
                Esqueceu sua senha?
              </h1>
              <p className="mt-2 text-sm text-zinc-600">
                Informe o e-mail cadastrado e enviaremos um link seguro para você redefinir sua
                senha.
              </p>
            </header>

            {success ? (
              <div className="space-y-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h9" />
                    <polyline points="22,6 12,13 2,6" />
                    <polyline points="16 19 19 22 24 17" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h2 className="text-base font-semibold text-emerald-900">E-mail enviado!</h2>
                  <p className="text-sm text-emerald-800">
                    Se existir uma conta associada a <strong>{email}</strong>, você receberá um link
                    com as instruções em instantes.
                  </p>
                </div>
                <div className="pt-2">
                  <Link href="/auth/login">
                    <Button fullWidth size="lg">
                      Voltar para o login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <Input
                  id="email"
                  label="E-mail"
                  type="email"
                  placeholder="voce@email.com"
                  value={email}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
                  premium
                  leadingIcon={
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m4 7 8 6 8-6" />
                    </svg>
                  }
                />

                {error ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </p>
                ) : null}

                <div className="pt-1">
                  <Button
                    fullWidth
                    size="lg"
                    disabled={submitting}
                    className="shadow-md shadow-wine-700/20"
                  >
                    {submitting ? "Enviando..." : "Enviar link de recuperação"}
                  </Button>
                </div>

                <div className="border-t border-zinc-100 pt-5 text-center text-sm text-zinc-600">
                  <p>
                    Lembrou a senha?{" "}
                    <Link href="/auth/login" className="font-bold text-wine-700 hover:underline">
                      Voltar ao login
                    </Link>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      <aside className="relative hidden h-full min-h-screen items-center justify-center overflow-hidden bg-zinc-950 p-12 text-white md:flex">
        <div className="relative z-10 max-w-md space-y-4 text-center">
          <BrandWordmark tone="light" />
          <h2 className="text-2xl font-light tracking-wide text-zinc-100">
            Acesso reservado e protegido
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            Garantimos a recuperação confidencial da sua conta através de links assinados
            temporários.
          </p>
        </div>
      </aside>
    </div>
  );
}
