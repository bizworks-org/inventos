import { useState } from "react";
import { toast } from "@/components/ui/sonner";

export function useBackupRestore() {
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewStats, setPreviewStats] = useState<Record<string, any> | null>(
    null
  );
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [restoreInProgress, setRestoreInProgress] = useState(false);

  const handleBackup = async () => {
    setBackupInProgress(true);
    try {
      const res = await fetch("/api/admin/backup", { method: "GET" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Backup failed");
      }
      const buf = await res.arrayBuffer();
      const blob = new Blob([buf], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inventos-backup-${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.bin`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded");
      return true;
    } catch (e: any) {
      toast.error(e?.message || "Backup failed");
      return false;
    } finally {
      setBackupInProgress(false);
    }
  };

  const handlePreview = async (file: File | null) => {
    setPreviewError(null);
    if (!file) return;
    setPreviewing(true);
    setPreviewFile(file);
    try {
      const buf = await file.arrayBuffer();
      const res = await fetch("/api/admin/backup?preview=1", {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: buf,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Preview failed");
      setPreviewStats(data.tables || null);
      setPreviewOpen(true);
      return true;
    } catch (e: any) {
      setPreviewError(e?.message || "Preview failed");
      toast.error(e?.message || "Preview failed");
      return false;
    } finally {
      setPreviewing(false);
    }
  };

  const handleRestoreConfirmed = async () => {
    if (!previewFile) return;
    setRestoreInProgress(true);
    try {
      const buf = await previewFile.arrayBuffer();
      const doing = toast.loading("Restoring backup…");
      const res = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: buf,
      });
      const data = await res.json().catch(() => ({}));
      toast.dismiss(doing);
      if (!res.ok) throw new Error(data?.error || "Restore failed");
      toast.success("Restore completed");
      setPreviewOpen(false);
      setPreviewStats(null);
      setPreviewFile(null);
      return true;
    } catch (e: any) {
      toast.error(e?.message || "Restore failed");
      return false;
    } finally {
      setRestoreInProgress(false);
    }
  };

  return {
    backupInProgress,
    previewOpen,
    setPreviewOpen,
    previewStats,
    setPreviewStats,
    previewFile,
    setPreviewFile,
    previewError,
    previewing,
    restoreInProgress,
    handleBackup,
    handlePreview,
    handleRestoreConfirmed,
  };
}
