"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../ui/card";
import { Checkbox } from "../../../ui/checkbox";
import { Button } from "../../../ui/button";

interface Props {
  notify: any;
  setNotify: any;
  handleSave: () => Promise<void> | void;
}

export default function NotificationsTab({
  notify,
  setNotify,
  handleSave,
}: Props) {
  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>Choose how you want to be notified.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Email
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notifications via email
                </p>
              </div>
              <Checkbox
                className="border-[#e2e8f0] bg-white dark:bg-gray-800"
                checked={!!notify.channels.email}
                onCheckedChange={(val: any) =>
                  setNotify((n: any) => ({
                    ...n,
                    channels: { ...n.channels, email: !!val },
                  }))
                }
                aria-label="Enable email notifications"
              />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  In-app
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Show notifications inside the app
                </p>
              </div>
              <Checkbox
                className="border-[#e2e8f0] bg-white dark:bg-gray-800"
                checked={!!notify.channels.push}
                onCheckedChange={(val: any) =>
                  setNotify((n: any) => ({
                    ...n,
                    channels: { ...n.channels, push: !!val },
                  }))
                }
                aria-label="Enable in-app notifications"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Event Notifications</CardTitle>
          <CardDescription>
            Choose which events trigger notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Assets */}
          <div className="border rounded-xl p-4">
            <p className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Assets
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                <span className="text-sm">New Asset Added</span>
                <Checkbox
                  className="border-[#e2e8f0] bg-black"
                  checked={!!notify.events.assets.newAsset}
                  onCheckedChange={(v: any) =>
                    setNotify((n: any) => ({
                      ...n,
                      events: {
                        ...n.events,
                        assets: { ...n.events.assets, newAsset: !!v },
                      },
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                <span className="text-sm">Asset Status Change</span>
                <Checkbox
                  className="border-[#e2e8f0] bg-black"
                  checked={!!notify.events.assets.statusChange}
                  onCheckedChange={(v: any) =>
                    setNotify((n: any) => ({
                      ...n,
                      events: {
                        ...n.events,
                        assets: { ...n.events.assets, statusChange: !!v },
                      },
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                <span className="text-sm">Maintenance Due</span>
                <Checkbox
                  className="border-[#e2e8f0] bg-black"
                  checked={!!notify.events.assets.maintenanceDue}
                  onCheckedChange={(v: any) =>
                    setNotify((n: any) => ({
                      ...n,
                      events: {
                        ...n.events,
                        assets: { ...n.events.assets, maintenanceDue: !!v },
                      },
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Licenses */}
          <div className="border rounded-xl p-4">
            <p className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Licenses
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                <span className="text-sm">License Expiring Soon</span>
                <Checkbox
                  className="border-[#e2e8f0] bg-white dark:bg-gray-800"
                  checked={!!notify.events.licenses.expiringSoon}
                  onCheckedChange={(v: any) =>
                    setNotify((n: any) => ({
                      ...n,
                      events: {
                        ...n.events,
                        licenses: { ...n.events.licenses, expiringSoon: !!v },
                      },
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                <span className="text-sm">License Expired</span>
                <Checkbox
                  className="border-[#e2e8f0] bg-white dark:bg-gray-800"
                  checked={!!notify.events.licenses.expired}
                  onCheckedChange={(v: any) =>
                    setNotify((n: any) => ({
                      ...n,
                      events: {
                        ...n.events,
                        licenses: { ...n.events.licenses, expired: !!v },
                      },
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                <span className="text-sm">Compliance Status Change</span>
                <Checkbox
                  className="border-[#e2e8f0] bg-white dark:bg-gray-800"
                  checked={!!notify.events.licenses.complianceChange}
                  onCheckedChange={(v: any) =>
                    setNotify((n: any) => ({
                      ...n,
                      events: {
                        ...n.events,
                        licenses: {
                          ...n.events.licenses,
                          complianceChange: !!v,
                        },
                      },
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Vendors */}
          <div className="border rounded-xl p-4 mb-4 ">
            <p className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Vendors
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                <span className="text-sm">Contract Nears Renewal</span>
                <Checkbox
                  className="border-[#e2e8f0] bg-white dark:bg-gray-800"
                  checked={!!notify.events.vendors.contractRenewal}
                  onCheckedChange={(v: any) =>
                    setNotify((n: any) => ({
                      ...n,
                      events: {
                        ...n.events,
                        vendors: { ...n.events.vendors, contractRenewal: !!v },
                      },
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                <span className="text-sm">New Vendor Approved</span>
                <Checkbox
                  className="border-[#e2e8f0] bg-white dark:bg-gray-800"
                  checked={!!notify.events.vendors.newVendorApproved}
                  onCheckedChange={(v: any) =>
                    setNotify((n: any) => ({
                      ...n,
                      events: {
                        ...n.events,
                        vendors: {
                          ...n.events.vendors,
                          newVendorApproved: !!v,
                        },
                      },
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6366f1]/30"
        >
          Save Preferences
        </Button>
      </div>
    </form>
  );
}
