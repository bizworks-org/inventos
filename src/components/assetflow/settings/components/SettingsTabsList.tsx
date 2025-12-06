import {
  User,
  SlidersHorizontal,
  Bell,
  Plug,
  Rss,
  Database,
  Mail,
} from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SettingsTabsListProps {
  view: "general" | "technical";
  activeTab: string;
  techTabsDisabled: boolean;
  canEditMail: boolean;
  isAdmin?: boolean;
}

export function SettingsTabsList({
  view,
  activeTab,
  techTabsDisabled,
  canEditMail,
  isAdmin,
}: Readonly<SettingsTabsListProps>) {
  const getTabClasses = (isActive: boolean) =>
    `${
      isActive
        ? "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-md text-gray-900 dark:text-gray-100 font-semibold"
        : "text-gray-700 dark:text-gray-300"
    } flex items-center gap-2 px-3 py-2 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-800`;

  return (
    <TabsList className="flex w-full flex-wrap gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2">
      {view === "general" && (
        <>
          <TabsTrigger
            value="profile"
            className={getTabClasses(activeTab === "profile")}
          >
            <User className="h-4 w-4 text-[#0ea5e9]" /> Profile
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className={getTabClasses(activeTab === "preferences")}
          >
            <SlidersHorizontal className="h-4 w-4 text-[#22c55e]" /> Preferences
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className={getTabClasses(activeTab === "notifications")}
          >
            <Bell className="h-4 w-4 text-[#f59e0b]" /> Notifications
          </TabsTrigger>
          {isAdmin ? (
            <TabsTrigger
              value="system"
              className={getTabClasses(activeTab === "system")}
            >
              <Database className="h-4 w-4 text-[#64748b]" /> System
            </TabsTrigger>
          ) : null}
        </>
      )}

      {view === "technical" && (
        <>
          {!techTabsDisabled && (
            <>
              <TabsTrigger
                value="integrations"
                className={getTabClasses(activeTab === "integrations")}
              >
                <Plug className="h-4 w-4 text-[#8b5cf6]" /> Integrations
              </TabsTrigger>
              <TabsTrigger
                value="events"
                className={getTabClasses(activeTab === "events")}
              >
                <Rss className="h-4 w-4 text-[#ec4899]" /> Events
              </TabsTrigger>
              <TabsTrigger
                value="database"
                className={getTabClasses(activeTab === "database")}
              >
                <Database className="h-4 w-4 text-[#14b8a6]" /> Database
              </TabsTrigger>
            </>
          )}
          {canEditMail && (
            <TabsTrigger
              value="mail"
              className={getTabClasses(activeTab === "mail")}
            >
              <Mail className="h-4 w-4 text-[#f97316]" /> Mail
            </TabsTrigger>
          )}
        </>
      )}
    </TabsList>
  );
}
