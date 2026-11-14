"use client";



import Registration from "@/views/Registration";

import { Suspense } from "react";
import ClientOnly from "@/components/ClientOnly";

export default function RegisterPage() {
  return (
    <ClientOnly>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center" />}>
      <Registration />
    </Suspense>
    </ClientOnly>
  );
}
