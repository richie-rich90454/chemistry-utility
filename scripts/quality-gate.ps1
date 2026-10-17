#
# Quality gate script: runs all checks (Go tests, go vet, TS typecheck,
# eslint, and vitest) and exits non-zero if ANY step fails.
# Usage: pwsh scripts/quality-gate.ps1
#
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot

Write-Host "=== Step 1/6: go test ./... (core) ==="
Push-Location (Join-Path $repoRoot "core")
try {
    go test ./...
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Step 1 failed: go test ./..."
        exit 1
    }

    Write-Host "=== Step 2/6: go vet ./... (core) ==="
    go vet ./...
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Step 2 failed: go vet ./..."
        exit 1
    }
}
finally {
    Pop-Location
}

Push-Location $repoRoot
try {
    Write-Host "=== Step 3/6: tsc --noEmit ==="
    npx tsc --noEmit
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Step 3 failed: tsc --noEmit"
        exit 1
    }

    Write-Host "=== Step 4/6: eslint src ==="
    npx eslint src
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Step 4 failed: eslint src"
        exit 1
    }

    Write-Host "=== Step 5/6: vitest run ==="
    npx vitest run
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Step 5 failed: vitest run"
        exit 1
    }

    Write-Host "=== Step 6/6: vite build (web) ==="
    npx vite build --mode web
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Step 6 failed: vite build --mode web"
        exit 1
    }
}
finally {
    Pop-Location
}

Write-Host "=== All quality gate checks passed ==="
exit 0
