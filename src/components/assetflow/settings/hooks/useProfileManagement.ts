import { useState } from "react";
import type { ClientMe } from "@/lib/auth/client";

interface UseProfileManagementProps {
  ctxMe: ClientMe;
  setCtxMe: (me: ClientMe) => void;
}

export function useProfileManagement({
  ctxMe,
  setCtxMe,
}: UseProfileManagementProps) {
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdNew2, setPwdNew2] = useState("");
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const saveProfile = async (name: string) => {
    setProfileMsg(null);

    if (!name && !pwdNew) {
      setProfileMsg("Nothing to update");
      return;
    }

    if (pwdNew) {
      if (pwdNew !== pwdNew2) {
        setProfileMsg("New passwords do not match");
        return;
      }
      if (pwdNew.length < 8) {
        setProfileMsg("New password must be at least 8 characters");
        return;
      }
      if (!pwdCurrent) {
        setProfileMsg("Current password is required to set a new password");
        return;
      }
    }

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          passwordCurrent: pwdCurrent || undefined,
          passwordNew: pwdNew || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update profile");
      setProfileMsg("OK: Profile updated");
      setCtxMe(ctxMe ? { ...ctxMe, name } : ctxMe);
      setPwdCurrent("");
      setPwdNew("");
      setPwdNew2("");
    } catch (e: any) {
      setProfileMsg(`Error: ${e?.message || e}`);
    }
  };

  return {
    pwdCurrent,
    setPwdCurrent,
    pwdNew,
    setPwdNew,
    pwdNew2,
    setPwdNew2,
    profileMsg,
    setProfileMsg,
    saveProfile,
  };
}
