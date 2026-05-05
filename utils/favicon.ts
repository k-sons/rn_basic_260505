export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function extractDomain(url: string): string | null {
  try {
    const normalized = normalizeUrl(url);
    const u = new URL(normalized);
    return u.hostname;
  } catch {
    return null;
  }
}

export function getFaviconUrl(url: string, size = 128): string | null {
  const domain = extractDomain(url);
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}
