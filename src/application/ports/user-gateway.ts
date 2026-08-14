// Deliberately just `suspend` — cerca-api's users.controller.ts only exposes
// POST /users/:id/suspend today. There is no GET /users (no way to list accounts) and no
// unsuspend route, even though the repository behind it already supports clearing suspendedAt;
// nothing here should pretend otherwise until the API actually adds them.
export interface UserGateway {
  suspend(userId: string, accessToken: string): Promise<void>;
}
