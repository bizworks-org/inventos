import { Button } from "@/components/ui/button";

interface SettingsHeaderProps {
  view: "general" | "technical";
  saving: boolean;
  isAdmin: boolean;
  onSave: () => void;
}

export function SettingsHeader({
  view,
  saving,
  isAdmin,
  onSave,
}: Readonly<SettingsHeaderProps>) {
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
    </div>
  );
}
