#!/usr/bin/env bash
#
# Runs Go tests with coverage and fails if total coverage is below 90%.
# Usage: bash scripts/check-coverage.sh
#
set -euo pipefail

THRESHOLD=90
COVERAGE_FILE="coverage.out"

echo "Running Go tests with coverage..."
cd core
go test ./... -coverprofile="$COVERAGE_FILE" -covermode=atomic

echo ""
echo "Coverage summary:"
go tool cover -func="$COVERAGE_FILE"

# Extract the total coverage percentage from the last line of `go tool cover -func`.
# The last line looks like: "total:        (statements)            85.5%"
TOTAL=$(go tool cover -func="$COVERAGE_FILE" | grep '^total:' | awk '{print $NF}' | tr -d '%')

if [ -z "$TOTAL" ]; then
    echo "ERROR: Could not parse total coverage percentage"
    exit 1
fi

echo ""
echo "Total coverage: ${TOTAL}%"
echo "Threshold:      ${THRESHOLD}%"

# Compare as floats using awk (returns 0 if TOTAL >= THRESHOLD).
if awk "BEGIN {exit !(${TOTAL} >= ${THRESHOLD})}"; then
    echo "PASS: Coverage meets the threshold"
    exit 0
else
    echo "FAIL: Coverage ${TOTAL}% is below the required ${THRESHOLD}%"
    exit 1
fi
