"use client";

import Dashboard from "@/views/Dashboard";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import ClientOnly from "@/components/ClientOnly";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [ready, setReady] = useState(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");
      return Boolean(token && savedUser);
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    // If token exists in storage or user exists in state, mark ready immediately
    if (user || (token && savedUser)) {
      setReady(true);
      return;
    }

    // Only redirect to login if auth finished loading AND there is definitely no token
    if (!isLoading && !user && !token) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <ClientOnly>
      <Dashboard />
    </ClientOnly>
  );
}
