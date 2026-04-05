"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuthSession } from "@/lib/auth-session";

export function AccountScreen() {
  const { user, logout } = useAuthSession();

  if (!user) {
    return (
      <AppShell>
        <EmptyState
          title="Conta indisponível"
          description="Use o seletor de perfil no header para alternar para Cliente e testar esta área."
          actionLabel="Entrar"
          onAction={() => {
            window.location.href = "/auth/login";
          }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto grid max-w-3xl gap-6">
        <Card className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Minha conta</p>
            <h1 className="mt-2 text-2xl font-semibold text-zinc-900">{user.fullName}</h1>
            <p className="text-sm text-zinc-600">{user.label}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="E-mail" value={user.email} />
            <Field label="Senha de teste" value={user.password} />
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/feed">
              <Button>Explorar feed</Button>
            </Link>
            <Button variant="danger" onClick={logout}>
              Sair do modo atual
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-900">{value}</p>
    </div>
  );
}
