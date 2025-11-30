"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

export function useAssetflowNavigate() {
  const router = useRouter();

  const pageToPath = useCallback((page: string, itemId?: string) => {
    switch (page) {
      case "dashboard":
        return "/dashboard";
      case "audits":
        return "/audits";
      case "assets":
        return "/assets";
      case "assets-add":
        return "/assets/add";
      case "assets-edit":
        return itemId ? `/assets/edit/${itemId}` : "/assets";
      case "licenses":
        return "/licenses";
      case "licenses-add":
        return "/licenses/add";
      case "licenses-edit":
        return itemId ? `/licenses/edit/${itemId}` : "/licenses";
      case "vendors":
        return "/vendors";
      case "vendors-add":
        return "/vendors/add";
      case "vendors-edit":
        return itemId ? `/vendors/edit/${itemId}` : "/vendors";
      case "events":
        return "/events";
      case "settings":
        return "/settings";
      case "search":
        return "/search";
      default:
        // Allow direct path-like pages, e.g. "audits/123"
        if (page && (page.startsWith("/") || page.includes("/"))) {
          return page.startsWith("/") ? page : `/${page}`;
        }
        return "/dashboard";
    }
  }, []);

  const onNavigate = useCallback(
    (page: string, itemId?: string) => {
      // Debug: log navigation requests to trace param propagation
      try {
        // eslint-disable-next-line no-console
        console.debug("[useAssetflowNavigate] onNavigate", { page, itemId });
      } catch {}
      const href = pageToPath(page, itemId);
      router.push(href);
    },
    [pageToPath, router]
  );

  const onSearch = useCallback(
    (query: string) => {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    },
    [router]
  );

  return { onNavigate, onSearch };
}

export default useAssetflowNavigate;
