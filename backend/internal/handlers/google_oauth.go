package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var googleOAuthConfig *oauth2.Config

func initGoogleOAuth() {
	googleOAuthConfig = &oauth2.Config{
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"},
		Endpoint:     google.Endpoint,
		RedirectURL:  "https://jclubadmin.gsteknologi.com/oauth/callback",
	}
}

func GetGoogleOAuthConfig() *oauth2.Config {
	if googleOAuthConfig == nil {
		initGoogleOAuth()
	}
	return googleOAuthConfig
}

type GoogleUserInfo struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
}

func GetGoogleUserInfo(code string) (*GoogleUserInfo, error) {
	config := GetGoogleOAuthConfig()
	
	fmt.Println("=== GOOGLE OAUTH DEBUG ===")
	fmt.Println("ClientID:", config.ClientID)
	fmt.Println("RedirectURL:", config.RedirectURL)
	
	token, err := config.Exchange(context.Background(), code)
	if err != nil {
		fmt.Println("Exchange Error:", err.Error())
		return nil, fmt.Errorf("failed to exchange code: %v", err)
	}
	
	fmt.Println("Token obtained successfully")

	client := config.Client(context.Background(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		fmt.Println("UserInfo Error:", err.Error())
		return nil, err
	}
	defer resp.Body.Close()

	data, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	fmt.Println("UserInfo Response:", string(data))

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

// GetGoogleUserInfoFromToken gets user info from an access token (for frontend OAuth flow)
func GetGoogleUserInfoFromToken(accessToken string) (*GoogleUserInfo, error) {
	resp, err := (&oauth2.Config{
		ClientID: os.Getenv("GOOGLE_CLIENT_ID"),
	}).Client(context.Background(), &oauth2.Token{AccessToken: accessToken}).Get("https://www.googleapis.com/oauth2/v2/userinfo")
	
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %v", err)
	}
	defer resp.Body.Close()

	data, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var userInfo GoogleUserInfo
	if err := json.Unmarshal(data, &userInfo); err != nil {
		return nil, err
	}

	return &userInfo, nil
}
