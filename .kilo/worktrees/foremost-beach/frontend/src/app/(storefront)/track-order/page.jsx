"use client";



import OrderTracking from "@/views/OrderTracking";

import { Suspense } from "react";
import ClientOnly from "@/components/ClientOnly";

export default function TrackOrderPage() {
  return (
    <ClientOnly>
      <Suspense fallback={<div className="min-h-[60vh]" />}>
      <OrderTracking />
    </Suspense>
    </ClientOnly>
  );
}
