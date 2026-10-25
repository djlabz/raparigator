"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { VerificationChannel, VerificationPublicState } from "@sigillus/contracts";
import { getApiClient } from "@/lib/api/client";
import { reportStoreError } from "@/lib/report-store-error";

export type { VerificationChannel, VerificationPublicState };

export const HAS_VERIFICATION_PROVIDER = false;

export const VERIFICATION_LOAD_ERROR = "Não foi possível carregar o estado da verificação.";

export type VerificationViewState = VerificationPublicState & { error: string | null };

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

const SERVER_SNAPSHOT: VerificationViewState = { ...DEFAULT_INITIAL_STATE, error: null };

let cachedState: VerificationViewState = SERVER_SNAPSHOT;
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

function getVerificationSnapshot(): VerificationViewState {
  return cachedState;
}

function getServerSnapshot(): VerificationViewState {
  return SERVER_SNAPSHOT;
}

async function fetchVerificationState(): Promise<VerificationPublicState> {
  if (inFlightPromise) {
    return inFlightPromise;
  }
  inFlightPromise = (async () => {
    try {
      const state = await getApiClient().verification.getState();
      cachedState = { ...state, error: null };
      emitChange();
      return state;
    } catch (error) {
      reportStoreError("verification.getState", error);
      cachedState = { ...cachedState, error: VERIFICATION_LOAD_ERROR };
      emitChange();
      return cachedState;
    } finally {
      inFlightPromise = null;
    }
  })();
  return inFlightPromise;
}

export function useVerification(
  user?: { id?: string; email?: string; phone?: string | null } | null,
) {
  const state = useSyncExternalStore(subscribe, getVerificationSnapshot, getServerSnapshot);
  const enabled = Boolean(user);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    void fetchVerificationState();
  }, [enabled, user?.id]);

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
