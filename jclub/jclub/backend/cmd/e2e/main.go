package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

// Config
const BaseURL = "http://localhost:8080/api"

// Helper Types
type Response struct {
	Token string `json:"token"`
	User  User   `json:"user"`
	Error string `json:"error"`
}

type User struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
	Role  string `json:"role"`
}

type Club struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type Match struct {
	ID           string `json:"id"`
	Title        string `json:"title"`
	Status       string `json:"status"`
	BookingCount int    `json:"booking_count"`
}

var (
	ownerToken  string
	ownerID     string
	memberToken string
	memberID    string
	clubID      string
	matchID     string
)

func main() {
	fmt.Println("🚀 Starting E2E System Test")

	// 1. Auth Flow
	fmt.Println("\n--- 1. Authentication ---")
	registerUser("owner_"+time.Now().Format("150405")+"@test.com", "Owner User")
	ownerToken, ownerID = loginUser("owner_" + time.Now().Format("150405") + "@test.com")

	registerUser("member_"+time.Now().Format("150405")+"@test.com", "Member User")
	memberToken, memberID = loginUser("member_" + time.Now().Format("150405") + "@test.com")

	if ownerToken == "" || memberToken == "" {
		fatal("Auth failed")
	}
	fmt.Println("✅ Auth Check Passed")

	// 2. Club Flow
	fmt.Println("\n--- 2. Club Management ---")
	createClub()
	joinClub()
	// Leave club tests later or now? Let's keep them in club for Match tests.

	// 3. Match Flow
	fmt.Println("\n--- 3. Match Lifecycle ---")
	createMatchDraft()
	publishMatch()
	joinMatch()

	// 4. Announcement Flow
	fmt.Println("\n--- 4. Announcements ---")
	createAnnouncement()

	// 5. Cleanup
	fmt.Println("\n--- 5. Cleanup ---")
	// cancelMatch()
	// leaveClub()

	fmt.Println("\n✅✅ ALL TESTS PASSED SUCCESSFULLY! ✅✅")
}

// --- Helpers ---

func registerUser(email, name string) {
	fmt.Printf("Registering %s...\n", email)
	post("/register", map[string]string{
		"email":    email,
		"password": "password123",
		"name":     name,
		"provider": "local",
	}, "")
}

func loginUser(email string) (string, string) {
	fmt.Printf("Logging in %s...\n", email)
	resp, body := post("/login", map[string]string{
		"email":    email,
		"password": "password123",
		"provider": "local",
	}, "")

	if resp.StatusCode != 200 {
		fatal("Login failed status: " + resp.Status)
	}

	var r Response
	json.Unmarshal(body, &r)
	if r.Token == "" {
		fatal("Login failed: " + string(body))
	}
	// Store email for next login if needed, but current flow registers unique emails
	return r.Token, r.User.ID
}

func createClub() {
	fmt.Println("Creating Club...")
	resp, body := post("/clubs", map[string]string{
		"name":        "Test Club " + time.Now().Format("150405"),
		"description": "E2E Test Club",
	}, ownerToken)

	if resp.StatusCode != 200 && resp.StatusCode != 201 {
		fatal("Create Club failed: " + string(body))
	}

	var club Club
	json.Unmarshal(body, &club)
	clubID = club.ID
	fmt.Printf("✅ Club Created: %s (%s)\n", club.Name, club.ID)
}

func joinClub() {
	fmt.Println("Member joining club...")
	resp, body := post("/clubs/"+clubID+"/join", nil, memberToken)
	if resp.StatusCode != 200 {
		fatal("Join Club failed: " + string(body))
	}
	fmt.Println("✅ Member Joined Club")
}

func createMatchDraft() {
	fmt.Println("Creating Draft Match...")
	data := map[string]interface{}{
		"title":       "Draft Match",
		"date":        time.Now().Add(24 * time.Hour).Format("2006-01-02"),
		"time":        "20:00",
		"location":    "Test Field",
		"price":       50000,
		"max_players": 10,
		"club_id":     clubID,
		"game_type":   "minisoccer",
		"status":      "draft",
	}

	resp, body := postJSON("/matches", data, ownerToken)
	if resp.StatusCode != 200 && resp.StatusCode != 201 {
		fatal("Create Match failed: " + string(body))
	}

	var match Match
	json.Unmarshal(body, &match)
	if match.Status != "draft" {
		fatal("Match status mismatch. Expected draft, got " + match.Status)
	}
	matchID = match.ID
	fmt.Printf("✅ Draft Match Created: %s\n", matchID)

	// Verify not visible to member
	verifyMatchVisibility(false)
}

func publishMatch() {
	fmt.Println("Publishing Match...")
	data := map[string]interface{}{
		"status": "published",
	}
	resp, body := putJSON("/matches/"+matchID, data, ownerToken)
	if resp.StatusCode != 200 {
		fatal("Publish Match failed: " + string(body))
	}
	fmt.Println("✅ Match Published")

	// Verify visible to member
	verifyMatchVisibility(true)
}

func verifyMatchVisibility(shouldBeVisible bool) {
	fmt.Printf("Verifying Visibility (Should see: %v)...\n", shouldBeVisible)
	resp, body := get("/matches?club_id="+clubID, memberToken)
	if resp.StatusCode != 200 {
		fatal("List Matches failed: " + string(body))
	}

	var matches []Match
	json.Unmarshal(body, &matches)

	found := false
	for _, m := range matches {
		if m.ID == matchID {
			found = true
			break
		}
	}

	if shouldBeVisible && !found {
		fatal("Match should be visible but wasn't found")
	}
	if !shouldBeVisible && found {
		fatal("Match should NOT be visible but WAS found")
	}
}

func joinMatch() {
	fmt.Println("Member booking match...")
	data := map[string]interface{}{
		"match_id": matchID,
		"position": "player_front",
	}
	resp, body := postJSON("/bookings", data, memberToken)
	if resp.StatusCode != 200 && resp.StatusCode != 201 {
		fatal("Join Match failed: " + string(body))
	}
	fmt.Println("✅ Member Joined Match")
}

func createAnnouncement() {
	fmt.Println("Creating Announcement...")
	data := map[string]string{
		"title":   "Test Announcement",
		"content": "This is a test",
	}
	resp, body := postJSON("/clubs/"+clubID+"/announcements", data, ownerToken)
	if resp.StatusCode != 200 && resp.StatusCode != 201 {
		fatal("Create Announcement failed: " + string(body))
	}
	fmt.Println("✅ Announcement Created")
}

// --- HTTP Utils ---

func post(path string, form map[string]string, token string) (*http.Response, []byte) {
	jsonBody, _ := json.Marshal(form)
	return request("POST", path, jsonBody, token)
}

func postJSON(path string, data interface{}, token string) (*http.Response, []byte) {
	jsonBody, _ := json.Marshal(data)
	return request("POST", path, jsonBody, token)
}

func putJSON(path string, data interface{}, token string) (*http.Response, []byte) {
	jsonBody, _ := json.Marshal(data)
	return request("PUT", path, jsonBody, token)
}

func get(path string, token string) (*http.Response, []byte) {
	return request("GET", path, nil, token)
}

func request(method, path string, body []byte, token string) (*http.Response, []byte) {
	req, _ := http.NewRequest(method, BaseURL+path, bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fatal("Request failed: " + err.Error())
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	return resp, respBody
}

func fatal(msg string) {
	fmt.Println("❌ ERROR:", msg)
	os.Exit(1)
}
