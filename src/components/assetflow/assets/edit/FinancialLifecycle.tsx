"use client";

import React from "react";

type Props = {
  formData: Record<string, string>;
  handleInputChange: (field: string, value: string) => void;
  currencySymbol: string;
};

export default function FinancialLifecycle({
  formData,
  handleInputChange,
  currencySymbol,
}: Props) {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold">Financial & Lifecycle</h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label
            htmlFor="purchaseCost"
            className="mb-2 block text-sm font-medium"
          >
            Purchase Cost *
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              {currencySymbol}
            </span>
            <input
              id="purchaseCost"
              type="number"
              min="0"
              step="0.01"
              required
              value={formData.cost}
              onChange={(event) =>
                handleInputChange("cost", event.target.value)
              }
              className="w-full rounded-lg border bg-card px-8 py-2.5"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="purchaseDate"
            className="mb-2 block text-sm font-medium"
          >
            Purchase Date *
          </label>
          <input
            id="purchaseDate"
            type="date"
            required
            value={formData.purchaseDate}
            onChange={(event) =>
              handleInputChange("purchaseDate", event.target.value)
            }
            className="w-full rounded-lg border bg-card px-4 py-2.5"
          />
        </div>
        <div>
          <label htmlFor="eosDate" className="mb-2 block text-sm font-medium">
            End of Support
          </label>
          <input
            id="eosDate"
            type="date"
            value={formData.eosDate}
            onChange={(event) =>
              handleInputChange("eosDate", event.target.value)
            }
            className="w-full rounded-lg border bg-card px-4 py-2.5"
          />
        </div>
        <div>
          <label htmlFor="eolDate" className="mb-2 block text-sm font-medium">
            End of Life
          </label>
          <input
            id="eolDate"
            type="date"
            value={formData.eolDate}
            onChange={(event) =>
              handleInputChange("eolDate", event.target.value)
            }
            className="w-full rounded-lg border bg-card px-4 py-2.5"
          />
        </div>
      </div>
    </div>
  );
}
