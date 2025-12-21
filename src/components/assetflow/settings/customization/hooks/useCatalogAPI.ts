import { useCallback, useRef } from "react";
import { toast } from "@/components/ui/sonner";
import type { UiCategory } from "../catalogHelpers";

/** Helper function to persist categories to localStorage */
const persistCategories = (cats: UiCategory[]): void => {
  try {
    localStorage.setItem("catalog.categories", JSON.stringify(cats));
    try {
      globalThis.dispatchEvent(new Event("assetflow:catalog-cleared"));
    } catch (e) {
      console.error("[Catalog] Failed to dispatch catalog-cleared event:", e);
    }
  } catch (e) {
    console.error("[Catalog] Failed to persist categories to localStorage:", e);
  }
};

/** Helper function to handle API fetch with JSON parsing */
const fetchCatalog = async (
  method: string,
  body?: unknown
): Promise<{ ok: boolean; data: any }> => {
  // Use public read-only endpoint for GET so the catalog lists even
  // when admin auth cookie isn't available in client contexts.
  const url = method === "GET" ? "/api/catalog" : "/api/admin/catalog";
  const res = await fetch(url, {
    method,
    cache: "no-store",
    ...(body && {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
};

/** Helper function to delete multiple types and check for errors */
const deleteTypesWithValidation = async (typeIds: number[]): Promise<void> => {
  // Dry run: Check if any types have asset dependencies
  const dryRuns = await Promise.all(
    typeIds.map((tid) =>
      fetchCatalog("DELETE", { entity: "type", id: tid, dryRun: true })
    )
  );

  for (const { ok, data } of dryRuns) {
    if (!ok) {
      throw new Error(data?.error || "Failed to check type dependencies");
    }
    if (data?.requiresConfirmation) {
      throw new Error(
        "Cannot delete types because some types have assets assigned. Reassign assets first."
      );
    }
  }

  // Perform actual deletion
  const responses = await Promise.all(
    typeIds.map((tid) => fetchCatalog("DELETE", { entity: "type", id: tid }))
  );

  for (const { ok, data } of responses) {
    if (!ok) {
      throw new Error(data?.error || "Failed to delete type");
    }
  }
};

/** Helper function to clear types from a category */
const clearCategoryTypes = (
  categoryId: number,
  cats: UiCategory[]
): UiCategory[] =>
  cats.map((c) => (c.id === categoryId ? { ...c, types: [] } : c));

/** Helper function to remove category from list */
const removeCategoryFromList = (
  categoryId: number,
  cats: UiCategory[]
): UiCategory[] => cats.filter((c) => c.id !== categoryId);

/** Helper function to remove type from all categories */
const removeTypeFromCategories = (
  typeId: number,
  cats: UiCategory[]
): UiCategory[] => {
  let found = false;
  const updated = cats.map((c) => {
    const hasType = c.types.some((t) => t.id === typeId);
    if (!hasType) return c;
    found = true;
    return {
      ...c,
      types: c.types.filter((t) => t.id !== typeId),
    };
  });
  return found ? updated : cats;
};

export const useCatalogAPI = (
  setCategories: React.Dispatch<React.SetStateAction<UiCategory[]>>,
  setSelectedId: (id: number | null) => void,
  selectedId: number | null,
  categories: UiCategory[]
) => {
  const isSavingCategory = useRef(false);

  const load = useCallback(async () => {
    try {
      const { ok, data } = await fetchCatalog("GET");

      let cats: UiCategory[] = [];

      if (ok && data) {
        cats = data.categories || [];
        console.debug("[Catalog] fetched from network, count=", (cats || []).length);
      }

      // If network fetch failed or returned no categories, try localStorage cache
      if ((!cats || cats.length === 0) && typeof localStorage !== "undefined") {
        try {
          const raw = localStorage.getItem("catalog.categories");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length) {
              cats = parsed as UiCategory[];
              console.debug("[Catalog] loaded categories from localStorage fallback, count=", cats.length);
            }
          }
        } catch (e) {
          console.debug("[Catalog] failed to parse cached categories", e);
        }
      }

      if (!cats) cats = [];

      // If the network explicitly failed and we have no cached categories,
      // surface an error so callers can show an error state instead of
      // silently showing an empty list.
      if (!ok && cats.length === 0) {
        throw new Error(data?.error || "Failed to load catalog");
      }

      // Only persist non-empty category lists to avoid clearing a valid cache
      // when the network returns empty or fails.
      setCategories(cats);
      if (cats.length) {
        persistCategories(cats);
        if (!selectedId) setSelectedId(cats[0].id);
      }
    } catch (e: unknown) {
      console.error("[Catalog] Failed to load catalog:", e);
      throw e;
    }
  }, [selectedId, setCategories, setSelectedId]);

  const addCategory = useCallback(
    async (name: string) => {
      if (!name.trim()) return;
      const toastId = toast.loading("Creating category…");
      try {
        const { ok, data } = await fetchCatalog("POST", { name });
        if (!ok) throw new Error(data?.error || "Failed to create category");
        await load();
        toast.success("Category created");
      } catch (e: unknown) {
        const error =
          e instanceof Error ? e.message : "Failed to create category";
        console.error("[Catalog] Failed to add category:", e);
        toast.error(error);
      } finally {
        toast.dismiss(toastId);
      }
    },
    [load]
  );

  const addType = useCallback(
    async (name: string, categoryId: number) => {
      if (!categoryId || !name.trim()) return;
      const toastId = toast.loading("Adding type…");
      try {
        const { ok, data } = await fetchCatalog("PUT", { name, categoryId });
        if (!ok) throw new Error(data?.error || "Failed to add type");
        await load();
        toast.success("Type added");
      } catch (e: unknown) {
        const error = e instanceof Error ? e.message : "Failed to add type";
        console.error("[Catalog] Failed to add type:", e);
        toast.error(error);
      } finally {
        toast.dismiss(toastId);
      }
    },
    [load]
  );

  const saveRenameCategory = useCallback(
    async (categoryId: number, nameRaw: string) => {
      if (isSavingCategory.current) return;

      const name = nameRaw.trim();
      const cat = categories.find((c) => c.id === categoryId);

      if (!cat || !name || name === cat.name) return;

      isSavingCategory.current = true;
      const toastId = toast.loading("Renaming category…");

      try {
        const { ok, data } = await fetchCatalog("PATCH", {
          entity: "category",
          id: categoryId,
          name,
        });
        if (!ok) throw new Error(data?.error || "Failed to rename category");
        await load();
        toast.success("Category renamed");
      } catch (e: unknown) {
        const error =
          e instanceof Error ? e.message : "Failed to rename category";
        console.error("[Catalog] Failed to rename category:", e);
        toast.error(error);
      } finally {
        toast.dismiss(toastId);
        isSavingCategory.current = false;
      }
    },
    [categories, load]
  );

  const submitRenameType = useCallback(
    async (
      typeId: number | null,
      typeName: string,
      categoryId: number | null
    ) => {
      if (typeId == null) return;

      const name = typeName.trim();
      if (!name) return;

      const toastId = toast.loading("Renaming type…");

      try {
        const body: any = { entity: "type", id: typeId, name };
        if (categoryId != null) body.categoryId = categoryId;

        const { ok, data } = await fetchCatalog("PATCH", body);
        if (!ok) throw new Error(data?.error || "Failed to rename type");
        await load();
        toast.success("Type renamed");
      } catch (e: unknown) {
        const error = e instanceof Error ? e.message : "Failed to rename type";
        console.error("[Catalog] Failed to rename type:", e);
        toast.error(error);
      } finally {
        toast.dismiss(toastId);
      }
    },
    [load]
  );

  const sortType = useCallback(
    async (typeId: number, nextSort: number) => {
      const toastId = toast.loading("Updating sort…");
      try {
        const { ok, data } = await fetchCatalog("PATCH", {
          entity: "type",
          id: typeId,
          sort: nextSort,
        });
        if (!ok) throw new Error(data?.error || "Failed to update order");
        await load();
        toast.success("Order updated");
      } catch (e: unknown) {
        const error = e instanceof Error ? e.message : "Failed to update order";
        console.error("[Catalog] Failed to sort type:", e);
        toast.error(error);
      } finally {
        toast.dismiss(toastId);
      }
    },
    [load]
  );

  const performDelete = useCallback(
    async (
      confirmPayload: {
        entity: "category" | "type";
        id: number;
        name: string;
        count?: number;
        types?: string[];
      } | null
    ) => {
      if (!confirmPayload) return;

      const { entity, id: targetId } = confirmPayload;

      try {
        // If deleting a category, first delete all associated types
        if (entity === "category") {
          const category = categories.find((c) => c.id === targetId);
          const typeIds = category?.types.map((t) => t.id) || [];

          if (typeIds.length > 0) {
            await deleteTypesWithValidation(typeIds);
            setCategories((prev) => clearCategoryTypes(targetId, prev));
            persistCategories(
              categories.map((c) =>
                c.id === targetId ? { ...c, types: [] } : c
              )
            );
          }
        }

        // Delete the main entity (category or type)
        const { ok, data } = await fetchCatalog("DELETE", {
          entity,
          id: targetId,
        });
        if (!ok) throw new Error(data?.error || "Delete failed");

        // Update local state and localStorage
        setCategories((prev) => {
          const updated =
            entity === "category"
              ? removeCategoryFromList(targetId, prev)
              : removeTypeFromCategories(targetId, prev);

          if (entity === "category" && selectedId === targetId) {
            setSelectedId(updated.length ? updated[0].id : null);
          }

          persistCategories(updated);
          return updated;
        });

        const entityLabel = entity === "category" ? "Category" : "Type";
        toast.success(`${entityLabel} deleted`);
        await load();
      } catch (e: unknown) {
        const error = e instanceof Error ? e.message : "Delete failed";
        console.error("[Catalog] Failed to delete:", e);
        toast.error(error);
        throw e;
      }
    },
    [categories, selectedId, setCategories, setSelectedId, load]
  );

  return {
    load,
    addCategory,
    addType,
    saveRenameCategory,
    submitRenameType,
    sortType,
    performDelete,
  };
};
