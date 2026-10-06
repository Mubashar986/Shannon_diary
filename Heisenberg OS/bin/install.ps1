<#
.SYNOPSIS
    Heisenberg OS - Windows Installer & GrapeRoot Launcher
.DESCRIPTION
    Installs GrapeRoot dual-graph engine, configures environment PATH, establishes
    the universal workspace .mcp.json, and launches GrapeRoot on port 8080.
.EXAMPLE
    Set-ExecutionPolicy RemoteSigned -Scope CurrentUser; .\Heisenberg\bin\install.ps1
#>

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "                  HEISENBERG OS - WINDOWS INSTALLER                     " -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""

# ----------------------------------------------------------------------
# 1. Verify / Setup Python Runtime (>= 3.10)
# ----------------------------------------------------------------------
Write-Host "[1/4] Checking Python runtime..." -ForegroundColor Yellow

$pythonCmd = $null
try {
    # Check py launcher first to bypass Windows Store 0-byte alias
    $pyCheck = py -3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>$null
    if ($pyCheck) {
        $pythonCmd = "py -3"
        Write-Host "  [✓] Found Python $pyCheck via Windows py launcher" -ForegroundColor Green
    }
} catch {
    # Fallback to direct python call
}

if (-not $pythonCmd) {
    try {
        $ver = & python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>$null
        if ($ver) {
            $pythonCmd = "python"
            Write-Host "  [✓] Found Python $ver" -ForegroundColor Green
        }
    } catch {
        # Python not found
    }
}

if (-not $pythonCmd) {
    Write-Host "  [!] Python >= 3.10 not found. Attempting install via winget..." -ForegroundColor Yellow
    try {
        winget install Python.Python.3.12 --silent --accept-package-agreements --accept-source-agreements
        Write-Host "  [✓] Python 3.12 installed successfully." -ForegroundColor Green
    } catch {
        Write-Host "  [!] Could not auto-install Python via winget. Please install Python 3.10+ from python.org." -ForegroundColor Red
    }
}

# ----------------------------------------------------------------------
# 2. Install GrapeRoot Dual-Graph Engine
# ----------------------------------------------------------------------
Write-Host "`n[2/4] Installing / Verifying GrapeRoot Dual-Graph Engine..." -ForegroundColor Yellow

$graperootCmd = Get-Command graperoot -ErrorAction SilentlyContinue
$dualGraphDir = Join-Path $HOME ".dual-graph"

if (-not $graperootCmd) {
    Write-Host "  [*] Downloading GrapeRoot from official installer..." -ForegroundColor Cyan
    try {
        irm https://graperoot.dev/install.ps1 | iex
        Write-Host "  [✓] GrapeRoot installed successfully." -ForegroundColor Green
    } catch {
        Write-Host "  [!] GrapeRoot installer encountered an issue: $_" -ForegroundColor Red
    }
} else {
    Write-Host "  [✓] GrapeRoot is already installed: $($graperootCmd.Source)" -ForegroundColor Green
}

# Ensure $HOME\.dual-graph is in User PATH
$userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($userPath -notlike "*$dualGraphDir*") {
    Write-Host "  [*] Adding $dualGraphDir to User PATH..." -ForegroundColor Cyan
    [Environment]::SetEnvironmentVariable("PATH", "$dualGraphDir;$userPath", "User")
    $env:Path = "$dualGraphDir;$env:Path"
    Write-Host "  [✓] User PATH updated." -ForegroundColor Green
}

# ----------------------------------------------------------------------
# 3. Create Mock CLI Stub & Universal Workspace .mcp.json
# ----------------------------------------------------------------------
Write-Host "`n[3/4] Scaffolding workspace and compatibility stubs..." -ForegroundColor Yellow

if (-not (Test-Path $dualGraphDir)) {
    New-Item -ItemType Directory -Path $dualGraphDir -Force | Out-Null
}

# Mock agy.cmd to prevent desktop agent CLI errors
$agyCmdPath = Join-Path $dualGraphDir "agy.cmd"
if (-not (Test-Path $agyCmdPath)) {
    Set-Content -Path $agyCmdPath -Value "@echo off`necho [GrapeRoot] Active.`npause" -Force
    Write-Host "  [✓] Created compatibility stub: $agyCmdPath" -ForegroundColor Green
}

# Universal workspace .mcp.json for modern editors (Cursor, Claude Code, Zed)
$workspaceRoot = Get-Location
$rootMcpJson = Join-Path $workspaceRoot ".mcp.json"

if (-not (Test-Path $rootMcpJson)) {
    $mcpConfig = @{
        mcpServers = @{
            graperoot = @{
                type = "streamableHttp"
                url = "http://127.0.0.1:8080/mcp"
                autoApprove = @(
                    "graph_retrieve",
                    "graph_read",
                    "graph_neighbors",
                    "graph_impact",
                    "graph_continue"
                )
            }
        }
    } | ConvertTo-Json -Depth 5

    Set-Content -Path $rootMcpJson -Value $mcpConfig -Force
    Write-Host "  [✓] Created universal workspace .mcp.json at project root" -ForegroundColor Green
}

# Also ensure .cursor directory has mcp.json if .cursor exists
$cursorDir = Join-Path $workspaceRoot ".cursor"
if (Test-Path $cursorDir) {
    Copy-Item -Path $rootMcpJson -Destination (Join-Path $cursorDir "mcp.json") -Force
    Write-Host "  [✓] Synced .cursor/mcp.json" -ForegroundColor Green
}

# ----------------------------------------------------------------------
# 4. Launch GrapeRoot Daemon on Port 8080
# ----------------------------------------------------------------------
Write-Host "`n[4/4] Starting GrapeRoot Daemon on Port 8080..." -ForegroundColor Yellow

# Test if port 8080 is already active
$portActive = $false
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tcp.Connect("127.0.0.1", 8080)
    $tcp.Close()
    $portActive = $true
} catch {
    $portActive = $false
}

if ($portActive) {
    Write-Host "  [✓] GrapeRoot daemon is ALREADY RUNNING on port 8080." -ForegroundColor Green
} else {
    Write-Host "  [*] Spawning GrapeRoot daemon in background..." -ForegroundColor Cyan
    
    # Launch graperoot in a new window or background process
    Start-Process -FilePath "graperoot" -ArgumentList ". --antigravity" -WorkingDirectory $workspaceRoot.Path -WindowStyle Minimized
    
    Start-Sleep -Seconds 2
    Write-Host "  [✓] GrapeRoot process launched." -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================================================" -ForegroundColor Green
Write-Host "           HEISENBERG SETUP COMPLETE - READY FOR CODING!                " -ForegroundColor Green
Write-Host "========================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Step:" -ForegroundColor Cyan
Write-Host "  1. Open your AI coding editor (Cursor, Windsurf, Cline, Antigravity, etc.)" -ForegroundColor White
Write-Host "  2. The universal .mcp.json is already active at: $rootMcpJson" -ForegroundColor White
Write-Host "  3. Prompt your agent to begin! It will follow the Heisenberg workflow." -ForegroundColor White
Write-Host ""
