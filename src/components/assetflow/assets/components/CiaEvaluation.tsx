"use client";

import React from "react";

type Props = {
  cia: { c: number; i: number; a: number };
  setCia: (v: { c: number; i: number; a: number }) => void;
  ciaTotal: number;
  ciaAvg: number;
};

export default function CiaEvaluation({
  cia,
  setCia,
  ciaTotal,
  ciaAvg,
}: Readonly<Props>) {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold">CIA Evaluation</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label
            htmlFor="ciaConfidentiality"
            className="mb-2 block text-sm font-medium"
          >
            Confidentiality
          </label>
          <select
            id="ciaConfidentiality"
            value={String(cia.c)}
            onChange={(e) => setCia({ ...cia, c: Number(e.target.value) })}
            className="w-full rounded-lg border bg-card px-4 py-2.5"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="ciaIntegrity"
            className="mb-2 block text-sm font-medium"
          >
            Integrity
          </label>
          <select
            id="ciaIntegrity"
            value={String(cia.i)}
            onChange={(e) => setCia({ ...cia, i: Number(e.target.value) })}
            className="w-full rounded-lg border bg-card px-4 py-2.5"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="ciaAvailability"
            className="mb-2 block text-sm font-medium"
          >
            Availability
          </label>
          <select
            id="ciaAvailability"
            value={String(cia.a)}
            onChange={(e) => setCia({ ...cia, a: Number(e.target.value) })}
            className="w-full rounded-lg border bg-card px-4 py-2.5"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-2.5">
          <span className="text-sm text-muted">Total</span>
          <span className="text-base font-semibold">{ciaTotal}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-2.5">
          <span className="text-sm text-muted">CIA Score</span>
          <span className="text-base font-semibold">{ciaAvg.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
