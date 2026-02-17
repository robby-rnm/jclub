package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
)

// Expo Push Notification Service

type ExpoPushMessage struct {
	To        string                 `json:"to"`
	Title     string                 `json:"title"`
	Body      string                 `json:"body"`
	Data      map[string]interface{} `json:"data,omitempty"`
	Sound     string                 `json:"sound,omitempty"`
	Priority  string                 `json:"priority,omitempty"`
	ChannelID string                 `json:"channelId,omitempty"`
}

type ExpoPushReceipt struct {
	Data struct {
		ID string `json:"id"`
	} `json:"data"`
}

type ExpoPushError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// SendPushNotification sends a push notification via Expo
func SendPushNotification(token string, title string, body string, data map[string]interface{}) error {
	if token == "" {
		return nil // No token, skip
	}

	// Check if it's an Expo push token
	if len(token) < 50 || token[:6] != "Exponent" {
		log.Printf("Skipping non-Expo push token: %s...", token[:20])
		return nil
	}

	messages := []ExpoPushMessage{
		{
			To:        token,
			Title:     title,
			Body:      body,
			Data:      data,
			Sound:     "default",
			Priority:  "high",
			ChannelID: "jclub-notifications",
		},
	}

	jsonData, err := json.Marshal(messages)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", "https://exp.host/--/api/v2/push/send", bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("Expo push notification failed with status: %d", resp.StatusCode)
		return fmt.Errorf("expo push failed with status: %d", resp.StatusCode)
	}

	log.Printf("Push notification sent to %s: %s", token[:20], title)
	return nil
}

// SendPushNotificationToUser sends push notification to a specific user
func SendPushNotificationToUser(userID string, title string, body string, notifType string, relatedID string) error {
	// This would be called from handlers
	// Need to get user push token from repository
	log.Printf("Would send push to user %s: %s - %s", userID, title, body)
	return nil
}

// BroadcastNotification sends notification to multiple users
func BroadcastNotification(userIDs []string, title string, body string, notifType string, relatedID string) {
	for _, userID := range userIDs {
		go SendPushNotificationToUser(userID, title, body, notifType, relatedID)
	}
}

// GetEnv vars
func GetExpoProjectID() string {
	// Set this in your environment or config
	return os.Getenv("EXPO_PROJECT_ID")
}
