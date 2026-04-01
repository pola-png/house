// CLIENT-SAFE Wasabi upload helpers (no server env access or private keys)
const DEBUG_WASABI = true;
const wlog = (...args: any[]) => { if (DEBUG_WASABI) console.log('[Wasabi]', ...args); };
const PUBLIC_BUCKET = process.env.NEXT_PUBLIC_WASABI_BUCKET;

const isHttpUrl = (s: string) => /^https?:\/\//i.test(s);
const isWasabiHost = (h: string) => h.endsWith('.wasabisys.com');

function isWasabiUrlOrKey(urlOrKey: string): boolean {
  if (!urlOrKey) return false;
  if (!isHttpUrl(urlOrKey)) return true; // plain keys correspond to Wasabi objects
  try {
    const u = new URL(urlOrKey);
    return isWasabiHost(u.hostname);
  } catch {
    return false;
  }
}

function extractKeyBestEffort(urlOrKey: string): string {
  if (!urlOrKey) return urlOrKey;
  if (!/^https?:\/\//i.test(urlOrKey)) return urlOrKey.replace(/^\/+/, '');
  try {
    const u = new URL(urlOrKey);
    let key = u.pathname.replace(/^\//, '');
    if (PUBLIC_BUCKET && key.startsWith(`${PUBLIC_BUCKET}/`)) {
      key = key.slice(PUBLIC_BUCKET.length + 1);
    }
    return key;
  } catch {
    const idx = urlOrKey.indexOf('.com/');
    return idx !== -1 ? urlOrKey.slice(idx + 5) : urlOrKey;
  }
}

export function toWasabiProxyPath(urlOrKey: string): string {
  if (!urlOrKey) return urlOrKey;
  if (urlOrKey.startsWith('/api/image-proxy')) return urlOrKey;
  if (!isWasabiUrlOrKey(urlOrKey)) return urlOrKey;
  const key = extractKeyBestEffort(urlOrKey);
  return `/api/image-proxy?path=${encodeURIComponent(key)}`;
}

export function toWasabiProxyAbsolute(urlOrKey: string, origin?: string): string {
  const proxied = toWasabiProxyPath(urlOrKey);
  if (!proxied) return proxied;
  if (proxied.startsWith('http://') || proxied.startsWith('https://')) return proxied;
  const base = origin || process.env.NEXT_PUBLIC_SITE_URL || 'https://gotperfects.online';
  if (proxied.startsWith('/')) return `${base}${proxied}`;
  return `${base}/${proxied}`;
}

export function normalizeWasabiImageArray(images: unknown): string[] {
  if (!images) return [];
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      return normalizeWasabiImageArray(parsed);
    } catch {
      const proxied = toWasabiProxyPath(images);
      return proxied ? [proxied] : [];
    }
  }
  if (!Array.isArray(images)) return [];
  return (images as unknown[])
    .map((value) => (typeof value === 'string' ? toWasabiProxyPath(value) : null))
    .filter((v): v is string => Boolean(v));
}

// Backwards-compatible helper for client forms that previously imported uploadToWasabi
// This performs the standard two-step flow via our API route.
export async function uploadToWasabi(
  file: File,
  params: string | { key: string; contentType?: string }
): Promise<string> {
  const normalized = typeof params === 'string' ? { key: params } : params;
  try { wlog('uploadToWasabi start', { key: normalized.key, size: file.size, type: file.type }); } catch {}
  const body = {
    key: normalized.key,
    contentType: normalized.contentType || file.type,
    contentLength: file.size,
  };
  wlog('requesting presigned PUT for', { key: body.key, contentType: body.contentType, contentLength: body.contentLength });
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    wlog('presign failed', { status: res.status, err });
    throw new Error(err.error || `Failed to create upload URL (${res.status})`);
  }
  const { uploadUrl, uploadHeaders, objectPath } = await res.json();
  wlog('presign ok', { key: normalized.key });
  const put = await fetch(uploadUrl, {
    method: 'PUT',
    headers: uploadHeaders || {},
    body: file,
  });
  if (!put.ok) {
    wlog('PUT failed', { status: put.status });
    throw new Error(`Upload failed (${put.status})`);
  }
  wlog('PUT success', { status: put.status, key: normalized.key });
  return objectPath as string;
}
