import { BookingStatus } from '../../domain/models/booking';

export function bookingStatusLabel(status: BookingStatus): string {
  switch (status) {
    case 'requested':
      return 'Solicitada';
    case 'accepted':
      return 'Aceptada';
    case 'declined':
      return 'Rechazada';
    case 'completed':
      return 'Completada';
    case 'cancelled':
      return 'Cancelada';
  }
}

// No `locale` param yet — same known gap `formatMoney` already has (see US-03-PUBLISH-LISTING.md
// §5): nothing in the app resolves the device's real locale yet, so this defers to the JS
// engine's default the same way every other formatter here does.
export function formatBookingDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}
