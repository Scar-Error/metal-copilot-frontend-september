/**
 * Central API origin config.
 *
 * The service files used to hardcode `https://corimetal.scarerror.com`, which made
 * the browser talk straight to the production server even during `npm run dev`.
 * Absolute URLs also bypass the Vite dev proxy, so nothing ever reached the local
 * Django process.
 *
 * Now every service builds its path from API_ORIGIN:
 *   - dev  (`npm run dev`):  API_ORIGIN === ''  -> paths stay relative ("/api/..."),
 *     so the browser calls the Vite dev server on :5173, which proxies /api and /media
 *     to the local Django on 127.0.0.1:8085 (see the `server.proxy` block in vite.config.js).
 *     Relative paths also mean there is no CORS preflight in development.
 *   - prod (`npm run build`): API_ORIGIN === 'https://corimetal.scarerror.com', so the
 *     deployed build keeps hitting the real production API.
 *
 * Override without touching code by creating a (git-ignored) .env file, e.g.
 *   VITE_API_ORIGIN=http://127.0.0.1:8085   # point at a local backend with no proxy
 *   VITE_API_ORIGIN=                        # empty string forces proxy/relative mode
 * Note: `.env*` is git-ignored in this project, so the defaults above are what make
 * dev and prod work out of the box for everyone.
 */
const PRODUCTION_ORIGIN = 'https://corimetal.scarerror.com';

// `??` (not `||`) so an intentionally empty VITE_API_ORIGIN is respected and kept relative.
const rawOrigin =
  import.meta.env.VITE_API_ORIGIN ?? (import.meta.env.PROD ? PRODUCTION_ORIGIN : '');

// Strip any trailing slash so `${API_ORIGIN}/api/...` never produces a double slash.
export const API_ORIGIN = rawOrigin.replace(/\/+$/, '');

export default API_ORIGIN;
