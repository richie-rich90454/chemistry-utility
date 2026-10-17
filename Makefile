.PHONY: test test-go test-frontend test-coverage check-coverage clean-coverage frontend-coverage desktop

## Run all tests (website + Go wrapper) without coverage
test: test-frontend test-go

## Run Go unit tests with coverage profile
test-go:
	cd core && go test ./... -coverprofile=coverage.out -covermode=atomic
	cd core && go tool cover -func=coverage.out

## Run website unit tests
test-frontend:
	npx vitest run

## Run Go tests with coverage and enforce a minimum threshold (90%)
check-coverage:
	@bash scripts/check-coverage.sh

## Run website tests with coverage and enforce thresholds
frontend-coverage:
	npx vitest run --coverage

## Build the desktop wrapper (builds the web bundle, stages it, then wails build)
desktop:
	npm run desktop:build

## Remove coverage artifacts
clean-coverage:
	rm -f coverage.out coverage.html core/coverage.out core/coverage.html
	rm -rf coverage
