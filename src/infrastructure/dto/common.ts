export interface MoneyDto {
  amountMinor: number;
  currency: string;
}

export type PricingDto =
  | { model: 'fixed'; price: MoneyDto }
  | { model: 'hourly'; hourlyRate: MoneyDto; minimumHours: number }
  | { model: 'quote'; startingFrom?: MoneyDto };

export interface GeoPointDto {
  lat: number;
  lng: number;
}
