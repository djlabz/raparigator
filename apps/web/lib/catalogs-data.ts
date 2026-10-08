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
import { isApiDataSource } from "@/lib/data-source";

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

let cachedCatalogs: Catalogs | null = null;
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

export function useCatalogs(): Catalogs {
  const useApi = isApiDataSource();
  const [catalogs, setCatalogs] = useState<Catalogs | null>(cachedCatalogs);

  useEffect(() => {
    if (!useApi || cachedCatalogs) {
      return;
    }
    let cancelled = false;
    loadCatalogs()
      .then((loaded) => {
        if (!cancelled) {
          setCatalogs(loaded);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [useApi]);

  if (!useApi) {
    return LOCAL_CATALOGS;
  }
  return catalogs ?? cachedCatalogs ?? LOCAL_CATALOGS;
}
