import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Check } from 'lucide-react';
import IntegrationCard from './IntegrationCard';

type IntegrationId = 'ad' | 'aws' | 'azure' | 'mdm';

export default function IntegrationsTab(props: {
  techTabsDisabled: boolean;
  integrations: Array<{ id: IntegrationId; name: string; description: string; icon: any }>;
  connected: Record<string, boolean>;
  dialogOpenFor: IntegrationId | null;
  setDialogOpenFor: (v: IntegrationId | null) => void;
  apiKey: string;
  setApiKey: (s: string) => void;
  endpointUrl: string;
  setEndpointUrl: (s: string) => void;
  handleConnect: (id: IntegrationId) => void;
  setConnected: (fn: (c: Record<string, boolean>) => Record<string, boolean>) => void;
}) {
  const { techTabsDisabled, integrations, connected, dialogOpenFor, setDialogOpenFor, apiKey, setApiKey, endpointUrl, setEndpointUrl, handleConnect, setConnected } = props;

  if (techTabsDisabled) return null; // parent will render DisabledCard when needed

  return (
    <Card>
      <CardHeader>
        <CardTitle>Automated Asset Discovery</CardTitle>
        <CardDescription>Connect to external systems to discover and track assets automatically.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {integrations.map((it) => (
            <IntegrationCard
              key={it.id}
              integration={it}
              isConnected={!!connected[it.id]}
              onConnect={(id, apiKey, endpointUrl) => {
                // call the parent handler which will update connected state and perform any further work
                // the original handleConnect only toggled without params; preserve that behavior
                // If you want to post credentials to server, update handleConnect in SettingsPage.
                // For now, simply mark connected and ignore credentials in UI mock.
                setConnected((c) => ({ ...c, [id]: true }));
              }}
              onDisconnect={(id) => setConnected((c) => ({ ...c, [id]: false }))}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
