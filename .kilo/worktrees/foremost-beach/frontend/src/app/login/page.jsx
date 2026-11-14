"use client";



import Login from "@/views/Login";

import { Suspense } from "react";
import ClientOnly from "@/components/ClientOnly";

export default function LoginPage() {
  return (
    <ClientOnly>
      <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
        </div>
      }
    >
      <Login />
    </Suspense>
    </ClientOnly>
  );
}
