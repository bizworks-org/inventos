import { Button } from "@/components/ui/button";
import { Sun, Moon, Laptop } from "lucide-react";

interface AppearanceTabProps {
  mode: "light" | "dark" | "system";
  systemTheme?: string;
  onModeChange: (mode: "light" | "dark" | "system") => void;
}

export function AppearanceTab({
  mode,
  systemTheme,
  onModeChange,
}: Readonly<AppearanceTabProps>) {
  const getModeButtonClasses = (isActive: boolean) =>
    `p-6 rounded-xl border text-left transition ${
      isActive
        ? "bg-indigo-50 dark:bg-indigo-950 border-indigo-500"
        : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
    }`;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Button
          onClick={() => onModeChange("light")}
          className={getModeButtonClasses(mode === "light")}
        >
          <Sun className="h-5 w-5 mb-2 text-gray-900 dark:text-gray-100" />
          <p className="font-medium text-gray-900 dark:text-gray-100">Light</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Bright appearance
          </p>
        </Button>
        <Button
          onClick={() => onModeChange("dark")}
          className={getModeButtonClasses(mode === "dark")}
        >
          <Moon className="h-5 w-5 mb-2 text-gray-900 dark:text-gray-100" />
          <p className="font-medium text-gray-900 dark:text-gray-100">Dark</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Reduced eye strain
          </p>
        </Button>
        <Button
          onClick={() => onModeChange("system")}
          className={getModeButtonClasses(mode === "system")}
        >
          <Laptop className="h-5 w-5 mb-2 text-gray-900 dark:text-gray-100" />
          <p className="font-medium text-gray-900 dark:text-gray-100">System</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Follow OS setting
          </p>
        </Button>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
        Current theme:{" "}
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {(mode === "system" ? systemTheme : mode) || "system"}
        </span>
      </p>
    </>
  );
}
