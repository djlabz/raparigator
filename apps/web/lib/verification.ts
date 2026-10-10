"use client";

import { useEffect, useSyncExternalStore } from "react";
import type {
  VerificationChannel,
  VerificationPublicChannelState,
  VerificationPublicState,
} from "@sigillus/contracts";
import { getApiClient } from "@/lib/api/client";

export type { VerificationChannel, VerificationPublicChannelState, VerificationPublicState };

export type VerificationState = VerificationPublicState;
export type VerificationChannelState = VerificationPublicChannelState;

export const HAS_VERIFICATION_PROVIDER = false;

const DEFAULT_INITIAL_STATE: VerificationPublicState = {
  email: {
    target: "",
    verified: false,
    verifiedAt: null,
    codeSentAt: null,
    expiresAt: null,
    attempts: 0,
  },
  phone: {
    target: "",
    verified: false,
    verifiedAt: null,
    codeSentAt: null,
    expiresAt: null,
    attempts: 0,
  },
  required: false,
};

let cachedState: VerificationPublicState = DEFAULT_INITIAL_STATE;
let inFlightPromise: Promise<VerificationPublicState> | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function getVerificationSnapshot(): VerificationPublicState {
  return cachedState;
}

export function getServerSnapshot(): VerificationPublicState {
  return DEFAULT_INITIAL_STATE;
}

export async function fetchVerificationState(): Promise<VerificationPublicState> {
  if (inFlightPromise) {
    return inFlightPromise;
  }
  inFlightPromise = (async () => {
    try {
      const state = await getApiClient().verification.getState();
      cachedState = state;
      emitChange();
      return state;
    } catch {
      return cachedState;
    } finally {
      inFlightPromise = null;
    }
  })();
  return inFlightPromise;
}

export function useVerification(_user?: { email?: string; phone?: string | null } | null) {
  const state = useSyncExternalStore(subscribe, getVerificationSnapshot, getServerSnapshot);

  useEffect(() => {
    void fetchVerificationState();
  }, []);

  return state;
}

export async function sendVerificationCode(channel: VerificationChannel) {
  const result = await getApiClient().verification.sendCode({ channel });
  await fetchVerificationState();
  return result;
}

export async function confirmVerificationCode(channel: VerificationChannel, code: string) {
  const result = await getApiClient().verification.confirmCode({ channel, code });
  await fetchVerificationState();
  return result;
}

export function getVerificationState(
  _userId?: string,
  _targets?: { email?: string; phone?: string | null } | null,
): VerificationPublicState {
  return cachedState;
}
