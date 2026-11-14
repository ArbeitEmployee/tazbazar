"use client";



import Contact from "@/Home/pages/Contact";

import { Suspense } from "react";
import ClientOnly from "@/components/ClientOnly";

export default function ContactPage() {
  return (
    <ClientOnly>
      <Suspense fallback={<div className="min-h-[60vh]" />}>
      <Contact />
    </Suspense>
    </ClientOnly>
  );
}
