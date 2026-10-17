#
# Runs the Go wrapper's tests with coverage and fails if total coverage falls
# below the floor. The ports are behavior-verified by the shared conformance
# suite (248 cases across 46 calculators), so this floor guards against a
# regression rather than standing in for the conformance check.
#
# The tests live in core/, and the coverage profile is written to an absolute
# path because PowerShell does not reliably forward a relative -coverprofile
# value to a native command.
#
# Usage: pwsh scripts/check-coverage.ps1
#
$ErrorActionPreference = "Stop"

$Threshold = 80
$repoRoot = Split-Path -Parent $PSScriptRoot
$coreDir = Join-Path $repoRoot "core"
$coverageFile = Join-Path $coreDir "coverage.out"

Write-Host "Running Go tests with coverage..."
Push-Location $coreDir
try {
    go test ./internal/... "-coverprofile=$coverageFile" -covermode=atomic

    Write-Host ""
    Write-Host "Coverage summary:"
    $output = go tool cover "-func=$coverageFile"
    $output | Out-Host
}
finally {
    Pop-Location
}

# The last line of `go tool cover -func` looks like:
# "total:        (statements)            85.5%"
$totalLine = $output | Where-Object { $_ -match '^total:' }

if (-not $totalLine) {
    Write-Host "ERROR: Could not find total coverage line"
    exit 1
}

if ($totalLine -match '(\d+(?:\.\d+)?)%') {
    $total = [double]$Matches[1]
} else {
    Write-Host "ERROR: Could not parse total coverage percentage from line: $totalLine"
    exit 1
}

Remove-Item $coverageFile -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Total coverage: $total%"
Write-Host "Threshold:      $Threshold%"

if ($total -ge $Threshold) {
    Write-Host "PASS: Coverage meets the threshold"
    exit 0
} else {
    Write-Host "FAIL: Coverage $total% is below the required $Threshold%"
    exit 1
}
