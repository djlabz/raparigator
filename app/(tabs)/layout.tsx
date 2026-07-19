"use client";

import type { PropsWithChildren } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ShellChromeProvider } from "@/components/layout/shell-chrome";
import { FeedHeaderTitleRoot } from "@/components/screens/feed-screen/feed-header-title-context";

export default function TabsLayout({ children }: PropsWithChildren) {
  return (
    <FeedHeaderTitleRoot>
      <ShellChromeProvider>
        <AppShell>{children}</AppShell>
      </ShellChromeProvider>
    </FeedHeaderTitleRoot>
  );
}
