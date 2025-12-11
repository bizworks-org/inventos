"use client";

type Props = {
  profile: any;
  setProfile: (updater: any) => void;
};

export default function ProcurementSection({
  profile,
  setProfile,
}: Readonly<Props>) {
  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">
        Internal Procurement
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="requestType"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Request Type
          </label>
          <select
            id="requestType"
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
            htmlFor="businessJustification"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Business Justification / Purpose of Onboarding
          </label>
          <textarea
            id="businessJustification"
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
            htmlFor="estimatedAnnualSpend"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Estimated Annual Spend
          </label>
          <input
            id="estimatedAnnualSpend"
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
            htmlFor="evaluationCommittee"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Evaluation Committee / Approver Name(s)
          </label>
          <input
            id="evaluationCommittee"
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
            htmlFor="riskAssessment"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Risk Assessment Notes
          </label>
          <select
            id="riskAssessment"
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
            htmlFor="legalInfosecReviewStatus"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Legal & InfoSec Review Status
          </label>
          <select
            id="legalInfosecReviewStatus"
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
    </div>
  );
}
