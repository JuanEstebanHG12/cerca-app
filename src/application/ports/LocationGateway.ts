import {Coords} from "../../domain/models/Location"

export interface LocationGateway {
  getCurrentLocation(): Promise<Coords | null>;
}