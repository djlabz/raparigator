"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type ChangeEvent, type FormEvent } from "react";
import { AuthHeroMobile } from "@/components/ui/auth-hero-mobile";
import { BrandWordmark } from "@/components/ui/brand-wordmark";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/api/auth-client";
import { translateAuthError } from "@/lib/auth-errors";

const resetHeroImage = {
  src: "/images/personas/persona2/persona2-elegant-look.webp",
  heroPosition: "center",
};

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const errorParam = searchParams.get("error");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(
    errorParam === "INVALID_TOKEN" ? "Link de redefinição inválido ou expirado." : null,
  );
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!token) {
    return (
      <div className="space-y-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-800">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-amber-900">Link inválido ou expirado</h2>
          <p className="text-sm text-amber-800">
            O token de redefinição não foi informado ou já expirou. Solicite um novo link para
            continuar.
          </p>
        </div>
        <div className="pt-2">
          <Link href="/auth/esqueci-senha">
            <Button fullWidth size="lg">
              Solicitar novo link
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await (
        authClient as unknown as {
          resetPassword: (data: { newPassword: string; token: string }) => Promise<{
            error?: { message?: string; statusText?: string };
          }>;
        }
      ).resetPassword({
        newPassword: password,
        token,
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

  if (success) {
    return (
      <div className="space-y-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-center">
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
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-emerald-900">Senha alterada com sucesso!</h2>
          <p className="text-sm text-emerald-800">
            Sua nova senha foi definida. Você já pode acessar sua conta utilizando as novas
            credenciais.
          </p>
        </div>
        <div className="pt-2">
          <Link href="/auth/login">
            <Button fullWidth size="lg">
              Entrar na minha conta
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input
        id="new-password"
        label="Nova senha"
        type="password"
        placeholder="Mínimo de 8 caracteres"
        value={password}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
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
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        }
      />

      <Input
        id="confirm-password"
        label="Confirmar nova senha"
        type="password"
        placeholder="Repita a nova senha"
        value={confirmPassword}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setConfirmPassword(event.target.value)}
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
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        }
      />

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="pt-1">
        <Button fullWidth size="lg" disabled={submitting} className="shadow-md shadow-wine-700/20">
          {submitting ? "Salvando..." : "Redefinir senha"}
        </Button>
      </div>
    </form>
  );
}

export function ResetPasswordScreen() {
  return (
    <div className="flex h-dvh flex-col bg-zinc-50 md:grid md:h-auto md:min-h-screen md:grid-cols-2 md:items-start">
      <section className="flex min-h-0 flex-1 flex-col md:min-h-screen">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] sm:px-6 md:flex md:items-center md:justify-center md:overflow-y-auto md:px-12 md:py-10">
          <AuthHeroMobile images={[resetHeroImage]} eyebrow="Segurança e privacidade" unoptimized />

          <div className="mx-auto mt-5 w-full max-w-md space-y-5 md:mt-0 md:space-y-8">
            <header>
              <div className="mb-6 hidden items-center gap-2 md:flex">
                <BackButton />
                <BrandWordmark />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-wine-200" />
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-wine-700">
                  Nova Senha
                </span>
                <div className="h-px flex-1 bg-wine-200" />
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 sm:mt-4 sm:text-3xl">
                Crie uma nova senha
              </h1>
              <p className="mt-2 text-sm text-zinc-600">
                Escolha uma nova senha forte com pelo menos 8 caracteres para proteger sua conta.
              </p>
            </header>

            <Suspense
              fallback={
                <div className="py-8 text-center text-sm text-zinc-500">
                  Carregando formulário...
                </div>
              }
            >
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </section>

      <aside className="relative hidden h-full min-h-screen items-center justify-center overflow-hidden bg-zinc-950 p-12 text-white md:flex">
        <div className="relative z-10 max-w-md space-y-4 text-center">
          <BrandWordmark tone="light" />
          <h2 className="text-2xl font-light tracking-wide text-zinc-100">
            Proteção de ponta a ponta
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            Sua nova senha é armazenada com criptografia irreversível para a sua total segurança.
          </p>
        </div>
      </aside>
    </div>
  );
}
