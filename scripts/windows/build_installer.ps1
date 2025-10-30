# Build PrintProxy Simple Installer (Auto-start version, no Windows Service)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PrintProxy Simple Installer Builder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get project root (go up two levels from scripts/windows)
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Write-Host "Project Root: $projectRoot" -ForegroundColor Gray

# Check if PrintProxy.exe exists
$exePath = Join-Path $projectRoot "dist\PrintProxy.exe"
Write-Host "Looking for EXE: $exePath" -ForegroundColor Gray

if (-not (Test-Path $exePath)) {
    Write-Host ""
    Write-Host "ERROR: PrintProxy.exe not found" -ForegroundColor Red
    Write-Host "Expected location: $exePath" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please run build.bat first to create the EXE" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

$exeFile = Get-Item $exePath
$exeSizeMB = [math]::Round($exeFile.Length / 1MB, 2)
Write-Host "[OK] PrintProxy.exe found ($exeSizeMB MB)" -ForegroundColor Green

# Check templates directory
$templatesDir = Join-Path $projectRoot "app\templates"
if (-not (Test-Path $templatesDir)) {
    Write-Host "ERROR: Templates directory not found: $templatesDir" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Templates directory found" -ForegroundColor Green

# Check if makensis is available
$makensis = Get-Command makensis.exe -ErrorAction SilentlyContinue
if (-not $makensis) {
    Write-Host ""
    Write-Host "ERROR: makensis.exe not found in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install NSIS 3.x and add to PATH" -ForegroundColor Yellow
    Write-Host "Download from: https://nsis.sourceforge.io/Download" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "[OK] NSIS found: $($makensis.Source)" -ForegroundColor Green
Write-Host ""

# Build the installer
Write-Host "Building installer..." -ForegroundColor Cyan
Write-Host ""

# Pass absolute paths to NSIS
$scriptPath = Join-Path $PSScriptRoot "print_proxy_installer.nsi"
$distPath = Join-Path $projectRoot "dist"
$templatesPath = Join-Path $projectRoot "app\templates"

# Build with absolute paths
Push-Location $PSScriptRoot
try {
    & makensis.exe `
        "/DPROJECT_ROOT=$projectRoot" `
        "/DDIST_PATH=$distPath" `
        "/DTEMPLATES_PATH=$templatesPath" `
        "/DOUT_PATH=$distPath" `
        "print_proxy_installer.nsi"
    
    $buildResult = $LASTEXITCODE
} finally {
    Pop-Location
}

if ($buildResult -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Installer Built Successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    # Check for installer in dist directory
    $installerPath = Join-Path $distPath "PrintProxySetup_1.0.0.exe"
    if (Test-Path $installerPath) {
        $installerFile = Get-Item $installerPath
        $installerSizeMB = [math]::Round($installerFile.Length / 1MB, 2)
        Write-Host "Output: $installerPath" -ForegroundColor Yellow
        Write-Host "Size: $installerSizeMB MB" -ForegroundColor Gray
    } else {
        Write-Host "Output: dist\PrintProxySetup_1.0.0.exe" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "This installer:" -ForegroundColor White
    Write-Host "  - Does NOT require password input" -ForegroundColor Green
    Write-Host "  - Does NOT use Windows Service" -ForegroundColor Green
    Write-Host "  - Uses Registry auto-start (runs as current user)" -ForegroundColor Green
    Write-Host "  - Full printer access automatically" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Installer build failed" -ForegroundColor Red
    Write-Host "Exit code: $buildResult" -ForegroundColor Red
    Write-Host ""
    exit 1
}
