import Portal from "@/components/ui/Portal";

// Helper component for warning section
const WarningSection = ({
  payload,
  pendingTypes,
}: {
  payload: {
    entity: "category" | "type";
    id: number;
    name: string;
    count?: number;
    types?: string[];
  } | null;
  pendingTypes: Array<{ id: number; name: string; sort: number }>;
}) => {
  const hasWarning =
    payload && typeof payload.count === "number" && payload.count > 0;

  if (!hasWarning) {
    return (
      <p className="text-sm text-[#64748b]">
        This action cannot be undone. Proceed?
      </p>
    );
  }

  return (
    <div className="p-4 bg-[#fff7ed] rounded-md border border-[#ffedd5] mb-2">
      <p className="text-sm text-[#92400e]">
        There are <span className="font-semibold">{payload.count}</span>{" "}
        asset(s) that reference{" "}
        {payload.entity === "category" ? "types in this category" : "this type"}
        .
      </p>
      {payload.types && payload.types.length > 0 && (
        <p className="text-xs text-[#92400e] mt-2">
          Affected types: {payload.types.join(", ")}
        </p>
      )}
      <p className="text-xs text-[#92400e] mt-2">
        Deleting will remove the{" "}
        {payload.entity === "category" ? "category and its types" : "type"} from
        the catalog. Assets themselves will not be removed.
      </p>
    </div>
  );
};

// Helper component for confirm button section
const ConfirmSection = ({
  payload,
  isBusy,
  confirmBtnRef,
  onConfirm,
}: {
  payload: {
    entity: "category" | "type";
    id: number;
    name: string;
    count?: number;
    types?: string[];
  } | null;
  isBusy: boolean;
  confirmBtnRef: React.RefObject<HTMLButtonElement>;
  onConfirm: () => void;
}) => {
  const hasBlockingAssets =
    payload && typeof payload.count === "number" && payload.count > 0;

  if (hasBlockingAssets) {
    return (
      <div className="text-sm text-[#92400e]">
        This item cannot be deleted because there are assets assigned. Reassign
        or remove assets first.
      </div>
    );
  }

  return (
    <button
      onClick={onConfirm}
      ref={confirmBtnRef}
      disabled={isBusy}
      className="px-4 py-2 rounded-lg border bg-[#ef4444] text-white"
    >
      {isBusy ? "Working…" : "Delete"}
    </button>
  );
};

interface ConfirmDialogProps {
  isOpen: boolean;
  payload: {
    entity: "category" | "type";
    id: number;
    name: string;
    count?: number;
    types?: string[];
  } | null;
  pendingTypes: Array<{ id: number; name: string; sort: number }>;
  isBusy: boolean;
  dialogTitle: string;
  modalRef: React.RefObject<HTMLDialogElement>;
  confirmBtnRef: React.RefObject<HTMLButtonElement>;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  isOpen,
  payload,
  pendingTypes,
  isBusy,
  dialogTitle,
  modalRef,
  confirmBtnRef,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-40">
        <button
          type="button"
          aria-label="Close dialog"
          className="absolute inset-0 bg-black/30 backdrop-blur-sm focus:outline-none"
          onClick={onCancel}
        />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <dialog
            ref={modalRef}
            open
            aria-labelledby="catalog-confirm-title"
            className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-[rgba(0,0,0,0.08)] p-6"
          >
            <div className="mb-3">
              <h3
                id="catalog-confirm-title"
                className="text-lg font-semibold text-[#111827]"
              >
                {dialogTitle}
              </h3>
              {payload && (
                <p className="text-sm text-[#64748b] mt-1">
                  You are about to delete the{" "}
                  {payload.entity === "category" ? "category" : "type"}{" "}
                  {payload.name}.
                </p>
              )}
            </div>

            {payload?.entity === "category" && pendingTypes.length > 0 && (
              <div className="mb-3">
                <p className="text-sm text-[#64748b]">
                  This category contains{" "}
                  <span className="font-semibold">{pendingTypes.length}</span>{" "}
                  type(s). These types will be deleted along with the category
                  if no assets reference them.
                </p>
              </div>
            )}

            <WarningSection payload={payload} pendingTypes={pendingTypes} />

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg border bg-white"
              >
                Cancel
              </button>

              <ConfirmSection
                payload={payload}
                isBusy={isBusy}
                confirmBtnRef={confirmBtnRef}
                onConfirm={onConfirm}
              />
            </div>
          </dialog>
        </div>
      </div>
    </Portal>
  );
};
