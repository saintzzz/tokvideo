# Invoked hourly by a Windows Task Scheduler task (see
# scripts/setup-task-scheduler.ps1). Pure deterministic Node script, no
# Claude CLI involved — just checks src/suckhoe/published.json for a
# stuck publish schedule and dispatches a catch-up via the GitHub API if
# needed. Same defensive logging pattern as the other run-*.ps1 scripts
# in this repo.

$logPath = Join-Path $PSScriptRoot "catchup-publish.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Add-Content -Path $logPath -Value "`n=== Run at $timestamp ==="

try {
    $repoPath = Split-Path -Parent $PSScriptRoot
    $envFile = Join-Path $PSScriptRoot ".env.github.local"

    if (Test-Path $envFile) {
        Get-Content $envFile | ForEach-Object {
            if ($_ -match "^([^=]+)=(.*)$") {
                [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], "Process")
            }
        }
    } else {
        Add-Content -Path $logPath -Value "WARNING: $envFile not found, GitHub API calls will fail."
    }

    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeCmd) {
        throw "node command not found on PATH in this session."
    }

    if (-not (Test-Path $repoPath)) {
        throw "repoPath does not exist: $repoPath"
    }

    Set-Location $repoPath
    node scripts/check-and-catchup-publish.mjs 2>&1 | Add-Content -Path $logPath

    Add-Content -Path $logPath -Value "=== Finished at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ==="
}
catch {
    Add-Content -Path $logPath -Value "!!! ERROR: $($_.Exception.Message)"
    Add-Content -Path $logPath -Value "!!! Failed at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    exit 1
}
