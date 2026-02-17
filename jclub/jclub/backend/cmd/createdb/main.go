package main

import (
	"log"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Connect to default 'postgres' database
	dsn := "postgres://postgres:1@localhost:5432/postgres?sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to postgres DB:", err)
	}

	// Create jclub database
	// Note: CREATE DATABASE cannot run inside a transaction block, so we might need raw sql driver if Gorm wraps in tx, 
	// but db.Exec usually doesn't unless specified. 
	// However, Gorm might use prepared statements.
	// A safer way is using standard sql with pgx driver, but let's try Gorm first as it is available.
	
	// Check if exists first
	var count int64
	db.Raw("SELECT count(*) FROM pg_database WHERE datname = ?", "jclub").Scan(&count)
	if count > 0 {
		log.Println("Database jclub already exists.")
		return
	}

	// We need to disable transaction for CREATE DATABASE
	db = db.Session(&gorm.Session{SkipDefaultTransaction: true})
	
	err = db.Exec("CREATE DATABASE jclub").Error
	if err != nil {
		log.Printf("Failed to create database: %v", err)
	} else {
		log.Println("Database jclub created successfully.")
	}
}
