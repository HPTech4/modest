const PUBLISHABLE_KEY = /^sb_publishable_[A-Za-z0-9_-]+$/;

function parseLegacyJwtRole(value) {
  const parts = value.split(".");
  if (parts.length !== 3 || !parts[1]) return null;
  try {
    const encoded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = globalThis.atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "="));
    const claims = JSON.parse(decoded);
    return typeof claims?.role === "string" ? claims.role : null;
  } catch {
    return null;
  }
}

export function isBrowserSafeSupabaseKey(candidate) {
  if (typeof candidate !== "string") return false;
  const value = candidate.trim();
  if (PUBLISHABLE_KEY.test(value)) return true;
  return parseLegacyJwtRole(value) === "anon";
}

export function isSafeSupabaseProjectUrl(candidate) {
  if (typeof candidate !== "string" || !candidate.trim()) return false;
  try {
    const url = new URL(candidate.trim());
    const isLoopback = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    const allowedProtocol = url.protocol === "https:" || (url.protocol === "http:" && isLoopback);
    return allowedProtocol
      && !url.username
      && !url.password
      && !url.search
      && !url.hash
      && url.pathname === "/";
  } catch {
    return false;
  }
}
