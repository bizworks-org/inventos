import { Button } from "@/components/ui/button";

interface SettingsHeaderProps {
  view: "general" | "technical";
  saving: boolean;
  isAdmin: boolean;
  backupInProgress: boolean;
  previewing: boolean;
  restoreInProgress: boolean;
  onSave: () => void;
  onBackup: () => void;
  onRestore: (file: File | null) => void;
}

export function SettingsHeader({
  view,
  saving,
  isAdmin,
  backupInProgress,
  previewing,
  restoreInProgress,
  onSave,
  onBackup,
  onRestore,
}: SettingsHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8 dark:bg-black">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {view === "technical"
            ? "Manage integrations, events, and mail server"
            : "Manage your profile, preferences, and notifications"}
        </p>
      </div>

      {view === "general" && (
        <Button
          onClick={onSave}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6366f1]/30 transition-all duration-200"
        >
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      )}

      {view === "technical" && isAdmin && (
        <div className="flex items-center gap-3">
          <input
            id="restore-file"
            type="file"
            accept=".bin"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files ? e.target.files[0] : null;
              onRestore(f);
              try {
                (e.target as HTMLInputElement).value = "";
              } catch {}
            }}
          />
          <Button
            onClick={onBackup}
            variant="outline"
            className="px-3 py-2 rounded-lg border-[#6366f1] text-[#6366f1] hover:bg-[#eef2ff]"
          >
            {backupInProgress ? "Backing up…" : "Backup"}
          </Button>
          <label htmlFor="restore-file">
            <Button
              type="button"
              className="px-3 py-2 rounded-lg border text-gray-700 dark:text-gray-200"
            >
              {previewing || restoreInProgress ? "Processing…" : "Restore"}
            </Button>
          </label>
        </div>
      )}
    </div>
  );
}
