# signin-and-post.ps1
$creds = @{ email = 'admin@inventos.io'; password = 'MyNewP@ssw0rd' } | ConvertTo-Json
$s = New-Object Microsoft.PowerShell.Commands.WebRequestSession

# Sign in -> sets auth cookie in $s
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/signin" -Method Post -Body $creds -ContentType "application/json" -WebSession $s

# If signin succeeded, $s.Cookies will contain auth_token
$body = @{
    id                  = "AST-test-0001"
    name                = "Test Asset"
    type_id             = 1
    serial_number       = "SN-0001"
    department          = "Engineering"
    status              = "In Store (New)"
    purchase_date       = "2025-11-30"
    end_of_support_date = "2026-11-30"
    end_of_life_date    = "2032-11-30"
    cost                = 100
} | ConvertTo-Json -Depth 6

Invoke-RestMethod -Uri "http://localhost:3000/api/assets" -Method Post -Body $body -ContentType "application/json" -WebSession $s