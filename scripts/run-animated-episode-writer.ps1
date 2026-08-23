# Invoked every 2 days by a Windows Task Scheduler task (see
# scripts/setup-task-scheduler.ps1). Runs the Claude Code CLI
# non-interactively to write ONE full ~20-minute episode script for the
# "Nha Ba Tu" animated-film series (src/animated-film/), then exits.
# Same proven shape as run-daily-content-writer.ps1 — see that file's
# comments for why (stdin-piped prompt, defensive top-level try/catch,
# $PSScriptRoot-relative paths). Logs to animated-episode-writer.log next
# to this script.

$logPath = Join-Path $PSScriptRoot "animated-episode-writer.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Add-Content -Path $logPath -Value "`n=== Run at $timestamp ==="
Add-Content -Path $logPath -Value "User: $(whoami) | PID: $PID | PSScriptRoot: $PSScriptRoot"

try {
    $repoPath = Split-Path -Parent $PSScriptRoot
    $promptPath = Join-Path $PSScriptRoot "animated-episode-writer-prompt.txt"

    Add-Content -Path $logPath -Value "repoPath: $repoPath"

    $claudeCmd = Get-Command claude -ErrorAction SilentlyContinue
    if (-not $claudeCmd) {
        throw "claude command not found on PATH in this session. PATH was: $env:PATH"
    }
    Add-Content -Path $logPath -Value "claude resolved to: $($claudeCmd.Source)"

    if (-not (Test-Path $repoPath)) {
        throw "repoPath does not exist: $repoPath"
    }
    if (-not (Test-Path $promptPath)) {
        throw "promptPath does not exist: $promptPath"
    }

    Set-Location $repoPath

    Get-Content -Raw -Path $promptPath | claude -p `
        --allowedTools "Bash,Read,Write,Edit,Glob,Grep" `
        --dangerously-skip-permissions `
        2>&1 | Add-Content -Path $logPath

    Add-Content -Path $logPath -Value "=== Finished at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ==="
}
catch {
    Add-Content -Path $logPath -Value "!!! ERROR: $($_.Exception.Message)"
    Add-Content -Path $logPath -Value "!!! Failed at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    exit 1
}
