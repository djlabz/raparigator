"use client";

import { useState } from "react";

const AUTOMATIC_LOCATION_CITY = "Sao Paulo";
const LOCATION_TOAST_MS = 3000;
const MIN_LOCATION_QUERY_LENGTH = 2;

export type FeedLocationFromUrl = { location: string; city: string };

export function readFeedLocationFromUrl(): FeedLocationFromUrl {
  if (typeof window === "undefined") {
    return { location: "", city: "all" };
  }
  const location = new URLSearchParams(window.location.search).get("location") || "";
  const city = location ? location.split(", ")[1] || "all" : "all";
  return { location, city };
}

interface UseFeedLocationOptions {
  initialLocation: string;
  selectedCity: string;
  cities: readonly string[];
  onSelectCity: (city: string) => void;
}

export function useFeedLocation({
  initialLocation,
  selectedCity,
  cities,
  onSelectCity,
}: UseFeedLocationOptions) {
  const [locationInput, setLocationInput] = useState(initialLocation);
  const [showLocationToolsModal, setShowLocationToolsModal] = useState(false);
  const [showLocationToast, setShowLocationToast] = useState(false);

  const normalizedQuery = locationInput.toLowerCase().trim();
  const locationMatches =
    normalizedQuery.length < MIN_LOCATION_QUERY_LENGTH
      ? []
      : cities.filter((city) => city.toLowerCase().includes(normalizedQuery));

  const applySelectedLocation = (city: string) => {
    onSelectCity(city);
    setLocationInput(city);
    setShowLocationToolsModal(false);
  };

  const openLocationToolsModal = () => {
    setLocationInput(selectedCity === "all" ? AUTOMATIC_LOCATION_CITY : selectedCity);
    setShowLocationToolsModal(true);
  };

  const closeLocationToolsModal = () => {
    setShowLocationToolsModal(false);
  };

  const clearLocation = () => {
    setLocationInput("");
    onSelectCity("all");
  };

  const useAutomaticLocation = () => {
    onSelectCity(AUTOMATIC_LOCATION_CITY);
    setLocationInput(AUTOMATIC_LOCATION_CITY);
    setShowLocationToast(true);
    setTimeout(() => setShowLocationToast(false), LOCATION_TOAST_MS);
  };

  return {
    locationInput,
    setLocationInput,
    locationMatches,
    showLocationToolsModal,
    showLocationToast,
    openLocationToolsModal,
    closeLocationToolsModal,
    applySelectedLocation,
    clearLocation,
    useAutomaticLocation,
  };
}
