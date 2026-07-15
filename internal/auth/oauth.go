package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
)

type OAuthConfig struct {
	ClientID     string
	ClientSecret string
	RedirectURL  string
}

type OAuthProviders struct {
	GitHub OAuthConfig
	Google OAuthConfig
}

type GitHubUserInfo struct {
	ID    float64 `json:"id"`
	Login string  `json:"login"`
	Email string  `json:"email"`
	Name  string  `json:"name"`
}

type GoogleUserInfo struct {
	Sub     string `json:"sub"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

type tokenResponse struct {
	AccessToken string `json:"access_token"`
}

func ExchangeGitHubCode(ctx context.Context, cfg OAuthConfig, code string) (string, error) {
	data := url.Values{}
	data.Set("client_id", cfg.ClientID)
	data.Set("client_secret", cfg.ClientSecret)
	data.Set("code", code)
	data.Set("redirect_uri", cfg.RedirectURL)
	req, err := http.NewRequestWithContext(ctx, "POST", "https://github.com/login/oauth/access_token", strings.NewReader(data.Encode()))
	if err != nil {
		return "", fmt.Errorf("failed to create github token request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to exchange github code: %w", err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read github token response: %w", err)
	}
	var tokenResp tokenResponse
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return "", fmt.Errorf("failed to parse github token response: %w", err)
	}
	if tokenResp.AccessToken == "" {
		return "", fmt.Errorf("empty access token from github")
	}
	return tokenResp.AccessToken, nil
}

func GetGitHubUserInfo(ctx context.Context, accessToken string) (GitHubUserInfo, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", "https://api.github.com/user", nil)
	if err != nil {
		return GitHubUserInfo{}, fmt.Errorf("failed to create github user info request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return GitHubUserInfo{}, fmt.Errorf("failed to get github user info: %w", err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return GitHubUserInfo{}, fmt.Errorf("failed to read github user info response: %w", err)
	}
	var info GitHubUserInfo
	if err := json.Unmarshal(body, &info); err != nil {
		return GitHubUserInfo{}, fmt.Errorf("failed to parse github user info: %w", err)
	}
	return info, nil
}

func ExchangeGoogleCode(ctx context.Context, cfg OAuthConfig, code string) (string, error) {
	data := url.Values{}
	data.Set("client_id", cfg.ClientID)
	data.Set("client_secret", cfg.ClientSecret)
	data.Set("code", code)
	data.Set("redirect_uri", cfg.RedirectURL)
	data.Set("grant_type", "authorization_code")
	req, err := http.NewRequestWithContext(ctx, "POST", "https://oauth2.googleapis.com/token", strings.NewReader(data.Encode()))
	if err != nil {
		return "", fmt.Errorf("failed to create google token request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to exchange google code: %w", err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read google token response: %w", err)
	}
	var tokenResp tokenResponse
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return "", fmt.Errorf("failed to parse google token response: %w", err)
	}
	if tokenResp.AccessToken == "" {
		return "", fmt.Errorf("empty access token from google")
	}
	return tokenResp.AccessToken, nil
}

func GetGoogleUserInfo(ctx context.Context, accessToken string) (GoogleUserInfo, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", "https://www.googleapis.com/oauth2/v3/userinfo", nil)
	if err != nil {
		return GoogleUserInfo{}, fmt.Errorf("failed to create google user info request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return GoogleUserInfo{}, fmt.Errorf("failed to get google user info: %w", err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return GoogleUserInfo{}, fmt.Errorf("failed to read google user info response: %w", err)
	}
	var info GoogleUserInfo
	if err := json.Unmarshal(body, &info); err != nil {
		return GoogleUserInfo{}, fmt.Errorf("failed to parse google user info: %w", err)
	}
	return info, nil
}
