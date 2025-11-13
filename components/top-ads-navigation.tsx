'use client';

import { usePathname } from "next/navigation";
import { useEffect } from "react";

declare global {
  interface Window {
    topAds?: {
      spa?: () => void;
    };
  }
}

export function TopAdsNavigation() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.topAds && typeof window.topAds.spa === "function") {
      window.topAds.spa();
    }
  }, [pathname]);

  return null;
}
