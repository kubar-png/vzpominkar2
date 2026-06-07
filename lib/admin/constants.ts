/**
 * Edge-safe admin auth constants. NO `node:crypto` here, so this module is
 * importable from middleware (Edge runtime) and from the Web-Crypto session
 * helpers without dragging the Node-only `node:crypto` code into the Edge bundle.
 */

/** Session cookie name. Scoped to `/admin` so it never leaks to app routes. */
export const ADMIN_COOKIE = "vzp_admin";

/** Admin session lifetime: 12 hours, in seconds. */
export const ADMIN_SESSION_MAX_AGE = 12 * 60 * 60;
