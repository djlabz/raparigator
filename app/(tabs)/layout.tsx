"use client";

import type { PropsWithChildren } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ShellChromeProvider } from "@/components/layout/shell-chrome";
import { TabsKeepAlive } from "@/components/layout/tabs-keep-alive";
import { FeedHeaderTitleRoot } from "@/components/screens/feed-screen/feed-header-title-context";
import { DashboardHeaderTitleRoot } from "@/components/screens/professional-dashboard/dashboard-header-title-context";

export default function TabsLayout({ children }: PropsWithChildren) {
  return (
    <FeedHeaderTitleRoot>
      <DashboardHeaderTitleRoot>
        <ShellChromeProvider>
          <AppShell>
            <TabsKeepAlive>{children}</TabsKeepAlive>
          </AppShell>
        </ShellChromeProvider>
      </DashboardHeaderTitleRoot>
    </FeedHeaderTitleRoot>
  );
}
