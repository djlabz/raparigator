"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import {
  Eye,
  Heart,
  MapPin,
  Ruler,
  Scissors,
  ShieldCheck,
  Upload,
  User,
  Weight,
  type LucideIcon,
} from "lucide-react";
import type { ProfessionalAd } from "@/lib/types";
import { isLocalImageSrc, resolveAdProfileImage } from "@/lib/ad-profile-image";
import { ShareProfileModal } from "@/components/ui/share-profile-modal";
import { cn } from "@/lib/utils";
import type { AdDetailsVariant } from "./variant";

const HEADER_THEME = {
  premium: {
    section: "relative isolate border-premium-border bg-premium-surface shadow-xl",
    cover: "bg-zinc-900",
    coverFade: "h-40 from-premium-surface via-premium-surface/70 to-transparent",
    actionButton:
      "border-gold/70 bg-linear-to-br from-premium-border to-[#0a0a0a] shadow-[0_4px_6px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)]",
    actionIcon: "text-[#FFEA00] drop-shadow-[0_0_6px_rgba(255,234,0,1)]",
    actionLabel:
      "bg-linear-to-r from-gold-gradient-start via-gold-gradient-mid to-gold-gradient-end bg-clip-text font-bold tracking-wider text-transparent drop-shadow-[0_1px_1px_rgba(0,0,0,1)]",
    avatarFrame:
      "rounded-full bg-linear-to-tr from-amber-300 via-[#a88222] to-amber-300 p-1 shadow-[0_0_20px_rgba(218,165,32,0.35)]",
    avatarInner: "border-[3px] border-premium-surface",
    status: "bg-success",
    statusRing: "ring-premium-surface",
    name: "text-gold-bright drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]",
    meta: "text-zinc-300",
    verified: "text-success",
    attribute:
      "cursor-pointer border-white/8 bg-[#0c0c0c]/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-sm transition-transform duration-300 hover:scale-[1.02]",
    attributeIconSlot: "border border-white/8 bg-black/55",
    attributeLabel: "tracking-[0.16em] text-amber-300/85 sm:tracking-[0.18em]",
    attributeValue: "text-zinc-100",
  },
  standard: {
    section: "border-zinc-200 bg-white shadow-sm",
    cover: "bg-zinc-100",
    coverFade: "h-16 from-white to-transparent",
    actionButton: "border-zinc-200/90 bg-white/90 shadow-sm",
    actionIcon: "text-zinc-600",
    actionLabel: "font-semibold text-zinc-700",
    avatarFrame: "overflow-hidden rounded-full border-4 border-white bg-zinc-100 shadow-md",
    avatarInner: "",
    status: "bg-emerald-500",
    statusRing: "ring-white",
    name: "text-zinc-900",
    meta: "text-zinc-500",
    verified: "text-emerald-600",
    attribute: "border-zinc-200 bg-zinc-50/80 shadow-xs transition-colors hover:border-zinc-300",
    attributeIconSlot: "bg-wine-50 text-wine-700",
    attributeLabel: "tracking-wider text-zinc-400",
    attributeValue: "text-zinc-800",
  },
} as const satisfies Record<AdDetailsVariant, Record<string, string>>;

type HeaderAttribute = { label: string; value: string; iconSrc: string; Icon: LucideIcon };

function buildAttributes(ad: ProfessionalAd): HeaderAttribute[] {
  return [
    {
      label: "Altura",
      value: `${ad.heightCm} cm`,
      iconSrc: "/icons/attributes/size-woman.svg",
      Icon: Ruler,
    },
    {
      label: "Cabelo",
      value: `${ad.hairType} • ${ad.hairColor}`,
      iconSrc: "/icons/attributes/hair-woman.svg",
      Icon: Scissors,
    },
    { label: "Etnia", value: ad.ethnicity, iconSrc: "/icons/attributes/person.svg", Icon: User },
    { label: "Olhos", value: ad.eyeColor, iconSrc: "/icons/attributes/eye.svg", Icon: Eye },
    {
      label: "Peso",
      value: `${ad.weightKg} kg`,
      iconSrc: "/icons/attributes/weight.svg",
      Icon: Weight,
    },
  ];
}

interface ProfileHeaderProps {
  ad: ProfessionalAd;
  variant: AdDetailsVariant;
}

export function ProfileHeader({ ad, variant }: ProfileHeaderProps) {
  const theme = HEADER_THEME[variant];
  const isPremium = variant === "premium";
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const profileImageSrc = resolveAdProfileImage(ad);
  const attributes = buildAttributes(ad);
  const actionButtonClassName = cn(
    "flex cursor-pointer items-center gap-1.5 rounded-full border p-2 backdrop-blur-md sm:px-3 sm:py-1.5",
    theme.actionButton,
  );
  const actionLabelClassName = cn("hidden text-xs sm:inline-block", theme.actionLabel);

  return (
    <section className={cn("overflow-hidden rounded-2xl border select-none", theme.section)}>
      <div className={cn("relative h-48 w-full overflow-hidden sm:h-64 md:h-72", theme.cover)}>
        <Image
          src={ad.images[0]}
          alt={`Capa de ${ad.artisticName}`}
          fill
          className="pointer-events-none object-cover select-none"
          priority
          loading="eager"
          fetchPriority="high"
          sizes="100vw"
          referrerPolicy="no-referrer"
          draggable={false}
        />

        {isPremium && (
          <div className="absolute top-4 left-4 z-20 flex cursor-default items-center gap-1.5 rounded-full border border-gold/70 bg-linear-to-br from-premium-border to-[#0a0a0a] px-3 py-1.5 shadow-[0_4px_6px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md transition-all duration-300 select-none hover:scale-105 hover:shadow-[0_0_12px_rgba(251,191,36,0.45)]">
            <span className="text-xs text-gold-bright drop-shadow-[0_0_4px_rgba(255,223,0,0.9)]">
              ★
            </span>
            <span className="bg-linear-to-r from-gold-gradient-start via-gold-gradient-mid to-gold-gradient-end bg-clip-text text-xs font-extrabold tracking-[0.2em] text-transparent uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">
              Premium
            </span>
          </div>
        )}

        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.85 }}
            onClick={() => setShareModalOpen(true)}
            className={actionButtonClassName}
          >
            <Upload className={cn("h-4 w-4", theme.actionIcon)} strokeWidth={2.5} />
            <span className={actionLabelClassName}>Compartilhar</span>
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.85 }}
            className={actionButtonClassName}
          >
            <Heart className={cn("h-4 w-4", theme.actionIcon)} strokeWidth={2.5} />
            <span className={actionLabelClassName}>Salvar</span>
          </motion.button>
        </div>

        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-linear-to-t",
            theme.coverFade,
          )}
        />
      </div>

      {isPremium && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-black/20 via-black/40 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,223,0,0.02)_0%,transparent_40%,rgba(218,165,32,0.03)_100%)]" />
        </>
      )}

      <div className="relative z-10 w-full px-4 pb-4 sm:px-8 sm:pb-6 md:px-12 md:pb-8">
        <div className="flex flex-col gap-5 md:gap-6">
          <div className="relative -mt-8 flex flex-row items-center gap-3 sm:-mt-12 sm:gap-4 md:-mt-16 md:items-end md:justify-between">
            <div className="flex items-end gap-3 sm:gap-4">
              <div className="relative inline-block shrink-0 align-bottom">
                <div
                  className={cn(
                    "relative z-10 h-20 w-20 sm:h-28 sm:w-28 md:h-36 md:w-36",
                    theme.avatarFrame,
                  )}
                >
                  <div
                    className={cn(
                      "relative h-full w-full overflow-hidden rounded-full",
                      theme.avatarInner,
                    )}
                  >
                    <Image
                      src={profileImageSrc}
                      alt={ad.artisticName}
                      fill
                      className="pointer-events-none object-cover select-none"
                      sizes="(max-width: 640px) 80px, (max-width: 768px) 112px, 144px"
                      referrerPolicy="no-referrer"
                      draggable={false}
                      unoptimized={isLocalImageSrc(profileImageSrc)}
                    />
                  </div>
                </div>
                <div className="absolute right-[14.6%] bottom-[14.6%] z-10 translate-x-1/2 translate-y-1/2">
                  <span className="relative flex h-3 w-3 items-center justify-center sm:h-4 sm:w-4">
                    <span
                      className={cn(
                        "absolute inline-flex h-full w-full animate-ping rounded-full opacity-65",
                        theme.status,
                      )}
                    />
                    <span
                      className={cn(
                        "relative inline-flex h-full w-full rounded-full ring-2",
                        theme.status,
                        theme.statusRing,
                      )}
                    />
                  </span>
                </div>
              </div>

              <div className="min-w-0 space-y-1 text-left sm:space-y-2">
                <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-4">
                  <h1
                    className={cn(
                      "min-w-0 font-display text-xl leading-tight font-bold sm:text-3xl",
                      theme.name,
                    )}
                  >
                    {ad.artisticName}
                  </h1>
                </div>

                <div
                  className={cn(
                    "flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:gap-x-5 sm:text-sm",
                    theme.meta,
                  )}
                >
                  <span className="flex items-center gap-1.5 leading-none font-medium">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-red-500 sm:h-4 sm:w-4" />
                    {ad.neighborhood}, {ad.city}
                  </span>

                  <span className="flex items-center gap-1.5 leading-none font-medium">
                    <Image
                      src="/icons/attributes/age.svg"
                      alt="Idade"
                      width={16}
                      height={16}
                      className="pointer-events-none h-3.5 w-3.5 object-contain select-none sm:h-4 sm:w-4"
                      referrerPolicy="no-referrer"
                      draggable={false}
                    />
                    {ad.age} anos
                  </span>

                  <div
                    className={cn(
                      "flex items-center gap-1.5 leading-none font-medium",
                      theme.verified,
                    )}
                  >
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                    Identidade Verificada
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {attributes.map((attribute) => (
              <div
                key={attribute.label}
                className={cn(
                  "flex min-h-20 items-center gap-2 rounded-2xl border px-3 py-3 sm:min-h-24 sm:gap-3 sm:px-4 sm:py-4",
                  theme.attribute,
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12",
                    theme.attributeIconSlot,
                  )}
                >
                  {isPremium ? (
                    <Image
                      src={attribute.iconSrc}
                      alt={attribute.label}
                      width={34}
                      height={34}
                      className="pointer-events-none h-7 w-7 object-contain select-none sm:h-8 sm:w-8"
                      referrerPolicy="no-referrer"
                      draggable={false}
                    />
                  ) : (
                    <attribute.Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  )}
                </div>

                <div className="min-w-0 space-y-1">
                  <p
                    className={cn(
                      "text-[10px] font-bold uppercase sm:text-xs",
                      theme.attributeLabel,
                    )}
                  >
                    {attribute.label}
                  </p>
                  <p
                    className={cn(
                      "wrap-break-word text-xs font-semibold sm:text-base",
                      theme.attributeValue,
                    )}
                  >
                    {attribute.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ShareProfileModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        ad={ad}
        isPremium={isPremium}
      />
    </section>
  );
}
