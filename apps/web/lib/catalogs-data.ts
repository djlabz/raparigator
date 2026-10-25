"use client";

import { useEffect, useState } from "react";
import type { Catalogs } from "@sigillus/contracts";
import {
  CATALOG_CATEGORIES,
  CATALOG_CITIES,
  CATALOG_ETHNICITIES,
  CATALOG_FETISHES,
  CATALOG_HAIR_COLORS,
  CATALOG_HAIR_TYPES,
  CATALOG_LOCATIONS,
  CATALOG_PAYMENT_METHODS,
  CATALOG_SERVICES,
  CATALOG_STATES,
} from "@sigillus/domain";
import { getApiClient } from "@/lib/api/client";
import { reportStoreError, storeErrorMessage } from "@/lib/report-store-error";

export type CatalogsSource = "api" | "local";

export type CatalogsResult = Catalogs & { source: CatalogsSource; error: string | null };

const CATALOGS_LOAD_ERROR = "Não foi possível carregar as listas da plataforma.";

const LOCAL_CATALOGS: Catalogs = {
  states: CATALOG_STATES,
  cities: CATALOG_CITIES,
  locations: CATALOG_LOCATIONS,
  categories: CATALOG_CATEGORIES,
  services: CATALOG_SERVICES,
  fetishes: CATALOG_FETISHES,
  ethnicities: CATALOG_ETHNICITIES,
  hairColors: CATALOG_HAIR_COLORS,
  hairTypes: CATALOG_HAIR_TYPES,
  paymentMethods: CATALOG_PAYMENT_METHODS,
};

const LOCAL_RESULT: CatalogsResult = { ...LOCAL_CATALOGS, source: "local", error: null };

let cachedCatalogs: Catalogs | null = null;
let cachedResult: CatalogsResult | null = null;
let pendingCatalogs: Promise<Catalogs> | null = null;

function loadCatalogs(): Promise<Catalogs> {
  if (!pendingCatalogs) {
    pendingCatalogs = getApiClient()
      .catalogs.get()
      .then((catalogs) => {
        cachedCatalogs = catalogs;
        return catalogs;
      })
      .catch((error: unknown) => {
        pendingCatalogs = null;
        throw error;
      });
  }
  return pendingCatalogs;
}

export function useCatalogs(): CatalogsResult {
  const [result, setResult] = useState<CatalogsResult | null>(cachedResult);

  useEffect(() => {
    if (cachedCatalogs) {
      return;
    }
    let cancelled = false;
    loadCatalogs()
      .then((loaded) => {
        cachedResult = { ...loaded, source: "api", error: null };
        if (!cancelled) {
          setResult(cachedResult);
        }
      })
      .catch((error: unknown) => {
        reportStoreError("catalogs.get", error);
        if (!cancelled) {
          setResult({
            ...LOCAL_CATALOGS,
            source: "local",
            error: storeErrorMessage(error, CATALOGS_LOAD_ERROR),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return result ?? cachedResult ?? LOCAL_RESULT;
}
