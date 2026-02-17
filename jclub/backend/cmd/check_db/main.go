package main

import (
	"log"
	"reserve_game/internal/config"
	"reserve_game/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	cfg := config.LoadConfig()
	dsn := cfg.DatabaseURL
	log.Printf("Connecting to %s", dsn)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	var userCount int64
	db.Model(&models.User{}).Count(&userCount)
	log.Printf("Users: %d", userCount)

	var matchCount int64
	db.Model(&models.Match{}).Count(&matchCount)
	log.Printf("Matches: %d", matchCount)

	var clubCount int64
	db.Model(&models.Club{}).Count(&clubCount)
	log.Printf("Clubs: %d", clubCount)
}
