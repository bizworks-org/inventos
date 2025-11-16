# Prepare request body
$body = @{ email = 'admin@inventos.io'; password = '<THEPASSWORD>' } | ConvertTo-Json

# Send request and capture response even on HTTP 500
try {
    $res = Invoke-WebRequest -Uri 'http://localhost:3000/api/auth/signin' -Method Post -Body $body -ContentType 'application/json' -UseBasicParsing -ErrorAction Stop

    # On success, show Set-Cookie header and extract token
    $sc = $res.Headers['Set-Cookie']
    Write-Output "Set-Cookie header: $sc"
    if ($sc -match 'auth_token=([^;]+)') {
        $token = $matches[1]
        Write-Output "auth_token: $token"
    }
    else {
        Write-Output "No auth_token found in Set-Cookie."
    }
}
catch {
    # When Invoke-WebRequest throws, read the HTTP response body for details
    $resp = $_.Exception.Response
    if ($resp -ne $null) {
        $status = $resp.StatusCode.value__
        $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
        $txt = $sr.ReadToEnd()
        Write-Output "HTTP Status: $status"
        Write-Output "Response body (server error):`n$txt"
    }
    else {
        Write-Output "Invoke-WebRequest failed: $($_.Exception.Message)"
    }
}