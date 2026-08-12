import type { Coords } from './coords';

// What `GET /listings` needs to search "near me": either device coordinates, or — with no
// device location (US-08) — a `cityId` the server resolves to its centroid. A discriminated
// union instead of `coords: Coords | null` + `cityId: string | null` rules out the two
// impossible states: both present, or neither.
export type SearchOrigin = { kind: 'coords'; coords: Coords } | { kind: 'city'; cityId: string };
