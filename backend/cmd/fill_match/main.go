package main

import (
	"log"
	"reserve_game/internal/config"
	"reserve_game/internal/models"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	cfg := config.LoadConfig()

	// Connect to Database
	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// 1. Find "Mabar Seru #3"
	var match models.Match
	if err := db.Preload("Bookings").Where("title = ?", "Mabar Seru #3").First(&match).Error; err != nil {
		log.Fatal("Match 'Mabar Seru #3' not found. Ensure seeder ran.", err)
	}

	log.Printf("Found Match: %s (Max: %d, Current Bookings: %d)", match.Title, match.MaxPlayers, len(match.Bookings))

	// 2. Fetch all users
	var users []models.User
	db.Find(&users)

	// 3. Map existing players to avoid duplicates
	existingPlayers := make(map[string]bool)
	for _, b := range match.Bookings {
		existingPlayers[b.UserID] = true
	}

	// 4. Fill to Max + 5 (Waitlist)
	targetCount := match.MaxPlayers + 5
	currentCount := len(match.Bookings)
	waitlistCount := 0

	// Check existing waitlist count if any
	for _, b := range match.Bookings {
		if b.Status == models.StatusWaitlist {
			waitlistCount++
		}
	}

	for _, user := range users {
		if currentCount >= targetCount {
			break
		}

		if existingPlayers[user.ID] {
			continue
		}

		// Create Booking
		booking := models.Booking{
			MatchID:   match.ID,
			UserID:    user.ID,
			Position:  models.PositionPlayerFront, // default
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		// Determine Status
		if currentCount < match.MaxPlayers {
			booking.Status = models.StatusConfirmed
			booking.IsPaid = true // Let's simplify and say they paid
		} else {
			booking.Status = models.StatusWaitlist
			waitlistCount++
			booking.WaitlistOrder = waitlistCount
			booking.IsPaid = false
		}

		if err := db.Create(&booking).Error; err != nil {
			log.Printf("Failed to book user %s: %v", user.Name, err)
		} else {
			log.Printf("Booked %s as %s (Waitlist Order: %d)", user.Name, booking.Status, booking.WaitlistOrder)
			currentCount++
		}
	}

	log.Println("Done. Updated Mabar Seru #3 Bookings.")
}
