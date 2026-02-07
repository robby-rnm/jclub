package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"sync"
)

const (
	baseURL = "http://localhost:8080/api"
)

func main() {
	// 1. Login as Admin/Host to Create Match
	token := login("tester@example.com", "password123")
	if token == "" {
		panic("Login failed")
	}

	// 2. Create a Club (if needed or use existing)
	clubID := "96363d7a-f918-4723-a990-128e28d77c82" // Hardcoded from previous checks

	// 3. Create a Match with Quota = 5
	matchID := createMatch(token, clubID)
	fmt.Printf("Created Match: %s with quota 5\n", matchID)

	// 4. Register 10 dummy users
	users := make([]string, 10)
	userTokens := make([]string, 10)
	for i := 0; i < 10; i++ {
		email := fmt.Sprintf("stress%d@test.com", i)
		register(email)
		userTokens[i] = login(email, "password123")
		users[i] = email
	}

	// 5. Concurrent Join
	// We have 5 slots. We try to join with 10 users at once.
	// Expected: 5 confirmed, 5 waitlist (or 5 confirmed, 5 rejected if logic differs).
	// But mostly we check if we oversell CONFIRMED.
	var wg sync.WaitGroup
	start := make(chan struct{})

	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			<-start // Wait for signal
			joinMatch(userTokens[idx], matchID)
		}(i)
	}

	fmt.Println("Starting Race...")
	close(start) // GO!
	wg.Wait()
	fmt.Println("Race Finished.")

	// 6. Check Result
	checkMatch(token, matchID)
}

func login(email, password string) string {
	payload := map[string]string{
		"email":    email,
		"password": password,
		"provider": "local",
	}
	body, _ := json.Marshal(payload)
	resp, err := http.Post(baseURL+"/login", "application/json", bytes.NewBuffer(body))
	if err != nil {
		fmt.Println("Login error:", err)
		return ""
	}
	defer resp.Body.Close()

	var res map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&res)
	if token, ok := res["token"].(string); ok {
		return token
	}
	return ""
}

func register(email string) {
	payload := map[string]string{
		"email":    email,
		"name":     "Stress User",
		"password": "password123",
	}
	body, _ := json.Marshal(payload)
	http.Post(baseURL+"/register", "application/json", bytes.NewBuffer(body))
}

func createMatch(token, clubID string) string {
	payload := map[string]interface{}{
		"club_id":         clubID,
		"title":           "Stress Match",
		"description":     "Stress Test",
		"game_type":       "Mini Soccer",
		"location":        "Test Loc",
		"price":           10000,
		"max_players":     5,
		"date":            "2026-05-01",
		"time":            "10:00",
		"position_quotas": `{"player_front": 5}`,
	}
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", baseURL+"/matches", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var res map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&res)
	if id, ok := res["ID"].(string); ok {
		return id
	}
	// Fallback or panic if failed
	fmt.Println("Create Match Failed:", res)
	panic("Failed to create match")
}

func joinMatch(token, matchID string) {
	payload := map[string]string{
		"match_id": matchID,
		"position": "player_front",
	}
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", baseURL+"/bookings", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		body, _ := ioutil.ReadAll(resp.Body)
		fmt.Printf("X (%d: %s) ", resp.StatusCode, string(body))
	} else {
		fmt.Print(".")
	}
	// We don't care about individual error here, we check final count.
}

func checkMatch(token, matchID string) {
	req, _ := http.NewRequest("GET", baseURL+"/matches/"+matchID, nil)
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()

	bodyBytes, _ := ioutil.ReadAll(resp.Body)
	// fmt.Println(string(bodyBytes))

	var match struct {
		Bookings []struct {
			Status string
		}
	}
	json.Unmarshal(bodyBytes, &match)

	confirmedCount := 0
	for _, b := range match.Bookings {
		if b.Status == "confirmed" {
			confirmedCount++
		}
	}
	fmt.Printf("\nFINAL RESULT: Confirmed Bookings = %d (Expected Max 5)\n", confirmedCount)
	if confirmedCount > 5 {
		fmt.Println("TEST FAILED: RACE CONDITION DETECTED!")
	} else {
		fmt.Println("TEST PASSED: No Overselling.")
	}
}
