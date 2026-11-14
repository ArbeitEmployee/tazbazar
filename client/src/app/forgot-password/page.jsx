"use client";



import ForgotPassword from "@/views/ForgotPassword";

import { Suspense } from "react";
import ClientOnly from "@/components/ClientOnly";

export default function ForgotPasswordPage() {
  return (
    <ClientOnly>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center" />}>
      <ForgotPassword />
    </Suspense>
    </ClientOnly>
  );
}
