# Invoked daily by a Windows Task Scheduler task (SucKhoeReplyComments).
# Runs the Claude Code CLI non-interactively to reply to genuine new
# comments on the channels' own videos, then exits. Logs to
# reply-comments.log next to this script.
#
# Mirrors scripts/run-daily-content-writer.ps1's proven pattern exactly
# (see that file's comments for why): $PSScriptRoot-based paths, a
# top-level try/catch that guarantees a log entry even on early failure,
# and piping the prompt via stdin (`Get-Content -Raw | claude -p`) instead
# of a `-p <value>` argument, since Task Scheduler was confirmed to
# truncate long multi-line arguments passed the second way.

$logPath = Join-Path $PSScriptRoot "reply-comments.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Add-Content -Path $logPath -Value "`n=== Run at $timestamp ==="
Add-Content -Path $logPath -Value "User: $(whoami) | PID: $PID | PSScriptRoot: $PSScriptRoot"

try {
    $repoPath = Split-Path -Parent $PSScriptRoot
    $promptPath = Join-Path $PSScriptRoot "reply-comments-prompt.txt"

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

    # Task Scheduler processes don't inherit the YOUTUBE_* secrets a
    # GitHub Actions job would get via `env:` — load them from a local,
    # gitignored file instead (scripts/.env.youtube.local). Confirmed
    # missing live on 2026-08-23: the job correctly refused to fabricate
    # credentials and just reported it couldn't proceed.
    $envFile = Join-Path $PSScriptRoot ".env.youtube.local"
    if (Test-Path $envFile) {
        Get-Content $envFile | ForEach-Object {
            if ($_ -match "^([^=]+)=(.*)$") {
                [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], "Process")
            }
        }
        Add-Content -Path $logPath -Value "Loaded YouTube credentials from $envFile"
    } else {
        Add-Content -Path $logPath -Value "WARNING: $envFile not found — YouTube API calls will fail."
    }

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
