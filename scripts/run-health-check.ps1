# Invoked daily by Windows Task Scheduler (registered by
# setup-task-scheduler.ps1). Runs the automation heartbeat and commits
# src/suckhoe/automation-health.json so a dead/stuck machine is visible
# from the repo — the file's checkedAt simply stops advancing.
# Logs to health-check.log next to this script.

$logPath = Join-Path $PSScriptRoot "health-check.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Add-Content -Path $logPath -Value "`n=== Run at $timestamp ==="
Add-Content -Path $logPath -Value "User: $(whoami) | PID: $PID"

try {
    $repoPath = Split-Path -Parent $PSScriptRoot
    Set-Location $repoPath

    node scripts/check-automation-health.mjs --write 2>&1 | Add-Content -Path $logPath

    # Commit the health file if it changed — pull --rebase first, same
    # race-avoidance pattern as the CI state commits.
    $status = git status --porcelain -- src/suckhoe/automation-health.json
    if ($status) {
        git add src/suckhoe/automation-health.json 2>&1 | Add-Content -Path $logPath
        git commit -m "Update automation health heartbeat [skip ci]" 2>&1 | Add-Content -Path $logPath
        git pull --rebase origin main 2>&1 | Add-Content -Path $logPath
        git push origin HEAD:main 2>&1 | Add-Content -Path $logPath
    }

    Add-Content -Path $logPath -Value "=== Finished at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ==="
} catch {
    Add-Content -Path $logPath -Value "!!! ERROR: $($_.Exception.Message)"
    Add-Content -Path $logPath -Value "!!! Failed at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
}
