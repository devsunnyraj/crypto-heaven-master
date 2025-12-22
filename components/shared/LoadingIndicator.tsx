"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

function LoadingIndicatorContent() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isLoaded } = useAuth();

  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParams]);

  // Show loading while auth is initializing
  useEffect(() => {
    if (!isLoaded) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [isLoaded]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      
      if (link && link.href && !link.target && link.href.startsWith(window.location.origin)) {
        const url = new URL(link.href);
        if (url.pathname !== pathname) {
          setLoading(true);
        }
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="relative">
        {/* Chasing tail ring */}
        <div className="w-20 h-20 rounded-full border-4 border-transparent animate-spin-chase"></div>
      </div>
    </div>
  );
}

export default function LoadingIndicator() {
  return (
    <Suspense fallback={null}>
      <LoadingIndicatorContent />
    </Suspense>
  );
}
