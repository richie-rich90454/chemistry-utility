package auth

import (
	"fmt"
	"time"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type JWTConfig struct {
	Secret             string
	AccessTokenExpiry  time.Duration
	RefreshTokenExpiry time.Duration
}

func DefaultJWTConfig(secret string) JWTConfig {
	return JWTConfig{
		Secret:             secret,
		AccessTokenExpiry:  15 * time.Minute,
		RefreshTokenExpiry: 7 * 24 * time.Hour,
	}
}

type TokenPair struct {
	AccessToken   string
	RefreshToken  string
	AccessExpiry  time.Time
	RefreshExpiry time.Time
}

type accessClaims struct {
	jwt.RegisteredClaims
	Role string `json:"role"`
}

type refreshClaims struct {
	jwt.RegisteredClaims
	Type string `json:"type"`
}

func GenerateTokenPair(userID uuid.UUID, role string, cfg JWTConfig) (TokenPair, error) {
	now := time.Now()
	accessExpiry := now.Add(cfg.AccessTokenExpiry)
	refreshExpiry := now.Add(cfg.RefreshTokenExpiry)
	accessTok := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(accessExpiry),
		},
		Role: role,
	})
	accessToken, err := accessTok.SignedString([]byte(cfg.Secret))
	if err != nil {
		return TokenPair{}, fmt.Errorf("failed to sign access token: %w", err)
	}
	refreshTok := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(refreshExpiry),
		},
		Type: "refresh",
	})
	refreshToken, err := refreshTok.SignedString([]byte(cfg.Secret))
	if err != nil {
		return TokenPair{}, fmt.Errorf("failed to sign refresh token: %w", err)
	}
	return TokenPair{
		AccessToken:   accessToken,
		RefreshToken:  refreshToken,
		AccessExpiry:  accessExpiry,
		RefreshExpiry: refreshExpiry,
	}, nil
}

func ValidateAccessToken(tokenStr string, cfg JWTConfig) (uuid.UUID, string, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &accessClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(cfg.Secret), nil
	})
	if err != nil {
		return uuid.Nil, "", fmt.Errorf("invalid access token: %w", err)
	}
	claims, ok := token.Claims.(*accessClaims)
	if !ok || !token.Valid {
		return uuid.Nil, "", fmt.Errorf("invalid access token claims")
	}
	userID, err := uuid.Parse(claims.Subject)
	if err != nil {
		return uuid.Nil, "", fmt.Errorf("invalid subject in token: %w", err)
	}
	return userID, claims.Role, nil
}

func ValidateRefreshToken(tokenStr string, cfg JWTConfig) (uuid.UUID, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &refreshClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(cfg.Secret), nil
	})
	if err != nil {
		return uuid.Nil, fmt.Errorf("invalid refresh token: %w", err)
	}
	claims, ok := token.Claims.(*refreshClaims)
	if !ok || !token.Valid {
		return uuid.Nil, fmt.Errorf("invalid refresh token claims")
	}
	if claims.Type != "refresh" {
		return uuid.Nil, fmt.Errorf("token is not a refresh token")
	}
	userID, err := uuid.Parse(claims.Subject)
	if err != nil {
		return uuid.Nil, fmt.Errorf("invalid subject in token: %w", err)
	}
	return userID, nil
}
