package main

import (
	"fmt"
	"log"
	"math/rand"
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
	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Auto Migrate for Seeder
	db.AutoMigrate(&models.User{}, &models.Match{}, &models.Booking{}, &models.Team{}, &models.TeamMember{}, &models.Sport{}, &models.SportPosition{})

	log.Println("Database connected. Starting seeder...")

	// 1. Create 100 Users
	password := "123456"
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("Failed to hash password:", err)
	}
	hashedPwdStr := string(hashedPassword)

	var createdUserIDs []string

	for i := 1; i <= 100; i++ {
		email := fmt.Sprintf("user%d@example.com", i)
		user := models.User{
			Name:      fmt.Sprintf("User %d", i),
			Email:     email,
			Password:  hashedPwdStr, // 123456
			Provider:  "local",
			Role:      models.RolePlayer,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		// Check if exists
		var existing models.User
		if err := db.Where("email = ?", email).First(&existing).Error; err == nil {
			// Exists
			createdUserIDs = append(createdUserIDs, existing.ID)
			continue
		}

		if err := db.Create(&user).Error; err != nil {
			log.Printf("Failed to create user %s: %v", email, err)
		} else {
			createdUserIDs = append(createdUserIDs, user.ID)
		}
	}
	log.Printf("Seeded users. Total available IDs: %d", len(createdUserIDs))

	if len(createdUserIDs) < 5 {
		log.Fatal("Not enough users to create groups")
	}

	// 2. Create 20 Groups from 5 random users
	// Shuffle user IDs to pick 5 random creators
	rand.Seed(time.Now().UnixNano())
	rand.Shuffle(len(createdUserIDs), func(i, j int) {
		createdUserIDs[i], createdUserIDs[j] = createdUserIDs[j], createdUserIDs[i]
	})
	creators := createdUserIDs[:5]

	locations := []string{"Gloria Mini Soccer", "Premier Pitch", "Champions Field", "City Stadium", "Impact Arena"}
	gameTypes := []string{"minisoccer", "futsal", "football"}

	for i := 1; i <= 20; i++ {
		creatorID := creators[rand.Intn(len(creators))]
		date := time.Now().Add(time.Duration(rand.Intn(14)) * 24 * time.Hour) // Random date within next 14 days
		// Set random time
		date = time.Date(date.Year(), date.Month(), date.Day(), 18+rand.Intn(4), 0, 0, 0, date.Location())

		match := models.Match{
			Title:       fmt.Sprintf("Mabar Seru #%d", i),
			Description: "Let's assume this is a fun match.",
			GameType:    gameTypes[rand.Intn(len(gameTypes))],
			CreatorID:   creatorID,
			Date:        date,
			Location:    locations[rand.Intn(len(locations))],
			Price:       float64(50000 + rand.Intn(5)*10000), // 50k - 90k
			MaxPlayers:  10 + rand.Intn(3)*2,                 // 10, 12, 14
			Status:      "open",
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}

		if err := db.Create(&match).Error; err != nil {
			log.Printf("Failed to create match: %v", err)
			continue
		}

		// Auto-book owner
		booking := models.Booking{
			MatchID:       match.ID,
			UserID:        creatorID,
			Position:      models.PositionPlayerFront,
			Status:        models.StatusConfirmed,
			WaitlistOrder: 0,
			IsPaid:        true,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}
		db.Create(&booking)
	}

	// 3. Seed Master Data (Sports)
	sports := []models.Sport{
		{
			Name: "Mini Soccer",
			Code: "minisoccer",
			Positions: []models.SportPosition{
				{Code: "gk", Name: "Kiper", DefaultQuota: 2},
				{Code: "player_front", Name: "Pemain", DefaultQuota: 14},
			},
		},
		{
			Name: "Futsal",
			Code: "futsal",
			Positions: []models.SportPosition{
				{Code: "gk", Name: "Kiper", DefaultQuota: 2},
				{Code: "player_front", Name: "Pemain", DefaultQuota: 10},
			},
		},
		{
			Name: "Sepak Bola",
			Code: "football",
			Positions: []models.SportPosition{
				{Code: "gk", Name: "Kiper", DefaultQuota: 2},
				{Code: "defender", Name: "Bek", DefaultQuota: 8},
				{Code: "midfielder", Name: "Gelandang", DefaultQuota: 8},
				{Code: "forward", Name: "Penyerang", DefaultQuota: 4},
			},
		},
		{
			Name: "Badminton",
			Code: "badminton",
			Positions: []models.SportPosition{
				{Code: "player_front", Name: "Pemain", DefaultQuota: 4},
			},
		},
		{
			Name: "Basket",
			Code: "basket",
			Positions: []models.SportPosition{
				{Code: "player_front", Name: "Pemain", DefaultQuota: 10},
			},
		},
		{
			Name: "Voli",
			Code: "volleyball",
			Positions: []models.SportPosition{
				{Code: "player_front", Name: "Pemain", DefaultQuota: 12},
			},
		},
		{
			Name: "Tenis",
			Code: "tennis",
			Positions: []models.SportPosition{
				{Code: "player_front", Name: "Pemain", DefaultQuota: 4},
			},
		},
	}

	for _, s := range sports {
		var existing models.Sport
		if err := db.Where("code = ?", s.Code).First(&existing).Error; err == nil {
			// Found
			if s.Code == "football" {
				// Force update for football to apply new positions
				db.Delete(&models.SportPosition{}, "sport_id = ?", existing.ID)
				db.Delete(&existing)
				log.Println("Deleted old Football data to update positions.")
			} else {
				continue
			}
		}

		if err := db.Create(&s).Error; err != nil {
			log.Printf("Failed to seed sport %s: %v", s.Name, err)
		}
	}
	log.Println("Seeded master sports data.")

	log.Println("Seeding complete! Created 100 users (if not existed) and 20 groups.")
}
