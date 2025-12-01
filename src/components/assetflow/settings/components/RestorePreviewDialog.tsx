import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PreviewStats {
  table: string;
  incoming: number;
  existing: number;
  delta: number;
}

interface RestorePreviewDialogProps {
  open: boolean;
  previewing: boolean;
  previewError: string | null;
  previewStats: Record<string, any> | null;
  previewFile: File | null;
  restoreInProgress: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function PreviewStatsTable({ stats }: { stats: any[] }) {
  const getDeltaClassName = (delta: number) => {
    if (delta > 0) return "text-green-600";
    if (delta < 0) return "text-red-600";
    return "text-gray-600 dark:text-gray-400";
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b dark:border-gray-700">
            <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-gray-100">
              Table
            </th>
            <th className="text-right py-2 px-3 font-semibold text-gray-900 dark:text-gray-100">
              Incoming
            </th>
            <th className="text-right py-2 px-3 font-semibold text-gray-900 dark:text-gray-100">
              Existing
            </th>
            <th className="text-right py-2 px-3 font-semibold text-gray-900 dark:text-gray-100">
              Delta
            </th>
          </tr>
        </thead>
        <tbody>
          {stats.map((stat) => (
            <tr key={stat.table} className="border-b dark:border-gray-700">
              <td className="py-2 px-3 text-gray-900 dark:text-gray-100">
                {stat.table}
              </td>
              <td className="text-right py-2 px-3 text-gray-600 dark:text-gray-400">
                {stat.incoming}
              </td>
              <td className="text-right py-2 px-3 text-gray-600 dark:text-gray-400">
                {stat.existing}
              </td>
              <td
                className={`text-right py-2 px-3 font-medium ${getDeltaClassName(
                  stat.delta
                )}`}
              >
                {stat.delta > 0 ? "+" : ""}
                {stat.delta}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PreviewContent({
  previewing,
  previewError,
  previewStats,
}: {
  previewing: boolean;
  previewError: string | null;
  previewStats: Record<string, any> | null;
}) {
  if (previewError) {
    return <p className="text-red-600 text-sm">{previewError}</p>;
  }

  if (previewing) {
    return (
      <p className="text-gray-600 dark:text-gray-400">
        Analyzing backup file...
      </p>
    );
  }

  if (previewStats && Array.isArray(previewStats) && previewStats.length > 0) {
    return <PreviewStatsTable stats={previewStats} />;
  }

  return (
    <p className="text-gray-600 dark:text-gray-400">
      No preview data available.
    </p>
  );
}

export function RestorePreviewDialog({
  open,
  previewing,
  previewError,
  previewStats,
  previewFile,
  restoreInProgress,
  onClose,
  onConfirm,
}: RestorePreviewDialogProps) {
  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Confirm Restore</DialogTitle>
          <DialogDescription>
            Review the backup contents before restoring. This will overwrite
            existing data.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <PreviewContent
            previewing={previewing}
            previewError={previewError}
            previewStats={previewStats}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={restoreInProgress}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={
              !previewFile ||
              restoreInProgress ||
              !!previewError ||
              !previewStats ||
              !Array.isArray(previewStats) ||
              previewStats.length === 0
            }
            className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg"
          >
            {restoreInProgress ? "Restoring…" : "Confirm Restore"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
