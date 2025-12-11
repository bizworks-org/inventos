import { Plus, Pencil, X, Check, Package } from "lucide-react";
import type { UiCategory } from "../catalogHelpers";
import { gradientForType, iconForType } from "../catalogHelpers";

interface ViewingTypeItemProps {
  type: { id: number; name: string; sort: number };
  hoveredTypeId: number | null;
  onHover: (id: number | null) => void;
  onEdit: (id: number, name: string, categoryId: number) => void;
  onDelete: (id: number, name: string) => void;
  onSortUp: (id: number) => void;
  onSortDown: (id: number) => void;
}

export const ViewingTypeItem = ({
  type: t,
  hoveredTypeId,
  onHover,
  onEdit,
  onDelete,
  onSortUp,
  onSortDown,
}: ViewingTypeItemProps) => {
  const Icon = iconForType(t.name);
  return (
    <fieldset
      className="group w-full flex items-center justify-between px-4 py-2 rounded-lg border text-white shadow-sm"
      style={{ backgroundImage: gradientForType(t.name) }}
      onMouseEnter={() => onHover(t.id)}
      onMouseLeave={() =>
        onHover(hoveredTypeId === t.id ? null : hoveredTypeId)
      }
      onFocus={() => onHover(t.id)}
      onBlur={() => onHover(hoveredTypeId === t.id ? null : hoveredTypeId)}
    >
      <legend className="sr-only">{`Type ${t.name}`}</legend>
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4 opacity-90" />
        <span className="font-medium">{t.name}</span>
      </span>
      <span className="flex items-center gap-2">
        <button
          onClick={() => onEdit(t.id, t.name, 0)}
          className={`text-xs bg-white/20 hover:bg-white/30 p-1.5 rounded inline-flex items-center transition-opacity ${
            hoveredTypeId === t.id
              ? "opacity-100 visible"
              : "opacity-0 invisible"
          } group-hover:opacity-100 group-hover:visible focus:opacity-100 focus:visible`}
          aria-label="Edit type"
          title="Edit type"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          onClick={() => onDelete(t.id, t.name)}
          className={`text-xs bg-white/20 hover:bg-white/30 p-1.5 rounded inline-flex items-center transition-opacity ${
            hoveredTypeId === t.id
              ? "opacity-100 visible"
              : "opacity-0 invisible"
          } group-hover:opacity-100 group-hover:visible focus:opacity-100 focus:visible`}
          aria-label="Delete type"
          title="Delete type"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 text-[#b91c1c]"
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
        <button
          onClick={() => onSortUp(t.id)}
          className="text-xs bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded"
        >
          ↑
        </button>
        <button
          onClick={() => onSortDown(t.id)}
          className="text-xs bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded"
        >
          ↓
        </button>
        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
          #{t.id}
        </span>
      </span>
    </fieldset>
  );
};

interface EditingTypeItemProps {
  typeName: string;
  typeCategoryId: number | null;
  categories: UiCategory[];
  selectedCategoryId: number;
  onNameChange: (name: string) => void;
  onCategoryChange: (id: number) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const EditingTypeItem = ({
  typeName,
  typeCategoryId,
  categories,
  selectedCategoryId,
  onNameChange,
  onCategoryChange,
  onSave,
  onCancel,
}: EditingTypeItemProps) => (
  <div className="w-full flex items-center gap-2 p-2 rounded-lg border bg-[#f8f9ff]">
    <input
      value={typeName}
      onChange={(e) => onNameChange(e.target.value)}
      className="flex-1 px-3 py-2 rounded-lg bg-white border border-[#e2e8f0]"
    />
    <select
      value={typeCategoryId ?? selectedCategoryId}
      onChange={(e) => onCategoryChange(Number(e.target.value))}
      className="px-3 py-2 rounded-lg bg-white border border-[#e2e8f0]"
    >
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
    <button
      onClick={onSave}
      className="px-3 py-2 rounded-lg text-white"
      style={{ backgroundImage: "linear-gradient(to right, #10b981, #22c55e)" }}
    >
      <span className="inline-flex items-center gap-1">
        <Check className="h-4 w-4" /> Save
      </span>
    </button>
    <button
      onClick={onCancel}
      className="px-3 py-2 rounded-lg text-[#ef4444] border border-[#fecaca] bg-[#fff1f2]"
    >
      <span className="inline-flex items-center gap-1">
        <X className="h-4 w-4" /> Cancel
      </span>
    </button>
  </div>
);

interface TypesColumnProps {
  selected: UiCategory | null;
  categories: UiCategory[];
  renamingTypeId: number | null;
  renamingTypeName: string;
  renamingTypeCategoryId: number | null;
  hoveredTypeId: number | null;
  newType: string;
  setHoveredTypeId: (id: number | null) => void;
  startRenameType: (id: number, name: string, catId: number) => void;
  setConfirmPayload: (p: any) => void;
  setConfirmOpen: (v: boolean) => void;
  sortType: (id: number, nextSort: number) => Promise<void>;
  submitRenameType: () => Promise<void>;
  cancelRenameType: () => void;
  setRenamingTypeName: (n: string) => void;
  setRenamingTypeCategoryId: (id: number | null) => void;
  setNewType: (v: string) => void;
  addType: () => Promise<void>;
}

export function TypesColumn(props: Readonly<TypesColumnProps>) {
  const {
    selected,
    categories,
    renamingTypeId,
    renamingTypeName,
    renamingTypeCategoryId,
    hoveredTypeId,
    newType,
    setHoveredTypeId,
    startRenameType,
    setConfirmPayload,
    setConfirmOpen,
    sortType,
    submitRenameType,
    cancelRenameType,
    setRenamingTypeName,
    setRenamingTypeCategoryId,
    setNewType,
    addType,
  } = props;
  return (
    <div className="lg:col-span-2">
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            Types{" "}
            {selected ? (
              <span className="text-[#64748b] font-normal">
                in {selected.name}
              </span>
            ) : null}
          </h2>
        </div>
        {!selected ? (
          <div className="p-12 text-center text-[#64748b]">
            <div className="h-12 w-12 rounded-full bg-[#f8f9ff] flex items-center justify-center mx-auto mb-3">
              <Package className="h-6 w-6 text-[#6366f1]" />
            </div>
            <p>Select a category to view and add types.</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {selected.types.length === 0 && (
                <p className="text-[#64748b]">No types in this category yet.</p>
              )}
              {selected.types.map((t) => {
                const isEditing = renamingTypeId === t.id;
                if (isEditing) {
                  return (
                    <EditingTypeItem
                      key={t.id}
                      typeName={renamingTypeName}
                      typeCategoryId={renamingTypeCategoryId}
                      categories={categories}
                      selectedCategoryId={selected.id}
                      onNameChange={setRenamingTypeName}
                      onCategoryChange={setRenamingTypeCategoryId}
                      onSave={submitRenameType}
                      onCancel={cancelRenameType}
                    />
                  );
                }
                return (
                  <ViewingTypeItem
                    key={t.id}
                    type={t}
                    hoveredTypeId={hoveredTypeId}
                    onHover={setHoveredTypeId}
                    onEdit={startRenameType}
                    onDelete={(id, name) => {
                      console.debug("[Catalog] delete type click", {
                        id,
                        name,
                      });
                      setConfirmPayload({ entity: "type", id, name });
                      setConfirmOpen(true);
                    }}
                    onSortUp={(id) =>
                      sortType(id, Math.max(0, (t.sort || 0) - 5))
                    }
                    onSortDown={(id) => sortType(id, (t.sort || 0) + 5)}
                  />
                );
              })}
            </div>

            <div className="pt-4 border-t border-[#e2e8f0]">
              <label
                htmlFor="add-type-input"
                className="block text-sm text-[#64748b] mb-1"
              >
                Add Type
              </label>
              <div className="flex gap-2 max-w-xl">
                <input
                  id="add-type-input"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  placeholder="e.g., Smartphone"
                  className="flex-1 px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1]"
                />
                <button
                  onClick={addType}
                  className="px-3 py-2 rounded-lg text-white"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, #6366f1, #8b5cf6)",
                  }}
                >
                  <span className="inline-flex items-center gap-1">
                    <Plus className="h-4 w-4" /> Add
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
