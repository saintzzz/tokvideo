# Invoked hourly by a Windows Task Scheduler task (see
# scripts/setup-task-scheduler.ps1). Checks whether a private
# animated-film upload has been approved (flipped to public by the
# channel owner) and, if so, keeps the pipeline moving: mux+upload a
# finished render, or start the next episode's render. See
# scripts/animated-film-pipeline-tick.mjs for the actual logic — this is
# just the env-loading/logging wrapper, same pattern as the other
# run-*.ps1 scripts in this repo.

$logPath = Join-Path $PSScriptRoot "animated-film-pipeline.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Add-Content -Path $logPath -Value "`n=== Run at $timestamp ==="

try {
    $repoPath = Split-Path -Parent $PSScriptRoot
    $envFile = Join-Path $PSScriptRoot ".env.youtube.local"

    if (Test-Path $envFile) {
        Get-Content $envFile | ForEach-Object {
            if ($_ -match "^([^=]+)=(.*)$") {
                [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], "Process")
            }
        }
    } else {
        Add-Content -Path $logPath -Value "WARNING: $envFile not found, YouTube API calls will fail."
    }

    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeCmd) {
        throw "node command not found on PATH in this session."
    }
    if (-not (Test-Path $repoPath)) {
        throw "repoPath does not exist: $repoPath"
    }

    Set-Location $repoPath
    node scripts/animated-film-pipeline-tick.mjs 2>&1 | Add-Content -Path $logPath

    Add-Content -Path $logPath -Value "=== Finished at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ==="
}
catch {
    Add-Content -Path $logPath -Value "!!! ERROR: $($_.Exception.Message)"
    Add-Content -Path $logPath -Value "!!! Failed at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    exit 1
}
