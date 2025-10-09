import { motion } from 'motion/react';
import { Edit2, Trash2, ExternalLink } from 'lucide-react';
import { Asset } from '../../../lib/data';
import { useState } from 'react';

interface AssetsTableProps {
  assets: Asset[];
  onNavigate?: (page: string, assetId?: string) => void;
}

function getStatusColor(status: Asset['status']) {
  const colors = {
    'Active': 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20',
    'In Repair': 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20',
    'Retired': 'bg-[#64748b]/10 text-[#64748b] border-[#64748b]/20',
    'In Storage': 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20'
  };
  return colors[status] || colors['Active'];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function isWarrantyExpiring(dateString: string): boolean {
  const expiryDate = new Date(dateString);
  const now = new Date();
  const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= 90 && daysUntilExpiry >= 0;
}

export function AssetsTable({ assets, onNavigate }: AssetsTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const handleEdit = (assetId: string) => {
    onNavigate?.('assets-edit', assetId);
  };

  const handleDelete = (assetId: string, assetName: string) => {
    if (confirm(`Are you sure you want to delete ${assetName}?`)) {
      // In a real app, this would call an API to delete the asset
      console.log('Deleting asset:', assetId);
    }
  };

  if (assets.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-12 text-center shadow-sm"
      >
        <div className="max-w-md mx-auto">
          <div className="h-16 w-16 rounded-full bg-[#f8f9ff] flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="h-8 w-8 text-[#6366f1]" />
          </div>
          <h3 className="text-xl font-semibold text-[#1a1d2e] mb-2">No assets found</h3>
          <p className="text-[#64748b] mb-6">
            Try adjusting your filters or search query to find what you're looking for.
          </p>
          <button
            onClick={() => onNavigate?.('assets-add')}
            className="px-6 py-2 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-lg hover:shadow-lg transition-all duration-200"
          >
            Add Your First Asset
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] overflow-hidden shadow-sm"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-[#f8f9ff] to-[#f0f4ff] border-b border-[rgba(0,0,0,0.05)]">
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                Asset
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                Serial Number
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                Assigned To
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                Warranty
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                Cost
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset, index) => (
              <motion.tr
                key={asset.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.25 + index * 0.05 }}
                onMouseEnter={() => setHoveredRow(asset.id)}
                onMouseLeave={() => setHoveredRow(null)}
                className={`
                  border-b border-[rgba(0,0,0,0.05)] transition-all duration-200
                  ${hoveredRow === asset.id ? 'bg-gradient-to-r from-[#f8f9ff] to-transparent' : ''}
                `}
              >
                {/* Asset Name & Type */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`
                      h-10 w-10 rounded-lg flex items-center justify-center text-xs font-semibold
                      ${asset.type === 'Laptop' ? 'bg-[#6366f1]/10 text-[#6366f1]' : ''}
                      ${asset.type === 'Desktop' ? 'bg-[#8b5cf6]/10 text-[#8b5cf6]' : ''}
                      ${asset.type === 'Server' ? 'bg-[#ec4899]/10 text-[#ec4899]' : ''}
                      ${asset.type === 'Monitor' ? 'bg-[#f59e0b]/10 text-[#f59e0b]' : ''}
                      ${asset.type === 'Printer' ? 'bg-[#10b981]/10 text-[#10b981]' : ''}
                      ${asset.type === 'Phone' ? 'bg-[#3b82f6]/10 text-[#3b82f6]' : ''}
                    `}>
                      {asset.type.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-[#1a1d2e]">{asset.name}</p>
                      <p className="text-xs text-[#94a3b8]">{asset.type}</p>
                    </div>
                  </div>
                </td>

                {/* Serial Number */}
                <td className="px-6 py-4">
                  <p className="text-sm text-[#64748b] font-mono">{asset.serialNumber}</p>
                </td>

                {/* Assigned To */}
                <td className="px-6 py-4">
                  <p className="text-sm text-[#1a1d2e] font-medium">{asset.assignedTo}</p>
                </td>

                {/* Department */}
                <td className="px-6 py-4">
                  <p className="text-sm text-[#64748b]">{asset.department}</p>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <span className={`
                    inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border
                    ${getStatusColor(asset.status)}
                  `}>
                    {asset.status}
                  </span>
                </td>

                {/* Warranty */}
                <td className="px-6 py-4">
                  <div>
                    <p className={`text-sm font-medium ${isWarrantyExpiring(asset.warrantyExpiry) ? 'text-[#f59e0b]' : 'text-[#64748b]'}`}>
                      {formatDate(asset.warrantyExpiry)}
                    </p>
                    {isWarrantyExpiring(asset.warrantyExpiry) && (
                      <p className="text-xs text-[#f59e0b]">Expiring soon</p>
                    )}
                  </div>
                </td>

                {/* Cost */}
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-[#1a1d2e]">{formatCurrency(asset.cost)}</p>
                </td>

                {/* Actions */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(asset.id)}
                      className="p-2 rounded-lg hover:bg-[#6366f1]/10 text-[#6366f1] transition-all duration-200 group"
                      title="Edit asset"
                    >
                      <Edit2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id, asset.name)}
                      className="p-2 rounded-lg hover:bg-[#ef4444]/10 text-[#ef4444] transition-all duration-200 group"
                      title="Delete asset"
                    >
                      <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
