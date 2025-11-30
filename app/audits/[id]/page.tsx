"use client";
import { useParams } from "next/navigation";
import { AuditSessionPage } from "../../../src/components/assetflow/audits/AuditSessionPage";

export default function AuditSessionRoute() {
  const params = useParams();
  const id = String(params?.id ?? "");
  return <AuditSessionPage auditId={id} />;
}
