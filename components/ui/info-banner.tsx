import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InfoBannerProps {
  title: string;
  description: string;
  tone?: "neutral" | "highlight" | "secure";
  icon?: ReactNode;
}

export function InfoBanner({ title, description, tone = "neutral", icon }: InfoBannerProps) {
  const toneClassName =
    tone === "highlight"
      ? "border-wine-200 bg-wine-50"
      : tone === "secure"
        ? "border-wine-300/80 bg-linear-to-br from-wine-50 to-zinc-100"
        : "border-zinc-200 bg-zinc-50";

  const iconClassName = tone === "secure" ? "bg-wine-700 text-white" : "bg-white text-zinc-700";

  return (
    <div className={cn("rounded-2xl border p-4", toneClassName)}>
      <div className="flex gap-3">
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm", iconClassName)}>{icon ?? "i"}</div>
        <div>
          <p className="text-sm font-semibold text-zinc-900">{title}</p>
          <p className="text-sm text-zinc-600">{description}</p>
        </div>
      </div>
    </div>
  );
}
