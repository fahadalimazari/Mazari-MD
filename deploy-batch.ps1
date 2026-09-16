$ErrorActionPreference = "Stop"

$RepoDir = "C:\Users\Fahad Mazari\Desktop\ArslanMD-Mini-Bot-main\ArslanMD-Mini-Bot-main"
$Branch = "main"

Set-Location $RepoDir

Write-Host ""
Write-Host "=== MAZARI MD BATCH DEPLOY: 02 -> 48 ===" -ForegroundColor Cyan
Write-Host "App 01 will remain untouched." -ForegroundColor Yellow
Write-Host ""

if (-not (Get-Command heroku -ErrorAction SilentlyContinue)) {
    $env:Path += ";C:\Program Files\heroku\bin"
}

if (-not (Get-Command heroku -ErrorAction SilentlyContinue)) {
    throw "Heroku CLI not found."
}

if ([string]::IsNullOrWhiteSpace($env:NEON_URL)) {
    throw "NEON_URL is not set in this PowerShell session."
}

$status = @(git status --porcelain | Where-Object {
    $_ -notmatch '^\?\?\s+deploy-batch\.ps1$' -and
    $_ -notmatch '^\?\?\s+test-db\.js$'
})

if ($status.Count -gt 0) {
    Write-Host "ERROR: Other Git changes exist:" -ForegroundColor Red
    $status
    exit 1
}

Write-Host "Heroku CLI: OK" -ForegroundColor Green
Write-Host "NEON_URL: SET" -ForegroundColor Green
Write-Host "Git: CLEAN" -ForegroundColor Green

$app01 = (heroku config:get SERVER_ID --app mazari-bot-01).Trim()

if ($app01 -ne "mazari-bot-01") {
    throw "App 01 SERVER_ID check failed: $app01"
}

Write-Host "App 01 check: OK (READ ONLY)" -ForegroundColor Green

for ($i = 2; $i -le 48; $i++) {

    $app = "mazari-bot-{0:D2}" -f $i

    Write-Host ""
    Write-Host "----------------------------------------" -ForegroundColor DarkCyan
    Write-Host "Processing $app" -ForegroundColor Cyan
    Write-Host "----------------------------------------" -ForegroundColor DarkCyan

    try {

        $info = heroku apps:info --app $app --json | ConvertFrom-Json
        $serverUrl = $info.app.web_url.TrimEnd("/")

        if ([string]::IsNullOrWhiteSpace($serverUrl)) {
            throw "Heroku URL not found."
        }

        heroku config:set "SERVER_ID=$app" --app $app | Out-Null
        heroku config:set "SERVER_URL=$serverUrl" --app $app | Out-Null
        heroku config:set "DATABASE_URL=$env:NEON_URL" --app $app | Out-Null

        $verifyId = (heroku config:get SERVER_ID --app $app).Trim()
        $verifyUrl = (heroku config:get SERVER_URL --app $app).Trim()

        if ($verifyId -ne $app) {
            throw "SERVER_ID verification failed."
        }

        if ($verifyUrl -ne $serverUrl) {
            throw "SERVER_URL verification failed."
        }

        $remote = "heroku-$app"
        $remoteExists = git remote get-url $remote 2>$null

        if (-not $remoteExists) {
            git remote add $remote "https://git.heroku.com/$app.git"
        }

        git push $remote "${Branch}:main"

        Write-Host "$app DEPLOYED" -ForegroundColor Green

    }
    catch {

        Write-Host "$app FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== BATCH DEPLOYMENT FINISHED ===" -ForegroundColor Cyan
Write-Host "App 01 was not modified." -ForegroundColor Yellow
