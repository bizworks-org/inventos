import { useState, useCallback } from "react";
import { toast } from "@/components/ui/sonner";

export interface BackupHistory {
  id: string;
  backupName: string;
  timestamp: number;
  timestampMs: string;
  filePath: string;
  fileSize: number;
  checksum: string;
  status: "active" | "restored" | "corrupted" | "pending";
  createdAt: Date;
  restoredAt?: Date;
  isEncrypted: boolean;
}

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
  const [selectiveRestoreOpen, setSelectiveRestoreOpen] = useState(false);
  const [selectiveRestoreBackup, setSelectiveRestoreBackup] = useState<BackupHistory | null>(null);
  const [selectiveRestoreStats, setSelectiveRestoreStats] = useState<Record<string, any> | null>(null);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([]);
  const [selectedBackupId, setSelectedBackupId] = useState<string | null>(null);
  const [captchaVerified, setCaptchaVerified] = useState(false);

  // Generate checksum for file integrity verification
  const generateChecksum = useCallback(async (buffer: ArrayBuffer): Promise<string> => {
    try {
      const hashBuffer = await crypto.subtle.digest("SHA-256", new Uint8Array(buffer));
      return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } catch (e) {
      console.error("Checksum generation failed:", e);
      return "";
    }
  }, []);

  // Load backup history from localStorage
  const loadBackupHistory = useCallback(async () => {
    try {
      const raw = localStorage.getItem("assetflow:backup-history");
      if (!raw) {
        setBackupHistory([]);
        return [];
      }
      const parsed = JSON.parse(raw) as BackupHistory[];
      setBackupHistory(parsed);
      return parsed;
    } catch (e) {
      console.error("Failed to load backup history:", e);
      return [];
    }
  }, []);

  // Save backup history to localStorage and backend
  const saveBackupHistory = useCallback(async (history: BackupHistory[]) => {
    try {
      localStorage.setItem("assetflow:backup-history", JSON.stringify(history));
      // Also save to backend via API
      await fetch("/api/admin/backup-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backups: history }),
      }).catch(() => {
        // Silently fail - localStorage is the primary storage
      });
      setBackupHistory(history);
    } catch (e) {
      console.error("Failed to save backup history:", e);
    }
  }, []);

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

      // Determine server-provided filename (from Content-Disposition)
      const cd = res.headers.get("Content-Disposition") || "";
      const m = cd.match(/filename="?([^";]+)"?/);
      const serverFilename = m ? m[1] : `inventos-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.bin`;

      // Generate checksum for integrity verification
      const checksum = await generateChecksum(buf);

      // Create backup history entry
      const now = new Date();
      const timestamp = Math.floor(now.getTime() / 1000);
      const timestampMs = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}-${String(now.getMilliseconds()).padStart(3, "0")}`;
      const backupName = serverFilename.replace(/\.bin$/i, "");

      const historyEntry: BackupHistory = {
        id: globalThis.crypto.randomUUID(),
        backupName,
        timestamp,
        timestampMs,
        filePath: serverFilename,
        fileSize: buf.byteLength,
        checksum,
        status: "active",
        createdAt: now,
        isEncrypted: true,
      };

      // Save file (trigger browser download)
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
<<<<<<< HEAD
      a.download = serverFilename;
=======
      a.download = `inventos-backup-${new Date()
        .toISOString()
        .split(":")
        .join("-")
        .split(".")
        .join("-")}.bin`;
>>>>>>> f9db60b150a1096c2cd789083e856d98de0fb3a9
      a.rel = "noopener noreferrer";
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      // Add to history
      const currentHistory = await loadBackupHistory();
      const updatedHistory = [historyEntry, ...currentHistory];
      await saveBackupHistory(updatedHistory);

      toast.success("Backup created, downloaded, and saved locally. History updated.");
      return true;
    } catch (e: any) {
      toast.error(e?.message || "Backup failed");
      return false;
    } finally {
      setBackupInProgress(false);
    }
  };

  const handlePreview = async (file: File | null, backupId?: string) => {
    setPreviewError(null);
    if (!file) return;
    setPreviewing(true);
    setPreviewFile(file);
    
    if (backupId) {
      setSelectedBackupId(backupId);
    }

    try {
      const buf = await file.arrayBuffer();
      
      // Verify checksum if this is from history
      if (backupId) {
        const history = await loadBackupHistory();
        const entry = history.find((h) => h.id === backupId);
        if (entry) {
          const checksum = await generateChecksum(buf);
          if (checksum !== entry.checksum) {
            throw new Error("Backup file integrity check failed - checksum mismatch");
          }
        }
      }

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
    
    if (!captchaVerified) {
      toast.error("Please verify CAPTCHA before restoring");
      return false;
    }

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

      // Update backup history status
      if (selectedBackupId) {
        const history = await loadBackupHistory();
        const updated = history.map((h) =>
          h.id === selectedBackupId
            ? { ...h, status: "restored" as const, restoredAt: new Date() }
            : h
        );
        await saveBackupHistory(updated);
      }

      toast.success("Restore completed");
      setPreviewOpen(false);
      setPreviewStats(null);
      setPreviewFile(null);
      setSelectedBackupId(null);
      setCaptchaVerified(false);
      return true;
    } catch (e: any) {
      toast.error(e?.message || "Restore failed");
      return false;
    } finally {
      setRestoreInProgress(false);
    }
  };

  const handleSelectiveRestore = useCallback(async (backup: BackupHistory, selectedTables: string[]) => {
    if (backup.status === "corrupted") {
      toast.error("Cannot restore corrupted backup");
      return;
    }
    
    setRestoreInProgress(true);
    try {
      // Get the backup file
      const res = await fetch(`/api/admin/backup-file?name=${encodeURIComponent(backup.filePath)}`);
      if (!res.ok) {
        throw new Error("Failed to fetch backup file");
      }
      const buf = await res.arrayBuffer();

      const doing = toast.loading(`Restoring ${selectedTables.length} table(s)…`);
      const restoreRes = await fetch("/api/admin/backup?selective=1", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Backup-Data": btoa(String.fromCharCode(...new Uint8Array(buf)))
        },
        body: JSON.stringify({ tables: selectedTables }),
      });
      const data = await restoreRes.json().catch(() => ({}));
      toast.dismiss(doing);
      if (!restoreRes.ok) throw new Error(data?.error || "Selective restore failed");

      // Update backup history status
      const history = await loadBackupHistory();
      const updated = history.map((h) =>
        h.id === backup.id
          ? { ...h, status: "restored" as const, restoredAt: new Date() }
          : h
      );
      await saveBackupHistory(updated);

      toast.success(`Restored ${selectedTables.length} table(s)`);
    } catch (e: any) {
      toast.error(e?.message || "Selective restore failed");
    } finally {
      setRestoreInProgress(false);
    }
  }, [loadBackupHistory, saveBackupHistory]);

  const handleSelectiveRestoreConfirmed = useCallback(async () => {
    // Placeholder implementation
    console.log("Confirming selective restore");
  }, []);

  const deleteBackupFromHistory = useCallback(async (backupId: string) => {
    try {
      const history = await loadBackupHistory();
      const filtered = history.filter((h) => h.id !== backupId);
      await saveBackupHistory(filtered);
      toast.success("Backup removed from history");
      return true;
    } catch (e: any) {
      toast.error("Failed to delete backup history entry");
      return false;
    }
  }, [loadBackupHistory, saveBackupHistory]);

  const markBackupCorrupted = useCallback(async (backupId: string) => {
    try {
      const history = await loadBackupHistory();
      const updated = history.map((h) =>
        h.id === backupId ? { ...h, status: "corrupted" as const } : h
      );
      await saveBackupHistory(updated);
      return true;
    } catch (e) {
      console.error("Failed to mark backup as corrupted:", e);
      return false;
    }
  }, [loadBackupHistory, saveBackupHistory]);

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
    handleSelectiveRestore,
    handleSelectiveRestoreConfirmed,
    selectiveRestoreOpen,
    setSelectiveRestoreOpen,
    selectiveRestoreBackup,
    selectiveRestoreStats,
    selectedTables,
    setSelectedTables,
    backupHistory,
    loadBackupHistory,
    saveBackupHistory,
    selectedBackupId,
    setSelectedBackupId,
    deleteBackupFromHistory,
    markBackupCorrupted,
    captchaVerified,
    setCaptchaVerified,
    generateChecksum,
  };
}
