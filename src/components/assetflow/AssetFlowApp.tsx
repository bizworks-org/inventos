'use client';

import { useState } from 'react';
import { AssetFlowDashboard } from './AssetFlowDashboard';
import { AssetFlowLayout } from './layout/AssetFlowLayout';
import { AssetsPage } from './assets/AssetsPage';
import { AddAssetPage } from './assets/AddAssetPage';
import { EditAssetPage } from './assets/EditAssetPage';
import { LicensesPage } from './licenses/LicensesPage';
import { AddLicensePage } from './licenses/AddLicensePage';
import { EditLicensePage } from './licenses/EditLicensePage';
import { VendorsPage } from './vendors/VendorsPage';
import { AddVendorPage } from './vendors/AddVendorPage';
import { EditVendorPage } from './vendors/EditVendorPage';
import { EventsPage } from './events/EventsPage';
import SearchResultsPage from './search/SearchResultsPage';
import { SettingsPage } from './settings/SettingsPage';

export type AssetFlowPage = 
  | 'dashboard' 
  | 'assets' 
  | 'assets-add' 
  | 'assets-edit' 
  | 'licenses'
  | 'licenses-add'
  | 'licenses-edit'
  | 'vendors'
  | 'vendors-add'
  | 'vendors-edit'
  | 'events' 
  | 'settings' 
  | 'search';

export function AssetFlowApp() {
  const [currentPage, setCurrentPage] = useState<AssetFlowPage>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const handleNavigate = (page: string, itemId?: string) => {
    setCurrentPage(page as AssetFlowPage);
    if (itemId) {
      setSelectedItemId(itemId);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage('search');
  };

  // Dashboard
  if (currentPage === 'dashboard') {
    return <AssetFlowDashboard onNavigate={handleNavigate} onSearch={handleSearch} />;
  }

  // IT Assets
  if (currentPage === 'assets') {
    return <AssetsPage onNavigate={handleNavigate} onSearch={handleSearch} />;
  }

  // Add Asset
  if (currentPage === 'assets-add') {
    return <AddAssetPage onNavigate={handleNavigate} onSearch={handleSearch} />;
  }

  // Edit Asset
  if (currentPage === 'assets-edit') {
    return <EditAssetPage assetId={selectedItemId ?? ''} onNavigate={handleNavigate} onSearch={handleSearch} />;
  }

  // Licenses
  if (currentPage === 'licenses') {
    return <LicensesPage onNavigate={handleNavigate} onSearch={handleSearch} />;
  }

  // Add License
  if (currentPage === 'licenses-add') {
    return <AddLicensePage onNavigate={handleNavigate} onSearch={handleSearch} />;
  }

  // Edit License
  if (currentPage === 'licenses-edit') {
    return <EditLicensePage licenseId={selectedItemId ?? ''} onNavigate={handleNavigate} onSearch={handleSearch} />;
  }

  // Vendors
  if (currentPage === 'vendors') {
    return <VendorsPage onNavigate={handleNavigate} onSearch={handleSearch} />;
  }

  // Add Vendor
  if (currentPage === 'vendors-add') {
    return <AddVendorPage onNavigate={handleNavigate} onSearch={handleSearch} />;
  }

  // Edit Vendor
  if (currentPage === 'vendors-edit') {
    return <EditVendorPage vendorId={selectedItemId ?? ''} onNavigate={handleNavigate} onSearch={handleSearch} />;
  }

  // Events
  if (currentPage === 'events') {
    return <EventsPage onNavigate={handleNavigate} onSearch={handleSearch} />;
  }

  // Settings
  if (currentPage === 'settings') {
    return <SettingsPage onNavigate={handleNavigate} onSearch={handleSearch} />;
  }

  // Search results
  if (currentPage === 'search') {
    return <SearchResultsPage query={searchQuery} onNavigate={handleNavigate} onSearch={handleSearch} />;
  }

  // Placeholder for other pages
  return (
    <AssetFlowLayout
      currentPage={currentPage}
      onSearch={handleSearch}
      breadcrumbs={[
        { label: 'Home', href: '#' },
        { label: String(currentPage).charAt(0).toUpperCase() + String(currentPage).slice(1).replace('-', ' ') }
      ]}
    >
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#1a1d2e] mb-2">
            {String(currentPage).charAt(0).toUpperCase() + String(currentPage).slice(1).replace('-', ' ')} Page
          </h2>
          <p className="text-[#64748b]">
            This page is under construction. Dashboard, IT Assets, Licenses, Vendors, and Events pages are fully functional!
          </p>
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-lg hover:shadow-lg transition-all duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </AssetFlowLayout>
  );
}
