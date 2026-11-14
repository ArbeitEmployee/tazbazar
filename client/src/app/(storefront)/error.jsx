"use client";

import { useEffect } from "react";

// Catches render/data errors inside the storefront segment and shows a
// readable message with a retry button — instead of a silent blank page.
export default function StorefrontError({ error, reset }) {
  useEffect(() => {
    try {
      console.error("Storefront error:", error);
    } catch {
      // ignore logging issues
    }
  }, [error]);

  const message =
    (error && (error.message || error.toString())) ||
    "Something went wrong while loading this page.";

  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#141210] text-2xl font-black text-[#BF9B5C]">
        !
      </span>
      <h2 className="mt-5 text-2xl font-black text-[#141210]">
        Page failed to load
      </h2>
      <p className="mt-2 max-w-md break-words text-sm leading-6 text-gray-600">
        {message}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex h-11 items-center rounded-full bg-gradient-to-r from-[#BF9B5C] to-[#8A6D3B] px-6 text-sm font-bold text-white shadow-sm transition hover:brightness-105"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex h-11 items-center rounded-full border border-[#EDE3D0] bg-white px-6 text-sm font-semibold text-[#6F562E] transition hover:border-[#BF9B5C]"
        >
          Reload page
        </button>
      </div>
    </div>
  );
}
