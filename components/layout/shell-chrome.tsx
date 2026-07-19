"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

export type ShellChromeState = {
  hideMobileBottomNav: boolean;
  hideTopHeader: boolean;
  hideDesktopNav: boolean;
  mainClassName?: string;
  onBack?: () => void;
};

const defaultChrome: ShellChromeState = {
  hideMobileBottomNav: false,
  hideTopHeader: false,
  hideDesktopNav: false,
};

type ShellChromeContextValue = {
  chrome: ShellChromeState;
  setChrome: (chrome: Partial<ShellChromeState>) => void;
  resetChrome: () => void;
};

const ShellChromeContext = createContext<ShellChromeContextValue | null>(null);

export function ShellChromeProvider({ children }: PropsWithChildren) {
  const [chrome, setChromeState] = useState<ShellChromeState>(defaultChrome);

  const setChrome = useCallback((next: Partial<ShellChromeState>) => {
    setChromeState({
      hideMobileBottomNav: next.hideMobileBottomNav ?? false,
      hideTopHeader: next.hideTopHeader ?? false,
      hideDesktopNav: next.hideDesktopNav ?? false,
      mainClassName: next.mainClassName,
      onBack: next.onBack,
    });
  }, []);

  const resetChrome = useCallback(() => {
    setChromeState(defaultChrome);
  }, []);

  const value = useMemo<ShellChromeContextValue>(
    () => ({
      chrome,
      setChrome,
      resetChrome,
    }),
    [chrome, setChrome, resetChrome]
  );

  return <ShellChromeContext.Provider value={value}>{children}</ShellChromeContext.Provider>;
}

export function useShellChrome(): ShellChromeState {
  const context = useContext(ShellChromeContext);
  return context?.chrome ?? defaultChrome;
}

export function useSetShellChrome(chrome: Partial<ShellChromeState>): void {
  const context = useContext(ShellChromeContext);
  const setChrome = context?.setChrome;
  const resetChrome = context?.resetChrome;
  const hideMobileBottomNav = chrome.hideMobileBottomNav ?? false;
  const hideTopHeader = chrome.hideTopHeader ?? false;
  const hideDesktopNav = chrome.hideDesktopNav ?? false;
  const mainClassName = chrome.mainClassName;
  const onBack = chrome.onBack;

  useLayoutEffect(() => {
    if (!setChrome || !resetChrome) {
      return;
    }

    setChrome({
      hideMobileBottomNav,
      hideTopHeader,
      hideDesktopNav,
      mainClassName,
      onBack,
    });

    return () => {
      resetChrome();
    };
  }, [
    setChrome,
    resetChrome,
    hideMobileBottomNav,
    hideTopHeader,
    hideDesktopNav,
    mainClassName,
    onBack,
  ]);
}
