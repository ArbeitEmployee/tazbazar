"use client";

import PolicyPage from "@/Home/pages/PolicyPage";
import { Suspense } from "react";
import ClientOnly from "@/components/ClientOnly";

export default function DefaultPolicyPage() {
  return (
    <ClientOnly>
      <Suspense fallback={<div className="min-h-[60vh]" />}>
        <PolicyPage />
      </Suspense>
    </ClientOnly>
  );
}

