# -*- powershell -*-
<#
.SYNOPSIS
    一键打包 Print Proxy 为 Windows EXE 可执行文件

.DESCRIPTION
    此脚本自动完成以下步骤：
    1. 创建独立的虚拟环境 (.venv_pack)
    2. 安装项目依赖和 PyInstaller
    3. 清理旧的构建文件
    4. 使用 PyInstaller 打包为单文件 EXE
    5. 显示打包结果和文件信息

.PARAMETER Clean
    是否清理虚拟环境后重新创建（默认：否）

.PARAMETER SkipTests
    是否跳过测试（默认：否）

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts\windows\build_exe.ps1
    
.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts\windows\build_exe.ps1 -Clean

.NOTES
    作者: Print Proxy Team
    版本: 2.0
    更新: 2025-10-25
#>

[CmdletBinding()]
param(
    [switch]$Clean = $false,
    [switch]$SkipTests = $false
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# 颜色输出函数
function Write-Step {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "  $Message" -ForegroundColor Gray
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

# Start build
Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "       Print Proxy Windows EXE Build Tool" -ForegroundColor Cyan
Write-Host "                    Version 2.0" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date

try {
    # 1. Check Python
    Write-Step "Step 1/7: Check Python Environment"
    
    $pythonCmd = Get-Command python -ErrorAction SilentlyContinue
    if (-not $pythonCmd) {
        Write-Error "Python not found, please install Python 3.11+"
        exit 1
    }
    
    $pythonVersion = & python --version 2>&1
    Write-Success "Found Python: $pythonVersion"
    Write-Info "Path: $($pythonCmd.Source)"

    # 2. Setup project path
    Write-Step "Step 2/7: Setup Project Path"
    
    $projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
    Push-Location $projectRoot
    
    Write-Success "Project Root: $projectRoot"

    # 3. Create/Update virtual environment
    Write-Step "Step 3/7: Prepare Virtual Environment"
    
    $venvPath = Join-Path $projectRoot '.venv_pack'
    
    if ($Clean -and (Test-Path $venvPath)) {
        Write-Info "Cleaning old virtual environment..."
        Remove-Item $venvPath -Recurse -Force
        Write-Success "Old environment cleaned"
    }
    
    if (-not (Test-Path $venvPath)) {
        Write-Info "Creating new virtual environment..."
        & python -m venv $venvPath
        Write-Success "Virtual environment created"
    } else {
        Write-Success "Using existing virtual environment"
    }

    $pythonExe = Join-Path $venvPath 'Scripts\python.exe'
    $pipExe = Join-Path $venvPath 'Scripts\pip.exe'

    # 4. Install dependencies
    Write-Step "Step 4/7: Install Dependencies"
    
    Write-Info "Upgrading pip, setuptools, wheel..."
    & $pythonExe -m pip install --upgrade pip setuptools wheel --quiet
    Write-Success "Base tools upgraded"
    
    Write-Info "Installing project dependencies (may take a few minutes)..."
    & $pipExe install -r requirements.txt --quiet
    Write-Success "Project dependencies installed"
    
    # Note: SVG support (cairosvg) is disabled by default in EXE builds
    # to avoid Cairo DLL compatibility issues on Windows
    Write-Info "SVG support disabled in EXE build (Cairo DLL issues)"
    Write-Info "Use ENABLE_SVG=1 environment variable to enable if needed"
    
    Write-Info "Installing PyInstaller..."
    & $pipExe install 'pyinstaller==5.13.0' --quiet
    Write-Success "PyInstaller installed"

    # 5. Run tests (optional)
    if (-not $SkipTests) {
        Write-Step "Step 5/7: Run Tests"
        
        Write-Info "Running unit tests..."
        try {
            $testResult = & $pythonExe -m pytest tests/ -v --tb=short 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "All tests passed"
            } else {
                Write-Warning "Some tests failed, but continuing build"
            }
        } catch {
            Write-Warning "Test execution failed, but continuing build"
            Write-Info "Use -SkipTests parameter to skip tests"
        }
    } else {
        Write-Step "Step 5/7: Skip Tests"
        Write-Info "Used -SkipTests parameter"
    }

    # 6. Clean and build
    Write-Step "Step 6/7: Build EXE"
    
    # Stop running process
    $runningProcess = Get-Process -Name 'PrintProxy' -ErrorAction SilentlyContinue
    if ($runningProcess) {
        Write-Info "Stopping running PrintProxy process..."
        $runningProcess | Stop-Process -Force
        Write-Success "Process stopped"
    }

    # Clean Python cache files first
    Write-Info "Cleaning Python cache files..."
    Get-ChildItem -Path $projectRoot -Recurse -Name "__pycache__" -Directory | Where-Object { $_ -notlike "*\.venv_*" } | ForEach-Object {
        $fullPath = Join-Path $projectRoot $_
        if (Test-Path $fullPath) {
            Remove-Item $fullPath -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
    
    # Clean pytest cache
    $pytestCache = Join-Path $projectRoot '.pytest_cache'
    if (Test-Path $pytestCache) {
        Remove-Item $pytestCache -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    # Clean test databases
    Get-ChildItem -Path $projectRoot -Name "test_*.db" | ForEach-Object {
        Remove-Item (Join-Path $projectRoot $_) -Force -ErrorAction SilentlyContinue
    }
    
    Write-Success "Python cache files cleaned"

    # Clean old build files
    $distPath = Join-Path $projectRoot 'dist'
    $buildPath = Join-Path $projectRoot 'build'
    
    if (Test-Path $distPath) {
        Write-Info "Cleaning old dist directory..."
        Remove-Item $distPath -Recurse -Force
    }
    
    if (Test-Path $buildPath) {
        Write-Info "Cleaning old build directory..."
        Remove-Item $buildPath -Recurse -Force
    }
    
    Write-Success "Build directories cleaned"

    # Execute build
    Write-Info "Starting build (may take 2-5 minutes)..."
    Write-Info "Building... (warnings are normal)"
    Write-Host ""
    
    # Set environment variables to prevent cache generation
    $env:PYTHONDONTWRITEBYTECODE = "1"
    $env:PYTHONPYCACHEPREFIX = $null
    
    $pyInstallerExe = Join-Path $venvPath 'Scripts\pyinstaller.exe'
    $args = @(
        '--clean',
        '--noconfirm',
        '--onefile',
        '--noconsole',
        '--name', 'PrintProxy',
        '--paths', $projectRoot,
        '--collect-all', 'pywin32',
        '--collect-all', 'uvicorn',
        '--collect-all', 'jinja2',

        '--collect-submodules', 'app',
        '--hidden-import', 'app.main',
        '--hidden-import', 'passlib.handlers.bcrypt',
        '--hidden-import', 'win32timezone',

        '--add-data', 'app\templates;app\templates',
        'scripts\windows\run_app.py'
    )

    # Run PyInstaller and show progress
    & $pyInstallerExe @args
    
    Write-Host ""
    
    # Clean cache files generated during build
    Write-Info "Cleaning cache files generated during build..."
    Get-ChildItem -Path $projectRoot -Recurse -Name "__pycache__" -Directory | Where-Object { $_ -notlike "*\.venv_*" } | ForEach-Object {
        $fullPath = Join-Path $projectRoot $_
        if (Test-Path $fullPath) {
            Remove-Item $fullPath -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Success "Post-build cache cleanup completed"

    # 7. Verify result
    Write-Step "Step 7/7: Verify Build Result"
    
    $exePath = Join-Path $distPath 'PrintProxy.exe'
    
    if (-not (Test-Path $exePath)) {
        Write-Host ""
        Write-Host "========================================================" -ForegroundColor Red
        Write-Host "                  Build Failed!" -ForegroundColor Red
        Write-Host "========================================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "EXE file was not created. Possible reasons:" -ForegroundColor Yellow
        Write-Host "  1. PyInstaller encountered errors" -ForegroundColor Gray
        Write-Host "  2. Insufficient disk space" -ForegroundColor Gray
        Write-Host "  3. Antivirus blocked the build" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Try:" -ForegroundColor Yellow
        Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\windows\build_exe.ps1 -Clean -SkipTests" -ForegroundColor White
        Write-Host ""
        exit 1
    }

    $exeFile = Get-Item $exePath
    $sizeInMB = [math]::Round($exeFile.Length / 1MB, 2)
    
    Write-Success "EXE file generated successfully!"
    Write-Host ""
    Write-Host "File Information:" -ForegroundColor Cyan
    Write-Info "Name: $($exeFile.Name)"
    Write-Info "Size: $sizeInMB MB ($($exeFile.Length) bytes)"
    Write-Info "Path: $($exeFile.FullName)"
    Write-Info "Created: $($exeFile.CreationTime)"
    Write-Info "Modified: $($exeFile.LastWriteTime)"

    # Calculate duration
    $endTime = Get-Date
    $duration = $endTime - $startTime
    $minutes = [math]::Floor($duration.TotalMinutes)
    $seconds = $duration.Seconds
    $durationStr = "$minutes min $seconds sec"

    # Success summary
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "              Build Completed Successfully!" -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Total Time: $durationStr" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Run EXE: " -NoNewline
    Write-Host ".\dist\PrintProxy.exe" -ForegroundColor White
    Write-Host "  2. Test Service: " -NoNewline
    Write-Host "http://localhost:8568" -ForegroundColor White
    Write-Host "  3. View Docs: " -NoNewline
    Write-Host "http://localhost:8568/docs" -ForegroundColor White
    Write-Host ""
    Write-Host "Tips:" -ForegroundColor Gray
    Write-Host "  - First run creates database and logs in %APPDATA%\PrintProxy" -ForegroundColor Gray
    Write-Host "  - Default admin: admin / admin123" -ForegroundColor Gray
    Write-Host "  - Use -Clean to recreate virtual environment" -ForegroundColor Gray
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Red
    Write-Host "                  Unexpected Error!" -ForegroundColor Red
    Write-Host "========================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error Details:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host $_.ScriptStackTrace -ForegroundColor Gray
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Try: powershell -ExecutionPolicy Bypass -File scripts\windows\build_exe.ps1 -Clean -SkipTests" -ForegroundColor White
    Write-Host "  2. Check: BUILD_GUIDE.txt for more help" -ForegroundColor White
    Write-Host ""
    exit 1
} finally {
    Pop-Location
}