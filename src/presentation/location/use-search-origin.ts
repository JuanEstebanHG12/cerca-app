import { useCallback, useState } from 'react';
import type { Coords } from '../../domain/models/coords';
import { useLocation } from './use-location';

// The state a search screen needs to know "where am I searching from", never left undefined:
// 'needs-city' is what replaces a blank screen when GPS isn't available (US-08), and 'city'
// is a deliberate user choice that GPS being granted later shouldn't silently override.
export type SearchOriginState =
  | { phase: 'loading' }
  | { phase: 'coords'; coords: Coords }
  // canAskAgain: false means the OS will no longer show its own permission dialog — retrying
  // has to open Settings instead of calling requestForegroundPermissionsAsync again, which
  // would just resolve 'denied' silently and look like a dead button.
  | { phase: 'needs-city'; reason: 'denied' | 'unavailable'; canAskAgain: boolean }
  | { phase: 'city'; cityId: string };

interface UseSearchOrigin {
  state: SearchOriginState;
  retryLocation: () => void;
  selectCity: (cityId: string) => void;
}

// Built on useLocation — the same GPS request US-02's search screen already makes — instead
// of a second expo-location wrapper. This hook's only job is translating "denied" / "no fix"
// into a 'needs-city' phase the presentation layer can act on (US-08), never re-implementing
// how a position is obtained.
export function useSearchOrigin(): UseSearchOrigin {
  const location = useLocation();
  const [cityId, setCityId] = useState<string | undefined>(undefined);

  const selectCity = useCallback((id: string) => setCityId(id), []);

  // A fresh GPS attempt always wins over a previously picked city — that's the point of the
  // retry button.
  const retryLocation = useCallback(() => {
    setCityId(undefined);
    location.retry();
  }, [location]);

  let state: SearchOriginState;
  if (cityId !== undefined) {
    state = { phase: 'city', cityId };
  } else if (location.status === 'loading') {
    state = { phase: 'loading' };
  } else if (location.status === 'granted') {
    state = { phase: 'coords', coords: location.coords };
  } else {
    state = {
      phase: 'needs-city',
      reason: location.reason === 'permission_denied' ? 'denied' : 'unavailable',
      // Only 'permission_denied' ever comes back with canAskAgain: false — a position that's
      // merely unavailable (GPS off, no fix) can always be retried the same way.
      canAskAgain: location.reason === 'permission_denied' ? location.canAskAgain : true,
    };
  }

  return { state, retryLocation, selectCity };
}
