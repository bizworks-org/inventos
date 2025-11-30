"use client";
import { AuditsPage } from "../../src/components/assetflow/audits/AuditsPage";
import useAssetflowNavigate from "../../src/components/assetflow/layout/useAssetflowNavigate";

export default function Page() {
  const { onNavigate } = useAssetflowNavigate();
  return <AuditsPage onNavigate={onNavigate} />;
}
