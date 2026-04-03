import Link from "next/link";
import { PropsWithChildren } from "react";
import { BackButton } from "@/components/ui/back-button";

interface AuthShellProps extends PropsWithChildren {
  title: string;
  description: string;
}

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <BackButton />
            <Link href="/" className="font-display text-2xl text-wine-800">Sigillus</Link>
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-zinc-900">{title}</h1>
          <p className="text-sm text-zinc-600">{description}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">{children}</div>
      </div>
    </div>
  );
}
