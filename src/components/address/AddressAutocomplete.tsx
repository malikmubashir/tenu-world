"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/** Structured address returned by Google Places */
export interface StructuredAddress {
  formatted: string;
  line1: string;
  line2: string;
  city: string;
  postalCode: string;
  region: string;
  countryCode: string;
  placeId: string;
  lat: number;
  lng: number;
}

interface Props {
  /** Restrict to these countries (ISO 3166-1 alpha-2) */
  countries?: string[];
  /** Called when a valid address is selected */
  onSelect: (address: StructuredAddress) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Google Places Autocomplete for address input.
 * Loads the Google Maps JS SDK on mount, attaches Autocomplete to the input.
 * Returns a fully structured address with lat/lng on selection.
 */
export default function AddressAutocomplete({
  countries = ["fr", "gb"],
  onSelect,
  placeholder = "Start typing your address…",
  className = "",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [loaded, setLoaded] = useState(false);

  /* Load Google Maps JS SDK */
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn("AddressAutocomplete: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not set");
      return;
    }

    /* Skip if already loaded */
    if (window.google?.maps?.places) {
      setLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);

    return () => {
      /* Don't remove script — other components may use it */
    };
  }, []);

  /* Parse address components from Google Place result */
  const parsePlace = useCallback(
    (place: google.maps.places.PlaceResult): StructuredAddress | null => {
      if (!place.address_components || !place.geometry?.location) return null;

      const get = (type: string): string => {
        const c = place.address_components?.find((ac) =>
          ac.types.includes(type),
        );
        return c?.long_name ?? "";
      };

      const getShort = (type: string): string => {
        const c = place.address_components?.find((ac) =>
          ac.types.includes(type),
        );
        return c?.short_name ?? "";
      };

      const streetNumber = get("street_number");
      const route = get("route");
      const line1 = streetNumber ? `${streetNumber} ${route}` : route;

      return {
        formatted: place.formatted_address ?? line1,
        line1,
        line2: get("subpremise"),
        city: get("locality") || get("postal_town") || get("administrative_area_level_2"),
        postalCode: get("postal_code"),
        region: get("administrative_area_level_1"),
        countryCode: getShort("country").toLowerCase(),
        placeId: place.place_id ?? "",
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
    },
    [],
  );

  /* Attach Autocomplete to input */
  useEffect(() => {
    if (!loaded || !inputRef.current || autocompleteRef.current) return;

    const ac = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      componentRestrictions: { country: countries },
      fields: [
        "address_components",
        "formatted_address",
        "geometry",
        "place_id",
      ],
    });

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      const parsed = parsePlace(place);
      if (parsed) onSelect(parsed);
    });

    autocompleteRef.current = ac;
  }, [loaded, countries, onSelect, parsePlace]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      className={`w-full rounded-lg border border-gray-300 px-4 py-3 text-base
        focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600
        ${className}`}
      autoComplete="off"
    />
  );
}
