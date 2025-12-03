import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "../../../ui/card";
import { Label } from "../../../ui/label";
import { Input } from "../../../ui/input";
import { Button } from "../../../ui/button";

export default function RestWebhookCard(props: Readonly<{
  events: any;
  setEvents: (fn: any) => void;
  headersError: string | null;
  setHeadersError: (s: string | null) => void;
  saveRestSettings: () => void;
}>) {
  const { events, setEvents, headersError, setHeadersError, saveRestSettings } =
    props;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>REST API Endpoint</CardTitle>
        </div>
        <CardDescription>
          Send events via HTTP POST/PUT to your endpoint.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="mb-1 block">Endpoint URL</Label>
          <Input
            placeholder="https://example.com/webhook"
            value={events.webhookUrl}
            onChange={(e) =>
              setEvents((v: any) => ({ ...v, webhookUrl: e.target.value }))
            }
          />
        </div>
        <div>
          <Label className="mb-1 block">HTTP Method</Label>
          <select
            className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]"
            value={events.webhookMethod}
            onChange={(e) =>
              setEvents((v: any) => ({
                ...v,
                webhookMethod: e.target.value as "POST" | "PUT",
              }))
            }
          >
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
          </select>
        </div>
        <div>
          <Label className="mb-1 block">Headers (JSON)</Label>
          <textarea
            rows={4}
            className={`w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border ${
              headersError ? "border-red-400" : "border-[rgba(0,0,0,0.08)]"
            } focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20`}
            value={events.webhookHeaders}
            onChange={(e) => {
              setEvents((v: any) => ({ ...v, webhookHeaders: e.target.value }));
              setHeadersError(null);
            }}
          />
          {headersError && (
            <p className="text-sm text-red-500 mt-1">{headersError}</p>
          )}
        </div>
        <div>
          <Label className="mb-1 block">Secret Token (optional)</Label>
          <Input
            type="password"
            placeholder="Used to sign requests (e.g., HMAC)"
            value={events.webhookSecret}
            onChange={(e) =>
              setEvents((v: any) => ({ ...v, webhookSecret: e.target.value }))
            }
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t">
        <Button
          type="button"
          className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6366f1]/30"
          onClick={saveRestSettings}
        >
          Save REST Settings
        </Button>
      </CardFooter>
    </Card>
  );
}
