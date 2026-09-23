# Weekly strategy refresh (PRD M-01/M-05): regenerates the data files the
# daily content writer reads — strategy report, publish-slot learning,
# comments-to-content and trend radar for both locales — then commits the
# outputs so the writer (and GitHub) always sees fresh signals.
#
# Registered as the SucKhoeWeeklyStrategy Task Scheduler job by
# setup-task-scheduler.ps1. Logs to strategy-report.log next to this
# script; check-automation-health.mjs monitors that log.

$logPath = Join-Path $PSScriptRoot "strategy-report.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Add-Content -Path $logPath -Value "`n=== Run at $timestamp ==="
Add-Content -Path $logPath -Value "User: $(whoami) | PID: $PID | PSScriptRoot: $PSScriptRoot"

try {
    $repoPath = Split-Path -Parent $PSScriptRoot
    Set-Location $repoPath

    # YouTube creds for the API-backed steps (no-op when absent).
    if (Test-Path (Join-Path $PSScriptRoot ".env.youtube.local")) {
        Get-Content (Join-Path $PSScriptRoot ".env.youtube.local") | ForEach-Object {
            if ($_ -match '^\s*([^#=]+?)\s*=\s*(.*)$') {
                [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
            }
        }
    }

    $steps = @(
        "node scripts/strategy-report.mjs",
        "node scripts/publish-slots.mjs",
        "node scripts/comments-to-content.mjs --locale=vi",
        "node scripts/comments-to-content.mjs --locale=en",
        "node scripts/trend-radar.mjs --locale=vi",
        "node scripts/trend-radar.mjs --locale=en",
        "node scripts/title-variants.mjs"
    )
    foreach ($s in $steps) {
        Add-Content -Path $logPath -Value "--- $s"
        Invoke-Expression "$s 2>&1" | Add-Content -Path $logPath
    }

    # Commit the regenerated artifacts if anything changed.
    git pull --rebase 2>&1 | Add-Content -Path $logPath
    git add src/suckhoe/strategy.md src/suckhoe/strategy.json `
            src/suckhoe/publish-slots.json src/suckhoe/comment-ideas.json `
            src/suckhoe/trend-radar-vi.md src/suckhoe/trend-radar-en.md `
            src/suckhoe/title-variants.json 2>&1 | Add-Content -Path $logPath
    git diff --cached --quiet
    if ($LASTEXITCODE -ne 0) {
        git commit -m "chore(strategy): weekly marketing data refresh" 2>&1 | Add-Content -Path $logPath
        git push 2>&1 | Add-Content -Path $logPath
    } else {
        Add-Content -Path $logPath -Value "No changes to commit."
    }

    Add-Content -Path $logPath -Value "=== Finished at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ==="
}
catch {
    Add-Content -Path $logPath -Value "!!! ERROR: $($_.Exception.Message)"
    Add-Content -Path $logPath -Value "!!! Failed at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    exit 1
}
