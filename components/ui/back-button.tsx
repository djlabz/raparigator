"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  className?: string;
  onBack?: () => void;
}

export function BackButton({ className, onBack }: BackButtonProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Não exibe o botão se estiver na página inicial
  if (pathname === "/") return null;

  const handleClick = () => {
    if (onBack) {
      onBack();
      return;
    }

    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "group gap-1 px-2 text-zinc-500 hover:text-wine-700 hover:bg-wine-50 transition-all",
        className
      )}
      onClick={handleClick}
      aria-label="Voltar"
      title="Voltar para a página anterior"
    >
      {/* Ícone ChevronLeft Inline (SVG) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 transition-transform group-hover:-translate-x-1"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
      <span className="hidden md:inline font-medium text-sm">Voltar</span>
    </Button>
  );
}
