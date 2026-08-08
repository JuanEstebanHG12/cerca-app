

export interface Coords {
  lat: number;
  lng: number;
}

// La regla pura de negocio vive en Dominio
export const snapToGrid = (coords: Coords): Coords => ({
  lat: Math.round(coords.lat * 100) / 100,
  lng: Math.round(coords.lng * 100) / 100,
});

