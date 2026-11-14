"use client";



import ResetPassword from "@/views/ResetPassword";

import { Suspense } from "react";
import ClientOnly from "@/components/ClientOnly";

export default function ResetPasswordPage() {
  return (
    <ClientOnly>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center" />}>
      <ResetPassword />
    </Suspense>
    </ClientOnly>
  );
}
