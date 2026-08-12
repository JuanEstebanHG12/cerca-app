import { Capacity } from '../../domain/models/actor';

export interface SignUpApiRequestDto {
  email: string;
  password: string;
  displayName: string;
  capacities?: Capacity[];
}

export interface SignInApiRequestDto {
  email: string;
  password: string;
}

export interface RefreshApiRequestDto {
  refreshToken: string;
}

export interface SignOutApiRequestDto {
  refreshToken: string;
}
