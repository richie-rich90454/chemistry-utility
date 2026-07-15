FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM golang:1.25-alpine AS backend-build
RUN apk add --no-cache gcc musl-dev
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
RUN CGO_ENABLED=1 go build -ldflags="-s -w" -o /server ./cmd/server

FROM alpine:3.21
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=backend-build /server .
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
COPY migrations/ ./migrations/
EXPOSE 6005
ENV PORT=6005
ENV DB_DRIVER=sqlite3
ENV DB_DSN=/data/chemistry.db
VOLUME ["/data"]
CMD ["./server"]
