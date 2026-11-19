const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

export class HttpError extends Error {
  constructor(public status: number, url: string) {
    super(`HTTP ${status} for ${url}`);
  }
}

/** fetch with a timeout, a browser-like UA and one retry on network errors / 5xx. */
export async function fetchText(url: string, timeoutMs = 20_000): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": UA, accept: "text/html,application/json;q=0.9,*/*;q=0.8" },
        signal: AbortSignal.timeout(timeoutMs),
        redirect: "follow",
        cache: "no-store",
      });
      if (res.ok) return await res.text();
      lastError = new HttpError(res.status, url);
      if (res.status < 500) break;
    } catch (e) {
      lastError = e;
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  throw lastError;
}

export async function fetchJson<T>(url: string, timeoutMs?: number): Promise<T> {
  const text = await fetchText(url, timeoutMs);
  return JSON.parse(text) as T;
}
