import { cn } from "@/lib/utils";

interface PremiumSeparatorProps {
  className?: string;
}

export function PremiumSeparator({ className }: PremiumSeparatorProps) {
  return (
    <div aria-hidden="true" className={cn("flex items-center", className)}>
      <div className="h-px flex-1 bg-linear-to-r from-transparent via-[#DAA520]/40 to-transparent" />
    </div>
  );
}
