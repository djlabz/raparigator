"use client";

import { ReactNode, useEffect } from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children?: ReactNode;
  actions?: ReactNode | null;
  headerActions?: ReactNode;
  size?: "sm" | "md";
}

export function Modal({ open, title, description, onClose, children, actions, headerActions, size = "sm" }: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const resolvedActions = actions === undefined ? (
    <Button variant="secondary" fullWidth onClick={onClose}>
      Fechar
    </Button>
  ) : actions;

  return (
    <div className="fixed inset-0 z-220 flex items-end bg-zinc-900/50 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] touch-none sm:items-center sm:justify-center" role="dialog" aria-modal="true">
      <div
        className={cn("flex w-full flex-col overflow-hidden rounded-2xl bg-white p-5 shadow-xl", size === "md" ? "sm:max-w-2xl" : "sm:max-w-md")}
        style={{
          maxHeight: "calc(100dvh - max(1rem, env(safe-area-inset-top)) - max(1rem, env(safe-area-inset-bottom)))",
        }}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
            {description ? <p className="text-sm text-zinc-600">{description}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            {headerActions}
            <button
              type="button"
              aria-label="Fechar modal"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-1 overscroll-contain touch-pan-y">
          {children}
        </div>
        {resolvedActions ? <div className="mt-5 flex shrink-0 gap-2 border-t border-zinc-100 pt-4">{resolvedActions}</div> : null}
      </div>
      <button aria-label="Fechar modal" className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}
