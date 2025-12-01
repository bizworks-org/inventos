"use client";
import { useParams } from "next/navigation";
import useAssetflowNavigate from "../../../src/components/assetflow/layout/useAssetflowNavigate";
import { AuditSessionPage } from "../../../src/components/assetflow/audits/AuditSessionPage";

export default function AuditSessionRoute() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const { onSearch } = useAssetflowNavigate();
  return <AuditSessionPage auditId={id} onSearch={onSearch} />;
}
