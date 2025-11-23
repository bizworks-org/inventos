# Dark Mode Batch Update Script
# This script updates all Add/Edit form pages with dark mode support

$files = @(
    "src/components/assetflow/assets/AddAssetPage.tsx",
    "src/components/assetflow/assets/EditAssetPage.tsx",
    "src/components/assetflow/vendors/AddVendorPage.tsx",
    "src/components/assetflow/vendors/EditVendorPage.tsx",
    "src/components/assetflow/licenses/AddLicensePage.tsx",
    "src/components/assetflow/licenses/EditLicensePage.tsx"
)

$replacements = @{
    'text-\[#1a1d2e\]' = 'text-gray-900 dark:text-gray-100'
    'text-\[#64748b\]' = 'text-gray-600 dark:text-gray-400'
    'text-\[#94a3b8\]' = 'text-gray-500 dark:text-gray-400'
    'text-\[#475569\]' = 'text-gray-700 dark:text-gray-300'
    'text-\[#a0a4b8\]' = 'text-gray-500 dark:text-gray-400'
    'text-\[#111827\]' = 'text-gray-900 dark:text-gray-100'
    'bg-white(?!/)' = 'bg-white dark:bg-gray-800'
    'bg-\[#f8f9ff\]' = 'bg-gray-50 dark:bg-gray-900'
    'bg-\[#f3f3f5\]' = 'bg-gray-100 dark:bg-gray-800'
    'bg-\[#f0f4ff\]' = 'bg-gray-100 dark:bg-gray-800'
    'border-\[rgba\(0,0,0,0\.08\)\]' = 'border-gray-200 dark:border-gray-700'
    'border-\[rgba\(0,0,0,0\.05\)\]' = 'border-gray-100 dark:border-gray-800'
    'border-\[rgba\(0,0,0,0\.12\)\]' = 'border-gray-300 dark:border-gray-600'
    'border-\[rgba\(0,0,0,0\.1\)\]' = 'border-gray-200 dark:border-gray-700'
    'border-\[rgba\(0,0,0,0\.06\)\]' = 'border-gray-200 dark:border-gray-700'
}

foreach ($file in $files) {
    $filePath = Join-Path $PSScriptRoot ".." $file
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw
        $originalContent = $content
        
        foreach ($pattern in $replacements.Keys) {
            $replacement = $replacements[$pattern]
            $content = $content -replace $pattern, $replacement
        }
        
        if ($content -ne $originalContent) {
            Set-Content $filePath $content -NoNewline
            Write-Host "Updated: $file" -ForegroundColor Green
        } else {
            Write-Host "No changes: $file" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Not found: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Dark mode update complete" -ForegroundColor Cyan
