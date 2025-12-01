import { useState } from "react";

export function useDatabaseManagement() {
  const [dbForm, setDbForm] = useState({
    host: "localhost",
    port: "3306",
    user: "root",
    password: "",
    database: "inventos",
  });
  const [dbBusy, setDbBusy] = useState(false);
  const [dbMsg, setDbMsg] = useState<string | null>(null);
  const [dbTestBusy, setDbTestBusy] = useState(false);

  const onTestConnection = async () => {
    setDbTestBusy(true);
    setDbMsg(null);
    try {
      const res = await fetch("/api/db/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: dbForm.host,
          port: Number(dbForm.port) || 3306,
          user: dbForm.user,
          password: dbForm.password,
          database: dbForm.database,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setDbMsg("OK: Connection successful");
    } catch (e: any) {
      setDbMsg(`Error: ${e?.message || e}`);
    } finally {
      setDbTestBusy(false);
    }
  };

  const onSaveConfig = async () => {
    try {
      const res = await fetch("/api/db/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: dbForm.host,
          port: Number(dbForm.port) || 3306,
          user: dbForm.user,
          password: dbForm.password,
          database: dbForm.database,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setDbMsg("OK: Configuration saved securely on server");
    } catch (e: any) {
      setDbMsg(`Error: ${e?.message || e}`);
    }
  };

  const onInitialize = async () => {
    setDbBusy(true);
    setDbMsg(null);
    try {
      const res = await fetch("/api/db/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: dbForm.host,
          port: Number(dbForm.port) || 3306,
          user: dbForm.user,
          password: dbForm.password,
          database: dbForm.database,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setDbMsg(
        `OK: Database initialized${
          data?.persisted ? " and configuration saved securely" : ""
        }.`
      );
    } catch (e: any) {
      setDbMsg(`Error: ${e?.message || e}`);
    } finally {
      setDbBusy(false);
    }
  };

  return {
    dbForm,
    setDbForm,
    dbBusy,
    dbMsg,
    dbTestBusy,
    onTestConnection,
    onSaveConfig,
    onInitialize,
  };
}
