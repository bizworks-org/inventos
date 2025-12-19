"use client";

import { AuditPage } from "../../src/components/assetflow/audit/AuditPage";
import useAssetflowNavigate from "../../src/components/assetflow/layout/useAssetflowNavigate";

export default function Page() {
  const { onNavigate, onSearch } = useAssetflowNavigate();
  return <AuditPage onNavigate={onNavigate} onSearch={onSearch} />;
}
