import React from "react";
import { Switch } from "../../../ui/switch";
import RestWebhookCard from "./RestWebhookCard";
import KafkaCard from "./KafkaCard";

export default function EventsTab(props: {
  techTabsDisabled: boolean;
  events: any;
  setEvents: (fn: any) => void;
  headersError: string | null;
  setHeadersError: (s: string | null) => void;
  saveRestSettings: () => void;
  saveKafkaSettings: () => void;
}) {
  const {
    techTabsDisabled,
    events,
    setEvents,
    headersError,
    setHeadersError,
    saveRestSettings,
    saveKafkaSettings,
  } = props;
  if (techTabsDisabled) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            Enable Event Delivery
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Send AssetFlow events to your system
          </p>
        </div>
        <Switch
          checked={events.enabled}
          onCheckedChange={(v: any) =>
            setEvents((e: any) => ({ ...e, enabled: !!v }))
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RestWebhookCard
          events={events}
          setEvents={setEvents}
          headersError={headersError}
          setHeadersError={setHeadersError}
          saveRestSettings={saveRestSettings}
        />
        <KafkaCard
          events={events}
          setEvents={setEvents}
          saveKafkaSettings={saveKafkaSettings}
        />
      </div>
    </div>
  );
}
