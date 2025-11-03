import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../ui/card';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Switch } from '../../ui/switch';
import RestWebhookCard from './RestWebhookCard';
import KafkaCard from './KafkaCard';

export default function EventsTab(props: {
  techTabsDisabled: boolean;
  events: any;
  setEvents: (fn: any) => void;
  headersError: string | null;
  setHeadersError: (s: string | null) => void;
  saveRestSettings: () => void;
  saveKafkaSettings: () => void;
}) {
  const { techTabsDisabled, events, setEvents, headersError, setHeadersError, saveRestSettings, saveKafkaSettings } = props;
  if (techTabsDisabled) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 border rounded-xl bg-[#f8f9ff] border-[rgba(0,0,0,0.08)]">
        <div>
          <p className="font-medium text-[#1a1d2e]">Enable Event Delivery</p>
          <p className="text-sm text-[#64748b]">Send AssetFlow events to your system</p>
        </div>
        <Switch checked={events.enabled} onCheckedChange={(v: any) => setEvents((e: any) => ({ ...e, enabled: !!v }))} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RestWebhookCard events={events} setEvents={setEvents} headersError={headersError} setHeadersError={setHeadersError} saveRestSettings={saveRestSettings} />
        <KafkaCard events={events} setEvents={setEvents} saveKafkaSettings={saveKafkaSettings} />
      </div>
    </div>
  );
}
