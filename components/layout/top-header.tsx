import Link from "next/link";
// 1. Importar o botão novo
import { BackButton } from "@/components/ui/back-button";

interface TopHeaderProps {
  location: string;
}

export function TopHeader({ location }: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* 2. Criei esta DIV para agrupar o Botão Voltar + Logo juntos na esquerda */}
        <div className="flex items-center gap-2 md:gap-4">
          <BackButton />
          <Link href="/" className="font-display text-xl tracking-wide text-wine-800">
            Sigillus
          </Link>
        </div>

        {/* O restante permanece igual */}
        <div className="hidden items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 md:flex">
          <span>Local:</span>
          <strong>{location}</strong>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <Link href="/chat" className="rounded-lg px-3 py-2 text-zinc-700 hover:bg-zinc-100">
            Chat
          </Link>
          <Link href="/auth/login" className="rounded-lg bg-wine-700 px-3 py-2 font-medium text-white hover:bg-wine-800">
            Entrar
          </Link>
        </div>
      </div>
    </header>
  );
}
