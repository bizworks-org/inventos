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

export default function DatabaseTab(props: {
  techTabsDisabled: boolean;
  dbForm: {
    host: string;
    port: string;
    user: string;
    password: string;
    database: string;
  };
  setDbForm: (fn: (v: any) => any) => void;
  dbMsg: string | null;
  dbTestBusy: boolean;
  dbBusy: boolean;
  onTestConnection: () => Promise<void>;
  onSaveConfig: () => Promise<void>;
  onInitialize: () => Promise<void>;
}) {
  const {
    techTabsDisabled,
    dbForm,
    setDbForm,
    dbMsg,
    dbTestBusy,
    dbBusy,
    onTestConnection,
    onSaveConfig,
    onInitialize,
  } = props;
  if (techTabsDisabled) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Connection</CardTitle>
        <CardDescription>
          Provide MySQL connection details to initialize required tables.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="mb-1 block">Host</Label>
            <Input
              value={dbForm.host}
              onChange={(e) =>
                setDbForm((v: any) => ({ ...v, host: e.target.value }))
              }
              placeholder="localhost"
            />
          </div>
          <div>
            <Label className="mb-1 block">Port</Label>
            <Input
              value={dbForm.port}
              onChange={(e) =>
                setDbForm((v: any) => ({ ...v, port: e.target.value }))
              }
              placeholder="3306"
            />
          </div>
          <div>
            <Label className="mb-1 block">User</Label>
            <Input
              value={dbForm.user}
              onChange={(e) =>
                setDbForm((v: any) => ({ ...v, user: e.target.value }))
              }
              placeholder="root"
            />
          </div>
          <div>
            <Label className="mb-1 block">Password</Label>
            <Input
              type="password"
              value={dbForm.password}
              onChange={(e) =>
                setDbForm((v: any) => ({ ...v, password: e.target.value }))
              }
            />
          </div>
          <div className="md:col-span-2">
            <Label className="mb-1 block">Database</Label>
            <Input
              value={dbForm.database}
              onChange={(e) =>
                setDbForm((v: any) => ({ ...v, database: e.target.value }))
              }
              placeholder="inventos"
            />
          </div>
        </div>
        {dbMsg && (
          <p
            className={`text-sm ${
              dbMsg.startsWith("OK") ? "text-green-600" : "text-red-600"
            }`}
          >
            {dbMsg}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between gap-3 flex-wrap border-t">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-[#6366f1] text-[#6366f1] hover:bg-indigo-50 dark:hover:bg-indigo-950"
            disabled={dbTestBusy}
            onClick={onTestConnection}
          >
            {dbTestBusy ? "Testing…" : "Test Connection"}
          </Button>
          <Button
            type="button"
            className="bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] text-white hover:shadow-lg hover:shadow-[#06b6d4]/20"
            onClick={onSaveConfig}
          >
            Save Config Securely
          </Button>
        </div>
        <Button
          type="button"
          disabled={dbBusy}
          className="bg-gradient-to-r from-[#10b981] to-[#22c55e] text-white hover:shadow-lg hover:shadow-[#22c55e]/20"
          onClick={onInitialize}
        >
          {dbBusy ? "Initializing…" : "Initialize Database"}
        </Button>
      </CardFooter>
    </Card>
  );
}
