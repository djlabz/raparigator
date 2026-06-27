"use client";

import Link from "next/link";
import { Lock, MessageSquare, ShieldCheck, Star } from "lucide-react";
import { TelegramIcon, WhatsAppIcon } from "@/components/ui/contact-icons";

interface StandardSidebarCtaProps {
  role: string;
  setRiskTarget: (target: "WhatsApp" | "Telegram") => void;
}

export function StandardSidebarCta({ role, setRiskTarget }: StandardSidebarCtaProps) {
  return (
    <div className="sticky top-24 flex w-full flex-col gap-4">
      <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-wine-100 bg-red-50 text-wine-700">
            <Star className="h-6 w-6" />
          </div>

          <h3 className="mb-2 font-display text-sm font-extrabold tracking-[0.1em] text-wine-700 uppercase">
            Atendimento Exclusivo
          </h3>
          
          <h4 className="mb-2 font-display text-2xl font-bold text-zinc-900">
            Fale Agora
          </h4>
          
          <p className="mb-6 text-sm leading-relaxed text-zinc-500">
            Entre em contato direto e seguro para confirmar disponibilidade e valores.
          </p>

          <div className="flex w-full flex-col gap-3">
            {role === "visitor" ? (
              <Link
                href="/auth/login"
                className="group/btn relative flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 font-bold !text-white shadow-sm transition-all hover:bg-zinc-800"
              >
                <Lock className="h-4 w-4" /> Entrar para Interagir
              </Link>
            ) : (
              <Link
                href="/chat"
                className="group/btn relative flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-wine-700 font-bold !text-white shadow-sm transition-all hover:bg-wine-800"
              >
                <MessageSquare className="h-4 w-4" /> Iniciar Chat Direto
              </Link>
            )}

            <div className="flex items-center gap-2 w-full">
              <button
                onClick={() => setRiskTarget("WhatsApp")}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white h-12 text-sm font-bold text-[#25D366] transition-all hover:bg-zinc-50"
              >
                <WhatsAppIcon className="h-5 w-5" /> WhatsApp
              </button>
              <button
                onClick={() => setRiskTarget("Telegram")}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white h-12 text-sm font-bold text-[#229ED9] transition-all hover:bg-zinc-50"
              >
                <TelegramIcon className="h-5 w-5" /> Telegram
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center justify-center gap-2 border-t border-zinc-100 pt-5 text-xs text-zinc-500">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <p className="max-w-[200px]">Ambiente 100% seguro com moderação ativa Sigillus.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
