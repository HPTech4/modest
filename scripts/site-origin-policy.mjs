const BLOCKED_ROOTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "[::1]",
  "manuspre.computer",
  "manus.computer",
  "manus-asia.computer",
  "manuscomputer.ai",
  "manusvm.computer",
  "example.com",
  "example.net",
  "example.org",
]);

const BLOCKED_SUFFIXES = [
  ".localhost",
  ".local",
  ".test",
  ".invalid",
  ".example",
  ".example.com",
  ".example.net",
  ".example.org",
  ".manuspre.computer",
  ".manus.computer",
  ".manus-asia.computer",
  ".manuscomputer.ai",
  ".manusvm.computer",
];

export function normalizePublicSiteOrigin(candidate) {
  if (typeof candidate !== "string" || !candidate.trim()) return null;
  try {
    const url = new URL(candidate.trim());
    const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
    const blocked = BLOCKED_ROOTS.has(hostname) || BLOCKED_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
    if (url.protocol !== "https:"
      || blocked
      || hostname.includes(":")
      || !hostname
      || url.username
      || url.password
      || url.search
      || url.hash
      || url.pathname !== "/") return null;
    return url.origin;
  } catch {
    return null;
  }
}
