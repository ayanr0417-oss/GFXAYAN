$port = 8000

# Step 1: Kill any existing process on port 8000 to prevent conflicts
Write-Host "Checking for existing processes on port $port..." -ForegroundColor Cyan
$existingProcess = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($existingProcess) {
    Write-Host "Found existing process on port $port. Stopping it..." -ForegroundColor Yellow
    foreach ($proc in $existingProcess) {
        Stop-Process -Id $proc.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 1
}

# Step 2: Initialize HTTP Listener
$listener = New-Object System.Net.HttpListener

# Bind to localhost, IPv4 loopback, and IPv6 loopback for maximum browser compatibility
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://127.0.0.1:$port/")
$listener.Prefixes.Add("http://[::1]:$port/")

try {
    $listener.Start()
} catch {
    Write-Error "Failed to start listener. Port $port might still be in use by another system service."
    pause
    exit
}

Write-Host "=============================================" -ForegroundColor Green
Write-Host "   NATIVE WINDOWS WEB SERVER STARTED" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host "Serving files from: C:\Users\acer\..scratch\portfolio-website"
Write-Host "Listening on: http://127.0.0.1:$port/  (or http://localhost:$port/)" -ForegroundColor Yellow
Write-Host "Press Ctrl+C in this window to stop the server." -ForegroundColor Cyan
Write-Host "============================================="
Write-Host "Waiting for connections..."

# Open browser using the IPv4 loopback address (most reliable)
Start-Process "http://127.0.0.1:$port"

$baseDir = "C:\Users\acer\.gemini\antigravity\scratch\portfolio-website"

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq "/") { $urlPath = "/index.html" }
        
        # Log request to console for debugging
        Write-Host "[$([DateTime]::Now.ToString('HH:mm:ss'))] $($request.HttpMethod) $($urlPath) - $($response.StatusCode)" -ForegroundColor Gray
        
        # Security check: ensure path doesn't escape baseDir
        $filePath = [System.IO.Path]::GetFullPath((Join-Path $baseDir $urlPath))
        if (-not $filePath.StartsWith($baseDir, [System.StringComparison]::OrdinalIgnoreCase)) {
            $response.StatusCode = 403
            $response.Close()
            continue
        }
        
        if (Test-Path $filePath -PathType Leaf) {
            try {
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                
                # Content-Type Mapping
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $contentType = "text/html"
                if ($ext -eq ".css") { $contentType = "text/css" }
                elseif ($ext -eq ".js") { $contentType = "application/javascript" }
                elseif ($ext -eq ".jpg" -or $ext -eq ".jpeg") { $contentType = "image/jpeg" }
                elseif ($ext -eq ".png") { $contentType = "image/png" }
                elseif ($ext -eq ".svg") { $contentType = "image/svg+xml" }
                
                $response.ContentType = $contentType
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } catch {
                $response.StatusCode = 500
            }
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    }
} catch {
    # Handled server close
} finally {
    $listener.Stop()
}
