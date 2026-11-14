"use client";



import ThankYou from "@/Home/components/ThankYou";

import { Suspense } from "react";
import ClientOnly from "@/components/ClientOnly";

export default function ThankYouPage() {
  return (
    <ClientOnly>
      <Suspense fallback={<div className="min-h-[60vh]" />}>
      <ThankYou />
    </Suspense>
    </ClientOnly>
  );
}
