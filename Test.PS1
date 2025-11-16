# Example POST with required type_id
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

Invoke-RestMethod -Uri "http://localhost:3000/api/assets" -Method Post -Body $body -ContentType "application/json"