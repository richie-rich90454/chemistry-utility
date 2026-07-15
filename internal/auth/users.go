package auth

import (
	"context"
	"fmt"
	"strconv"
	"chemistry-utility/internal/db"
	"github.com/google/uuid"
)

type UserService struct {
	store         *db.UserStore
	jwtCfg        JWTConfig
	oauthProviders OAuthProviders
}

func NewUserService(store *db.UserStore, jwtCfg JWTConfig, oauthProviders OAuthProviders) *UserService {
	return &UserService{
		store:         store,
		jwtCfg:        jwtCfg,
		oauthProviders: oauthProviders,
	}
}

func (s *UserService) Register(ctx context.Context, email, password, name string) (db.User, TokenPair, error) {
	existing, err := s.store.GetByEmail(ctx, email)
	if err == nil && existing != nil {
		return db.User{}, TokenPair{}, fmt.Errorf("email already registered")
	}
	hash, err := HashPassword(password)
	if err != nil {
		return db.User{}, TokenPair{}, fmt.Errorf("failed to hash password: %w", err)
	}
	user := db.User{
		Email:        email,
		PasswordHash: hash,
		Name:         name,
		Role:         "student",
	}
	if err := s.store.Create(ctx, &user); err != nil {
		return db.User{}, TokenPair{}, fmt.Errorf("failed to create user: %w", err)
	}
	tokens, err := GenerateTokenPair(user.ID, user.Role, s.jwtCfg)
	if err != nil {
		return db.User{}, TokenPair{}, fmt.Errorf("failed to generate tokens: %w", err)
	}
	return user, tokens, nil
}

func (s *UserService) Login(ctx context.Context, email, password string) (db.User, TokenPair, error) {
	user, err := s.store.GetByEmail(ctx, email)
	if err != nil {
		return db.User{}, TokenPair{}, fmt.Errorf("invalid credentials")
	}
	if !CheckPassword(password, user.PasswordHash) {
		return db.User{}, TokenPair{}, fmt.Errorf("invalid credentials")
	}
	tokens, err := GenerateTokenPair(user.ID, user.Role, s.jwtCfg)
	if err != nil {
		return db.User{}, TokenPair{}, fmt.Errorf("failed to generate tokens: %w", err)
	}
	return *user, tokens, nil
}

func (s *UserService) RefreshTokens(ctx context.Context, refreshToken string) (TokenPair, error) {
	userID, err := ValidateRefreshToken(refreshToken, s.jwtCfg)
	if err != nil {
		return TokenPair{}, fmt.Errorf("invalid refresh token: %w", err)
	}
	user, err := s.store.GetByID(ctx, userID)
	if err != nil {
		return TokenPair{}, fmt.Errorf("user not found: %w", err)
	}
	tokens, err := GenerateTokenPair(user.ID, user.Role, s.jwtCfg)
	if err != nil {
		return TokenPair{}, fmt.Errorf("failed to generate tokens: %w", err)
	}
	return tokens, nil
}

func (s *UserService) OAuthLogin(ctx context.Context, provider, code string) (db.User, TokenPair, error) {
	switch provider {
	case "github":
		return s.githubLogin(ctx, code)
	case "google":
		return s.googleLogin(ctx, code)
	default:
		return db.User{}, TokenPair{}, fmt.Errorf("unsupported oauth provider: %s", provider)
	}
}

func (s *UserService) githubLogin(ctx context.Context, code string) (db.User, TokenPair, error) {
	accessToken, err := ExchangeGitHubCode(ctx, s.oauthProviders.GitHub, code)
	if err != nil {
		return db.User{}, TokenPair{}, fmt.Errorf("github code exchange failed: %w", err)
	}
	info, err := GetGitHubUserInfo(ctx, accessToken)
	if err != nil {
		return db.User{}, TokenPair{}, fmt.Errorf("github user info failed: %w", err)
	}
	oauthID := strconv.FormatFloat(info.ID, 'f', 0, 64)
	return s.findOrCreateOAuthUser(ctx, "github", oauthID, info.Email, info.Name)
}

func (s *UserService) googleLogin(ctx context.Context, code string) (db.User, TokenPair, error) {
	accessToken, err := ExchangeGoogleCode(ctx, s.oauthProviders.Google, code)
	if err != nil {
		return db.User{}, TokenPair{}, fmt.Errorf("google code exchange failed: %w", err)
	}
	info, err := GetGoogleUserInfo(ctx, accessToken)
	if err != nil {
		return db.User{}, TokenPair{}, fmt.Errorf("google user info failed: %w", err)
	}
	return s.findOrCreateOAuthUser(ctx, "google", info.Sub, info.Email, info.Name)
}

func (s *UserService) findOrCreateOAuthUser(ctx context.Context, provider, oauthID, email, name string) (db.User, TokenPair, error) {
	users, err := s.store.List(ctx, 1000, 0)
	if err != nil {
		return db.User{}, TokenPair{}, fmt.Errorf("failed to search users: %w", err)
	}
	for _, u := range users {
		if u.OAuthProvider == provider && u.OAuthID == oauthID {
			tokens, err := GenerateTokenPair(u.ID, u.Role, s.jwtCfg)
			if err != nil {
				return db.User{}, TokenPair{}, fmt.Errorf("failed to generate tokens: %w", err)
			}
			return *u, tokens, nil
		}
	}
	user := db.User{
		Email:         email,
		Name:          name,
		Role:          "student",
		OAuthProvider: provider,
		OAuthID:       oauthID,
	}
	if err := s.store.Create(ctx, &user); err != nil {
		return db.User{}, TokenPair{}, fmt.Errorf("failed to create oauth user: %w", err)
	}
	tokens, err := GenerateTokenPair(user.ID, user.Role, s.jwtCfg)
	if err != nil {
		return db.User{}, TokenPair{}, fmt.Errorf("failed to generate tokens: %w", err)
	}
	return user, tokens, nil
}

func (s *UserService) VerifyEmail(ctx context.Context, userID uuid.UUID) error {
	user, err := s.store.GetByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}
	user.EmailVerified = true
	if err := s.store.Update(ctx, user); err != nil {
		return fmt.Errorf("failed to verify email: %w", err)
	}
	return nil
}

func (s *UserService) RequestPasswordReset(ctx context.Context, email string) (string, error) {
	_, err := s.store.GetByEmail(ctx, email)
	if err != nil {
		return "", fmt.Errorf("user not found")
	}
	resetToken := uuid.New().String()
	return resetToken, nil
}

func (s *UserService) ResetPassword(ctx context.Context, resetToken, newPassword string) error {
	userID, err := uuid.Parse(resetToken)
	if err != nil {
		return fmt.Errorf("invalid reset token")
	}
	user, err := s.store.GetByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}
	hash, err := HashPassword(newPassword)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}
	user.PasswordHash = hash
	if err := s.store.Update(ctx, user); err != nil {
		return fmt.Errorf("failed to reset password: %w", err)
	}
	return nil
}
