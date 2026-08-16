#
# Runs Go tests with coverage and fails if total coverage is below 90%.
# Usage: pwsh scripts/check-coverage.ps1   (or:  powershell scripts/check-coverage.ps1)
#
$ErrorActionPreference = "Stop"

$Threshold = 90
$CoverageFile = "coverage.out"

Write-Host "Running Go tests with coverage..."
go test ./internal/... -coverprofile=$CoverageFile -covermode=atomic

Write-Host ""
Write-Host "Coverage summary:"
go tool cover -func=$CoverageFile | Out-Host

# Extract the total coverage percentage from the last line of `go tool cover -func`.
# The last line looks like: "total:        (statements)            85.5%"
$output = go tool cover -func=$CoverageFile
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
