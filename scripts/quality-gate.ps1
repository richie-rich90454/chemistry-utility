#
# Quality gate script: runs all checks (Go tests, go vet, TS typecheck,
# eslint, and vitest with coverage) and exits non-zero if ANY step fails.
# Usage: pwsh scripts/quality-gate.ps1
#
$ErrorActionPreference = "Stop"

$env:PATH = "C:\msys64\ucrt64\bin;$env:PATH"

Write-Host "=== Step 1/6: go test ./... ==="
go test ./...
if ($LASTEXITCODE -ne 0) {
    Write-Error "Step 1 failed: go test ./..."
    exit 1
}

Write-Host "=== Step 2/6: go vet ./... ==="
go vet ./...
if ($LASTEXITCODE -ne 0) {
    Write-Error "Step 2 failed: go vet ./..."
    exit 1
}

Push-Location frontend
try {
    Write-Host "=== Step 3/6: tsc --noEmit (frontend) ==="
    npx tsc --noEmit
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Step 3 failed: tsc --noEmit"
        exit 1
    }

    Write-Host "=== Step 4/6: eslint src (frontend) ==="
    npx eslint src
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Step 4 failed: eslint src"
        exit 1
    }

    Write-Host "=== Step 5/6: vitest run (frontend) ==="
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
