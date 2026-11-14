"use client";

import { useEffect } from "react";

// If a Next.js chunk fails to load (stale cache after a rebuild/redeploy),
// the page would otherwise stay blank forever. Detect failed
// /_next/static/* script loads and reload once per session to pick up
// fresh chunks.
const RELOAD_FLAG = "chunkReloadedAt";
const RELOAD_COOLDOWN_MS = 5 * 60 * 1000;

const shouldReload = () => {
  try {
    const last = Number(window.sessionStorage.getItem(RELOAD_FLAG) || 0);
    if (Date.now() - last < RELOAD_COOLDOWN_MS) return false;
    window.sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
    return true;
  } catch {
    return false;
  }
};

export default function ChunkErrorReload() {
  useEffect(() => {
    const onError = (event) => {
      const target = event?.target;
      const src =
        (target && (target.src || target.href)) || "";
      if (
        target &&
        (target.tagName === "SCRIPT" || target.tagName === "LINK") &&
        String(src).includes("/_next/static/")
      ) {
        if (shouldReload()) {
          window.location.reload();
        }
      }
    };

    // Capture phase: resource load errors don't bubble.
    window.addEventListener("error", onError, true);
    return () => window.removeEventListener("error", onError, true);
  }, []);

  return null;
}
