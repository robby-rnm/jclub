package main

import (
	"fmt"
	"log"
	"reserve_game/internal/config"
	"reserve_game/internal/models"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	cfg := config.LoadConfig()

	// Connect to Database
	dsn := cfg.DatabaseURL
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("Database connected. Starting population script...")

	// 1. Find or Create User robby.juli@gmail.com
	var robby models.User
	email := "robby.juli@gmail.com"
	if err := db.Where("email = ?", email).First(&robby).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			log.Printf("User %s not found. Creating...", email)
			password := "123456"
			hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
			robby = models.User{
				Name:      "Robby Juli",
				Email:     email,
				Password:  string(hashedPassword),
				Provider:  "local",
				Role:      models.RolePlayer,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}
			if err := db.Create(&robby).Error; err != nil {
				log.Fatal("Failed to create user:", err)
			}
		} else {
			log.Fatalf("Error finding user: %v", err)
		}
	}
	log.Printf("User %s ready (ID: %s)", robby.Name, robby.ID)

	// 2. Find or Create Club "Test"
	var club models.Club
	clubName := "Test"
	if err := db.Where("name = ? AND creator_id = ?", clubName, robby.ID).First(&club).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			log.Printf("Club %s not found. Creating...", clubName)
			club = models.Club{
				Name:        clubName,
				Description: "Test Club for Development",
				CreatorID:   robby.ID,
				CreatedAt:   time.Now(),
				UpdatedAt:   time.Now(),
			}
			if err := db.Create(&club).Error; err != nil {
				log.Fatal("Failed to create club:", err)
			}
			// Add Robby as admin
			db.Create(&models.ClubMember{
				ClubID:    club.ID,
				UserID:    robby.ID,
				Role:      "admin",
				CreatedAt: time.Now(),
			})
		} else {
			log.Fatalf("Error finding club: %v", err)
		}
	}
	log.Printf("Club %s ready (ID: %s)", club.Name, club.ID)

	// 3. Find or Create Match "Test"
	var match models.Match
	matchTitle := "Test"
	if err := db.Preload("Bookings").Where("title = ? AND club_id = ?", matchTitle, club.ID).First(&match).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			log.Printf("Match %s not found. Creating...", matchTitle)
			// Ensure date is in future
			date := time.Now().Add(24 * time.Hour)
			match = models.Match{
				Title:       matchTitle,
				Description: "Test Match",
				GameType:    "minisoccer",
				ClubID:      &club.ID,
				CreatorID:   robby.ID,
				Date:        date,
				Location:    "Test Location",
				Price:       50000,
				MaxPlayers:  14,
				Status:      "published",
				// Default 2 GK, 12 Players
				PositionQuotas: `{"gk": 2, "player_front": 12}`,
				CreatedAt:      time.Now(),
				UpdatedAt:      time.Now(),
			}
			if err := db.Create(&match).Error; err != nil {
				log.Fatal("Failed to create match:", err)
			}
		} else {
			log.Fatalf("Error finding match: %v", err)
		}
	}
	log.Printf("Match %s ready (ID: %s). Current bookings: %d", match.Title, match.ID, len(match.Bookings))

	// 4. Ensure we have enough users to fill the match
	// We need MaxPlayers distinct users (including Robby if he booked, but let's just get a pool)
	var allUsers []models.User
	if err := db.Find(&allUsers).Error; err != nil {
		log.Fatal("Failed to fetch users:", err)
	}

	neededTotal := match.MaxPlayers + 5 // Have some extra
	if len(allUsers) < neededTotal {
		neededNew := neededTotal - len(allUsers)
		log.Printf("Creating %d more dummy users...", neededNew)
		password := "123456"
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		hashedPwdStr := string(hashedPassword)

		for i := 0; i < neededNew; i++ {
			email := fmt.Sprintf("dummy%d_%d@example.com", time.Now().UnixNano(), i)
			user := models.User{
				Name:      fmt.Sprintf("Dummy User %d", i),
				Email:     email,
				Password:  hashedPwdStr,
				Provider:  "local",
				Role:      models.RolePlayer,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}
			if err := db.Create(&user).Error; err != nil {
				log.Printf("Failed to create dummy user: %v", err)
			} else {
				allUsers = append(allUsers, user)
			}
		}
	}

	// Refresh users list
	db.Find(&allUsers)

	// 5. Fill the match
	existingPlayers := make(map[string]bool)
	for _, b := range match.Bookings {
		existingPlayers[b.UserID] = true
	}

	currentCount := len(match.Bookings)
	log.Printf("Filling match... Current: %d, Max: %d", currentCount, match.MaxPlayers)

	// Simple round-robin for positions to ensure we don't violate unique checks if any (but simpler is just picking allowed ones)
	// Minisoccer: gk (2), player_front (12)
	// Let's count current positions
	gkCount := 0
	playerCount := 0
	for _, b := range match.Bookings {
		if b.Position == "gk" {
			gkCount++
		} else {
			playerCount++
		}
	}

	for _, user := range allUsers {
		if currentCount >= match.MaxPlayers {
			log.Println("Match is full.")
			break
		}

		if existingPlayers[user.ID] {
			continue
		}

		// determine position
		var pos models.Position
		if gkCount < 2 {
			pos = models.PositionGK
			gkCount++
		} else {
			pos = models.PositionPlayerFront
			playerCount++
		}

		booking := models.Booking{
			MatchID:   match.ID,
			UserID:    user.ID,
			Position:  pos,
			Status:    models.StatusConfirmed,
			IsPaid:    true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		if err := db.Create(&booking).Error; err != nil {
			log.Printf("Failed to book user %s: %v", user.Name, err)
		} else {
			log.Printf("Booked %s as %s", user.Name, pos)
			existingPlayers[user.ID] = true
			currentCount++
		}
	}

	log.Println("Population complete.")
}
