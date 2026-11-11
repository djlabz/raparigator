"use client";

import { Star, ThumbsUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAdReviews } from "@/lib/ad-reviews";
import type { ProfessionalAd } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ReviewCta } from "./review-cta";
import type { AdDetailsVariant } from "./variant";

const REVIEWS_THEME = {
  premium: {
    ratingChip: "border-amber-200",
    ratingText: "text-amber-800",
    scoreChip: "border-amber-100/40",
    scoreText: "text-amber-800",
  },
  standard: {
    ratingChip: "border-amber-100",
    ratingText: "text-amber-700",
    scoreChip: "border-amber-100",
    scoreText: "text-amber-700",
  },
} as const satisfies Record<AdDetailsVariant, Record<string, string>>;

interface ReviewsSectionProps {
  ad: ProfessionalAd;
  variant: AdDetailsVariant;
}

export function ReviewsSection({ ad, variant }: ReviewsSectionProps) {
  const theme = REVIEWS_THEME[variant];
  const { reviews, rating, reviewsCount } = useAdReviews(ad);

  return (
    <Card className="space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-zinc-100 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-lg font-bold tracking-tight text-zinc-900 sm:text-xl">
            Avaliações dos Clientes ({reviewsCount})
          </h3>
          <p className="text-xs text-zinc-500 sm:text-sm">
            Só quem conversou pelo chat e recebeu convite da profissional pode avaliar
          </p>
        </div>
        <div
          className={cn(
            "self-start rounded-full border bg-amber-50 px-3 py-1 sm:self-center",
            theme.ratingChip,
          )}
        >
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
            <span className={cn("text-xs font-black", theme.ratingText)}>
              {rating.toFixed(1)} / 5
            </span>
          </div>
        </div>
      </div>

      <ReviewCta ad={ad} />

      <div className="space-y-3">
        {reviews.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-400">
            Nenhum comentário ou avaliação recente no momento.
          </p>
        ) : (
          reviews.map((review) => (
            <article
              key={review.id}
              className="space-y-2.5 rounded-xl border border-zinc-100/90 bg-[#fafafa]/50 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 font-display text-xs font-bold text-zinc-600 uppercase shadow-xs">
                    {review.author.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-900">{review.author}</p>
                    <span className="mt-0.5 block text-xs leading-none font-semibold text-zinc-400">
                      Membro Verificado • Há poucos dias
                    </span>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1 rounded-md border bg-amber-50 px-2 py-0.5",
                    theme.scoreChip,
                  )}
                >
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                  <span className={cn("text-xs font-bold", theme.scoreText)}>
                    {review.score.toFixed(1)}
                  </span>
                </div>
              </div>

              <p className="pl-10 text-xs leading-relaxed text-zinc-600">
                &ldquo;{review.comment}&rdquo;
              </p>

              <div className="flex items-center gap-1 pt-1 pl-10 text-xs font-bold tracking-wider text-emerald-700 uppercase">
                <ThumbsUp className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                Perfil Recomendado
              </div>
            </article>
          ))
        )}
      </div>
    </Card>
  );
}
