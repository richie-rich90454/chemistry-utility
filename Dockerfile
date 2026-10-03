# Multi-stage image: Vite frontend bundle + static Go server binary.
# Build:   docker build -t chemistry-utility .
# Run:     docker run --rm -p 6005:6005 chemistry-utility

# ---- Stage 1: frontend bundle (for Go embed / DIST_DIR) ----
FROM node:22-slim AS frontend-builder
WORKDIR /app/frontend
# Dependency manifests first so `npm ci` is cached unless deps change.
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build:web

# ---- Stage 2: Go server binary ----
FROM golang:1.26-slim-bookworm AS go-builder
WORKDIR /src
# Module manifests first so `go mod download` is cached unless deps change.
COPY go.mod go.sum ./
RUN go mod download
COPY api/ ./api/
COPY cmd/ ./cmd/
COPY internal/ ./internal/
COPY migrations/ ./migrations/
COPY app.go main.go main_smoke_test.go Schema.txt ./
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/server ./cmd/server

# ---- Stage 3: non-root slim runtime ----
FROM debian:12-slim
RUN apt-get update \
	&& apt-get install -y --no-install-recommends ca-certificates \
	&& rm -rf /var/lib/apt/lists/* \
	&& useradd --system --create-home --uid 10001 appuser
WORKDIR /app
COPY --from=go-builder /out/server /app/server
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist
RUN chown -R appuser:appuser /app
USER appuser
EXPOSE 6005
ENV PORT=6005 DIST_DIR=/app/frontend/dist RATE_LIMIT_PER_MINUTE=100
CMD ["/app/server"]
