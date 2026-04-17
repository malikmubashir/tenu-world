/**
 * Minimal Google Maps Places type declarations.
 * The SDK is loaded at runtime via <script> tag in AddressAutocomplete.
 * Only the types we actually use are declared here.
 */

declare namespace google.maps {
  class LatLng {
    lat(): number;
    lng(): number;
  }

  namespace places {
    interface AutocompleteOptions {
      types?: string[];
      componentRestrictions?: { country: string | string[] };
      fields?: string[];
    }

    interface AddressComponent {
      long_name: string;
      short_name: string;
      types: string[];
    }

    interface PlaceResult {
      address_components?: AddressComponent[];
      formatted_address?: string;
      geometry?: {
        location: LatLng;
      };
      place_id?: string;
    }

    class Autocomplete {
      constructor(input: HTMLInputElement, opts?: AutocompleteOptions);
      addListener(event: string, handler: () => void): void;
      getPlace(): PlaceResult;
    }
  }
}

interface Window {
  google?: typeof google;
}
