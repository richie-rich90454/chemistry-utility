package auth

import (
	"context"
	"database/sql"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"
	"chemistry-utility/internal/db"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	_ "github.com/mattn/go-sqlite3"
)

func testJWTConfig() JWTConfig {
	return JWTConfig{
		Secret:             "test-secret-key",
		AccessTokenExpiry:  15 * time.Minute,
		RefreshTokenExpiry: 7 * 24 * time.Hour,
	}
}

func setupTestDB(t *testing.T) *sql.DB {
	t.Helper()
	f, err := os.CreateTemp("", "auth_test_*.db")
	if err != nil {
		t.Fatalf("failed to create temp db file: %v", err)
	}
	dbPath := f.Name()
	f.Close()
	t.Cleanup(func() {
		os.Remove(dbPath)
	})
	dbConn, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		t.Fatalf("failed to open test db: %v", err)
	}
	schema := `CREATE TABLE IF NOT EXISTS users (
		id TEXT PRIMARY KEY,
		email TEXT NOT NULL UNIQUE,
		password_hash TEXT NOT NULL DEFAULT '',
		name TEXT NOT NULL DEFAULT '',
		role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'researcher', 'admin')),
		email_verified INTEGER NOT NULL DEFAULT 0,
		oauth_provider TEXT NOT NULL DEFAULT '',
		oauth_id TEXT NOT NULL DEFAULT '',
		created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
	);`
	if _, err := dbConn.Exec(schema); err != nil {
		t.Fatalf("failed to execute schema: %v", err)
	}
	t.Cleanup(func() {
		dbConn.Close()
	})
	return dbConn
}

func TestGenerateAndValidateTokenPair(t *testing.T) {
	cfg := testJWTConfig()
	userID := uuid.New()
	role := "student"
	pair, err := GenerateTokenPair(userID, role, cfg)
	if err != nil {
		t.Fatalf("GenerateTokenPair failed: %v", err)
	}
	if pair.AccessToken == "" {
		t.Error("AccessToken should not be empty")
	}
	if pair.RefreshToken == "" {
		t.Error("RefreshToken should not be empty")
	}
	if pair.AccessExpiry.IsZero() {
		t.Error("AccessExpiry should not be zero")
	}
	if pair.RefreshExpiry.IsZero() {
		t.Error("RefreshExpiry should not be zero")
	}
	parsedUserID, parsedRole, err := ValidateAccessToken(pair.AccessToken, cfg)
	if err != nil {
		t.Fatalf("ValidateAccessToken failed: %v", err)
	}
	if parsedUserID != userID {
		t.Errorf("expected userID %v, got %v", userID, parsedUserID)
	}
	if parsedRole != role {
		t.Errorf("expected role %s, got %s", role, parsedRole)
	}
	refreshUserID, err := ValidateRefreshToken(pair.RefreshToken, cfg)
	if err != nil {
		t.Fatalf("ValidateRefreshToken failed: %v", err)
	}
	if refreshUserID != userID {
		t.Errorf("expected userID %v, got %v", userID, refreshUserID)
	}
}

func TestValidateAccessTokenInvalid(t *testing.T) {
	cfg := testJWTConfig()
	_, _, err := ValidateAccessToken("invalid-token", cfg)
	if err == nil {
		t.Error("expected error for invalid token, got nil")
	}
}

func TestValidateRefreshTokenRejectsAccessToken(t *testing.T) {
	cfg := testJWTConfig()
	userID := uuid.New()
	pair, err := GenerateTokenPair(userID, "student", cfg)
	if err != nil {
		t.Fatalf("GenerateTokenPair failed: %v", err)
	}
	_, err = ValidateRefreshToken(pair.AccessToken, cfg)
	if err == nil {
		t.Error("expected error when validating access token as refresh token, got nil")
	}
}

func TestValidateTokenWithWrongSecret(t *testing.T) {
	cfg := testJWTConfig()
	userID := uuid.New()
	pair, err := GenerateTokenPair(userID, "student", cfg)
	if err != nil {
		t.Fatalf("GenerateTokenPair failed: %v", err)
	}
	wrongCfg := JWTConfig{Secret: "wrong-secret", AccessTokenExpiry: cfg.AccessTokenExpiry, RefreshTokenExpiry: cfg.RefreshTokenExpiry}
	_, _, err = ValidateAccessToken(pair.AccessToken, wrongCfg)
	if err == nil {
		t.Error("expected error with wrong secret, got nil")
	}
}

func TestHashPasswordAndCheck(t *testing.T) {
	password := "mysecretpassword123"
	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}
	if hash == "" {
		t.Error("hash should not be empty")
	}
	if hash == password {
		t.Error("hash should not equal the plain password")
	}
	if !CheckPassword(password, hash) {
		t.Error("CheckPassword should return true for correct password")
	}
	if CheckPassword("wrongpassword", hash) {
		t.Error("CheckPassword should return false for wrong password")
	}
}

func TestRBACMiddlewareAllowed(t *testing.T) {
	gin.SetMode(gin.TestMode)
	cfg := testJWTConfig()
	userID := uuid.New()
	pair, err := GenerateTokenPair(userID, "admin", cfg)
	if err != nil {
		t.Fatalf("GenerateTokenPair failed: %v", err)
	}
	router := gin.New()
	router.Use(AuthMiddleware(cfg))
	router.Use(RBACMiddleware("admin"))
	router.GET("/test", func(c *gin.Context) {
		uid := GetUserID(c)
		role := GetUserRole(c)
		c.JSON(http.StatusOK, gin.H{"user_id": uid, "role": role})
	})
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer "+pair.AccessToken)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}
}

func TestRBACMiddlewareDenied(t *testing.T) {
	gin.SetMode(gin.TestMode)
	cfg := testJWTConfig()
	userID := uuid.New()
	pair, err := GenerateTokenPair(userID, "student", cfg)
	if err != nil {
		t.Fatalf("GenerateTokenPair failed: %v", err)
	}
	router := gin.New()
	router.Use(AuthMiddleware(cfg))
	router.Use(RBACMiddleware("admin"))
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer "+pair.AccessToken)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusForbidden {
		t.Errorf("expected status 403, got %d", w.Code)
	}
}

func TestAuthMiddlewareMissingHeader(t *testing.T) {
	gin.SetMode(gin.TestMode)
	cfg := testJWTConfig()
	router := gin.New()
	router.Use(AuthMiddleware(cfg))
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected status 401, got %d", w.Code)
	}
}

func TestRegisterAndLogin(t *testing.T) {
	dbConn := setupTestDB(t)
	store := &db.UserStore{DB: dbConn, Driver: "sqlite3"}
	svc := NewUserService(store, testJWTConfig(), OAuthProviders{})
	ctx := context.Background()
	user, tokens, err := svc.Register(ctx, "test@example.com", "password123", "Test User")
	if err != nil {
		t.Fatalf("Register failed: %v", err)
	}
	if user.ID == uuid.Nil {
		t.Error("user ID should not be nil")
	}
	if user.Email != "test@example.com" {
		t.Errorf("expected email test@example.com, got %s", user.Email)
	}
	if tokens.AccessToken == "" {
		t.Error("access token should not be empty")
	}
	if tokens.RefreshToken == "" {
		t.Error("refresh token should not be empty")
	}
	loginUser, loginTokens, err := svc.Login(ctx, "test@example.com", "password123")
	if err != nil {
		t.Fatalf("Login failed: %v", err)
	}
	if loginUser.ID != user.ID {
		t.Errorf("expected user ID %v, got %v", user.ID, loginUser.ID)
	}
	if loginTokens.AccessToken == "" {
		t.Error("login access token should not be empty")
	}
	_, _, err = svc.Login(ctx, "test@example.com", "wrongpassword")
	if err == nil {
		t.Error("expected error for wrong password, got nil")
	}
}

func TestRegisterDuplicateEmail(t *testing.T) {
	dbConn := setupTestDB(t)
	store := &db.UserStore{DB: dbConn, Driver: "sqlite3"}
	svc := NewUserService(store, testJWTConfig(), OAuthProviders{})
	ctx := context.Background()
	_, _, err := svc.Register(ctx, "dup@example.com", "password", "User1")
	if err != nil {
		t.Fatalf("first Register failed: %v", err)
	}
	_, _, err = svc.Register(ctx, "dup@example.com", "password2", "User2")
	if err == nil {
		t.Error("expected error for duplicate email, got nil")
	}
}

func TestRefreshTokens(t *testing.T) {
	dbConn := setupTestDB(t)
	store := &db.UserStore{DB: dbConn, Driver: "sqlite3"}
	svc := NewUserService(store, testJWTConfig(), OAuthProviders{})
	ctx := context.Background()
	_, tokens, err := svc.Register(ctx, "refresh@example.com", "password123", "Refresh User")
	if err != nil {
		t.Fatalf("Register failed: %v", err)
	}
	newTokens, err := svc.RefreshTokens(ctx, tokens.RefreshToken)
	if err != nil {
		t.Fatalf("RefreshTokens failed: %v", err)
	}
	if newTokens.AccessToken == "" {
		t.Error("new access token should not be empty")
	}
	if newTokens.RefreshToken == "" {
		t.Error("new refresh token should not be empty")
	}
}
