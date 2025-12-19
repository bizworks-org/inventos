"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";
import { BackupHistory } from "../hooks/useBackupRestore";
import { Trash2, Download, Info, RotateCcw } from "lucide-react";

const ITEMS_PER_PAGE = 10;

interface BackupHistoryTableProps {
  backups: BackupHistory[];
  selectedBackupId: string | null;
  onSelectBackup: (id: string | null) => void;
  onRestore: (backup: BackupHistory) => Promise<void>;
  onSelectiveRestore: (backup: BackupHistory, selectedTables: string[]) => Promise<void>;
  onDelete: (id: string) => Promise<boolean>;
  onDownload: (backup: BackupHistory) => void;
  loading?: boolean;
  userRole?: string;
}

const getStatusBadgeClass = (status: BackupHistory["status"]) => {
  switch (status) {
    case "active":
      return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200";
    case "restored":
      return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200";
    case "corrupted":
      return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200";
    case "pending":
      return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200";
    default:
      return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200";
  }
};

const getStatusLabel = (status: BackupHistory["status"]) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export function BackupHistoryTable({
  backups,
  selectedBackupId,
  onSelectBackup,
  onRestore,
  onSelectiveRestore,
  onDelete,
  onDownload,
  loading = false,
  userRole,
}: Readonly<BackupHistoryTableProps>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilterFrom, setDateFilterFrom] = useState("");
  const [dateFilterTo, setDateFilterTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [restoreConfirm, setRestoreConfirm] = useState<BackupHistory | null>(
    null
  );
  const [selectedBackupNames, setSelectedBackupNames] = useState<string[]>([]);
  const [selectiveRestoreModalOpen, setSelectiveRestoreModalOpen] = useState(false);
  const [selectiveRestoreBackup, setSelectiveRestoreBackup] = useState<BackupHistory | null>(null);
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);

  // Filter backups based on search and filters
  const filteredBackups = useMemo(() => {
    let filtered = [...backups];

    // Search by name
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter((b) =>
        b.backupName.toLowerCase().includes(lower)
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    // Filter by date range
    if (dateFilterFrom) {
      const fromDate = new Date(dateFilterFrom).getTime();
      filtered = filtered.filter((b) => b.createdAt && new Date(b.createdAt).getTime() >= fromDate);
    }
    if (dateFilterTo) {
      const toDate = new Date(dateFilterTo).getTime();
      filtered = filtered.filter((b) => b.createdAt && new Date(b.createdAt).getTime() <= toDate);
    }

    return filtered;
  }, [backups, searchTerm, statusFilter, dateFilterFrom, dateFilterTo]);

  // Pagination
  const totalPages = Math.ceil(filteredBackups.length / ITEMS_PER_PAGE);
  const paginatedBackups = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBackups.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBackups, currentPage]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilterFrom, dateFilterTo]);

  const handleDelete = async (id: string) => {
    const success = await onDelete(id);
    if (success) {
      setDeleteConfirm(null);
      toast.success("Backup removed from history");
    }
  };

  const handleSelectiveRestoreClick = async (backup: BackupHistory) => {
    if (backup.status === "corrupted") {
      toast.error("Cannot restore corrupted backup");
      return;
    }

    try {
      // Fetch the backup file
      const res = await fetch(`/api/admin/backup-file?name=${encodeURIComponent(backup.filePath)}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Backup file not found. The backup may not have been saved locally or the file was moved/deleted. Check the Data folder for backup files.");
        } else if (res.status === 403) {
          throw new Error("Access denied. You don't have permission to access this backup file.");
        } else if (res.status === 500) {
          throw new Error("Server error. Please try again later or contact support.");
        } else {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData?.error || `Failed to fetch backup file (${res.status})`);
        }
      }
      const buf = await res.arrayBuffer();
      
      // Verify checksum
      const checksum = await generateChecksum(new Uint8Array(buf));
      if (checksum !== backup.checksum) {
        throw new Error("Backup file integrity check failed");
      }

      // Get table names by sending to preview endpoint
      const previewRes = await fetch("/api/admin/backup?preview=1", {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: buf,
      });
      if (!previewRes.ok) {
        const errorData = await previewRes.json().catch(() => ({}));
        throw new Error(errorData?.error || "Failed to analyze backup contents. The file may be corrupted.");
      }
      const previewData = await previewRes.json().catch(() => ({}));

      const tables = Object.keys(previewData.tables || {});
      setAvailableTables(tables);
      setSelectedTables(tables); // Select all by default
      setSelectiveRestoreBackup(backup);
      setSelectiveRestoreModalOpen(true);
    } catch (e: any) {
      console.error("Failed to load backup for selective restore:", e);
      toast.error(e?.message || "Unable to load backup file. Please check if the file exists and try again.");
    }
  };

  // Generate checksum for file integrity verification
  const generateChecksum = async (buffer: Uint8Array): Promise<string> => {
    try {
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } catch (e) {
      console.error("Checksum generation failed:", e);
      return "";
    }
  };

  if (!backups || backups.length === 0) {
    return (
      <Card className="mt-6 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
          <CardDescription>
            No backups available yet. Create your first backup using the Backup
            button above.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mt-6 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle>Backup History</CardTitle>
        <CardDescription>
          Manage and restore from your backup history. {filteredBackups.length}{" "}
          backup(s) available.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search by Name
            </label>
            <Input
              id="search-input"
              placeholder="Search backup..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
            />
          </div>

          <div>
            <label htmlFor="from-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              From Date
            </label>
            <Input
              id="from-date"
              type="date"
              value={dateFilterFrom}
              onChange={(e) => setDateFilterFrom(e.target.value)}
              className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
            />
          </div>

          <div>
            <label htmlFor="to-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              To Date
            </label>
            <Input
              id="to-date"
              type="date"
              value={dateFilterTo}
              onChange={(e) => setDateFilterTo(e.target.value)}
              className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
            />
          </div>

          <div>
            <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status-select" className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="restored">Restored</SelectItem>
                <SelectItem value="corrupted">Corrupted</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {userRole === "superadmin" && (
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">
                    Restore
                  </th>
                )}
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">
                  Date of Backup
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">
                  Backup Name
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">
                  Size
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedBackups.map((backup) => (
                <tr
                  key={backup.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  {userRole === "superadmin" && (
                    <td className="px-4 py-3">
                      <Checkbox
                        className="border-gray-300 dark:border-gray-600"
                        checked={selectedBackupNames.includes(backup.backupName)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedBackupNames([...selectedBackupNames, backup.backupName]);
                          } else {
                            setSelectedBackupNames(selectedBackupNames.filter(name => name !== backup.backupName));
                          }
                        }}
                        disabled={backup.status === "corrupted"}
                        aria-label={`Select ${backup.backupName}`}
                      />
                    </td>
                  )}
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <span>
                        {backup.createdAt
                          ? new Date(backup.createdAt).toLocaleString()
                          : "—"}
                      </span>
                      {backup.isEncrypted && (
                        <span
                          title="This backup is encrypted"
                          className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded"
                        >
                          🔒
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 max-w-xs truncate">
                    <span title={backup.backupName}>{backup.backupName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                        backup.status
                      )}`}
                    >
                      {getStatusLabel(backup.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {backup.fileSize
                      ? `${(backup.fileSize / 1024 / 1024).toFixed(2)} MB`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectiveRestoreClick(backup)}
                        disabled={backup.status === "corrupted"}
                        title="Selective restore"
                        className="h-8 w-8 p-0 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownload(backup)}
                        title="Download backup"
                        className="h-8 w-8 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(backup.id)}
                        disabled={backup.status === "corrupted"}
                        title="Delete from history"
                        className="h-8 w-8 p-0 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {backup.status === "corrupted" && (
                        <div
                          title="This backup is corrupted and cannot be used"
                          className="h-8 w-8 flex items-center justify-center"
                        >
                          <Info className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages} ({filteredBackups.length} total
              backups)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="border-gray-200 dark:border-gray-700"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="border-gray-200 dark:border-gray-700"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Restore Selected Button */}
        {selectedBackupNames.length > 0 && (
          <div className="pt-4">
            <Button
              onClick={() => {
                selectedBackupNames.forEach(name => {
                  const backup = backups.find(b => b.backupName === name);
                  if (backup) onRestore(backup);
                });
                setSelectedBackupNames([]);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Restore Selected ({selectedBackupNames.length})
            </Button>
          </div>
        )}

        {/* Selection info */}
        {selectedBackupId && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-200">
            <Info className="h-4 w-4 flex-shrink-0" />
            <span>
              {paginatedBackups.find((b) => b.id === selectedBackupId)
                ?.backupName || "Selected backup"}{" "}
              is selected for restoration. Use the Restore button to proceed.
            </span>
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirm !== null} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Backup from History</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this backup from history? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreConfirm !== null} onOpenChange={(open) => !open && setRestoreConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Restore</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore from{" "}
              <strong>{restoreConfirm?.backupName}</strong>? This will overwrite
              the current database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => restoreConfirm && handleRestore(restoreConfirm)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Selective Restore Modal */}
      <Dialog open={selectiveRestoreModalOpen} onOpenChange={setSelectiveRestoreModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Selective Restore</DialogTitle>
            <DialogDescription>
              Select the tables you want to restore from <strong>{selectiveRestoreBackup?.backupName}</strong>.
              Only the selected data will be restored.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Available Tables ({availableTables.length})</h4>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTables(availableTables)}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTables([])}
                >
                  Select None
                </Button>
              </div>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-96 overflow-y-auto">
              <div className="p-4 space-y-2">
                {availableTables.map((table) => (
                  <div key={table} className="flex items-center space-x-2">
                    <Checkbox
                      id={`table-${table}`}
                      checked={selectedTables.includes(table)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTables([...selectedTables, table]);
                        } else {
                          setSelectedTables(selectedTables.filter(t => t !== table));
                        }
                      }}
                    />
                    <label
                      htmlFor={`table-${table}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {table}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedTables.length} of {availableTables.length} tables selected
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectiveRestoreModalOpen(false);
                setSelectiveRestoreBackup(null);
                setAvailableTables([]);
                setSelectedTables([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!selectiveRestoreBackup || selectedTables.length === 0) return;
                
                try {
                  // Call the onSelectiveRestore prop with the backup and selected tables
                  await onSelectiveRestore(selectiveRestoreBackup, selectedTables);
                  setSelectiveRestoreModalOpen(false);
                  setSelectiveRestoreBackup(null);
                  setAvailableTables([]);
                  setSelectedTables([]);
                  toast.success(`Restored ${selectedTables.length} table(s)`);
                } catch (e: any) {
                  toast.error(e?.message || "Selective restore failed");
                }
              }}
              disabled={selectedTables.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Restore Selected ({selectedTables.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
