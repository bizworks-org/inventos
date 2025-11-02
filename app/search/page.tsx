'use client'
import React, { Suspense } from 'react';
import SearchResultsClient from '../../src/components/assetflow/search/SearchResultsClient';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading search…</div>}>
      <SearchResultsClient />
    </Suspense>
  );
}
