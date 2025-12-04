"use client";
import React from "react";
import { motion } from "motion/react";

type Props = {
  profile: any;
  setProfile: (v: any) => void;
};

export default function VendorProcurementTab({
  profile,
  setProfile,
}: Readonly<Props>) {
  return (
    <motion.div
      id="panel-procurement"
      role="tabpanel"
      aria-labelledby="tab-procurement"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">
        Internal Procurement
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="request-type"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Request Type
          </label>
          <select
            id="request-type"
            value={profile.request_type}
            onChange={(e) =>
              setProfile((p: any) => ({ ...p, request_type: e.target.value }))
            }
            className="w-full px-3 py-2 rounded-lg bg-[#fbfbff] border"
          >
            <option>New Vendor</option>
            <option>Renewal</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="business-justification"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Business Justification / Purpose of Onboarding
          </label>
          <textarea
            id="business-justification"
            value={profile.business_justification}
            onChange={(e) =>
              setProfile((p: any) => ({
                ...p,
                business_justification: e.target.value,
              }))
            }
            className="w-full px-3 py-2 rounded-lg bg-[#fbfbff] border"
            rows={3}
          />
        </div>

        <div>
          <label
            htmlFor="estimated-annual-spend"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Estimated Annual Spend
          </label>
          <input
            id="estimated-annual-spend"
            type="number"
            min="0"
            step="0.01"
            value={profile.estimated_annual_spend}
            onChange={(e) =>
              setProfile((p: any) => ({
                ...p,
                estimated_annual_spend: e.target.value,
              }))
            }
            className="w-full px-3 py-2 rounded-lg bg-[#fbfbff] border"
          />
        </div>

        <div>
          <label
            htmlFor="evaluation-committee"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Evaluation Committee / Approver Name(s)
          </label>
          <input
            id="evaluation-committee"
            type="text"
            placeholder="Comma-separated emails or names"
            value={(profile.evaluation_committee || []).join(", ")}
            onChange={(e) =>
              setProfile((p: any) => ({
                ...p,
                evaluation_committee: e.target.value
                  .split(",")
                  .map((s: string) => s.trim())
                  .filter(Boolean),
              }))
            }
            className="w-full px-3 py-2 rounded-lg bg-[#fbfbff] border"
          />
        </div>

        <div>
          <label
            htmlFor="risk-assessment"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Risk Assessment Notes
          </label>
          <select
            id="risk-assessment"
            value={profile.risk_assessment}
            onChange={(e) =>
              setProfile((p: any) => ({
                ...p,
                risk_assessment: e.target.value,
              }))
            }
            className="w-full px-3 py-2 rounded-lg bg-[#fbfbff] border"
          >
            <option>High</option>
            <option>Moderate</option>
            <option>Low</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="legal-infosec-review-status"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Legal & InfoSec Review Status
          </label>
          <select
            id="legal-infosec-review-status"
            value={profile.legal_infosec_review_status}
            onChange={(e) =>
              setProfile((p: any) => ({
                ...p,
                legal_infosec_review_status: e.target.value,
              }))
            }
            className="w-full px-3 py-2 rounded-lg bg-[#fbfbff] border"
          >
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>
        </div>
      </div>
    </motion.div>
  );
}
