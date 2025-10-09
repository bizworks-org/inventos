# AssetFlow - IT Asset Management Dashboard

A modern, animated IT Asset Management (ITAM) application built with React, TypeScript, Tailwind CSS, and Motion (Framer Motion).

## ✨ Features

### Currently Implemented

#### 🎨 Design & UI
- **Modern gradient-based interface** with deep blues and purples
- **Animated dashboard** with Motion for smooth transitions
- **Dark sidebar navigation** with gradient active states
- **Glassmorphic card designs** with subtle shadows and borders
- **Responsive stat cards** with hover effects and trend indicators

#### 📊 Dashboard
- **4 Key Metrics Cards**:
  - Total Assets (with +12% trend)
  - Licenses Expiring Soon (warning indicator)
  - Assets in Repair (status tracking)
  - Total Vendors (growth indicator)
  
- **Asset Distribution Chart**: Interactive bar chart showing asset breakdown by category (Laptop, Desktop, Server, Monitor, Printer, Phone)
  
- **Recent Activity Feed**: Real-time activity log with:
  - Severity indicators (info, warning, error, success)
  - User attribution
  - Timestamp formatting
  - Color-coded badges

#### 🗂️ Data Management
- **Mock data system** (`/lib/data.ts`) with:
  - 8 sample assets across different types
  - 6 software licenses with compliance tracking
  - 5 vendor relationships
  - Activity history
  - Event logging
  
- **Helper functions** for:
  - Filtering by type, status, and expiration
  - Dashboard statistics calculation
  - Asset distribution analysis

#### 🤖 AI Integration (Infrastructure)
- **Prediction engine** (`/lib/ai-prediction.ts`):
  - Mock AI prediction for asset replacement cycles
  - Considers usage patterns, maintenance history, age, and cost
  - Generates confidence scores and reasoning
  - Provides actionable recommendations
  - Cost projections (maintenance vs. replacement)

#### 📝 Event System
- **Event bus** (`/lib/events.ts`):
  - In-memory event logging
  - Event filtering by severity and entity type
  - Helper functions for common events
  - Real-time event notifications

### ✅ IT Assets Page (Fully Implemented)

#### 📋 Assets List View
- **Type-based Tabs**: Filter assets by type (All, Laptop, Desktop, Server, Monitor, Printer, Phone)
- **Advanced Filtering**: 
  - Real-time search across name, serial number, assignee, and department
  - Status dropdown filter (All, Active, In Repair, Retired, In Storage)
  - Results counter showing filtered vs. total assets
  
- **Interactive Table**: 
  - Color-coded asset type badges
  - Status indicators with color-coded badges
  - Warranty expiration warnings
  - Cost display with currency formatting
  - Hover effects for better UX
  - Edit and Delete actions per row
  
- **Action Buttons**:
  - Add Asset (navigates to form)
  - Import (placeholder)
  - Export (placeholder)

#### ➕ Add Asset Form
- **Multi-section Form**:
  - **Basic Information**: Asset type selector (button group), name, serial number, status, assignee, department, location
  - **Financial & Warranty**: Purchase cost, purchase date, warranty expiry
  - **Technical Specifications**: Dynamic section that appears only for Laptop, Desktop, and Server types
    - Processor, RAM, Storage, Operating System
    
- **Live Summary Sidebar**:
  - Real-time asset type, status, and cost preview
  - Sticky positioning for easy access
  - Save and Cancel actions
  
- **Form Features**:
  - Required field validation
  - Date pickers for purchase and warranty dates
  - Currency input with $ prefix
  - Dynamic field visibility based on asset type
  - Event logging on asset creation

### ✅ Licenses Page (Fully Implemented)

#### 📊 Dashboard Stats Cards
- **Total Licenses**: Shows count and annual spend
- **Expiring Soon**: Warning indicator for licenses expiring within 90 days
- **Seat Utilization**: Visual percentage of seats in use across all licenses
- **Compliance Status**: Count of compliant licenses with status indicator

#### 📋 Licenses List View
- **Type-based Tabs**: Filter by license type (All, Software, SaaS, Cloud) with counts
- **Advanced Filtering**:
  - Real-time search across name, vendor, and owner
  - Compliance status filter (All, Compliant, Warning, Non-Compliant)
  - Results counter
  
- **Rich Data Table**:
  - License name with type badge (Software/SaaS/Cloud)
  - Vendor and owner information
  - **Seat Utilization Visualization**:
    - Visual progress bar showing seat usage
    - Color-coded indicators (green/yellow/red based on utilization)
    - Percentage and count display (e.g., "85/100 seats")
  - **Expiration Tracking**:
    - Date display with color coding (expired/expiring soon/normal)
    - Days remaining countdown
    - "Expired!" indicator for past dates
  - **Compliance Badges**: Color-coded status with icons
  - **Cost Display**: Annual and monthly breakdown
  - Edit and Delete actions
  
- **Action Buttons**: Add License, Import, Export

#### ➕ Add License Form
- **Multi-section Layout**:
  - **License Information**: Name, vendor, type selector, owner/department
  - **Seat Management**: 
    - Total seats and seats in use
    - Real-time utilization visualization with progress bar
    - Color-coded warnings (>95% red, >80% yellow)
  - **Financial & Renewal**:
    - Annual cost with auto-calculated monthly breakdown
    - Compliance status selector
    - Expiration date picker
    - Renewal date with auto-calculation option (30 days before expiry)
    
- **Live Summary Sidebar**:
  - License type, compliance status
  - Seat allocation display
  - Cost preview
  - Sticky positioning
  
- **Smart Features**:
  - Auto-calculate renewal date if not specified
  - Real-time seat utilization calculation
  - Monthly cost breakdown
  - Form validation
  - Event logging integration

### ✅ Vendors Page (Fully Implemented)

#### 📊 Dashboard Stats Cards
- **Total Contract Value**: Aggregate spend across all vendors with count
- **Average Rating**: Overall vendor performance with visual star rating
- **Approved Vendors**: Count of active partnerships
- **Expiring Soon**: Contracts expiring within 90 days

#### 📋 Vendors List View
- **Type-based Tabs**: Filter by vendor type (All, Hardware, Software, Services, Cloud) with counts
- **Advanced Filtering**:
  - Real-time search across vendor name, contact person, and email
  - Status dropdown filter (All, Approved, Pending, Rejected)
  - Results counter
  
- **Rich Data Table**:
  - Vendor name with type badge (Hardware/Software/Services/Cloud)
  - **Contact Information**:
    - Contact person name
    - Clickable email address (opens email client)
    - Clickable phone number (initiates call)
  - **Performance Rating**: 5-star visual rating system with numeric score
  - **Status Badges**: Color-coded with icons (✓ Approved, ⏳ Pending, ✕ Rejected)
  - **Contract Value**: Total contract value with monthly average
  - **Contract Expiration**:
    - Date display with color coding (expired/expiring soon/normal)
    - Days remaining countdown
    - "Expired!" indicator with alert icon
  - Edit and Delete actions
  
- **Action Buttons**: Add Vendor, Import, Export

#### ➕ Add Vendor Form
- **Multi-section Layout**:
  - **Vendor Information**: 
    - Vendor name, type selector, status
    - Website URL and physical address
  - **Contact Information**:
    - Contact person name
    - Email address and phone number
  - **Contract & Performance**:
    - Contract value with currency input
    - Contract expiry date picker
    - **Interactive Rating Slider**:
      - Visual slider from 0-5 stars
      - Real-time star display
      - Numeric score display (e.g., 4.2 / 5.0)
    - Notes/comments textarea
    
- **Live Summary Sidebar**:
  - Vendor type and status
  - Contract value display
  - Star rating preview
  - Sticky positioning
  
- **Smart Features**:
  - Interactive star rating slider with visual feedback
  - Form validation for email and phone formats
  - Event logging integration
  - Color-coded rating display

### ✅ Events Log Page (Fully Implemented)

#### 📊 Dashboard Stats Cards
- **Total Events**: Complete count of all system activities
- **Critical Events**: Count of events requiring immediate attention
- **Warnings**: Count of events needing review
- **Info Events**: Count of normal operation activities

#### 🔍 Advanced Filtering System
- **Entity Type Tabs**: Filter by entity (All, Asset, License, Vendor, User) with event counts
- **Severity Filter**: Dropdown to filter by severity level (All, Info, Warning, Error, Critical)
- **Time Filter**: Quick filters for temporal ranges
  - All Time
  - Today
  - This Week (last 7 days)
  - This Month (last 30 days)
- **Real-time Search**: Search across event details, user, and action fields
- **Results Counter**: Shows filtered vs. total events

#### 📅 Beautiful Timeline View
- **Date Grouping**: Events automatically grouped by date (Today, Yesterday, or full date)
- **Visual Timeline**: Each event displays in a card with:
  - **Entity Icon**: Color-coded icon for asset/license/vendor/user
  - **Severity Badge**: Color-coded badge with icon (ℹ Info, ⚠ Warning, ✕ Error, ! Critical)
  - **Entity Type Badge**: Shows the type of entity involved
  - **Event Details**: Clear description of what happened
  - **Action Code**: Monospace display of the action type (e.g., `asset.created`)
  - **User Information**: Who performed the action
  - **Entity ID**: Reference to the specific item
  - **Metadata Display**: Key-value pairs showing additional context
  - **Dual Timestamps**: 
    - Relative time (e.g., "2h ago", "Today")
    - Absolute timestamp with full date and time
  
- **Color-Coded Severity**:
  - Info: Green (normal operations)
  - Warning: Orange (needs attention)
  - Error: Red (problems occurred)
  - Critical: Dark red (immediate action required)

#### 🔄 Real-time Features
- **Live Updates**: Automatically subscribes to new events as they occur
- **Refresh Button**: Manual refresh with animated spinner
- **Export Functionality**: Export event log (button ready)

#### 💾 Event Types Tracked
- **Assets**: Creation, updates, status changes, warranty alerts, deletions, maintenance
- **Licenses**: Creation, seat allocations, expiration warnings, compliance violations
- **Vendors**: Creation, updates, contract expiration alerts
- **Users**: Login activity, system actions

#### 🎨 Design Features
- Smooth Motion animations for event cards
- Hover effects for better UX
- Responsive layout
- Empty state with helpful messaging
- Date separators with visual styling
- Monospace fonts for technical data
- Gradient backgrounds for metadata sections

### 🚧 Placeholder Pages
The following sections have navigation placeholders:
- Edit Asset/License/Vendor (forms ready, need data binding)
- Predictive Analytics
- Settings

## 🎯 Tech Stack

- **React** with TypeScript
- **Tailwind CSS v4** for styling
- **Motion** (Framer Motion) for animations
- **Recharts** for data visualization
- **Lucide React** for icons
- **shadcn/ui** components (available but not yet utilized)

## 📁 File Structure

```
/lib
  ├── data.ts                          # Mock data and helper functions
  ├── events.ts                        # Event bus system
  └── ai-prediction.ts                 # AI prediction engine

/components/assetflow
  ├── AssetFlowApp.tsx                 # Main app container with routing
  ├── AssetFlowDashboard.tsx           # Dashboard page
  ├── /layout
  │   ├── Sidebar.tsx                  # Navigation sidebar
  │   ├── Header.tsx                   # Top header with search
  │   └── AssetFlowLayout.tsx          # Page layout wrapper
  └── /dashboard
      ├── StatCard.tsx                 # Animated statistic card
      ├── AssetOverviewChart.tsx       # Bar chart component
      └── RecentActivityTable.tsx      # Activity feed component

/components
  ├── AppRouter.tsx                    # App switcher (Trip Planner ↔ AssetFlow)
  └── TripPlannerApp.tsx               # Original trip planner app
```

## 🎨 Design System

### Colors
- **Primary Gradient**: `from-[#6366f1] to-[#8b5cf6]` (Indigo to Purple)
- **Background**: Gradient from `#f8f9ff` to `#f0f4ff`
- **Sidebar**: Gradient from `#1a1d2e` to `#0f1218`
- **Text Primary**: `#1a1d2e`
- **Text Secondary**: `#64748b`
- **Text Muted**: `#94a3b8`

### Status Colors
- **Success**: `#10b981` (Green)
- **Warning**: `#f59e0b` (Amber)
- **Error**: `#ef4444` (Red)
- **Info**: `#3b82f6` (Blue)

### Card Gradients
- Assets: `from-[#6366f1] to-[#8b5cf6]`
- Licenses: `from-[#ec4899] to-[#f43f5e]`
- Repair: `from-[#f59e0b] to-[#f97316]`
- Vendors: `from-[#10b981] to-[#14b8a6]`

## 🚀 Usage

The application starts with AssetFlow by default. Use the app switcher in the top-right corner to toggle between:
- **AssetFlow**: IT Asset Management Dashboard
- **Trip Planner**: Original collaborative trip planning app

### Navigation
Click any item in the sidebar to navigate between sections. Currently, only the Dashboard is fully implemented, with placeholder pages for other sections.

### Dashboard Features
- View key metrics at a glance
- Explore asset distribution by type
- Monitor recent system activities
- Track expiring licenses and repair status

## 🔮 Future Enhancements

### Phase 1: Core Pages
- [ ] IT Assets page with filterable table
- [ ] Add/Edit Asset forms
- [ ] License management with renewal tracking
- [ ] Vendor onboarding and management
- [ ] Comprehensive event log with filtering

### Phase 2: Advanced Features
- [ ] Predictive Analytics page with AI integration
- [ ] Settings page with tabs (Profile, Notifications, Integrations)
- [ ] Global search functionality
- [ ] Export/Import capabilities
- [ ] Real-time notifications

### Phase 3: Integration
- [ ] Actual Genkit + Gemini AI integration
- [ ] Backend API connection
- [ ] Authentication system
- [ ] Role-based access control
- [ ] Webhook integrations

### Phase 4: Polish
- [ ] Mobile responsive design
- [ ] Dark mode toggle
- [ ] Advanced filtering and sorting
- [ ] Bulk operations
- [ ] Data visualization improvements

## 📊 Data Models

### Asset
```typescript
{
  id: string
  name: string
  type: 'Laptop' | 'Desktop' | 'Server' | 'Monitor' | 'Printer' | 'Phone'
  serialNumber: string
  assignedTo: string
  department: string
  status: 'Active' | 'In Repair' | 'Retired' | 'In Storage'
  purchaseDate: string
  warrantyExpiry: string
  cost: number
  location: string
  specifications?: {...}
}
```

### License
```typescript
{
  id: string
  name: string
  vendor: string
  type: 'Software' | 'SaaS' | 'Cloud'
  seats: number
  seatsUsed: number
  expirationDate: string
  cost: number
  owner: string
  compliance: 'Compliant' | 'Warning' | 'Non-Compliant'
  renewalDate: string
}
```

### Vendor
```typescript
{
  id: string
  name: string
  type: 'Hardware' | 'Software' | 'Services' | 'Cloud'
  contactPerson: string
  email: string
  phone: string
  status: 'Approved' | 'Pending' | 'Rejected'
  contractValue: number
  contractExpiry: string
  rating: number
}
```

## 🎓 Learning Resources

This application demonstrates:
- Complex React component architecture
- TypeScript type safety
- Tailwind CSS utility-first styling
- Motion animation best practices
- Data visualization with Recharts
- Mock data patterns for prototyping
- Event-driven architecture
- AI/ML integration patterns (mock)

---

**Note**: This is a frontend prototype with mock data. In a production environment, you would connect to a real backend API, implement authentication, and integrate with actual AI services like Google's Gemini via Genkit.
