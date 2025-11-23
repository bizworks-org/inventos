"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface Preferences {
  density: "ultra-compact" | "compact" | "comfortable";
  dateFormat: "YYYY-MM-DD" | "MM/DD/YYYY" | "DD/MM/YYYY";
  currency: string;
  language: string;
}

interface Props {
  prefs: Preferences;
  setPrefs: React.Dispatch<React.SetStateAction<Preferences>>;
  persistPrefs: (next: Partial<Preferences>) => void;
  mode: "light" | "dark" | "system";
  setMode: (m: "light" | "dark" | "system") => void;
  systemTheme?: string | undefined;
}

export default function PreferencesTab({
  prefs,
  setPrefs,
  persistPrefs,
  mode,
  setMode,
  systemTheme,
}: Props) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Table Density
          </label>
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => {
                setPrefs((p) => ({ ...p, density: "ultra-compact" }));
                persistPrefs({ density: "ultra-compact" });
              }}
              className={`px-3 py-2 rounded-lg border ${
                prefs.density === "ultra-compact"
                  ? "bg-[#e0e7ff] border-[#6366f1] text-gray-900 dark:text-gray-100"
                  : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
              }`}
            >
              Ultra-compact
            </Button>
            <Button
              type="button"
              onClick={() => {
                setPrefs((p) => ({ ...p, density: "compact" }));
                persistPrefs({ density: "compact" });
              }}
              className={`px-3 py-2 rounded-lg border ${
                prefs.density === "compact"
                  ? "bg-[#e0e7ff] border-[#6366f1] text-gray-900 dark:text-gray-100"
                  : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
              }`}
            >
              Compact
            </Button>
            <Button
              type="button"
              onClick={() => {
                setPrefs((p) => ({ ...p, density: "comfortable" }));
                persistPrefs({ density: "comfortable" });
              }}
              className={`px-3 py-2 rounded-lg border ${
                prefs.density === "comfortable"
                  ? "bg-[#e0e7ff] border-[#6366f1] text-gray-900 dark:text-gray-100"
                  : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
              }`}
            >
              Comfortable
            </Button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 mt-4">
              Currency: INR
            </label>
            <select
              className="w-full hidden px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
              value={"INR"}
              onChange={() => {
                /* disabled */
              }}
              disabled
            >
              <option value="INR">INR</option>
            </select>
            <p className="text-xs hidden text-gray-500 dark:text-gray-400 mt-1">
              Used for cost and value displays.
            </p>
          </div>
          {/* Language selector intentionally hidden */}
        </div>
        {/* Date Format selector intentionally removed */}
      </div>

      <div className="space-y-4 hidden">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Theme
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Choose how AssetFlow should look on this device.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 hidden gap-6">
            <Button
              onClick={() => setMode("light")}
              className={`p-6 rounded-xl border text-left transition ${
                mode === "light"
                  ? "text-gray-600 bg-[#e0e7ff] border-[#6366f1]"
                  : "text-gray-400 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              }`}
            >
              <p className="font-medium text-gray-900 dark:text-gray-100">
                Light
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Bright appearance
              </p>
            </Button>
            <Button
              onClick={() => setMode("dark")}
              className={`p-6 rounded-xl border text-left transition ${
                mode === "dark"
                  ? "text-gray-600 bg-[#e0e7ff] border-[#6366f1]"
                  : "text-gray-400 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              }`}
            >
              <p className="font-medium text-gray-900 dark:text-gray-100">
                Dark
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Reduced eye strain
              </p>
            </Button>
            <Button
              onClick={() => setMode("system")}
              className={`p-6 rounded-xl border text-left transition ${
                mode === "system"
                  ? "text-gray-600 bg-[#e0e7ff] border-[#6366f1]"
                  : "text-gray-400 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              }`}
            >
              <p className="font-medium text-gray-600 dark:text-gray-100">
                System
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Follow OS setting
              </p>
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            Current theme:{" "}
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {(mode === "system" ? systemTheme : mode) || "system"}
            </span>
          </p>
        </div>
      </div>
    </>
  );
}
