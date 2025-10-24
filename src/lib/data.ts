// Mock data for the IT Asset Management application

export interface Asset {
  id: string;
  name: string;
  type: 'Laptop' | 'Desktop' | 'Server' | 'Monitor' | 'Printer' | 'Phone';
  serialNumber: string;
  assignedTo: string;
  // Optional email used for consent workflow
  assignedEmail?: string;
  // Optional consent status for assignment confirmations
  consentStatus?: 'pending' | 'accepted' | 'rejected' | 'none';
  department: string;
  status:
    | 'In Store (New)'
    | 'In Store (Used)'
    | 'Allocated'
    | 'In Repair (In Store)'
    | 'In Repair (Allocated)'
    | 'Faulty – To Be Scrapped'
    | 'Scrapped / Disposed'
    | 'Lost / Missing';
  purchaseDate: string;
  // Lifecycle dates
  eosDate?: string; // End of Support (YYYY-MM-DD)
  eolDate?: string; // End of Life (YYYY-MM-DD)
  // Deprecated: kept temporarily for back-compat with older exports
  warrantyExpiry?: string;
  cost: number;
  location: string;
  specifications?: {
    processor?: string;
    ram?: string;
    storage?: string;
    os?: string;
    // Arbitrary key-value pairs entered per asset
    customFields?: Record<string, string>;
  };
}

export interface License {
  id: string;
  name: string;
  vendor: string;
  type: 'Software' | 'SaaS' | 'Cloud';
  seats: number;
  seatsUsed: number;
  expirationDate: string;
  cost: number;
  owner: string;
  compliance: 'Compliant' | 'Warning' | 'Non-Compliant';
  renewalDate: string;
}

export interface Vendor {
  id: string;
  name: string;
  type: 'Hardware' | 'Software' | 'Services' | 'Cloud';
  contactPerson: string;
  email: string;
  phone: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  contractValue: number;
  contractExpiry: string;
  rating: number;
}

export interface Activity {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export interface Event {
  id: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  entityType: 'asset' | 'license' | 'vendor' | 'user';
  entityId: string;
  action: string;
  user: string;
  details: string;
  metadata: Record<string, any>;
}

// Global definition for custom fields shown on Asset pages
export interface AssetFieldDef {
  key: string;           // machine key used in specifications.customFields
  label: string;         // human-friendly label shown in forms
  required?: boolean;    // whether this field is required on the form
  placeholder?: string;  // optional placeholder text
}

// Types available for custom asset fields
export type AssetFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'datetime'
  | 'phone'
  | 'email'
  | 'url'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'currency'
  | 'star'       // simple star rating
  | 'cia_rating' // confidentiality/integrity/availability rating (CIA)
  ;

// Extend AssetFieldDef to include type and options for select-like fields
export interface AssetFieldDef {
  key: string;           // machine key used in specifications.customFields
  label: string;         // human-friendly label shown in forms
  required?: boolean;    // whether this field is required on the form
  placeholder?: string;  // optional placeholder text
  type?: AssetFieldType; // field input type (defaults to 'text')
  options?: string[];    // for select / multiselect
}

// Mock Assets
export const mockAssets: Asset[] = [
  {
    id: 'AST-001',
    name: 'MacBook Pro 16"',
    type: 'Laptop',
    serialNumber: 'MBP-2023-001',
    assignedTo: 'John Doe',
    department: 'Engineering',
    status: 'Allocated',
    purchaseDate: '2023-01-15',
    eosDate: '2025-01-15',
    eolDate: '2028-01-15',
    cost: 2499,
    location: 'Building A - Floor 3',
    specifications: {
      processor: 'M2 Pro',
      ram: '32GB',
      storage: '1TB SSD',
      os: 'macOS Sonoma'
    }
  },
  {
    id: 'AST-002',
    name: 'Dell XPS 15',
    type: 'Laptop',
    serialNumber: 'DELL-2023-045',
    assignedTo: 'Sarah Johnson',
    department: 'Design',
    status: 'Allocated',
    purchaseDate: '2023-03-20',
    eosDate: '2026-03-20',
    eolDate: '2029-03-20',
    cost: 1899,
    location: 'Building B - Floor 2',
    specifications: {
      processor: 'Intel Core i7-13700H',
      ram: '16GB',
      storage: '512GB SSD',
      os: 'Windows 11 Pro'
    }
  },
  {
    id: 'AST-003',
    name: 'HP EliteDesk 800',
    type: 'Desktop',
    serialNumber: 'HP-2022-189',
    assignedTo: 'Mike Chen',
    department: 'Finance',
    status: 'Allocated',
    purchaseDate: '2022-06-10',
    eosDate: '2025-06-10',
    eolDate: '2028-06-10',
    cost: 1299,
    location: 'Building A - Floor 2',
    specifications: {
      processor: 'Intel Core i5-12500',
      ram: '16GB',
      storage: '256GB SSD',
      os: 'Windows 11 Pro'
    }
  },
  {
    id: 'AST-004',
    name: 'AWS EC2 Server',
    type: 'Server',
    serialNumber: 'AWS-PROD-001',
    assignedTo: 'IT Operations',
    department: 'IT',
    status: 'Allocated',
    purchaseDate: '2023-01-01',
    eosDate: '2024-12-31',
    eolDate: '2027-12-31',
    cost: 5000,
    location: 'AWS us-east-1',
    specifications: {
      processor: 't3.xlarge',
      ram: '16GB',
      storage: '500GB EBS'
    }
  },
  {
    id: 'AST-005',
    name: 'ThinkPad X1 Carbon',
    type: 'Laptop',
    serialNumber: 'LNV-2023-067',
    assignedTo: 'Emily Brown',
    department: 'Marketing',
    status: 'In Repair (Allocated)',
    purchaseDate: '2023-02-14',
    eosDate: '2026-02-14',
    eolDate: '2029-02-14',
    cost: 1599,
    location: 'Repair Center',
    specifications: {
      processor: 'Intel Core i7-1365U',
      ram: '16GB',
      storage: '512GB SSD',
      os: 'Windows 11 Pro'
    }
  },
  {
    id: 'AST-006',
    name: 'Dell UltraSharp 27"',
    type: 'Monitor',
    serialNumber: 'MON-2023-234',
    assignedTo: 'Design Team',
    department: 'Design',
    status: 'Allocated',
    purchaseDate: '2023-04-01',
    eosDate: '2026-04-01',
    eolDate: '2029-04-01',
    cost: 599,
    location: 'Building B - Floor 2'
  },
  {
    id: 'AST-007',
    name: 'iPhone 14 Pro',
    type: 'Phone',
    serialNumber: 'APPL-2023-891',
    assignedTo: 'David Wilson',
    department: 'Sales',
    status: 'Allocated',
    purchaseDate: '2023-09-22',
    eosDate: '2024-09-22',
    eolDate: '2027-09-22',
    cost: 999,
    location: 'Mobile - Sales Team'
  },
  {
    id: 'AST-008',
    name: 'HP LaserJet Pro',
    type: 'Printer',
    serialNumber: 'PRT-2022-456',
    assignedTo: 'Office Services',
    department: 'Operations',
    status: 'Allocated',
    purchaseDate: '2022-08-15',
    eosDate: '2025-08-15',
    eolDate: '2028-08-15',
    cost: 399,
    location: 'Building A - Floor 1'
  }
];

// Mock Licenses
export const mockLicenses: License[] = [
  {
    id: 'LIC-001',
    name: 'Microsoft 365 Enterprise',
    vendor: 'Microsoft',
    type: 'SaaS',
    seats: 500,
    seatsUsed: 487,
    expirationDate: '2024-12-31',
    cost: 125000,
    owner: 'IT Department',
    compliance: 'Compliant',
    renewalDate: '2024-11-01'
  },
  {
    id: 'LIC-002',
    name: 'Adobe Creative Cloud',
    vendor: 'Adobe',
    type: 'SaaS',
    seats: 50,
    seatsUsed: 48,
    expirationDate: '2024-11-15',
    cost: 35000,
    owner: 'Design Team',
    compliance: 'Warning',
    renewalDate: '2024-10-01'
  },
  {
    id: 'LIC-003',
    name: 'Slack Business+',
    vendor: 'Salesforce',
    type: 'SaaS',
    seats: 300,
    seatsUsed: 285,
    expirationDate: '2025-06-30',
    cost: 36000,
    owner: 'Operations',
    compliance: 'Compliant',
    renewalDate: '2025-05-01'
  },
  {
    id: 'LIC-004',
    name: 'GitHub Enterprise',
    vendor: 'GitHub',
    type: 'SaaS',
    seats: 200,
    seatsUsed: 198,
    expirationDate: '2024-10-31',
    cost: 42000,
    owner: 'Engineering',
    compliance: 'Warning',
    renewalDate: '2024-09-15'
  },
  {
    id: 'LIC-005',
    name: 'Zoom Enterprise',
    vendor: 'Zoom',
    type: 'SaaS',
    seats: 500,
    seatsUsed: 312,
    expirationDate: '2025-03-31',
    cost: 75000,
    owner: 'IT Department',
    compliance: 'Compliant',
    renewalDate: '2025-02-01'
  },
  {
    id: 'LIC-006',
    name: 'Figma Professional',
    vendor: 'Figma',
    type: 'SaaS',
    seats: 25,
    seatsUsed: 25,
    expirationDate: '2024-11-30',
    cost: 18000,
    owner: 'Design Team',
    compliance: 'Non-Compliant',
    renewalDate: '2024-10-15'
  }
];

// Mock Vendors
export const mockVendors: Vendor[] = [
  {
    id: 'VND-001',
    name: 'Microsoft Corporation',
    type: 'Software',
    contactPerson: 'John Smith',
    email: 'john.smith@microsoft.com',
    phone: '+1-425-882-8080',
    status: 'Approved',
    contractValue: 250000,
    contractExpiry: '2024-12-31',
    rating: 4.8
  },
  {
    id: 'VND-002',
    name: 'Dell Technologies',
    type: 'Hardware',
    contactPerson: 'Sarah Williams',
    email: 'sarah.w@dell.com',
    phone: '+1-800-289-3355',
    status: 'Approved',
    contractValue: 150000,
    contractExpiry: '2025-06-30',
    rating: 4.6
  },
  {
    id: 'VND-003',
    name: 'Amazon Web Services',
    type: 'Cloud',
    contactPerson: 'Mike Anderson',
    email: 'mike.a@aws.amazon.com',
    phone: '+1-206-266-4064',
    status: 'Approved',
    contractValue: 500000,
    contractExpiry: '2025-12-31',
    rating: 4.9
  },
  {
    id: 'VND-004',
    name: 'Adobe Inc.',
    type: 'Software',
    contactPerson: 'Emily Davis',
    email: 'emily.davis@adobe.com',
    phone: '+1-408-536-6000',
    status: 'Approved',
    contractValue: 75000,
    contractExpiry: '2024-11-15',
    rating: 4.5
  },
  {
    id: 'VND-005',
    name: 'Cisco Systems',
    type: 'Hardware',
    contactPerson: 'Robert Johnson',
    email: 'rjohnson@cisco.com',
    phone: '+1-408-526-4000',
    status: 'Pending',
    contractValue: 200000,
    contractExpiry: '2025-03-31',
    rating: 4.7
  }
];

// Mock Activities
export const mockActivities: Activity[] = [
  {
    id: 'ACT-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    user: 'admin@company.com',
    action: 'Created',
    entity: 'Asset',
    entityId: 'AST-008',
    details: 'Added new HP LaserJet Pro printer',
    severity: 'success'
  },
  {
    id: 'ACT-002',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    user: 'john.doe@company.com',
    action: 'Updated',
    entity: 'License',
    entityId: 'LIC-002',
    details: 'Updated Adobe Creative Cloud seat count',
    severity: 'info'
  },
  {
    id: 'ACT-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    user: 'sarah.j@company.com',
    action: 'Status Changed',
    entity: 'Asset',
    entityId: 'AST-005',
    details: 'Changed ThinkPad X1 Carbon status to In Repair',
    severity: 'warning'
  },
  {
    id: 'ACT-004',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    user: 'admin@company.com',
    action: 'Approved',
    entity: 'Vendor',
    entityId: 'VND-003',
    details: 'Approved Amazon Web Services vendor',
    severity: 'success'
  },
  {
    id: 'ACT-005',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    user: 'mike.c@company.com',
    action: 'Expired',
    entity: 'License',
    entityId: 'LIC-006',
    details: 'Figma Professional license expired',
    severity: 'error'
  }
];

// Mock Events
export const mockEvents: Event[] = [
  {
    id: 'EVT-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    severity: 'info',
    entityType: 'asset',
    entityId: 'AST-001',
    action: 'asset.created',
    user: 'admin@company.com',
    details: 'New asset created: MacBook Pro 16"',
    metadata: {
      assetType: 'Laptop',
      department: 'Engineering',
      cost: 2499
    }
  },
  {
    id: 'EVT-002',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    severity: 'warning',
    entityType: 'license',
    entityId: 'LIC-002',
    action: 'license.expiring_soon',
    user: 'system',
    details: 'Adobe Creative Cloud license expiring in 30 days',
    metadata: {
      daysUntilExpiry: 30,
      seats: 50,
      cost: 35000
    }
  },
  {
    id: 'EVT-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    severity: 'error',
    entityType: 'asset',
    entityId: 'AST-005',
    action: 'asset.status_changed',
    user: 'sarah.j@company.com',
    details: 'Asset status changed to In Repair',
    metadata: {
      previousStatus: 'Active',
      newStatus: 'In Repair',
      reason: 'Hardware malfunction'
    }
  },
  {
    id: 'EVT-004',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    severity: 'info',
    entityType: 'vendor',
    entityId: 'VND-003',
    action: 'vendor.updated',
    user: 'admin@company.com',
    details: 'Vendor contract value updated',
    metadata: {
      previousValue: 450000,
      newValue: 500000,
      field: 'contractValue'
    }
  },
  {
    id: 'EVT-005',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    severity: 'critical',
    entityType: 'license',
    entityId: 'LIC-006',
    action: 'license.compliance_violation',
    user: 'system',
    details: 'License seats exceeded: Figma Professional',
    metadata: {
      seats: 25,
      seatsUsed: 25,
      overageSeats: 3
    }
  }
];

// Helper functions
export function getAssetsByType(type: Asset['type']): Asset[] {
  return mockAssets.filter(asset => asset.type === type);
}

export function getAssetsByStatus(status: Asset['status']): Asset[] {
  return mockAssets.filter(asset => asset.status === status);
}

export function getLicensesExpiringSoon(days: number = 90): License[] {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return mockLicenses.filter(license => {
    const expiryDate = new Date(license.expirationDate);
    return expiryDate <= futureDate && expiryDate >= now;
  });
}

export function getVendorsByStatus(status: Vendor['status']): Vendor[] {
  return mockVendors.filter(vendor => vendor.status === status);
}

export function getDashboardStats() {
  return {
    totalAssets: mockAssets.length,
    licensesExpiringSoon: getLicensesExpiringSoon().length,
    assetsInRepair:
      mockAssets.filter(a => a.status === 'In Repair (In Store)' || a.status === 'In Repair (Allocated)').length,
    totalVendors: mockVendors.length
  };
}

export function getAssetDistribution() {
  const types: Asset['type'][] = ['Laptop', 'Desktop', 'Server', 'Monitor', 'Printer', 'Phone'];
  return types.map(type => ({
    name: type,
    count: getAssetsByType(type).length
  }));
}

// Lookup helpers
export function getAssetById(id: string): Asset | undefined {
  return mockAssets.find(a => a.id === id);
}

// Initialize event bus with sample events
export function initializeSampleEvents() {
  // Import eventBus only when called to avoid circular dependencies
  const { eventBus } = require('./events');
  
  // Check if events already exist
  if (eventBus.getEvents().length > 0) {
    return; // Already initialized
  }

  // Generate sample events based on mock data
  const sampleEvents = [
    // Recent asset events
    {
      severity: 'info' as const,
      entityType: 'asset' as const,
      entityId: 'AST-001',
      action: 'asset.created',
      user: 'admin@company.com',
      details: 'New asset created: MacBook Pro 16"',
      metadata: { type: 'Laptop', cost: 2499, department: 'Engineering' },
      timestamp: new Date(Date.now() - 1000 * 60 * 15)
    },
    {
      severity: 'info' as const,
      entityType: 'asset' as const,
      entityId: 'AST-002',
      action: 'asset.updated',
      user: 'sarah.johnson@company.com',
      details: 'Asset updated: Dell XPS 15',
      metadata: { changes: { location: 'Building B - Floor 2' } },
      timestamp: new Date(Date.now() - 1000 * 60 * 45)
    },
    {
      severity: 'warning' as const,
      entityType: 'asset' as const,
      entityId: 'AST-005',
      action: 'asset.status_changed',
      user: 'mike.wilson@company.com',
      details: 'Asset status changed to In Repair: Lenovo ThinkPad X1',
      metadata: { previousStatus: 'Active', newStatus: 'In Repair' },
      timestamp: new Date(Date.now() - 1000 * 60 * 90)
    },
    
    // License events
    {
      severity: 'info' as const,
      entityType: 'license' as const,
      entityId: 'LIC-001',
      action: 'license.created',
      user: 'admin@company.com',
      details: 'New license added: Microsoft 365 Enterprise',
      metadata: { type: 'SaaS', seats: 500, cost: 125000 },
      timestamp: new Date(Date.now() - 1000 * 60 * 120)
    },
    {
      severity: 'warning' as const,
      entityType: 'license' as const,
      entityId: 'LIC-002',
      action: 'license.expiring_soon',
      user: 'system',
      details: 'License expiring in 45 days: Adobe Creative Cloud',
      metadata: { daysUntilExpiry: 45, seats: 50 },
      timestamp: new Date(Date.now() - 1000 * 60 * 150)
    },
    {
      severity: 'critical' as const,
      entityType: 'license' as const,
      entityId: 'LIC-006',
      action: 'license.compliance_violation',
      user: 'system',
      details: 'License seats exceeded: Figma Professional',
      metadata: { seats: 25, seatsUsed: 25, overageSeats: 3 },
      timestamp: new Date(Date.now() - 1000 * 60 * 180)
    },
    {
      severity: 'warning' as const,
      entityType: 'license' as const,
      entityId: 'LIC-004',
      action: 'license.expiring_soon',
      user: 'system',
      details: 'License expiring in 21 days: GitHub Enterprise',
      metadata: { daysUntilExpiry: 21, seats: 200 },
      timestamp: new Date(Date.now() - 1000 * 60 * 240)
    },
    
    // Vendor events
    {
      severity: 'info' as const,
      entityType: 'vendor' as const,
      entityId: 'VND-001',
      action: 'vendor.created',
      user: 'admin@company.com',
      details: 'New vendor added: Microsoft Corporation',
      metadata: { type: 'Software', contractValue: 250000 },
      timestamp: new Date(Date.now() - 1000 * 60 * 300)
    },
    {
      severity: 'info' as const,
      entityType: 'vendor' as const,
      entityId: 'VND-003',
      action: 'vendor.updated',
      user: 'admin@company.com',
      details: 'Vendor updated: Amazon Web Services',
      metadata: { changes: { contractValue: 500000 } },
      timestamp: new Date(Date.now() - 1000 * 60 * 360)
    },
    {
      severity: 'warning' as const,
      entityType: 'vendor' as const,
      entityId: 'VND-004',
      action: 'vendor.contract_expiring',
      user: 'system',
      details: 'Vendor contract expiring in 75 days: Adobe Inc.',
      metadata: { daysUntilExpiry: 75, contractValue: 75000 },
      timestamp: new Date(Date.now() - 1000 * 60 * 420)
    },
    
    // User/System events
    {
      severity: 'info' as const,
      entityType: 'user' as const,
      entityId: 'USR-001',
      action: 'user.login',
      user: 'admin@company.com',
      details: 'User logged into AssetFlow dashboard',
      metadata: { ipAddress: '192.168.1.100', userAgent: 'Chrome/120.0' },
      timestamp: new Date(Date.now() - 1000 * 60 * 480)
    },
    {
      severity: 'info' as const,
      entityType: 'asset' as const,
      entityId: 'AST-003',
      action: 'asset.warranty_expiring',
      user: 'system',
      details: 'Asset warranty expiring in 60 days: HP ProDesk 600',
      metadata: { warrantyExpiry: '2025-02-15', cost: 899 },
      timestamp: new Date(Date.now() - 1000 * 60 * 540)
    },
    {
      severity: 'error' as const,
      entityType: 'asset' as const,
      entityId: 'AST-007',
      action: 'asset.deleted',
      user: 'admin@company.com',
      details: 'Asset deleted: Old Canon Printer (retired)',
      metadata: { reason: 'End of life' },
      timestamp: new Date(Date.now() - 1000 * 60 * 600)
    },
    
    // More recent events for timeline variety
    {
      severity: 'info' as const,
      entityType: 'license' as const,
      entityId: 'LIC-005',
      action: 'license.seat_allocated',
      user: 'john.doe@company.com',
      details: 'License seat allocated to new team member',
      metadata: { licenseName: 'Zoom Enterprise', user: 'jane.smith@company.com' },
      timestamp: new Date(Date.now() - 1000 * 60 * 30)
    },
    {
      severity: 'warning' as const,
      entityType: 'asset' as const,
      entityId: 'AST-006',
      action: 'asset.maintenance_due',
      user: 'system',
      details: 'Server maintenance due: Dell PowerEdge R740',
      metadata: { lastMaintenance: '2024-07-15', nextDue: '2025-01-15' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60)
    }
  ];

  // Add events to the event bus
  sampleEvents.forEach(event => {
    const eventDate = event.timestamp;
    const eventWithTimestamp = {
      ...event,
      timestamp: eventDate.toISOString()
    };
    
    // Manually create event to preserve custom timestamp
    (eventBus as any).events.unshift({
      id: `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...eventWithTimestamp
    });
  });
}
