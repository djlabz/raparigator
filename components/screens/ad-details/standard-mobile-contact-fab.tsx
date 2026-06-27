"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Lock, MessageSquare, X, MapPin } from "lucide-react";
import { TelegramIcon, WhatsAppIcon } from "@/components/ui/contact-icons";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ProfessionalAd } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StandardMobileContactFabProps {
  ad: ProfessionalAd;
  setRiskTarget: (target: "WhatsApp" | "Telegram") => void;
  role: "visitor" | "client" | "professional";
}

export function StandardMobileContactFab({ ad, setRiskTarget, role }: StandardMobileContactFabProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = 400;
      if (window.scrollY > heroHeight) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
        setIsExpanded(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {isExpanded && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in lg:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <div className={cn("fixed right-4 bottom-20 z-[60] transition-all duration-500 ease-spring lg:hidden", isExpanded ? "translate-y-0" : "translate-y-0")}>
        {!isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="group relative flex h-14 items-center justify-center gap-3 overflow-hidden rounded-full bg-wine-700 px-6 font-bold text-white shadow-xl ring-1 ring-white/10 transition-transform active:scale-95"
          >
            <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <MessageSquare className="h-5 w-5" />
            <span>Falar Agora</span>
          </button>
        )}
      </div>

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center justify-end transition-transform duration-500 ease-spring lg:hidden",
          isExpanded ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="w-full rounded-t-3xl border-t border-zinc-200 bg-white p-5 pb-8 shadow-2xl">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold text-zinc-900">{ad.artisticName}</h3>
                <StatusBadge status={ad.status} />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-zinc-500">
                <MapPin className="h-3.5 w-3.5 text-wine-700" />
                {ad.neighborhood}, {ad.city}
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors active:bg-zinc-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex w-full flex-col gap-3">
            {role === "visitor" ? (
              <Link
                href="/auth/login"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 font-bold !text-white shadow-md active:scale-[0.98]"
              >
                <Lock className="h-4 w-4" /> Entrar para Interagir
              </Link>
            ) : (
              <Link
                href="/chat"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-wine-700 font-bold !text-white shadow-md active:scale-[0.98]"
              >
                <MessageSquare className="h-4 w-4" /> Iniciar Chat Direto
              </Link>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setRiskTarget("WhatsApp")}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white font-bold text-[#25D366] shadow-sm active:scale-[0.98]"
              >
                <WhatsAppIcon className="h-5 w-5" /> WhatsApp
              </button>
              <button
                onClick={() => setRiskTarget("Telegram")}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white font-bold text-[#229ED9] shadow-sm active:scale-[0.98]"
              >
                <TelegramIcon className="h-5 w-5" /> Telegram
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
