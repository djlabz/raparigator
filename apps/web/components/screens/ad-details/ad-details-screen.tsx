"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAdDetails } from "./use-ad-details";
import { ProfileHeader } from "./profile-header";
import { PhotoGallerySection } from "./photo-gallery-section";
import { AboutSection } from "./about-section";
import { SchedulingSimulator } from "./scheduling-simulator";
import { SpecialtiesSection } from "./specialties-section";
import { ReviewsSection } from "./reviews-section";
import { SidebarCta } from "./sidebar-cta";
import { PhotoLightbox } from "./photo-lightbox";
import { MobileContactFab } from "./mobile-contact-fab";
import { getAdDetailsVariant } from "./variant";
import { AppShell } from "@/components/layout/app-shell";
import {
  FEED_CARDS_COLUMN_OFFSET_CLASS,
  FEED_CONTENT_GRID_CLASS,
  FEED_SIDE_COLUMN_CLASS,
} from "@/components/screens/feed-screen/constants";
import { EmptyState } from "@/components/ui/empty-state";
import { RiskWarningModal } from "@/components/ui/risk-warning-modal";
import { useRegisterAdView } from "@/lib/ads-api";
import { consumeReturnScroll } from "@/lib/auth-return";
import {
  copyToClipboard,
  getExternalContactText,
  getTelegramChatUrl,
  getWhatsAppChatUrl,
} from "@/lib/share-utils";
import { useScrollToAnchorUntilStable } from "@/lib/use-scroll-to-anchor-until-stable";
import { cn } from "@/lib/utils";

interface AdDetailsScreenProps {
  slug: string;
}

export function AdDetailsScreen({ slug }: AdDetailsScreenProps) {
  const {
    ad,
    isLoading,
    role,
    riskTarget,
    setRiskTarget,
    selectedPhotoIndex,
    setSelectedPhotoIndex,
    galleryMode,
    setGalleryMode,
    selectedDuration,
    setSelectedDuration,
    selectedExtras,
    toggleExtra,
    bentoItems,
    basePrice,
    calculatedExtrasCost,
    totalCalculatedValue,
    nextPhoto,
    prevPhoto,
    brief,
  } = useAdDetails(slug);
  useRegisterAdView(slug, Boolean(ad));
  const pathname = usePathname();

  const [returnScroll] = useState(() => consumeReturnScroll(pathname));
  const [anchorId] = useState(() =>
    typeof window === "undefined" ? null : window.location.hash.slice(1) || null,
  );
  const [externalTargetUrl, setExternalTargetUrl] = useState<string | null>(null);
  const [externalTextCopied, setExternalTextCopied] = useState(false);

  useScrollToAnchorUntilStable(returnScroll, anchorId);

  if (isLoading) {
    return <AppShell>{null}</AppShell>;
  }

  if (!ad) {
    return (
      <AppShell>
        <EmptyState
          title="Esse encanto não está mais aqui"
          description="O perfil pode ter saído do ar ou mudado de endereço. Volta e escolhe outro que te faça piscadinha."
        />
      </AppShell>
    );
  }

  const variant = getAdDetailsVariant(ad);
  const isPremium = variant === "premium";

  const handleExternalContact = async (target: "WhatsApp" | "Telegram") => {
    setRiskTarget(target);
    setExternalTextCopied(false);

    if (target === "WhatsApp") {
      setExternalTargetUrl(
        ad.whatsappNumber
          ? getWhatsAppChatUrl(ad.artisticName, ad.slug, ad.whatsappNumber, brief)
          : null,
      );
      return;
    }

    setExternalTargetUrl(
      ad.telegramUsername
        ? getTelegramChatUrl(ad.artisticName, ad.slug, ad.telegramUsername, brief)
        : null,
    );
    const copied = await copyToClipboard(getExternalContactText(ad.artisticName, ad.slug, brief));
    setExternalTextCopied(copied);
  };

  return (
    <AppShell location={`${ad.city}, ${ad.state}`}>
      <div className={FEED_CONTENT_GRID_CLASS}>
        <div className={cn("hidden lg:block", FEED_SIDE_COLUMN_CLASS)} aria-hidden />
        <div
          data-ad-content-column
          className={cn("min-w-0 space-y-7 pb-24 md:pb-12", FEED_CARDS_COLUMN_OFFSET_CLASS)}
        >
          <ProfileHeader ad={ad} variant={variant} />

          <PhotoGallerySection
            ad={ad}
            galleryMode={galleryMode}
            setGalleryMode={setGalleryMode}
            bentoItems={bentoItems}
            isPremium={isPremium}
            setSelectedPhotoIndex={setSelectedPhotoIndex}
          />

          <section className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <AboutSection ad={ad} variant={variant} />
              <SpecialtiesSection ad={ad} />
              <SchedulingSimulator
                ad={ad}
                variant={variant}
                selectedDuration={selectedDuration}
                setSelectedDuration={setSelectedDuration}
                selectedExtras={selectedExtras}
                toggleExtra={toggleExtra}
                basePrice={basePrice}
                calculatedExtrasCost={calculatedExtrasCost}
                totalCalculatedValue={totalCalculatedValue}
                role={role}
                setRiskTarget={handleExternalContact}
                brief={brief}
              />
              <ReviewsSection ad={ad} variant={variant} />
            </div>

            <aside className="hidden lg:block">
              <SidebarCta
                role={role}
                variant={variant}
                setRiskTarget={handleExternalContact}
                brief={brief}
              />
            </aside>
          </section>
        </div>
      </div>

      <PhotoLightbox
        images={ad.images}
        selectedIndex={selectedPhotoIndex}
        onClose={() => setSelectedPhotoIndex(null)}
        onNext={nextPhoto}
        onPrev={prevPhoto}
        onSelect={setSelectedPhotoIndex}
      />

      <MobileContactFab
        ad={ad}
        role={role}
        variant={variant}
        setRiskTarget={handleExternalContact}
        brief={brief}
      />

      <RiskWarningModal
        open={Boolean(riskTarget)}
        onClose={() => {
          setRiskTarget(null);
          setExternalTargetUrl(null);
          setExternalTextCopied(false);
        }}
        targetLabel={riskTarget ?? "canal externo"}
        onConfirm={() => {
          setRiskTarget(null);
          if (typeof window !== "undefined" && externalTargetUrl) {
            window.open(externalTargetUrl, "_blank", "noopener,noreferrer");
          }
          setExternalTargetUrl(null);
          setExternalTextCopied(false);
        }}
        messageCopied={externalTextCopied}
      />
    </AppShell>
  );
}
