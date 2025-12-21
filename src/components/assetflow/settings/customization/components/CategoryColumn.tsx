import { Plus, Check, Pencil, RefreshCcw } from "lucide-react";
import type { UiCategory } from "../catalogHelpers";
import { gradientForCategory, iconForCategory } from "../catalogHelpers";

interface EditingCategoryItemProps {
  category: UiCategory;
  editingName: string;
  onSave: (id: number, name: string) => void;
  onNameChange: (name: string) => void;
}

export const EditingCategoryItem = ({
  category,
  editingName,
  onSave,
  onNameChange,
}: EditingCategoryItemProps) => (
  <div className="w-full flex items-center justify-between px-3 py-2 rounded-lg border bg-[#f8f9ff] border-[#e2e8f0]">
    <div className="flex items-center gap-2 min-w-0 flex-1">
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-white"
        style={{ backgroundImage: gradientForCategory(category.name) }}
      >
        {(() => {
          const CatIcon = iconForCategory(category.name);
          return <CatIcon className="h-4 w-4" />;
        })()}
      </span>
      <input
        autoFocus
        value={editingName}
        onChange={(e) => onNameChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSave(category.id, editingName);
          } else if (e.key === "Escape") {
            onSave(category.id, "");
          }
        }}
        onBlur={() => onSave(category.id, editingName)}
        className="flex-1 px-3 py-1.5 rounded-md bg-white border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1]"
      />
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onSave(category.id, editingName);
        }}
        className="inline-flex items-center justify-center text-xs p-1.5 rounded bg-[#e2e8f0] text-[#475569] hover:bg-[#cbd5e1]"
        aria-label="Save category"
        title="Save"
      >
        <Check className="h-3 w-3" />
      </button>
    </div>
    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-[#e2e8f0] text-[#64748b]">
      {category.types.length}
    </span>
  </div>
);

interface ViewingCategoryItemProps {
  category: UiCategory;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (id: number) => void;
  onHover: (id: number | null) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number, name: string) => void;
}

export const ViewingCategoryItem = ({
  category,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onEdit,
  onDelete,
}: ViewingCategoryItemProps) => (
  <fieldset
    className={`group w-full flex items-center justify-between px-4 py-2 rounded-lg border transition-colors ${
      isSelected
        ? "text-white border-transparent"
        : "bg-white text-[#1a1d2e] border-[#e2e8f0] hover:border-[#cbd5e1]"
    }`}
    style={
      isSelected
        ? { backgroundImage: gradientForCategory(category.name) }
        : undefined
    }
    onMouseEnter={() => onHover(category.id)}
    onMouseLeave={() => onHover(null)}
  >
    <button
      type="button"
      onClick={() => onSelect(category.id)}
      className="flex items-center gap-2 min-w-0 flex-1 text-left"
    >
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-white"
        style={{ backgroundImage: gradientForCategory(category.name) }}
      >
        {(() => {
          const CatIcon = iconForCategory(category.name);
          return <CatIcon className="h-4 w-4" />;
        })()}
      </span>
      <span className="font-medium truncate">{category.name}</span>
    </button>
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.preventDefault();
          e.stopPropagation();
          onEdit(category.id);
        }}
        className={`${
          isSelected
            ? "bg-white/20 text-white hover:bg-white/30"
            : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
        } inline-flex items-center text-xs p-1.5 rounded transition-opacity ${
          isHovered ? "opacity-100 visible" : "opacity-0 invisible"
        } group-hover:opacity-100 group-hover:visible focus:opacity-100 focus:visible`}
        aria-label="Edit category"
        title="Edit category"
      >
        <Pencil className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete(category.id, category.name);
        }}
        className={`inline-flex items-center text-xs p-1.5 rounded transition-opacity ${
          isHovered ? "opacity-100 visible" : "opacity-0 invisible"
        } group-hover:opacity-100 group-hover:visible focus:opacity-100 focus:visible bg-[#fff1f2] text-[#b91c1c] hover:bg-[#fee2e2]`}
        aria-label="Delete category"
        title="Delete category"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3 w-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
      <span
        className={`text-xs px-2 py-0.5 rounded-full ${
          isSelected ? "bg-white/20 text-white" : "bg-[#f1f5f9] text-[#64748b]"
        }`}
      >
        {category.types.length}
      </span>
    </div>
  </fieldset>
);

interface CategoryListContentProps {
  categories: UiCategory[];
  selectedId: number | null;
  hoveredCategoryId: number | null;
  editingCategoryId: number | null;
  editingCategoryName: string;
  onSelect: (id: number) => void;
  onHover: (id: number | null) => void;
  onStartEdit: (id: number, name: string) => void;
  onNameChange: (name: string) => void;
  onSaveRename: (id: number, name: string) => void;
  onDelete: (id: number, name: string) => void;
}

export const CategoryListContent = ({
  categories,
  selectedId,
  hoveredCategoryId,
  editingCategoryId,
  editingCategoryName,
  onSelect,
  onHover,
  onStartEdit,
  onNameChange,
  onSaveRename,
  onDelete,
}: CategoryListContentProps) => (
  <div className="space-y-2">
    {categories.map((c) => {
      const isSelected = selectedId === c.id;
      const isEditing = editingCategoryId === c.id;
      const isHovered = hoveredCategoryId === c.id;

      if (isEditing) {
        return (
          <EditingCategoryItem
            key={c.id}
            category={c}
            editingName={editingCategoryName}
            onSave={onSaveRename}
            onNameChange={onNameChange}
          />
        );
      }

      return (
        <ViewingCategoryItem
          key={c.id}
          category={c}
          isSelected={isSelected}
          isHovered={isHovered}
          onSelect={onSelect}
          onHover={onHover}
          onEdit={(id) => onStartEdit(id, c.name)}
          onDelete={onDelete}
        />
      );
    })}
  </div>
);

interface CategoryColumnLoadingStateProps {
  loading: boolean;
  error: string | null;
}

export const CategoryColumnLoadingState = ({
  loading,
  error,
}: CategoryColumnLoadingStateProps) => {
  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-[#ef4444]">{error}</p>;
  return null;
};

interface CategoryColumnProps {
  categories: UiCategory[];
  loading: boolean;
  error: string | null;
  selectedId: number | null;
  hoveredCategoryId: number | null;
  editingCategoryId: number | null;
  editingCategoryName: string;
  newCategory: string;
  setHoveredCategoryId: (id: number | null) => void;
  setSelectedId: (id: number | null) => void;
  setEditingCategoryId: (id: number | null) => void;
  setEditingCategoryName: (name: string) => void;
  saveRenameCategory: (id: number, name: string) => void;
  setConfirmPayload: (p: any) => void;
  setConfirmOpen: (v: boolean) => void;
  setNewCategory: (v: string) => void;
  addCategory: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function CategoryColumn(
  props: Readonly<{
    categories: UiCategory[];
    loading: boolean;
    error: string | null;
    selectedId: number | null;
    hoveredCategoryId: number | null;
    editingCategoryId: number | null;
    editingCategoryName: string;
    newCategory: string;
    setHoveredCategoryId: (id: number | null) => void;
    setSelectedId: (id: number | null) => void;
    setEditingCategoryId: (id: number | null) => void;
    setEditingCategoryName: (name: string) => void;
    saveRenameCategory: (id: number, name: string) => void;
    setConfirmPayload: (p: any) => void;
    setConfirmOpen: (v: boolean) => void;
    setNewCategory: (v: string) => void;
    addCategory: () => Promise<void>;
    refresh: () => Promise<void>;
  }>
) {
  const {
    categories,
    loading,
    error,
    selectedId,
    hoveredCategoryId,
    editingCategoryId,
    editingCategoryName,
    newCategory,
    setHoveredCategoryId,
    setSelectedId,
    setEditingCategoryId,
    setEditingCategoryName,
    saveRenameCategory,
    setConfirmPayload,
    setConfirmOpen,
    setNewCategory,
    addCategory,
  } = props;
  const showEmpty = !loading && !error && categories.length === 0;
  const handleDeleteClick = (id: number, name: string) => {
    console.debug("[Catalog] delete category click", { id, name });
    setConfirmPayload({
      entity: "category",
      id,
      name,
    } as { entity: "category"; id: number; name: string });
    setConfirmOpen(true);
  };

  const showLoadingOrError = loading || !!error;
  const loadingOrErrorContent = showLoadingOrError ? (
    <CategoryColumnLoadingState loading={loading} error={error} />
  ) : null;

  const listContent = !loading && !error ? (
    <CategoryListContent
      categories={categories}
      selectedId={selectedId}
      hoveredCategoryId={hoveredCategoryId}
      editingCategoryId={editingCategoryId}
      editingCategoryName={editingCategoryName}
      onSelect={setSelectedId}
      onHover={setHoveredCategoryId}
      onStartEdit={setEditingCategoryId}
      onNameChange={setEditingCategoryName}
      onSaveRename={saveRenameCategory}
      onDelete={handleDeleteClick}
    />
  ) : null;

  return (
    <div className="lg:col-span-1">
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold">Categories</h2>
          <button
            onClick={async () => {
              try {
                await props.refresh();
              } catch (e) {
                console.error("[Catalog] refresh failed", e);
              }
            }}
            title="Refresh catalog"
            className="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-lg bg-white border"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>
        <p className="text-xs text-[#64748b] mb-3">
          Tip: hover a category to reveal the edit icon.
        </p>
        {loadingOrErrorContent ? loadingOrErrorContent : listContent}
        {showEmpty && (
          <div className="mt-4 p-4 rounded-lg bg-[#fff8f3] border border-[#fde8d6] text-[#92400e]">
            <div className="flex items-center justify-between gap-4">
              <div>No categories found. Try refreshing the catalog.</div>
              <button
                onClick={async () => {
                  try {
                    await props.refresh();
                  } catch (e) {
                    console.error("[Catalog] refresh failed", e);
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-white border text-sm"
              >
                Refresh
              </button>
            </div>
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-[#e2e8f0]">
          <label
            htmlFor="newCategoryInput"
            className="block text-sm text-[#64748b] mb-1"
          >
            Add Category
          </label>
          <div className="flex gap-2">
            <input
              id="newCategoryInput"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="e.g., Electronic Devices"
              className="flex-1 px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1]"
            />
            <button
              onClick={addCategory}
              className="px-3 py-2 rounded-lg text-white"
              style={{
                backgroundImage: "linear-gradient(to right, #22c55e, #14b8a6)",
              }}
            >
              <span className="inline-flex items-center gap-1">
                <Plus className="h-4 w-4" /> Add
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
