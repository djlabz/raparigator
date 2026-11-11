"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Lock, MessageSquare, X } from "lucide-react";
import type { AuthRole, EncounterBrief, ProfessionalAd } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TelegramIcon, WhatsAppIcon } from "@/components/ui/contact-icons";
import { useMobileContactFab } from "./use-mobile-contact-fab";
import { useContactCta } from "./use-contact-cta";
import type { AdDetailsVariant } from "./variant";

const FAB_THEME = {
  premium: {
    tooltip:
      "border border-dashed border-stone-400/70 bg-[#f5f4ef]/85 font-medium shadow-[0_4px_16px_rgba(0,0,0,0.1)]",
    tooltipArrowRight: "-left-1.5 border-r-[6px] border-r-[#f5f4ef]/85",
    tooltipArrowLeft: "-right-1.5 border-l-[6px] border-l-[#f5f4ef]/85",
    tooltipText: "Clique para entrar em contato.",
    chatButton: "bg-wine-800",
    toggle: "bg-linear-to-tr from-amber-300 via-amber-400 to-amber-200",
    toggleOpen: "shadow-[0_0_20px_rgba(251,191,36,0.4)]",
    avatarFrame: "border-black/40",
    badge: "bg-wine-800 ring-2 ring-white",
  },
  standard: {
    tooltip: "border border-zinc-200 bg-white font-semibold shadow-md",
    tooltipArrowRight: "-left-1.5 border-r-[6px] border-r-white",
    tooltipArrowLeft: "-right-1.5 border-l-[6px] border-l-white",
    tooltipText: "Falar agora.",
    chatButton: "bg-wine-700",
    toggle: "bg-wine-700",
    toggleOpen: "shadow-[0_0_20px_rgba(150,0,30,0.3)]",
    avatarFrame: "border-black/25",
    badge: "border border-white/20 bg-zinc-900",
  },
} as const satisfies Record<AdDetailsVariant, Record<string, string>>;

interface MobileContactFabProps {
  ad: ProfessionalAd;
  role: AuthRole;
  variant: AdDetailsVariant;
  setRiskTarget: (target: "WhatsApp" | "Telegram") => void;
  brief: EncounterBrief | null;
}

export function MobileContactFab({
  ad,
  role,
  variant,
  setRiskTarget,
  brief,
}: MobileContactFabProps) {
  const theme = FAB_THEME[variant];
  const { onLoginClick, openChatWithBrief } = useContactCta(brief);
  const {
    isOpen,
    showTooltip,
    isVisible,
    hasAppeared,
    fabSide,
    tooltipSide,
    fabRef,
    x,
    y,
    dragConstraints,
    toggleOpen,
    handleDragEnd,
  } = useMobileContactFab();

  if (!hasAppeared) {
    return null;
  }

  const chatButtonClassName = cn(
    "flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg ring-1 ring-white/20",
    theme.chatButton,
  );

  return (
    <motion.div
      ref={fabRef}
      initial={false}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.2 }}
      drag={isVisible}
      dragConstraints={dragConstraints}
      dragElastic={0.12}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      style={{ x, y }}
      className={cn(
        "fixed bottom-17.25 z-60 flex w-14 flex-col items-center justify-end md:hidden",
        isVisible ? "pointer-events-auto" : "pointer-events-none",
        fabSide === "right" ? "right-4" : "left-4",
      )}
    >
      <div className="relative flex w-full items-center justify-center">
        <AnimatePresence>
          {showTooltip && !isOpen && isVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: tooltipSide === "right" ? -10 : 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={cn(
                "absolute z-10 w-max max-w-35 rounded-xl px-3 py-1.5 text-xs leading-tight text-zinc-700 backdrop-blur-sm",
                theme.tooltip,
                tooltipSide === "right" ? "left-17" : "right-17",
              )}
            >
              <div
                className={cn(
                  "absolute top-1/2 h-0 w-0 -translate-y-1/2 border-y-4 border-y-transparent",
                  tooltipSide === "right" ? theme.tooltipArrowRight : theme.tooltipArrowLeft,
                )}
              />
              {theme.tooltipText}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isOpen && isVisible && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 0 }}
                animate={{ opacity: 1, scale: 1, y: -65 }}
                exit={{ opacity: 0, scale: 0.5, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="absolute"
              >
                {role === "visitor" ? (
                  <Link
                    href="/auth/login"
                    onClick={onLoginClick}
                    aria-label="Entrar para interagir"
                    className={chatButtonClassName}
                  >
                    <Lock className="h-4.5 w-4.5 text-white" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={openChatWithBrief}
                    aria-label="Abrir chat direto"
                    className={chatButtonClassName}
                  >
                    <MessageSquare className="h-4.5 w-4.5 fill-white text-white" />
                  </button>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 0 }}
                animate={{ opacity: 1, scale: 1, y: -115 }}
                exit={{ opacity: 0, scale: 0.5, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.05 }}
                className="absolute"
              >
                <button
                  type="button"
                  onClick={() => setRiskTarget("WhatsApp")}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg"
                >
                  <WhatsAppIcon className="h-5.5 w-5.5" />
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 0 }}
                animate={{ opacity: 1, scale: 1, y: -165 }}
                exit={{ opacity: 0, scale: 0.5, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                className="absolute"
              >
                <button
                  type="button"
                  onClick={() => setRiskTarget("Telegram")}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-sky-500 text-white shadow-lg"
                >
                  <TelegramIcon className="h-5.5 w-5.5" />
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={toggleOpen}
          className={cn(
            "relative z-20 h-14 w-14 shrink-0 cursor-pointer rounded-full p-0.5 shadow-xl transition-transform active:scale-95",
            theme.toggle,
            isOpen && theme.toggleOpen,
          )}
        >
          <div
            className={cn(
              "relative h-full w-full overflow-hidden rounded-full border bg-zinc-900",
              theme.avatarFrame,
            )}
          >
            <Image
              src={ad.images[0]}
              alt={ad.artisticName}
              fill
              className="pointer-events-none object-cover select-none"
              sizes="56px"
              loading="eager"
              referrerPolicy="no-referrer"
              draggable={false}
            />
          </div>
          <div
            className={cn(
              "absolute right-[14.6%] bottom-[14.6%] z-20 flex h-6 w-6 translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full",
              theme.badge,
            )}
          >
            {isOpen ? (
              <X className="h-3.5 w-3.5 text-white" />
            ) : (
              <MessageSquare className="h-3.5 w-3.5 fill-white text-white" />
            )}
          </div>
        </button>
      </div>
    </motion.div>
  );
}
