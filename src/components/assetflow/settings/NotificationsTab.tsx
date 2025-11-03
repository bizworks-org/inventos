"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Switch } from '../../ui/switch';
import { Button } from '../../ui/button';

interface Props {
  notify: any;
  setNotify: any;
  handleSave: () => Promise<void> | void;
}

export default function NotificationsTab({ notify, setNotify, handleSave }: Props) {
  return (
    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>Choose how you want to be notified.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 border rounded-xl bg-[#f8f9ff] border-[rgba(0,0,0,0.08)]">
              <div>
                <p className="font-medium text-[#1a1d2e]">Email</p>
                <p className="text-sm text-[#64748b]">Get notifications via email</p>
              </div>
              <Switch
                checked={notify.channels.email}
                onCheckedChange={(val: any) => setNotify((n: any) => ({ ...n, channels: { ...n.channels, email: !!val } }))}
                aria-label="Toggle email notifications"
              />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-xl bg-[#f8f9ff] border-[rgba(0,0,0,0.08)]">
              <div>
                <p className="font-medium text-[#1a1d2e]">In-app</p>
                <p className="text-sm text-[#64748b]">Show notifications inside the app</p>
              </div>
              <Switch
                checked={!!notify.channels.push}
                onCheckedChange={(val: any) => setNotify((n: any) => ({ ...n, channels: { ...n.channels, push: !!val } }))}
                aria-label="Toggle in-app notifications"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Event Notifications</CardTitle>
          <CardDescription>Choose which events trigger notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Assets */}
          <div className="border rounded-xl p-4">
            <p className="font-semibold text-[#1a1d2e] mb-3">Assets</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#f8f9ff]">
                <span className="text-sm">New Asset Added</span>
                <Switch checked={notify.events.assets.newAsset} onCheckedChange={(v: any) => setNotify((n: any) => ({ ...n, events: { ...n.events, assets: { ...n.events.assets, newAsset: !!v } } }))} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#f8f9ff]">
                <span className="text-sm">Asset Status Change</span>
                <Switch checked={notify.events.assets.statusChange} onCheckedChange={(v: any) => setNotify((n: any) => ({ ...n, events: { ...n.events, assets: { ...n.events.assets, statusChange: !!v } } }))} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#f8f9ff]">
                <span className="text-sm">Maintenance Due</span>
                <Switch checked={notify.events.assets.maintenanceDue} onCheckedChange={(v: any) => setNotify((n: any) => ({ ...n, events: { ...n.events, assets: { ...n.events.assets, maintenanceDue: !!v } } }))} />
              </div>
            </div>
          </div>

          {/* Licenses */}
          <div className="border rounded-xl p-4">
            <p className="font-semibold text-[#1a1d2e] mb-3">Licenses</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#f8f9ff]">
                <span className="text-sm">License Expiring Soon</span>
                <Switch checked={notify.events.licenses.expiringSoon} onCheckedChange={(v: any) => setNotify((n: any) => ({ ...n, events: { ...n.events, licenses: { ...n.events.licenses, expiringSoon: !!v } } }))} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#f8f9ff]">
                <span className="text-sm">License Expired</span>
                <Switch checked={notify.events.licenses.expired} onCheckedChange={(v: any) => setNotify((n: any) => ({ ...n, events: { ...n.events, licenses: { ...n.events.licenses, expired: !!v } } }))} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#f8f9ff]">
                <span className="text-sm">Compliance Status Change</span>
                <Switch checked={notify.events.licenses.complianceChange} onCheckedChange={(v: any) => setNotify((n: any) => ({ ...n, events: { ...n.events, licenses: { ...n.events.licenses, complianceChange: !!v } } }))} />
              </div>
            </div>
          </div>

          {/* Vendors */}
          <div className="border rounded-xl p-4">
            <p className="font-semibold text-[#1a1d2e] mb-3">Vendors</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#f8f9ff]">
                <span className="text-sm">Contract Nears Renewal</span>
                <Switch checked={notify.events.vendors.contractRenewal} onCheckedChange={(v: any) => setNotify((n: any) => ({ ...n, events: { ...n.events, vendors: { ...n.events.vendors, contractRenewal: !!v } } }))} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#f8f9ff]">
                <span className="text-sm">New Vendor Approved</span>
                <Switch checked={notify.events.vendors.newVendorApproved} onCheckedChange={(v: any) => setNotify((n: any) => ({ ...n, events: { ...n.events, vendors: { ...n.events.vendors, newVendorApproved: !!v } } }))} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6366f1]/30">Save Preferences</Button>
      </div>
    </form>
  );
}
