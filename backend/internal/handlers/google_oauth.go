
package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var googleOAuthConfig *oauth2.Config

func initGoogleOAuth() {
	googleOAuthConfig = &oauth2.Config{
		ClientID:     "1043625471796-v485tairv9a70ih1fl203f91aqbatanb.apps.googleusercontent.com",
		ClientSecret: "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",
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"},
		Endpoint:     google.Endpoint,
		RedirectURL:  "https://jclubadmin.gsteknologi.com/api/oauth/callback",
	}
}

type GoogleUserInfo struct {
	ID      string `json:"id"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

func GetGoogleOAuthConfig() *oauth2.Config {
	if googleOAuthConfig == nil {
		initGoogleOAuth()
	}
	return googleOAuthConfig
}

func GetGoogleUserInfo(code string) (*GoogleUserInfo, error) {
	config := GetGoogleOAuthConfig()
	token, err := config.Exchange(context.Background(), code)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code: %v", err)
	}
	client := config.Client(context.Background(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	var userInfo GoogleUserInfo
	if err := json.Unmarshal(data, &userInfo); err != nil {
		return nil, err
	}
	return &userInfo, nil
}

func GetGoogleAuthURL(state string) string {
	config := GetGoogleOAuthConfig()
	return config.AuthCodeURL(state, oauth2.AccessTypeOffline)
}
