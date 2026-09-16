$ErrorActionPreference = "Stop"

$heroku = "C:\Program Files\heroku\bin\heroku.cmd"
$repoDir = "C:\Users\Fahad Mazari\Desktop\ArslanMD-Mini-Bot-main\ArslanMD-Mini-Bot-main"

Set-Location $repoDir

Write-Host ""
Write-Host "=== MAZARI MD SAFE BATCH CONFIG ===" -ForegroundColor Cyan
Write-Host "Protected: 01, 02, 04"
Write-Host "Target: 03, 05 -> 48"
Write-Host ""

# Check Heroku
if (-not (Test-Path $heroku)) {
    throw "Heroku CLI not found: $heroku"
}

# Check Neon URL
if ([string]::IsNullOrWhiteSpace($env:NEON_URL)) {
    throw "NEON_URL is missing in this PowerShell session."
}

# Remove problematic optional parameter
$databaseUrl = $env:NEON_URL -replace '&channel_binding=require',''

Write-Host "NEON_URL: SET" -ForegroundColor Green
Write-Host ""

$failed = @()

foreach ($n in 3..48) {

    $app = "mazari-bot-{0:D2}" -f $n

    if ($n -eq 4) {
        continue
    }

    Write-Host "----------------------------------------" -ForegroundColor DarkGray
    Write-Host "Processing $app" -ForegroundColor Cyan

    try {

        # Verify app exists
        & $heroku apps:info --app $app *> $null

        if ($LASTEXITCODE -ne 0) {
            throw "$app not found"
        }

        # Verify SERVER_ID
        $serverId = (& $heroku config:get SERVER_ID --app $app).Trim()

        if ($serverId -ne $app) {
            Write-Host "Setting SERVER_ID = $app" -ForegroundColor Yellow
            & $heroku config:set "SERVER_ID=$app" --app $app

            if ($LASTEXITCODE -ne 0) {
                throw "SERVER_ID failed"
            }
        }
        else {
            Write-Host "SERVER_ID: OK" -ForegroundColor Green
        }

        # Get actual Heroku Web URL
        $infoJson = (& $heroku apps:info --json --app $app | Out-String)
        $info = $infoJson | ConvertFrom-Json
        $serverUrl = ($info.app.web_url).TrimEnd('/')

        if ([string]::IsNullOrWhiteSpace($serverUrl)) {
            throw "Could not determine Web URL"
        }

        # Set SERVER_URL
        Write-Host "Setting SERVER_URL" -ForegroundColor Yellow

        & $heroku config:set "SERVER_URL=$serverUrl" --app $app

        if ($LASTEXITCODE -ne 0) {
            throw "SERVER_URL failed"
        }

        # Set DATABASE_URL
        Write-Host "Setting DATABASE_URL" -ForegroundColor Yellow

        & $heroku config:set "DATABASE_URL=$databaseUrl" --app $app

        if ($LASTEXITCODE -ne 0) {
            throw "DATABASE_URL failed"
        }

        # Verify without printing secret
        $verifyDb = (& $heroku config:get DATABASE_URL --app $app).Trim()

        if ([string]::IsNullOrWhiteSpace($verifyDb)) {
            throw "DATABASE_URL verification failed"
        }

        $verifyServer = (& $heroku config:get SERVER_ID --app $app).Trim()

        if ($verifyServer -ne $app) {
            throw "SERVER_ID verification failed"
        }

        Write-Host "$app SUCCESS" -ForegroundColor Green
    }
    catch {
        Write-Host "$app FAILED: $($_.Exception.Message)" -ForegroundColor Red
        $failed += $app
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BATCH CONFIGURATION FINISHED" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($failed.Count -eq 0) {
    Write-Host "ALL TARGET APPS SUCCESSFUL" -ForegroundColor Green
}
else {
    Write-Host "FAILED APPS:" -ForegroundColor Red
    $failed | ForEach-Object {
        Write-Host " - $_" -ForegroundColor Red
    }
}

Write-Host ""