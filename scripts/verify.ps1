<#
  Local verification — one shot.

  Writes ALL output to a single log file (.verify.log at repo root, gitignored)
  and prints a compact PASS/FAIL summary. On failure it tails the failing step's
  errors so you don't have to open the log.

  Why this exists / what gates what:
    * type-check (db + web)  -> BLOCKING. This is the real local gate. It catches
      broken imports, removed symbols, type drift, etc. If this is green, the
      code is structurally sound.
    * lint (web)             -> ADVISORY only. The repo has many pre-existing
      react-compiler / react-hooks lint findings, and `next build` SKIPS linting,
      so lint never blocks a deploy. We surface a count but do NOT fail on it.
    * build (web)            -> OPT-IN (`-Build`). A real production build does
      NOT complete on this Windows box: it needs DATABASE_URL to prerender pages
      and it hits EPERM creating .next/standalone symlinks (Windows privilege).
      The authoritative build runs on Vercel (Linux). Use -Build only to confirm
      the bundle COMPILES ("Compiled successfully"); ignore the prerender/symlink
      tail.

  `turbo run` crashes on this machine (exit 3221225781), so we call the tools
  directly instead of going through turbo.

  Usage:
    pnpm verify            # type-check (blocking) + lint (advisory)
    pnpm verify -Build     # also attempt the Next.js build (compile check)
#>

param(
  [switch]$Build
)

$ErrorActionPreference = 'Continue'
$repoRoot = Split-Path -Parent $PSScriptRoot
$log = Join-Path $repoRoot '.verify.log'
Set-Content -Path $log -Value "Verify run: $(Get-Date -Format o)`n" -Encoding utf8

$blockingFailed = @()

function Run-Step {
  param(
    [string]$Name,
    [string]$Command,
    [switch]$Advisory   # report only; never fails the run
  )

  Write-Host ">> $Name ..." -ForegroundColor Cyan
  Add-Content $log "`n==================== $Name ====================`n> $Command`n"

  $output = & cmd /c "$Command 2>&1"
  $code = $LASTEXITCODE
  Add-Content $log ($output -join "`n")

  if ($code -eq 0) {
    Write-Host "   PASS  $Name" -ForegroundColor Green
  }
  elseif ($Advisory) {
    Write-Host "   WARN  $Name (exit $code) - advisory, not blocking" -ForegroundColor Yellow
  }
  else {
    Write-Host "   FAIL  $Name (exit $code)" -ForegroundColor Red
    $script:blockingFailed += $Name
    $errs = $output | Select-String -Pattern 'error TS|Error:|ERR_|Cannot find|Type error' | Select-Object -First 30
    if ($errs) {
      Write-Host "   ---- first errors ----" -ForegroundColor Yellow
      $errs | ForEach-Object { Write-Host "   $_" -ForegroundColor DarkYellow }
    }
  }
  return $code
}

Push-Location $repoRoot
try {
  # Clean stale Next type stubs so deleted routes don't produce phantom tsc errors.
  if (Test-Path 'apps/web/.next/types') {
    Remove-Item -Recurse -Force 'apps/web/.next/types' -ErrorAction SilentlyContinue
  }

  # ---- Blocking gates ----
  Run-Step 'type-check: @repo/db' 'pnpm --filter @repo/db exec tsc --noEmit' | Out-Null
  Run-Step 'type-check: web'      'pnpm --filter web exec tsc --noEmit'      | Out-Null

  # ---- Advisory ----
  Run-Step 'lint: web' 'pnpm --filter web exec next lint' -Advisory | Out-Null

  # ---- Opt-in compile check ----
  if ($Build) {
    Write-Host "   note: local build can't finish (needs DB + Linux); look for 'Compiled successfully'." -ForegroundColor DarkGray
    Run-Step 'build: web' 'pnpm --filter web exec next build' -Advisory | Out-Null
    $compiled = Select-String -Path $log -Pattern 'Compiled successfully' -Quiet
    if ($compiled) {
      Write-Host "   bundle COMPILED ok (prerender/symlink failures below are environmental)" -ForegroundColor Green
    }
  }
}
finally {
  Pop-Location
}

Write-Host ""
if ($blockingFailed.Count -eq 0) {
  Write-Host "TYPE-CHECK PASSED. Full log: $log" -ForegroundColor Green
  exit 0
} else {
  Write-Host ("BLOCKING FAILURES: " + ($blockingFailed -join ', ')) -ForegroundColor Red
  Write-Host "Full log: $log" -ForegroundColor Red
  exit 1
}
