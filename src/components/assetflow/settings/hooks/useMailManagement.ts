import { useState } from "react";
import type { ClientMe } from "@/lib/auth/client";

export function useMailManagement(me: ClientMe) {
  const [mailForm, setMailForm] = useState({
    host: "",
    port: "587",
    secure: false,
    user: "",
    password: "",
    fromName: "",
    fromEmail: "",
  });
  const [mailTestTo, setMailTestTo] = useState<string>("");
  const [mailMsg, setMailMsg] = useState<string | null>(null);
  const [mailBusy, setMailBusy] = useState(false);
  const [mailTestBusy, setMailTestBusy] = useState(false);

  const verifySmtp = async () => {
    setMailTestBusy(true);
    setMailMsg(null);
    try {
      if (!mailForm.host || !mailForm.port || !mailForm.fromEmail) {
        setMailMsg("Error: Host, Port and From Email are required");
        return;
      }
      const res = await fetch("/api/mail/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: mailForm.host,
          port: Number(mailForm.port) || 587,
          secure: !!mailForm.secure,
          user: mailForm.user || undefined,
          password: mailForm.password || undefined,
          fromEmail: mailForm.fromEmail || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setMailMsg("OK: SMTP verified");
    } catch (e: any) {
      setMailMsg(`Error: ${e?.message || e}`);
    } finally {
      setMailTestBusy(false);
    }
  };

  const saveMailConfig = async () => {
    setMailBusy(true);
    setMailMsg(null);
    try {
      if (!mailForm.host || !mailForm.port || !mailForm.fromEmail) {
        setMailMsg("Error: Host, Port and From Email are required");
        return;
      }
      const res = await fetch("/api/mail/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: mailForm.host,
          port: Number(mailForm.port) || 587,
          secure: !!mailForm.secure,
          user: mailForm.user || undefined,
          password: mailForm.password || undefined,
          fromName: mailForm.fromName || undefined,
          fromEmail: mailForm.fromEmail || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setMailMsg("OK: Mail config saved securely on server");
    } catch (e: any) {
      setMailMsg(`Error: ${e?.message || e}`);
    } finally {
      setMailBusy(false);
    }
  };

  const sendTestEmail = async () => {
    setMailMsg(null);
    try {
      if (!mailTestTo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mailTestTo)) {
        setMailMsg("Error: Enter a valid recipient email");
        return;
      }
      const res = await fetch("/api/mail/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: mailTestTo,
          subject: "AssetFlow SMTP Test",
          text: "This is a test email from AssetFlow.",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setMailMsg("OK: Test email sent");
    } catch (e: any) {
      setMailMsg(`Error: ${e?.message || e}`);
    }
  };

  const sendTestToMe = async () => {
    setMailMsg(null);
    try {
      const to = me?.email || "";
      if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
        setMailMsg("Error: Your user email is not available");
        return;
      }
      setMailTestTo(to);
      const res = await fetch("/api/mail/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject: "AssetFlow SMTP Test",
          text: "This is a test email from AssetFlow.",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setMailMsg("OK: Test email sent to your address");
    } catch (e: any) {
      setMailMsg(`Error: ${e?.message || e}`);
    }
  };

  return {
    mailForm,
    setMailForm,
    mailTestTo,
    setMailTestTo,
    mailMsg,
    mailBusy,
    mailTestBusy,
    verifySmtp,
    saveMailConfig,
    sendTestEmail,
    sendTestToMe,
  };
}
