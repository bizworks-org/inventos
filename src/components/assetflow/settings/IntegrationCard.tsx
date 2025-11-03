import React, { useState } from 'react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../../ui/dialog';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Check } from 'lucide-react';

type Integration = { id: string; name: string; description: string; icon: any };

export default function IntegrationCard(props: {
  integration: Integration;
  isConnected: boolean;
  onConnect: (id: string, apiKey: string, endpointUrl: string) => void;
  onDisconnect: (id: string) => void;
}) {
  const { integration, isConnected, onConnect, onDisconnect } = props;
  const Icon = integration.icon;
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [endpointUrl, setEndpointUrl] = useState('');

  return (
    <div className="flex items-center justify-between p-4 border rounded-xl bg-[#f8f9ff] border-[rgba(0,0,0,0.08)]">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-white border border-[rgba(0,0,0,0.06)] flex items-center justify-center">
          <Icon className="h-5 w-5 text-[#6366f1]" />
        </div>
        <div>
          <p className="font-medium text-[#1a1d2e] flex items-center gap-2">
            {integration.name}
            {isConnected && (
              <Badge variant="secondary" className="bg-[#e0f2f1] text-[#065f46] border-[#10b981]/20"><Check className="h-3 w-3" /> Connected</Badge>
            )}
          </p>
          <p className="text-sm text-[#64748b]">{integration.description}</p>
        </div>
      </div>

      {!isConnected ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6366f1]/30">Connect</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect {integration.name}</DialogTitle>
              <DialogDescription>Enter credentials to authorize this integration.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`apiKey-${integration.id}`}>API Key</Label>
                <Input id={`apiKey-${integration.id}`} type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`endpoint-${integration.id}`}>Endpoint URL (optional)</Label>
                <Input id={`endpoint-${integration.id}`} value={endpointUrl} onChange={(e) => setEndpointUrl(e.target.value)} placeholder="https://api.example.com" />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" className="border-[#6366f1] text-[#6366f1] hover:bg-[#eef2ff]" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="button" className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6366f1]/30" onClick={() => { onConnect(integration.id, apiKey, endpointUrl); setOpen(false); setApiKey(''); setEndpointUrl(''); }}>Connect</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <Button variant="outline" className="border-[#ef4444] text-[#ef4444] hover:bg-[#fee2e2]" onClick={() => onDisconnect(integration.id)}>Disconnect</Button>
      )}
    </div>
  );
}
