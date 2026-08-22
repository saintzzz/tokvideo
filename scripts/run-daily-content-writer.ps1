# Invoked daily by a Windows Task Scheduler task (see scripts/README-scheduled-task.md).
# Runs the Claude Code CLI non-interactively to top up the Suc Khoe episode
# queue, then exits. Logs to daily-content-writer.log next to this script.
#
# Everything below is wrapped defensively: $PSScriptRoot (not a hardcoded
# path) locates the log file so logging can't fail before it starts, and a
# top-level try/catch guarantees a log entry even if something throws before
# reaching the claude invocation (missing repo, bad PATH, etc.) — a prior
# scheduled run produced zero log output and zero diagnostic trail, so this
# rewrite exists specifically to make the next scheduled failure visible.

$logPath = Join-Path $PSScriptRoot "daily-content-writer.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Add-Content -Path $logPath -Value "`n=== Run at $timestamp ==="
Add-Content -Path $logPath -Value "User: $(whoami) | PID: $PID | PSScriptRoot: $PSScriptRoot"

try {
    $repoPath = Split-Path -Parent $PSScriptRoot
    $promptPath = Join-Path $PSScriptRoot "daily-content-writer-prompt.txt"

    Add-Content -Path $logPath -Value "repoPath: $repoPath"
    Add-Content -Path $logPath -Value "PATH: $env:PATH"

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

    # Pipe the prompt via stdin instead of passing it as a `-p <value>`
    # command-line argument. Confirmed live on 2026-08-22: launched via
    # Task Scheduler, the long multi-line prompt text arrived at claude
    # truncated mid-sentence, while the identical `-p $prompt` form worked
    # fine run directly — a command-line-length/encoding quirk specific to
    # how Task Scheduler creates the process. `claude -p` (no positional
    # argument) reads the prompt from stdin when it isn't a TTY, which
    # sidesteps the command-line argument path entirely.
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
