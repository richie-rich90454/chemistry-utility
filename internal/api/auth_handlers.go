package api

import (
	"fmt"
	"net/http"

	"chemistry-utility/internal/auth"

	"github.com/gin-gonic/gin"
)

type registerRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Name     string `json:"name" binding:"required"`
}

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type forgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type resetPasswordRequest struct {
	Token    string `json:"token" binding:"required"`
	Password string `json:"password" binding:"required,min=8"`
}

type authResponse struct {
	User   auth.PublicUser `json:"user"`
	Tokens auth.TokenPair  `json:"tokens"`
}

// register handles user registration.
func (a *API) register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		WriteValidation(c, err.Error())
		return
	}

	user, tokens, err := a.userService.Register(c.Request.Context(), req.Email, req.Password, req.Name)
	if err != nil {
		WriteProblem(c, http.StatusConflict, "Registration Failed", err.Error())
		return
	}

	c.JSON(http.StatusCreated, authResponse{
		User:   auth.ToPublicUser(user),
		Tokens: tokens,
	})
}

// login handles user login with email and password.
func (a *API) login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		WriteValidation(c, err.Error())
		return
	}

	user, tokens, err := a.userService.Login(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		WriteUnauthorized(c, "invalid credentials")
		return
	}

	c.JSON(http.StatusOK, authResponse{
		User:   auth.ToPublicUser(user),
		Tokens: tokens,
	})
}

// refreshToken issues a new token pair from a valid refresh token.
func (a *API) refreshToken(c *gin.Context) {
	var req refreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		WriteValidation(c, err.Error())
		return
	}

	tokens, err := a.userService.RefreshTokens(c.Request.Context(), req.RefreshToken)
	if err != nil {
		WriteUnauthorized(c, "invalid or expired refresh token")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"tokens": tokens,
	})
}

// forgotPassword requests a password reset for the given email.
func (a *API) forgotPassword(c *gin.Context) {
	var req forgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		WriteValidation(c, err.Error())
		return
	}

	_, err := a.userService.RequestPasswordReset(c.Request.Context(), req.Email)
	if err != nil {
		// Always return success to avoid email enumeration
		c.JSON(http.StatusOK, gin.H{"message": "if the email exists, a reset link has been sent"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "if the email exists, a reset link has been sent"})
}

// resetPassword resets a user's password using a valid reset token.
func (a *API) resetPassword(c *gin.Context) {
	var req resetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		WriteValidation(c, err.Error())
		return
	}

	if err := a.userService.ResetPassword(c.Request.Context(), req.Token, req.Password); err != nil {
		WriteValidation(c, "invalid or expired reset token")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "password has been reset"})
}

// githubOAuth redirects to the GitHub OAuth authorization page.
func (a *API) githubOAuth(c *gin.Context) {
	cfg := a.cfg.OAuthProviders.GitHub
	if cfg.ClientID == "" {
		WriteNotFound(c, "github oauth not configured")
		return
	}
	url := fmt.Sprintf("https://github.com/login/oauth/authorize?client_id=%s&redirect_uri=%s",
		cfg.ClientID, cfg.RedirectURL)
	c.Redirect(http.StatusFound, url)
}

// githubOAuthCallback handles the OAuth callback from GitHub.
func (a *API) githubOAuthCallback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		WriteValidation(c, "missing authorization code")
		return
	}

	user, tokens, err := a.userService.OAuthLogin(c.Request.Context(), "github", code)
	if err != nil {
		WriteUnauthorized(c, "github oauth failed: "+err.Error())
		return
	}

	c.JSON(http.StatusOK, authResponse{
		User:   auth.ToPublicUser(user),
		Tokens: tokens,
	})
}

// googleOAuth redirects to the Google OAuth authorization page.
func (a *API) googleOAuth(c *gin.Context) {
	cfg := a.cfg.OAuthProviders.Google
	if cfg.ClientID == "" {
		WriteNotFound(c, "google oauth not configured")
		return
	}
	url := fmt.Sprintf("https://accounts.google.com/o/oauth2/v2/auth?client_id=%s&redirect_uri=%s&response_type=code&scope=openid+email+profile",
		cfg.ClientID, cfg.RedirectURL)
	c.Redirect(http.StatusFound, url)
}

// googleOAuthCallback handles the OAuth callback from Google.
func (a *API) googleOAuthCallback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		WriteValidation(c, "missing authorization code")
		return
	}

	user, tokens, err := a.userService.OAuthLogin(c.Request.Context(), "google", code)
	if err != nil {
		WriteUnauthorized(c, "google oauth failed: "+err.Error())
		return
	}

	c.JSON(http.StatusOK, authResponse{
		User:   auth.ToPublicUser(user),
		Tokens: tokens,
	})
}
