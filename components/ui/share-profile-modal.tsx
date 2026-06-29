"use client";

import { useState } from "react";
import Image from "next/image";
import { Link, X, MapPin } from "lucide-react";
import { Modal } from "./modal";
import { WhatsAppIcon, TelegramIcon } from "./contact-icons";
import { ProfessionalAd } from "@/lib/types";
import {
  copyToClipboard,
  getShareCopyText,
  getWhatsAppChatUrl,
  getTelegramChatUrl,
  vibrate,
} from "@/lib/share-utils";
import { cn } from "@/lib/utils";

interface ShareProfileModalProps {
  open: boolean;
  onClose: () => void;
  ad: ProfessionalAd;
  isPremium?: boolean;
  onExternalLink: (target: "WhatsApp" | "Telegram", url: string) => void;
}

export function ShareProfileModal({
  open,
  onClose,
  ad,
  isPremium = false,
  onExternalLink,
}: ShareProfileModalProps) {
  const [copied, setCopied] = useState(false);

  if (!open && !isPremium) return null;

  const handleCopy = async () => {
    vibrate(50);
    const text = getShareCopyText(ad.artisticName, ad.slug);
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWhatsApp = () => {
    vibrate(50);
    if (ad.whatsappNumber) {
      const url = getWhatsAppChatUrl(ad.artisticName, ad.slug, ad.whatsappNumber);
      onExternalLink("WhatsApp", url);
    } else {
      // Fallback genérico se não tiver número
      onExternalLink("WhatsApp", "https://wa.me/");
    }
  };

  const handleTelegram = () => {
    vibrate(50);
    if (ad.telegramUsername) {
      const url = getTelegramChatUrl(ad.artisticName, ad.slug, ad.telegramUsername);
      onExternalLink("Telegram", url);
    } else {
      // Fallback genérico se não tiver username
      onExternalLink("Telegram", "https://t.me/");
    }
  };

  const adCover = ad.images[0];
  const adProfile = ad.images[1] || ad.images[0];

  if (isPremium) {
    return (
      <>
        {/* Overlay do Premium - sempre renderizado para a transição funcionar, mas escondido visualmente se !open */}
        <div
          className={cn(
            "fixed inset-0 z-220 flex items-center justify-center bg-black/80 px-4 transition-opacity duration-300",
            open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          )}
          aria-hidden={!open}
        >
          <div
            className={cn(
              "relative w-full max-w-sm overflow-hidden rounded-3xl border border-[#DAA520]/50 bg-[#121212] p-1 shadow-2xl transition-all duration-400 ease-[cubic-bezier(0.25,1,0.5,1)]",
              open ? "share-modal-premium-open" : "share-modal-premium-enter"
            )}
          >
            {/* Background effects */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,223,0,0.05)_0%,transparent_40%,rgba(218,165,32,0.05)_100%)]" />

            <div className="flex items-center justify-between p-5 pb-3">
              <h2 className="font-display text-[13px] font-bold tracking-[0.2em] text-[#DAA520]">
                COMPARTILHAR
              </h2>
              <button
                onClick={onClose}
                className="rounded-full border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition-colors hover:text-[#FFDF00]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Premium Preview */}
            <div className="relative mb-5 flex flex-col items-center px-5">
              <div className="relative h-28 w-full overflow-hidden rounded-xl">
                <Image
                  src={adCover}
                  alt="Capa"
                  fill
                  className="object-cover opacity-60"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#121212] via-transparent to-transparent" />
              </div>

              <div className="relative -mt-10 h-20 w-20 overflow-hidden rounded-full border-2 border-[#DAA520] shadow-[0_0_15px_rgba(218,165,32,0.2)]">
                <Image src={adProfile} alt={ad.artisticName} fill className="object-cover" />
              </div>

              <div className="mt-3 text-center">
                <h3 className="font-display text-2xl font-bold text-[#DAA520]">
                  {ad.artisticName}
                </h3>
                <p className="mt-1 flex items-center justify-center gap-1.5 text-[13px] text-zinc-400">
                  <MapPin className="h-3.5 w-3.5" />
                  {ad.neighborhood}, {ad.city}
                </p>
              </div>
            </div>

            {/* Premium Actions */}
            <div className="grid grid-cols-3 gap-3 px-5 pb-6">
              <button
                onClick={handleCopy}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 py-4 transition-all hover:border-[#DAA520]/50 hover:bg-zinc-800"
              >
                <Link className="h-5 w-5 text-[#FFDF00]" />
                <span className="text-xs font-medium text-zinc-200">
                  {copied ? <span className="text-[#10b981]">Copiado!</span> : "Copiar Link"}
                </span>
              </button>

              <button
                onClick={handleWhatsApp}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 py-4 transition-all hover:border-[#25D366]/50 hover:bg-zinc-800"
              >
                <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
                <span className="text-xs font-medium text-zinc-200">WhatsApp</span>
              </button>

              <button
                onClick={handleTelegram}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 py-4 transition-all hover:border-[#229ED9]/50 hover:bg-zinc-800"
              >
                <TelegramIcon className="h-5 w-5 text-[#229ED9]" />
                <span className="text-xs font-medium text-zinc-200">Telegram</span>
              </button>
            </div>
            
            {/* Inline Toast Premium */}
            <div
              className={cn(
                "absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-[#10b981]/20 px-4 py-2 text-sm font-medium text-[#10b981] backdrop-blur-md transition-all duration-300",
                copied ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
              )}
            >
              Link copiado com sucesso!
            </div>
          </div>
          
          <button aria-label="Fechar modal" className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
      </>
    );
  }

  // Standard Variante
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Compartilhar Perfil"
      actions={null} // Sem ações padrão na base
    >
      <div className="relative -mx-4 -mt-4 mb-6 sm:-mx-5 sm:-mt-5">
        <div className="relative h-24 w-full bg-zinc-100">
          <Image src={adCover} alt="Capa" fill className="object-cover opacity-70" />
          <div className="absolute inset-0 bg-linear-to-t from-white to-transparent" />
        </div>
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 rounded-full border-4 border-white bg-zinc-100 shadow-sm">
          <div className="relative h-20 w-20 overflow-hidden rounded-full">
            <Image src={adProfile} alt={ad.artisticName} fill className="object-cover" />
          </div>
        </div>
      </div>

      <div className="mt-10 text-center">
        <h3 className="text-xl font-bold text-zinc-900">{ad.artisticName}</h3>
        <p className="text-sm text-zinc-500">
          {ad.neighborhood}, {ad.city}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <button
          onClick={handleCopy}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-3.5 font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
        >
          <Link className="h-5 w-5 text-zinc-400" />
          {copied ? <span className="text-emerald-600">Copiado!</span> : <span>Copiar Link</span>}
        </button>

        <button
          onClick={handleWhatsApp}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 text-emerald-700 py-3.5 font-medium transition-colors hover:bg-emerald-100"
        >
          <WhatsAppIcon className="h-5 w-5" />
          WhatsApp
        </button>

        <button
          onClick={handleTelegram}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-50 text-sky-700 py-3.5 font-medium transition-colors hover:bg-sky-100"
        >
          <TelegramIcon className="h-5 w-5" />
          Telegram
        </button>
      </div>
      
      {/* Inline Toast Standard */}
      <div
        className={cn(
          "absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-300",
          copied ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
        )}
      >
        Link copiado com sucesso!
      </div>
    </Modal>
  );
}
