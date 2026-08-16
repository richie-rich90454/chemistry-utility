#
# Quality gate script: runs all checks (Go tests, clippy, TS typecheck,
# eslint, and vitest with coverage) and exits non-zero if ANY step fails.
# Usage: pwsh scripts/quality-gate.ps1
#
$ErrorActionPreference = "Stop"

Write-Host "=== Step 1/5: cargo test --all ==="
cargo test --all
if ($LASTEXITCODE -ne 0) {
    Write-Error "Step 1 failed: cargo test --all"
    exit 1
}

Write-Host "=== Step 2/5: cargo clippy --all -- -D warnings ==="
cargo clippy --all -- -D warnings
if ($LASTEXITCODE -ne 0) {
    Write-Error "Step 2 failed: cargo clippy --all -- -D warnings"
    exit 1
}

Push-Location frontend
try {
    Write-Host "=== Step 3/5: tsc --noEmit (frontend) ==="
    npx tsc --noEmit
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Step 3 failed: tsc --noEmit"
        exit 1
    }

    Write-Host "=== Step 4/5: eslint src (frontend) ==="
    npx eslint src
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Step 4 failed: eslint src"
        exit 1
    }

    Write-Host "=== Step 5/5: vitest run --coverage (frontend) ==="
    npx vitest run --coverage
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Step 5 failed: vitest run --coverage"
        exit 1
    }
}
finally {
    Pop-Location
}

Write-Host "=== All quality gate checks passed ==="
exit 0
