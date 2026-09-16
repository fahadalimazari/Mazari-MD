$ErrorActionPreference = "Stop"

$repoDir = "C:\Users\Fahad Mazari\Desktop\ArslanMD-Mini-Bot-main\ArslanMD-Mini-Bot-main"
$heroku = "C:\Program Files\heroku\bin\heroku.cmd"

Set-Location $repoDir

Write-Host ""
Write-Host "=== MAZARI MD CODE DEPLOYMENT ===" -ForegroundColor Cyan
Write-Host "Protected: mazari-bot-01, mazari-bot-04"
Write-Host "Deploying: mazari-bot-02, 03, 05 -> 48"
Write-Host ""

if (-not (Test-Path $heroku)) {
    throw "Heroku CLI not found."
}

$commit = (git rev-parse HEAD).Trim()

Write-Host "Deploy commit: $commit" -ForegroundColor Green
Write-Host ""

$failed = @()

foreach ($n in 2..48) {

    if ($n -eq 4) {
        continue
    }

    $app = "mazari-bot-{0:D2}" -f $n
    $remote = "heroku-$app"
    $gitUrl = "https://git.heroku.com/$app.git"

    Write-Host "----------------------------------------" -ForegroundColor DarkGray
    Write-Host "Deploying $app" -ForegroundColor Cyan

    try {

        # Verify app exists
        & $heroku apps:info --app $app *> $null

        if ($LASTEXITCODE -ne 0) {
            throw "$app not found"
        }

        # Create dedicated Git remote if missing
        $existingRemote = git remote get-url $remote 2>$null

        if ([string]::IsNullOrWhiteSpace($existingRemote)) {
            Write-Host "Creating Git remote: $remote" -ForegroundColor Yellow
            git remote add $remote $gitUrl
        }
        elseif ($existingRemote.Trim() -ne $gitUrl) {
            Write-Host "Correcting Git remote: $remote" -ForegroundColor Yellow
            git remote set-url $remote $gitUrl
        }

        # Push exact current commit to Heroku main
        Write-Host "Pushing $commit -> $app" -ForegroundColor Yellow

        git push $remote "HEAD:main"

        if ($LASTEXITCODE -ne 0) {
            throw "Git push failed"
        }

        Write-Host "$app DEPLOYED" -ForegroundColor Green
    }
    catch {
        Write-Host "$app FAILED: $($_.Exception.Message)" -ForegroundColor Red
        $failed += $app
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CODE DEPLOYMENT FINISHED" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($failed.Count -eq 0) {
    Write-Host "ALL TARGET APPS DEPLOYED SUCCESSFULLY" -ForegroundColor Green
}
else {
    Write-Host "FAILED APPS:" -ForegroundColor Red
    $failed | ForEach-Object {
        Write-Host " - $_" -ForegroundColor Red
    }
}

Write-Host ""