"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

// Renders children only after client-side mount. During SSR/prerender a
// lightweight fallback is emitted so browser-only APIs (localStorage,
// window) inside views never execute on the server.
export default function ClientOnly({
  children,
  fallback = <div className="min-h-[40vh]" />,
}) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!isClient) return fallback;
  return <>{children}</>;
}
