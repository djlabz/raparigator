"use client";

import { useState } from "react";
import { useAdDetails } from "./use-ad-details";
import { StandardProfileHeader } from "./standard-profile-header";
import { PhotoGallerySection } from "./photo-gallery-section";
import { StandardAboutSection } from "./standard-about-section";
import { SpecialtiesSection } from "./specialties-section";
import { StandardReviewsSection } from "./standard-reviews-section";
import { StandardSchedulingSimulator } from "./standard-scheduling-simulator";
import { StandardSidebarCta } from "./standard-sidebar-cta";
import { StandardMobileContactFab } from "./standard-mobile-contact-fab";
import { PhotoLightbox } from "./photo-lightbox";
import { AppShell } from "@/components/layout/app-shell";
import {
  FEED_CARDS_COLUMN_OFFSET_CLASS,
  FEED_CONTENT_GRID_CLASS,
  FEED_SIDE_COLUMN_CLASS,
} from "@/components/screens/feed-screen/constants";
import { EmptyState } from "@/components/ui/empty-state";
import { RiskWarningModal } from "@/components/ui/risk-warning-modal";
import { getTelegramChatUrl, getWhatsAppChatUrl } from "@/lib/share-utils";
import { cn } from "@/lib/utils";

interface StandardAdDetailsScreenProps {
  slug: string;
}

export function StandardAdDetailsScreen({ slug }: StandardAdDetailsScreenProps) {
  const {
    ad,
    role,
    riskTarget,
    setRiskTarget,
    selectedPhotoIndex,
    setSelectedPhotoIndex,
    galleryMode,
    setGalleryMode,
    bentoItems,
    selectedDuration,
    setSelectedDuration,
    selectedExtras,
    toggleExtra,
    basePrice,
    calculatedExtrasCost,
    totalCalculatedValue,
    nextPhoto,
    prevPhoto,
  } = useAdDetails(slug);

  const [externalTargetUrl, setExternalTargetUrl] = useState<string | null>(null);

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

  const handleExternalContact = (target: "WhatsApp" | "Telegram") => {
    setRiskTarget(target);
    if (target === "WhatsApp") {
      setExternalTargetUrl(
        ad.whatsappNumber ? getWhatsAppChatUrl(ad.artisticName, ad.slug, ad.whatsappNumber) : null,
      );
      return;
    }
    setExternalTargetUrl(
      ad.telegramUsername
        ? getTelegramChatUrl(ad.artisticName, ad.slug, ad.telegramUsername)
        : null,
    );
  };

  return (
    <AppShell location={`${ad.city}, ${ad.state}`}>
      <div className={FEED_CONTENT_GRID_CLASS}>
        <div className={cn("hidden lg:block", FEED_SIDE_COLUMN_CLASS)} aria-hidden />
        <div
          data-ad-content-column
          className={cn("min-w-0 space-y-7 pb-24 md:pb-12", FEED_CARDS_COLUMN_OFFSET_CLASS)}
        >
          <StandardProfileHeader ad={ad} />
          <PhotoGallerySection
            ad={ad}
            galleryMode={galleryMode}
            setGalleryMode={setGalleryMode}
            bentoItems={bentoItems}
            isPremium={false}
            setSelectedPhotoIndex={setSelectedPhotoIndex}
          />
          <section className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <StandardAboutSection ad={ad} />
              <SpecialtiesSection ad={ad} />
              <StandardSchedulingSimulator
                ad={ad}
                selectedDuration={selectedDuration}
                setSelectedDuration={setSelectedDuration}
                selectedExtras={selectedExtras}
                toggleExtra={toggleExtra}
                basePrice={basePrice}
                calculatedExtrasCost={calculatedExtrasCost}
                totalCalculatedValue={totalCalculatedValue}
                role={role}
                setRiskTarget={handleExternalContact}
              />
              <StandardReviewsSection ad={ad} />
            </div>

            <aside className="hidden lg:block">
              <StandardSidebarCta role={role} setRiskTarget={handleExternalContact} />
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

      <StandardMobileContactFab
        ad={ad}
        setRiskTarget={handleExternalContact}
        role={role === "cliente" ? "client" : role === "profissional" ? "professional" : role}
      />

      <RiskWarningModal
        open={Boolean(riskTarget)}
        onClose={() => {
          setRiskTarget(null);
          setExternalTargetUrl(null);
        }}
        targetLabel={riskTarget ?? "canal externo"}
        onConfirm={() => {
          setRiskTarget(null);
          if (typeof window !== "undefined" && externalTargetUrl) {
            window.open(externalTargetUrl, "_blank", "noopener,noreferrer");
          }
          setExternalTargetUrl(null);
        }}
      />
    </AppShell>
  );
}
