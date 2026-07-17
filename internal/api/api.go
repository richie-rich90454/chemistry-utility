package api

import (
	"database/sql"
	"net/http"
	"sync"
	"time"

	"chemistry-utility/internal/auth"
	"chemistry-utility/internal/calculators"
	dbstore "chemistry-utility/internal/db"

	"github.com/gin-gonic/gin"
)

// Config holds API configuration.
type Config struct {
	JWTSecret          string
	OAuthProviders     auth.OAuthProviders
	RateLimitPerMinute int
	CORSAllowedOrigins []string
}

// API is the main API instance holding all stores, services, and configuration.
type API struct {
	db             *sql.DB
	userStore      *dbstore.UserStore
	calcStore      *dbstore.CalculationStore
	workspaceStore *dbstore.WorkspaceStore
	compoundStore  *dbstore.CompoundStore
	apiKeyStore    *dbstore.APIKeyStore
	pluginStore    *dbstore.PluginStore
	analyticsStore *dbstore.AnalyticsStore
	calcRegistry   *calculators.Registry
	userService    *auth.UserService
	cfg            Config
	jwtCfg         auth.JWTConfig
}

// New creates a new API instance with all stores and services.
func New(db *sql.DB, driver string, cfg Config) *API {
	if cfg.RateLimitPerMinute == 0 {
		cfg.RateLimitPerMinute = 100
	}
	if len(cfg.CORSAllowedOrigins) == 0 {
		cfg.CORSAllowedOrigins = []string{"*"}
	}

	jwtCfg := auth.DefaultJWTConfig(cfg.JWTSecret)

	userStore := &dbstore.UserStore{DB: db, Driver: driver}
	calcStore := &dbstore.CalculationStore{DB: db, Driver: driver}
	workspaceStore := &dbstore.WorkspaceStore{DB: db, Driver: driver}
	compoundStore := &dbstore.CompoundStore{DB: db, Driver: driver}
	apiKeyStore := &dbstore.APIKeyStore{DB: db, Driver: driver}
	pluginStore := &dbstore.PluginStore{DB: db, Driver: driver}
	analyticsStore := &dbstore.AnalyticsStore{DB: db, Driver: driver}
	calcRegistry := calculators.NewRegistry()
	userService := auth.NewUserService(userStore, jwtCfg, cfg.OAuthProviders)

	return &API{
		db:             db,
		userStore:      userStore,
		calcStore:      calcStore,
		workspaceStore: workspaceStore,
		compoundStore:  compoundStore,
		apiKeyStore:    apiKeyStore,
		pluginStore:    pluginStore,
		analyticsStore: analyticsStore,
		calcRegistry:   calcRegistry,
		userService:    userService,
		cfg:            cfg,
		jwtCfg:         jwtCfg,
	}
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
	}

	// Auth routes
	authGroup := v1.Group("/auth")
	{
		authGroup.POST("/register", a.register)
		authGroup.POST("/login", a.login)
		authGroup.POST("/refresh", a.refreshToken)
		authGroup.POST("/forgot-password", a.forgotPassword)
		authGroup.POST("/reset-password", a.resetPassword)
		authGroup.GET("/github", a.githubOAuth)
		authGroup.GET("/github/callback", a.githubOAuthCallback)
		authGroup.GET("/google", a.googleOAuth)
		authGroup.GET("/google/callback", a.googleOAuthCallback)
	}

	// Authenticated routes
	authed := v1.Group("")
	authed.Use(auth.AuthMiddleware(a.jwtCfg))
	{
		authed.GET("/users/me", a.getCurrentUser)
		authed.PATCH("/users/me", a.updateCurrentUser)

		authed.GET("/calculations", a.listCalculations)
		authed.GET("/calculations/:id", a.getCalculation)
		authed.POST("/calculations/:id/annotate", a.annotateCalculation)
		authed.POST("/calculations/:id/star", a.starCalculation)
		authed.DELETE("/calculations/:id", a.deleteCalculation)

		authed.POST("/workspaces", a.createWorkspace)
		authed.GET("/workspaces", a.listWorkspaces)
		authed.GET("/workspaces/:id", a.getWorkspace)
		authed.PATCH("/workspaces/:id", a.updateWorkspace)
		authed.DELETE("/workspaces/:id", a.deleteWorkspace)
		authed.POST("/workspaces/:id/members", a.addWorkspaceMember)
		authed.DELETE("/workspaces/:id/members/:userId", a.removeWorkspaceMember)
		authed.GET("/workspaces/:id/calculations", a.getWorkspaceCalculations)
	}

	// API key management (researcher+ role)
	apiKeys := v1.Group("/api-keys")
	apiKeys.Use(auth.AuthMiddleware(a.jwtCfg))
	apiKeys.Use(auth.RBACMiddleware("researcher", "educator", "admin"))
	{
		apiKeys.POST("", a.createAPIKey)
		apiKeys.GET("", a.listAPIKeys)
		apiKeys.DELETE("/:id", a.deleteAPIKey)
	}

	// Admin-only routes
	admin := v1.Group("")
	admin.Use(auth.AuthMiddleware(a.jwtCfg))
	admin.Use(auth.RBACMiddleware("admin"))
	{
		admin.GET("/analytics/overview", a.analyticsOverview)
		admin.GET("/analytics/usage", a.analyticsUsage)

		admin.GET("/plugins", a.listPlugins)
		admin.POST("/plugins", a.createPlugin)
		admin.PATCH("/plugins/:id/enable", a.enablePlugin)
		admin.PATCH("/plugins/:id/disable", a.disablePlugin)
		admin.DELETE("/plugins/:id", a.deletePlugin)
	}

	return r
}

// rateLimitEntry tracks request counts per IP for rate limiting.
type rateLimitEntry struct {
	count    int
	windowStart time.Time
}

// RateLimitMiddleware returns a gin middleware that limits requests per minute per IP.
func (a *API) RateLimitMiddleware(rpm int) gin.HandlerFunc {
	var mu sync.Mutex
	clients := make(map[string]*rateLimitEntry)

	return func(c *gin.Context) {
		ip := c.ClientIP()
		mu.Lock()
		entry, exists := clients[ip]
		now := time.Now()
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
