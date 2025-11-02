"use client";

import React from 'react';
import SearchResultsPage from './SearchResultsPage';
import useAssetflowNavigate from '../layout/useAssetflowNavigate';
import { useSearchParams } from 'next/navigation';

export default function SearchResultsClient() {
  const { onNavigate, onSearch } = useAssetflowNavigate();
  const sp = useSearchParams();
  const q = sp?.get('q') ?? '';
  return <SearchResultsPage query={q} onNavigate={onNavigate} onSearch={onSearch} />;
}
