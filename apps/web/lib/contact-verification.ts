"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { ContactVerificationChannel, ContactVerificationState } from "@sigillus/contracts";
import { getApiClient } from "@/lib/api/client";
import { reportStoreError } from "@/lib/report-store-error";

export type { ContactVerificationChannel, ContactVerificationState };

export const HAS_CONTACT_VERIFICATION_PROVIDER = false;

export const CONTACT_VERIFICATION_LOAD_ERROR = "Não foi possível carregar o estado da verificação.";

export type ContactVerificationViewState = ContactVerificationState & { error: string | null };

const DEFAULT_INITIAL_STATE: ContactVerificationState = {
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

const SERVER_SNAPSHOT: ContactVerificationViewState = { ...DEFAULT_INITIAL_STATE, error: null };

let cachedState: ContactVerificationViewState = SERVER_SNAPSHOT;
let inFlightPromise: Promise<ContactVerificationState> | null = null;
let generation = 0;
const listeners = new Set<() => void>();

export function resetContactVerification() {
  generation += 1;
  inFlightPromise = null;
  cachedState = SERVER_SNAPSHOT;
  emitChange();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function getVerificationSnapshot(): ContactVerificationViewState {
  return cachedState;
}

function getServerSnapshot(): ContactVerificationViewState {
  return SERVER_SNAPSHOT;
}

async function fetchVerificationState(): Promise<ContactVerificationState> {
  if (inFlightPromise) {
    return inFlightPromise;
  }
  const started = generation;
  inFlightPromise = (async () => {
    try {
      const state = await getApiClient().contactVerification.getState();
      if (started !== generation) {
        return cachedState;
      }
      cachedState = { ...state, error: null };
      emitChange();
      return state;
    } catch (error) {
      if (started !== generation) {
        return cachedState;
      }
      reportStoreError("verification.getState", error);
      cachedState = { ...cachedState, error: CONTACT_VERIFICATION_LOAD_ERROR };
      emitChange();
      return cachedState;
    } finally {
      if (started === generation) {
        inFlightPromise = null;
      }
    }
  })();
  return inFlightPromise;
}

export function useContactVerification(
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

export async function sendContactVerificationCode(channel: ContactVerificationChannel) {
  const result = await getApiClient().contactVerification.sendCode({ channel });
  await fetchVerificationState();
  return result;
}

export async function confirmContactVerificationCode(
  channel: ContactVerificationChannel,
  code: string,
) {
  const result = await getApiClient().contactVerification.confirmCode({ channel, code });
  await fetchVerificationState();
  return result;
}
