# Recreates the 3 Windows Task Scheduler jobs that drive this repo's
# content-writing/community-interaction automation, on WHATEVER machine
# this is run on — paths are resolved from this script's own location
# ($PSScriptRoot), not hardcoded to any one machine. Safe to re-run
# (unregisters + recreates each task rather than erroring if it already
# exists).
#
# Prerequisites before running this:
#   1. `claude` CLI installed and on PATH (or adjust the -File paths'
#      sibling scripts if your install differs) and already logged in
#      once interactively (these tasks run non-interactively and rely on
#      an existing session/credentials).
#   2. `npm install` already run in the repo root.
#   3. scripts/.env.youtube.local populated — see SETUP.md.
#
# Usage (run from an elevated or normal PowerShell — these tasks run
# "Interactive only" under the current user, matching how they were
# originally set up):
#   powershell -ExecutionPolicy Bypass -File scripts\setup-task-scheduler.ps1

$repoRoot = Split-Path -Parent $PSScriptRoot

$tasks = @(
    @{
        Name = "SucKhoeDailyContentWriter"
        Script = "run-daily-content-writer.ps1"
        Time = "08:00"
        DaysInterval = 1
    },
    @{
        Name = "SucKhoeReplyComments"
        Script = "run-reply-comments.ps1"
        Time = "16:00"
        DaysInterval = 1
    },
    @{
        Name = "SucKhoeCommentOutreach"
        Script = "run-comment-outreach.ps1"
        Time = "20:00"
        DaysInterval = 3
    },
    @{
        Name = "AnimatedFilmEpisodeWriter"
        Script = "run-animated-episode-writer.ps1"
        Time = "10:00"
        DaysInterval = 2
    }
)

# Hourly tasks — separate list since they need a repeating-interval
# trigger (New-ScheduledTaskTrigger has no -Hourly mode; the standard
# PowerShell pattern for "every N minutes/hours forever" is a one-time
# trigger with a repetition interval and an indefinite duration).
$hourlyTasks = @(
    @{
        Name = "SucKhoePublishCatchup"
        Script = "run-check-catchup-publish.ps1"
        RepeatMinutes = 60
    }
)

foreach ($t in $tasks) {
    $scriptPath = Join-Path $repoRoot "scripts\$($t.Script)"
    if (-not (Test-Path $scriptPath)) {
        Write-Warning "Skipping $($t.Name), script not found at $scriptPath"
        continue
    }

    $existing = Get-ScheduledTask -TaskName $t.Name -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "Removing existing task $($t.Name) to recreate it..."
        Unregister-ScheduledTask -TaskName $t.Name -Confirm:$false
    }

    $action = New-ScheduledTaskAction -Execute "powershell.exe" `
        -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""
    $trigger = New-ScheduledTaskTrigger -Daily -At $t.Time -DaysInterval $t.DaysInterval
    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive
    $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable `
        -DontStopOnIdleEnd -ExecutionTimeLimit (New-TimeSpan -Hours 72)

    Register-ScheduledTask -TaskName $t.Name -Action $action -Trigger $trigger `
        -Principal $principal -Settings $settings | Out-Null

    Write-Host "Registered $($t.Name): daily at $($t.Time), every $($t.DaysInterval) day(s) -> $scriptPath"
}

foreach ($t in $hourlyTasks) {
    $scriptPath = Join-Path $repoRoot "scripts\$($t.Script)"
    if (-not (Test-Path $scriptPath)) {
        Write-Warning "Skipping $($t.Name), script not found at $scriptPath"
        continue
    }

    $existing = Get-ScheduledTask -TaskName $t.Name -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "Removing existing task $($t.Name) to recreate it..."
        Unregister-ScheduledTask -TaskName $t.Name -Confirm:$false
    }

    $action = New-ScheduledTaskAction -Execute "powershell.exe" `
        -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""
    # [TimeSpan]::MaxValue overflows Task Scheduler's XML duration
    # schema (confirmed live: "value ... out of range" on registration).
    # A 10-year duration is effectively indefinite for this purpose.
    $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) `
        -RepetitionInterval (New-TimeSpan -Minutes $t.RepeatMinutes) `
        -RepetitionDuration (New-TimeSpan -Days 3650)
    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive
    $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable `
        -DontStopOnIdleEnd -ExecutionTimeLimit (New-TimeSpan -Minutes 10)

    Register-ScheduledTask -TaskName $t.Name -Action $action -Trigger $trigger `
        -Principal $principal -Settings $settings | Out-Null

    Write-Host "Registered $($t.Name): every $($t.RepeatMinutes) minute(s) -> $scriptPath"
}

Write-Host ""
Write-Host "Done. Verify with: Get-ScheduledTask | Where-Object { `$_.TaskName -like 'SucKhoe*' }"
