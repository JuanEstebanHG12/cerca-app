import { useCallback, useEffect, useMemo, useState } from 'react';
import { GetCurrentLocationUseCase } from '../../application/use-cases/get-current-location';
import { Coords } from '../../domain/models/coords';
import { LocationFailureReason } from '../../domain/errors/location-errors';
import { ExpoLocationProvider } from '../../infrastructure/location/expo-location-provider';

// 'loading' is its own state, not `coords === null`, for the same reason AuthProvider's
// status isn't derived from `actor === null`: "don't know yet" and "denied" need different UI.
type LocationState =
  | { status: 'loading' }
  | { status: 'granted'; coords: Coords }
  | { status: 'denied'; reason: LocationFailureReason; canAskAgain: boolean };

export function useLocation() {
  const getCurrentLocation = useMemo(() => new GetCurrentLocationUseCase(new ExpoLocationProvider()), []);
  const [state, setState] = useState<LocationState>({ status: 'loading' });

  // Always goes through requestForegroundPermissionsAsync again (ExpoLocationProvider), so
  // calling this re-asks the OS for permission, not just re-reads whatever it decided last
  // time — that's what makes `retry` a real retry and not a re-render of the same denial.
  const request = useCallback(() => {
    setState({ status: 'loading' });
    let cancelled = false;
    getCurrentLocation.execute().then((result) => {
      if (cancelled) return;
      setState(
        result.ok
          ? { status: 'granted', coords: result.coords }
          : { status: 'denied', reason: result.reason, canAskAgain: result.canAskAgain },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [getCurrentLocation]);

  useEffect(() => request(), [request]);

  return { ...state, retry: request };
}
