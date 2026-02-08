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
	log.Println("Creating 100 users...")

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
	log.Printf("Seeded users. Total IDs: %d", len(createdUserIDs))

	if len(createdUserIDs) < 20 {
		log.Fatal("Not enough users to create clubs")
	}

	// 2. Create 10 Clubs
	log.Println("Creating 10 Clubs...")
	clubNames := []string{"Garuda FC", "Tigers United", "Jakarta All Stars", "Bandung Juara", "Surabaya Heroes", "Bali United", "Medan City", "Makassar PSM", "Semarang FC", "Yogya United"}

	// Shuffle user IDs to pick 10 random creators
	rand.Seed(time.Now().UnixNano())
	rand.Shuffle(len(createdUserIDs), func(i, j int) {
		createdUserIDs[i], createdUserIDs[j] = createdUserIDs[j], createdUserIDs[i]
	})

	creators := createdUserIDs[:10]
	var createdClubIDs []string

	for i, name := range clubNames {
		creatorID := creators[i]

		club := models.Club{
			Name:        name,
			Description: fmt.Sprintf("Official club for %s fans and players.", name),
			CreatorID:   creatorID,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}

		if err := db.Create(&club).Error; err != nil {
			log.Printf("Failed to create club %s: %v", name, err)
			continue
		}
		createdClubIDs = append(createdClubIDs, club.ID)

		// Add creator as member (admin)
		db.Create(&models.ClubMember{
			ClubID:    club.ID,
			UserID:    creatorID,
			Role:      "admin",
			CreatedAt: time.Now(),
		})

		// Add 5-15 random members
		numMembers := rand.Intn(10) + 5
		for j := 0; j < numMembers; j++ {
			memberID := createdUserIDs[rand.Intn(len(createdUserIDs))]
			if memberID == creatorID {
				continue
			}

			// Check distinct
			var count int64
			db.Model(&models.ClubMember{}).Where("club_id = ? AND user_id = ?", club.ID, memberID).Count(&count)
			if count > 0 {
				continue
			}

			db.Create(&models.ClubMember{
				ClubID:    club.ID,
				UserID:    memberID,
				Role:      "member",
				CreatedAt: time.Now(),
			})
		}
	}

	log.Printf("Seeded %d clubs with members.", len(createdClubIDs))

	// 3. Create Matches (Linked to Clubs & Public)
	log.Println("Creating Matches...")

	// Clear existing data to avoid duplicates/stale data
	log.Println("Clearing existing matches, bookings, teams...")
	db.Exec("TRUNCATE TABLE teams, team_members, bookings, matches CASCADE")

	// 3. Create Matches (Linked to Clubs & Public)
	log.Println("Creating Matches...")

	locations := []string{"Gloria Mini Soccer", "Premier Pitch", "Champions Field", "City Stadium", "Impact Arena"}
	gameTypes := []string{"minisoccer", "futsal", "football"}

	// Create 20 Matches linked to Clubs
	for _, clubID := range createdClubIDs {
		// 2 matches per club
		currentClubID := clubID // capture variable
		for k := 0; k < 2; k++ {
			date := time.Now().Add(time.Duration(rand.Intn(30)) * 24 * time.Hour)
			date = time.Date(date.Year(), date.Month(), date.Day(), 18+rand.Intn(4), 0, 0, 0, date.Location())

			// Fix Random Logic: Pick GameType first
			gt := gameTypes[rand.Intn(len(gameTypes))]

			// Generate Quotas based on GameType
			quotas := `{"player_front": 10}`
			if gt == "minisoccer" {
				quotas = `{"gk": 2, "player_front": 14}`
			} else if gt == "futsal" {
				quotas = `{"gk": 2, "player_front": 10}`
			} else if gt == "football" {
				quotas = `{"gk": 2, "defender": 8, "midfielder": 8, "forward": 4}`
			}

			match := models.Match{
				Title:          fmt.Sprintf("Club Match #%d", rand.Intn(1000)),
				Description:    "Exclusive match for club members.",
				GameType:       gt,
				ClubID:         &currentClubID,
				CreatorID:      createdUserIDs[0],
				Date:           date,
				Location:       locations[rand.Intn(len(locations))],
				Price:          float64(50000 + rand.Intn(5)*10000),
				MaxPlayers:     10 + rand.Intn(3)*2,
				Status:         "published",
				PositionQuotas: quotas,
				CreatedAt:      time.Now(),
				UpdatedAt:      time.Now(),
			}
			db.Create(&match)
		}
	}

	// Create 10 Public Matches (No ClubID)
	for i := 1; i <= 10; i++ {
		creatorID := createdUserIDs[rand.Intn(len(createdUserIDs))]
		date := time.Now().Add(time.Duration(rand.Intn(14)) * 24 * time.Hour)
		date = time.Date(date.Year(), date.Month(), date.Day(), 18+rand.Intn(4), 0, 0, 0, date.Location())

		// Fix Random Logic: Pick GameType first
		gt := gameTypes[rand.Intn(len(gameTypes))]

		// Generate Quotas based on GameType
		quotas := `{"player_front": 10}`
		if gt == "minisoccer" {
			quotas = `{"gk": 2, "player_front": 14}`
		} else if gt == "futsal" {
			quotas = `{"gk": 2, "player_front": 10}`
		} else if gt == "football" {
			quotas = `{"gk": 2, "defender": 8, "midfielder": 8, "forward": 4}`
		}

		match := models.Match{
			Title:          fmt.Sprintf("Public Mabar #%d", i),
			Description:    "Open for everyone!",
			GameType:       gt,
			CreatorID:      creatorID,
			Date:           date,
			Location:       locations[rand.Intn(len(locations))],
			Price:          float64(40000 + rand.Intn(5)*10000),
			MaxPlayers:     10 + rand.Intn(3)*2,
			Status:         "published",
			PositionQuotas: quotas,
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
			ClubID:         nil, // Explicitly nil
		}

		if err := db.Create(&match).Error; err != nil {
			log.Printf("Failed to create match: %v", err)
			continue
		}
	}
	log.Println("Seeded matches (Club & Public).")

	// 4. Seed Master Data (Sports)
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
			} else {
				continue
			}
		}

		if err := db.Create(&s).Error; err != nil {
			log.Printf("Failed to seed sport %s: %v", s.Name, err)
		}
	}
	log.Println("Seeded master sports data.")

	log.Println("Seeding complete! 100 Users, ~10 Clubs, ~30 Matches.")
}
