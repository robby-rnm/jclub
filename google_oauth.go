package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"reserve_game/internal/middleware"
	"reserve_game/internal/models"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var googleOAuthConfig *oauth2.Config

func initGoogleOAuth() {
	if googleOAuthConfig == nil {
		googleOAuthConfig = &oauth2.Config{
			ClientID:     "1043625471796-m5453ulsspucqg3fi6q77dd17q028pda.apps.googleusercontent.com",
			ClientSecret: "GOCSPX-your-secret-here", // TODO: Add actual secret
			Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"},
			Endpoint:     google.Endpoint,
			RedirectURL:  "https://jclubadmin.gsteknologi.com/api/oauth/callback",
		}
	}
}

type GoogleUserInfo struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	VerifiedEmail bool   `json:"verified_email"`
}

func GetGoogleUserInfo(code string) (*GoogleUserInfo, error) {
	initGoogleOAuth()
	
	token, err := googleOAuthConfig.Exchange(nil, code)
	if err != nil {
		return nil, fmt.Errorf("code exchange failed: %s", err)
	}

	resp, err := googleOAuthConfig.Client(nil, token).Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %s", err)
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
	initGoogleOAuth()
	return googleOAuthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
}

func generateToken(user *models.User) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"exp":     time.Now().Add(time.Hour * 72).Unix(),
	})
	return token.SignedString(middleware.SecretKey)
}
