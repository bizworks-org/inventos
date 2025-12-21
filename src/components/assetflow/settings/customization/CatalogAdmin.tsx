"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import useFetchOnMount from "../../hooks/useFetchOnMount";
import { toast } from "@/components/ui/sonner";
import { CategoryColumn } from "./components/CategoryColumn";
import { TypesColumn } from "./components/TypesColumn";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { useCatalogAPI } from "./hooks/useCatalogAPI";
import type { UiCategory } from "./catalogHelpers";

export { type UiCategory } from "./catalogHelpers";

export default function CatalogAdmin() {
  const [categories, setCategories] = useState<UiCategory[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [newType, setNewType] = useState("");

  // Category rename state
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
    null
  );
  const [editingCategoryName, setEditingCategoryName] = useState("");

  // Hover state
  const [hoveredCategoryId, setHoveredCategoryId] = useState<number | null>(
    null
  );

  // Type rename state
  const [renamingTypeId, setRenamingTypeId] = useState<number | null>(null);
  const [renamingTypeName, setRenamingTypeName] = useState("");
  const [renamingTypeCategoryId, setRenamingTypeCategoryId] = useState<
    number | null
  >(null);
  const [hoveredTypeId, setHoveredTypeId] = useState<number | null>(null);

  // Delete confirmation state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPayload, setConfirmPayload] = useState<{
    entity: "category" | "type";
    id: number;
    name: string;
    count?: number;
    types?: string[];
  } | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  // Dialog refs
  const modalRef = useRef<HTMLDialogElement | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  const {
    load,
    addCategory: apiAddCategory,
    addType: apiAddType,
    saveRenameCategory,
    submitRenameType: apiSubmitRenameType,
    sortType,
    performDelete: apiPerformDelete,
  } = useCatalogAPI(setCategories, setSelectedId, selectedId, categories);

  const { loading } = useFetchOnMount(async () => {
    try {
      await load();
      setError(null);
    } catch (e: any) {
      const msg = e?.message || "Failed to load catalog";
      setError(msg);
      try {
        toast.error(msg);
      } catch {}
    }
  }, [load]);

  const selected = useMemo(
    () => categories.find((c) => c.id === selectedId) || null,
    [categories, selectedId]
  );

  const pendingTypes =
    confirmPayload?.entity === "category"
      ? categories.find((c) => c.id === confirmPayload.id)?.types || []
      : [];

  const addCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    try {
      await apiAddCategory(name);
      setNewCategory("");
    } catch (error_: unknown) {
      console.error("[CatalogAdmin] Failed to add category:", error_);
    }
  };

  const addType = async () => {
    if (!selected) return;
    const name = newType.trim();
    if (!name) return;
    try {
      await apiAddType(name, selected.id);
      setNewType("");
    } catch (error_: unknown) {
      console.error("[CatalogAdmin] Failed to add type:", error_);
    }
  };

  const startRenameType = (
    id: number,
    currentName: string,
    currentCategoryId: number
  ) => {
    setRenamingTypeId(id);
    setRenamingTypeName(currentName);
    setRenamingTypeCategoryId(currentCategoryId);
  };

  const cancelRenameType = () => {
    setRenamingTypeId(null);
    setRenamingTypeName("");
    setRenamingTypeCategoryId(null);
  };

  const submitRenameType = async () => {
    try {
      await apiSubmitRenameType(
        renamingTypeId,
        renamingTypeName,
        renamingTypeCategoryId
      );
      cancelRenameType();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error_: unknown) {
      console.error("[CatalogAdmin] Failed to rename type:", error_);
    }
  };

  // Check dependencies when dialog opens
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!confirmOpen || !confirmPayload) return;
      if (typeof confirmPayload.count === "number") return;
      try {
        const res = await fetch("/api/admin/catalog", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entity: confirmPayload.entity,
            id: confirmPayload.id,
            dryRun: true,
          }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          toast.error(data?.error || "Failed to check dependencies");
          return;
        }
        setConfirmPayload((p) =>
          p ? { ...p, count: data?.count ?? 0, types: data?.types } : p
        );
      } catch (e: any) {
        toast.error(e?.message || "Failed to check dependencies");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [confirmOpen, confirmPayload]);

  const performDelete = async () => {
    if (!confirmPayload) return;
    setConfirmBusy(true);
    try {
      await apiPerformDelete(confirmPayload);
      setConfirmOpen(false);
      setConfirmPayload(null);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error_: unknown) {
      console.error("[CatalogAdmin] Failed to delete:", error_);
    } finally {
      setConfirmBusy(false);
    }
  };

  // Dialog keyboard navigation
  useEffect(() => {
    if (!confirmOpen) return;
    const prev = document.activeElement as HTMLElement | null;
    const id = setTimeout(() => confirmBtnRef.current?.focus(), 120);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setConfirmOpen(false);
        setConfirmPayload(null);
        return;
      }
      if (e.key === "Tab") {
        const container = modalRef.current;
        if (!container) return;
        const focusable = Array.from(
          container.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
          )
        ).filter(
          (el) =>
            !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(id);
      document.removeEventListener("keydown", onKey);
      if (prev) prev.focus();
    };
  }, [confirmOpen]);

  let dialogTitle = "Delete";
  if (confirmPayload) {
    const entityLabel =
      confirmPayload.entity === "category" ? "Category" : "Type";
    dialogTitle = `Delete ${entityLabel}`;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Catalog</h1>
        <p className="text-sm text-[#64748b]">
          Manage asset categories and their types.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CategoryColumn
          categories={categories}
          loading={loading}
          error={error}
          selectedId={selectedId}
          hoveredCategoryId={hoveredCategoryId}
          editingCategoryId={editingCategoryId}
          editingCategoryName={editingCategoryName}
          newCategory={newCategory}
          setHoveredCategoryId={setHoveredCategoryId}
          setSelectedId={setSelectedId}
          setEditingCategoryId={setEditingCategoryId}
          setEditingCategoryName={setEditingCategoryName}
          saveRenameCategory={saveRenameCategory}
          setConfirmPayload={setConfirmPayload}
          setConfirmOpen={setConfirmOpen}
          setNewCategory={setNewCategory}
          addCategory={addCategory}
          refresh={load}
        />

        <TypesColumn
          selected={selected}
          categories={categories}
          renamingTypeId={renamingTypeId}
          renamingTypeName={renamingTypeName}
          renamingTypeCategoryId={renamingTypeCategoryId}
          hoveredTypeId={hoveredTypeId}
          newType={newType}
          setHoveredTypeId={setHoveredTypeId}
          startRenameType={startRenameType}
          setConfirmPayload={setConfirmPayload}
          setConfirmOpen={setConfirmOpen}
          sortType={sortType}
          submitRenameType={submitRenameType}
          cancelRenameType={cancelRenameType}
          setRenamingTypeName={setRenamingTypeName}
          setRenamingTypeCategoryId={setRenamingTypeCategoryId}
          setNewType={setNewType}
          addType={addType}
        />
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        payload={confirmPayload}
        pendingTypes={pendingTypes}
        isBusy={confirmBusy}
        dialogTitle={dialogTitle}
        modalRef={modalRef}
        confirmBtnRef={confirmBtnRef}
        onConfirm={performDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmPayload(null);
        }}
      />
    </div>
  );
}
