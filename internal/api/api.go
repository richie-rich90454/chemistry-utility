package api

import (
	"database/sql"
	"net/http"
	"sync"
	"time"

	"chemistry-utility/internal/calculators"
	dbstore "chemistry-utility/internal/db"

	"github.com/gin-gonic/gin"
)

// Config holds API configuration.
type Config struct {
	RateLimitPerMinute int
	CORSAllowedOrigins []string
}

// API is the main API instance holding all stores, services, and configuration.
type API struct {
	db            *sql.DB
	compoundStore *dbstore.CompoundStore
	pluginStore   *dbstore.PluginStore
	calcRegistry  *calculators.Registry
	cfg           Config
}

// New creates a new API instance with all stores and services.
func New(db *sql.DB, driver string, cfg Config) *API {
	if cfg.RateLimitPerMinute == 0 {
		cfg.RateLimitPerMinute = 100
	}
	if len(cfg.CORSAllowedOrigins) == 0 {
		cfg.CORSAllowedOrigins = []string{"*"}
	}

	compoundStore := &dbstore.CompoundStore{DB: db, Driver: driver}
	pluginStore := &dbstore.PluginStore{DB: db, Driver: driver}
	calcRegistry := calculators.NewRegistry()

	return &API{
		db:            db,
		compoundStore: compoundStore,
		pluginStore:   pluginStore,
		calcRegistry:  calcRegistry,
		cfg:           cfg,
	}
}

// requireDB aborts the request with 501 when the API has no database. The
// anonymous web build runs without any database or user storage, so
// DB-backed features (compound search, plugins) are disabled there.
func (a *API) requireDB(c *gin.Context) bool {
	if a.db != nil {
		return true
	}
	WriteNotImplemented(c, "this feature requires a server database and is not available on this build")
	return false
}

// Router creates and configures the Gin engine with all routes.
func (a *API) Router() *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(a.CORSMiddleware(a.cfg.CORSAllowedOrigins))

	// API documentation (Swagger UI + OpenAPI spec) at /api/docs
	docsGroup := r.Group("/api/docs")
	{
		docsGroup.GET("", ServeDocs)
		docsGroup.GET("/openapi.yaml", ServeSpec)
	}

	v1 := r.Group("/api/v1")

	// Public rate-limited routes
	public := v1.Group("")
	public.Use(a.RateLimitMiddleware(a.cfg.RateLimitPerMinute))
	{
		public.GET("/calculators", a.listCalculators)
		public.POST("/calculators/:type", a.runCalculator)
		public.GET("/compounds", a.searchCompounds)
		public.GET("/compounds/:id", a.getCompound)

		public.GET("/plugins", a.listPlugins)
		public.POST("/plugins", a.createPlugin)
		public.PATCH("/plugins/:id/enable", a.enablePlugin)
		public.PATCH("/plugins/:id/disable", a.disablePlugin)
		public.DELETE("/plugins/:id", a.deletePlugin)
	}

	return r
}

// rateLimitEntry tracks request counts per IP for rate limiting.
type rateLimitEntry struct {
	count       int
	windowStart time.Time
}

// RateLimitMiddleware returns a gin middleware that limits requests per minute per IP.
func (a *API) RateLimitMiddleware(rpm int) gin.HandlerFunc {
	var mu sync.Mutex
	clients := make(map[string]*rateLimitEntry)
	lastSweep := time.Now()

	return func(c *gin.Context) {
		ip := c.ClientIP()
		now := time.Now()
		mu.Lock()
		// Prune expired entries at most once a minute so the per-IP map
		// stays bounded instead of growing forever with unique IPs.
		if now.Sub(lastSweep) >= time.Minute {
			for k, e := range clients {
				if now.Sub(e.windowStart) >= time.Minute {
					delete(clients, k)
				}
			}
			lastSweep = now
		}
		entry, exists := clients[ip]
		if !exists || now.Sub(entry.windowStart) >= time.Minute {
			clients[ip] = &rateLimitEntry{count: 1, windowStart: now}
			mu.Unlock()
			c.Next()
			return
		}
		if entry.count >= rpm {
			mu.Unlock()
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "rate limit exceeded",
			})
			return
		}
		entry.count++
		mu.Unlock()
		c.Next()
	}
}

// CORSMiddleware returns a gin middleware that sets CORS headers.
func (a *API) CORSMiddleware(allowedOrigins []string) gin.HandlerFunc {
	allowAll := false
	originSet := make(map[string]struct{}, len(allowedOrigins))
	for _, o := range allowedOrigins {
		if o == "*" {
			allowAll = true
			break
		}
		originSet[o] = struct{}{}
	}

	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if allowAll {
			c.Header("Access-Control-Allow-Origin", "*")
		} else if _, ok := originSet[origin]; ok {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Vary", "Origin")
		}
		c.Header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Header("Access-Control-Max-Age", "86400")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}
