package main

import (
	"compress/gzip"
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"chemistry-utility/internal/api"
	"chemistry-utility/internal/compounds"
	"chemistry-utility/internal/db"

	"github.com/gin-gonic/gin"
)

func gzipMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !strings.Contains(c.GetHeader("Accept-Encoding"), "gzip") {
			c.Next()
			return
		}
		gz := gzip.NewWriter(c.Writer)
		defer gz.Close()
		c.Header("Content-Encoding", "gzip")
		c.Header("Vary", "Accept-Encoding")
		c.Writer = &gzipResponseWriter{Writer: gz, ResponseWriter: c.Writer}
		c.Next()
	}
}

type gzipResponseWriter struct {
	gin.ResponseWriter
	Writer *gzip.Writer
}

func (w *gzipResponseWriter) Write(data []byte) (int, error) {
	return w.Writer.Write(data)
}

func (w *gzipResponseWriter) WriteString(s string) (int, error) {
	return w.Writer.Write([]byte(s))
}

// securityHeadersMiddleware adds browser security headers to every
// response: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection,
// Referrer-Policy, and a Content-Security-Policy that restricts
// resource loading to same-origin (with unsafe-inline permitted for
// script/style to support the inline event handlers and style tags
// used by the static frontend).
func securityHeadersMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Header("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:")
		c.Next()
	}
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "6005"
	}
	dbDriver := os.Getenv("DB_DRIVER")
	if dbDriver == "" {
		dbDriver = "sqlite3"
	}
	dbDSN := os.Getenv("DB_DSN")
	if dbDSN == "" {
		dbDSN = "chemistry.db"
	}
	distDir := os.Getenv("DIST_DIR")
	if distDir == "" {
		distDir = "frontend/dist"
	}
	cfg := db.Config{
		Driver:          dbDriver,
		DSN:             dbDSN,
		MaxOpenConns:    25,
		MaxIdleConns:    5,
		ConnMaxLifetime: 5 * time.Minute,
	}
	database, err := db.New(cfg)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer database.Close()
	compoundStore := &db.CompoundStore{DB: database, Driver: dbDriver}
	pluginStore := &db.PluginStore{DB: database, Driver: dbDriver}
	pubchemClient := compounds.NewPubChemClient()
	compoundCache := compounds.NewCompoundCache(compoundStore, pubchemClient)
	apiCfg := api.Config{
		RateLimitPerMinute: 100,
		CORSAllowedOrigins: []string{"*"},
	}
	apiInstance := api.New(database, dbDriver, apiCfg)
	_ = compoundCache
	_ = pluginStore
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(securityHeadersMiddleware())
	r.Use(gzipMiddleware())
	apiRouter := apiInstance.Router()
	r.Any("/api/v1/:path", func(c *gin.Context) {
		c.Request.URL.Path = "/api/v1/" + c.Param("path")
		apiRouter.HandleContext(c)
	})
	r.Any("/api/v1/:path/:sub", func(c *gin.Context) {
		c.Request.URL.Path = "/api/v1/" + c.Param("path") + "/" + c.Param("sub")
		apiRouter.HandleContext(c)
	})
	r.Any("/api/v1/:path/:sub/:id", func(c *gin.Context) {
		c.Request.URL.Path = "/api/v1/" + c.Param("path") + "/" + c.Param("sub") + "/" + c.Param("id")
		apiRouter.HandleContext(c)
	})
	r.Any("/api/v1/:path/:sub/:id/:action", func(c *gin.Context) {
		c.Request.URL.Path = "/api/v1/" + c.Param("path") + "/" + c.Param("sub") + "/" + c.Param("id") + "/" + c.Param("action")
		apiRouter.HandleContext(c)
	})
	// Proxy the Swagger UI and OpenAPI spec to the API router so the docs
	// routes registered in api.Router() are reachable through this server.
	r.GET("/api/docs", func(c *gin.Context) {
		c.Request.URL.Path = "/api/docs"
		apiRouter.HandleContext(c)
	})
	r.GET("/api/docs/openapi.yaml", func(c *gin.Context) {
		c.Request.URL.Path = "/api/docs/openapi.yaml"
		apiRouter.HandleContext(c)
	})
	r.Static("/assets", filepath.Join(distDir, "assets"))
	r.Static("/src", filepath.Join(distDir, "src"))
	r.Static("/wailsjs", filepath.Join(distDir, "wailsjs"))
	r.StaticFile("/favicon.ico", filepath.Join(distDir, "favicon.ico"))
	r.StaticFile("/favicon.png", filepath.Join(distDir, "favicon.png"))
	r.StaticFile("/manifest.webmanifest", filepath.Join(distDir, "manifest.webmanifest"))
	r.StaticFile("/robots.txt", filepath.Join(distDir, "robots.txt"))
	r.StaticFile("/sitemap.xml", filepath.Join(distDir, "sitemap.xml"))
	r.StaticFile("/NotoSans-VariableFont_wdth,wght.ttf", filepath.Join(distDir, "NotoSans-VariableFont_wdth,wght.ttf"))
	r.StaticFile("/EBGaramond-VariableFont_wght.ttf", filepath.Join(distDir, "EBGaramond-VariableFont_wght.ttf"))
	r.StaticFile("/app-image.png", filepath.Join(distDir, "app-image.png"))
	r.StaticFile("/apple-touch-icon.png", filepath.Join(distDir, "apple-touch-icon.png"))
	r.StaticFile("/ptable.json", filepath.Join(distDir, "ptable.json"))
	indexPath := filepath.Join(distDir, "index.html")
	r.NoRoute(func(c *gin.Context) {
		if strings.HasPrefix(c.Request.URL.Path, "/api/") {
			c.JSON(http.StatusNotFound, gin.H{"error": "API endpoint not found"})
			return
		}
		if _, err := os.Stat(indexPath); err != nil {
			c.String(http.StatusNotFound, "index.html not found — run `cd frontend && npm run build` first")
			return
		}
		c.File(indexPath)
	})
	srv := &http.Server{
		Addr:    ":" + port,
		Handler: r,
	}
	go func() {
		log.Printf("Starting server on :%s (db: %s)", port, dbDriver)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Server failed:", err)
		}
	}()
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}
	log.Println("Server exited")
}
