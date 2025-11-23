// Script to add dark mode classes to components
// This will be run manually to update hardcoded colors

const colorMappings = {
  // Text colors
  'text-[#1a1d2e]': 'text-gray-900 dark:text-gray-100',
  'text-[#64748b]': 'text-gray-600 dark:text-gray-400',
  'text-[#94a3b8]': 'text-gray-500 dark:text-gray-400',
  'text-[#475569]': 'text-gray-700 dark:text-gray-300',
  'text-[#6b7280]': 'text-gray-600 dark:text-gray-400',
  'text-[#717182]': 'text-gray-600 dark:text-gray-400',
  
  // Background colors
  'bg-white': 'bg-white dark:bg-gray-800',
  'bg-[#f8f9ff]': 'bg-gray-50 dark:bg-gray-900',
  'bg-[#f0f4ff]': 'bg-gray-100 dark:bg-gray-800',
  'bg-[#f3f4f6]': 'bg-gray-100 dark:bg-gray-700',
  'bg-[#e5e7eb]': 'bg-gray-200 dark:bg-gray-700',
  'bg-[#ececf0]': 'bg-gray-200 dark:bg-gray-700',
  'bg-[#eef2ff]': 'bg-indigo-50 dark:bg-indigo-950',
  
  // Border colors
  'border-[rgba(0,0,0,0.08)]': 'border-gray-200 dark:border-gray-700',
  'border-[rgba(0,0,0,0.05)]': 'border-gray-100 dark:border-gray-800',
  'border-[rgba(0,0,0,0.12)]': 'border-gray-300 dark:border-gray-600',
  'border-[rgba(0,0,0,0.1)]': 'border-gray-200 dark:border-gray-700',
};

console.log('Dark mode color mappings:');
console.log(JSON.stringify(colorMappings, null, 2));
