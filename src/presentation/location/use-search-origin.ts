import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Coords } from '../../domain/models/coords';
import { RequestLocationUseCase } from '../../application/use-cases/request-location';
import { ExpoLocationGateway } from '../../infrastructure/location/expo-location-gateway';

// The state a search screen needs to know "where am I searching from", never left undefined:
// 'needs-city' is what replaces a blank screen when GPS isn't available (US-08), and 'city'
// is a deliberate user choice that GPS being granted later shouldn't silently override.
export type SearchOriginState =
  | { phase: 'loading' }
  | { phase: 'coords'; coords: Coords }
  | { phase: 'needs-city'; reason: 'denied' | 'unavailable' }
  | { phase: 'city'; cityId: string };

interface UseSearchOrigin {
  state: SearchOriginState;
  retryLocation: () => void;
  selectCity: (cityId: string) => void;
}

// Composition root for this flow, same shape as createAuthUseCases() in auth-context.tsx:
// the only spot allowed to know LocationGateway is really expo-location.
export function useSearchOrigin(): UseSearchOrigin {
  const requestLocation = useMemo(() => new RequestLocationUseCase(new ExpoLocationGateway()), []);
  const [state, setState] = useState<SearchOriginState>({ phase: 'loading' });

  const retryLocation = useCallback(() => {
    setState({ phase: 'loading' });
    requestLocation.execute().then((result) => {
      setState(
        result.status === 'granted'
          ? { phase: 'coords', coords: result.coords }
          : { phase: 'needs-city', reason: result.status },
      );
    });
  }, [requestLocation]);

  // Ask once, automatically, the moment this flow mounts — the same way a search screen
  // would want it, without waiting for the user to press anything first.
  useEffect(() => {
    retryLocation();
  }, [retryLocation]);

  const selectCity = useCallback((cityId: string) => {
    setState({ phase: 'city', cityId });
  }, []);

  return { state, retryLocation, selectCity };
}
