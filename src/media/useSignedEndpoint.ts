import { useCallback, useEffect, useState } from "react";

/**
 * Ported unchanged from media-cloudplus's use-signed-endpoint.ts — signs an
 * endpoint URL with a Web Crypto HMAC once signing is switched on and a
 * secret exists, so the Connections tab behaves identically here.
 */

export type SigningState = {
  enabled: boolean;
  secret: string;
  expirationMinutes: string;
  /** Bumped on every Generate so an identical secret still re-signs. */
  nonce: number;
};

function randomHex(bytes: number) {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function generateSecret() {
  return randomHex(24);
}

/** HMAC-SHA256 over `path:expires`, truncated to a URL-friendly token. */
async function sign(secret: string, payload: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(mac).slice(0, 16), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Appends a `token`/`expires` pair to an endpoint once signing is switched on
 * and a secret exists. Every new secret produces a new token, so the URL the
 * user copies always matches the credential they just generated.
 */
export function useSignedEndpoint(baseUrl: string, signing: SigningState) {
  const [signedUrl, setSignedUrl] = useState(baseUrl);
  /** Epoch seconds the current URL dies at; 0 = never. */
  const [expiresAt, setExpiresAt] = useState(0);
  const [expired, setExpired] = useState(false);

  const { enabled, secret, expirationMinutes, nonce } = signing;

  useEffect(() => {
    let cancelled = false;

    if (!enabled || secret.length < 16) {
      setSignedUrl(baseUrl);
      setExpiresAt(0);
      setExpired(false);
      return;
    }

    const minutes = Number(expirationMinutes);
    const validMinutes = Number.isFinite(minutes) && minutes >= 0 ? minutes : 0;
    // 0 minutes means the signed URL never expires.
    const expires = validMinutes === 0 ? 0 : Math.floor(Date.now() / 1000) + validMinutes * 60;

    sign(secret, `${baseUrl}:${expires}:${nonce}`)
      .then((token) => {
        if (cancelled) return;
        const sep = baseUrl.includes("?") ? "&" : "?";
        setSignedUrl(`${baseUrl}${sep}token=${token}&expires=${expires}`);
        setExpiresAt(expires);
        setExpired(false);
      })
      .catch(() => {
        if (!cancelled) setSignedUrl(baseUrl);
      });

    return () => {
      cancelled = true;
    };
  }, [baseUrl, enabled, secret, expirationMinutes, nonce]);

  // Flip to expired on the deadline rather than polling a clock every second.
  useEffect(() => {
    if (!expiresAt) return;
    const remaining = expiresAt * 1000 - Date.now();
    if (remaining <= 0) {
      setExpired(true);
      return;
    }
    const timer = window.setTimeout(() => setExpired(true), remaining);
    return () => window.clearTimeout(timer);
  }, [expiresAt]);

  // Lets the UI show the expired state on demand instead of waiting out the
  // real deadline — a signed link can be valid for hours.
  const expireNow = useCallback(() => setExpired(true), []);

  const isSigned = signedUrl !== baseUrl;

  return { signedUrl, isSigned, expired: isSigned && expired, expireNow };
}

export function useSigningState(defaultEnabled: boolean, defaultMinutes: number) {
  const [state, setState] = useState<SigningState>({
    enabled: defaultEnabled,
    secret: "",
    expirationMinutes: String(defaultMinutes),
    nonce: 0,
  });
  const [dirty, setDirty] = useState(false);

  const update = useCallback((patch: Partial<SigningState>) => {
    setState((current) => ({ ...current, ...patch }));
    setDirty(true);
  }, []);

  const regenerate = useCallback(() => {
    setState((current) => ({ ...current, secret: generateSecret(), nonce: current.nonce + 1 }));
    setDirty(true);
  }, []);

  const reset = useCallback(() => {
    setState({ enabled: defaultEnabled, secret: "", expirationMinutes: String(defaultMinutes), nonce: 0 });
    setDirty(false);
  }, [defaultEnabled, defaultMinutes]);

  return { state, update, regenerate, reset, dirty, setDirty };
}
