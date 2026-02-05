package main

import (
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"reserve_game/internal/config"
	"reserve_game/internal/handlers"
	"reserve_game/internal/middleware"
	"reserve_game/internal/models"
	"reserve_game/internal/repository"
)

func main() {
	cfg := config.LoadConfig()

	// Connect to Database
	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Migrate Schema
	// Added waitlist order column if not exists by auto migrate
	err = db.AutoMigrate(&models.User{}, &models.Match{}, &models.Booking{}, &models.Team{}, &models.TeamMember{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// Initialize Layers
	repo := repository.NewRepository(db)
	handler := handlers.NewHandler(repo)

	r := gin.Default()

	// CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-User-ID"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	api := r.Group("/api")
	{
		// Public
		api.POST("/login", handler.Login)
		api.GET("/matches", handler.ListMatches)
		api.GET("/matches/:id", handler.GetMatch)
		api.GET("/matches/:id/teams", handler.GetTeams)

		// Protected
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{
			protected.POST("/matches", handler.CreateMatch) // Should filter by Admin role
			protected.POST("/matches/:id/teams/generate", handler.GenerateTeams)
			protected.PUT("/bookings/:id/pay", handler.SetPaymentStatus)
			protected.DELETE("/bookings/:id", handler.CancelBooking)

			protected.PUT("/profile", handler.UpdateUser)
			protected.DELETE("/profile", handler.DeleteUser) // Add this
		}
	}

	log.Println("Server starting on port " + cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
