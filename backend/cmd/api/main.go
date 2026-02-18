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
	err = db.AutoMigrate(&models.User{}, &models.Match{}, &models.Booking{}, &models.Team{}, &models.TeamMember{}, &models.Sport{}, &models.SportPosition{}, &models.Club{}, &models.ClubMember{}, &models.Announcement{}, &models.Notification{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// Initialize Layers
	repo := repository.NewRepository(db)
	handler := handlers.NewHandler(repo)

	// Fix Data (Temporary for Dev)
	if err := repo.FixData(); err != nil {
		log.Println("Warning: FixData failed:", err)
	}

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

	r.Static("/uploads", "./uploads") // Serve uploaded files

	api := r.Group("/api")
	{
		// Public
		api.POST("/register", handler.Register)
		api.POST("/login", handler.Login)

	// Admin
	admin := api.Group("/admin")
	{
		admin.GET("/users", handler.AdminGetAllUsers)
		admin.GET("/sports", handler.GetMasterSports)
	}

	// OAuth
	api.GET("/oauth/login", handler.GoogleLogin)
	api.GET("/oauth/callback", handler.GoogleCallback)
		api.GET("/matches", handler.ListMatches)
		api.GET("/matches/:id", handler.GetMatch)
		api.GET("/matches/:id/teams", handler.GetTeams)
		api.GET("/master/sports", handler.GetMasterSports)

		// Clubs Public
		api.GET("/clubs", handler.ListClubs)
		api.GET("/clubs/:id", handler.GetClub)

		// Protected
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{
			protected.POST("/upload", handler.UploadAvatar) // Upload Endpoint

			protected.POST("/clubs", handler.CreateClub)              // Create Club
			protected.POST("/matches", handler.CreateMatch)           // Create Match (Schedule)
			protected.PUT("/matches/:id", handler.UpdateMatch)        // Reschedule / Edit (Draft)
			protected.PUT("/matches/:id/cancel", handler.CancelMatch) // Cancel Match
			protected.POST("/matches/:id/teams/generate", handler.GenerateTeams)
			protected.PUT("/teams/members/:memberId", handler.UpdateTeamMember) // Manual move
			protected.POST("/bookings", handler.JoinMatch)
			protected.PUT("/bookings/:id/pay", handler.SetPaymentStatus)
			protected.DELETE("/bookings/:id", handler.CancelBooking)

			protected.GET("/profile", handler.GetUser)
			protected.PUT("/profile", handler.UpdateUser)
			protected.DELETE("/profile", handler.DeleteUser) // Add this

			// Club Membership
			protected.PUT("/clubs/:id", handler.UpdateClub)
			protected.GET("/clubs/:id/announcements/manage", handler.ListAllClubAnnouncements)
			protected.DELETE("/clubs/:id", handler.DeleteClub)
			protected.POST("/clubs/:id/join", handler.JoinClub)
			protected.POST("/clubs/:id/leave", handler.LeaveClub)

			// Announcements
			protected.POST("/clubs/:id/announcements", handler.CreateAnnouncement)
			protected.GET("/announcements/:id", handler.GetAnnouncement)
			protected.PUT("/announcements/:id", handler.UpdateAnnouncement)
			protected.DELETE("/announcements/:id", handler.DeleteAnnouncement)
			protected.POST("/announcements/:id/publish", handler.PublishAnnouncement)

			// Notifications
			protected.PUT("/profile/push-token", handler.UpdatePushToken)
			protected.GET("/notifications", handler.GetNotifications)
		}

		// Public Announcement List (or Protected? Public is fine for info)
		api.GET("/clubs/:id/announcements", handler.ListClubAnnouncements)
	}

	log.Println("Server starting on port " + cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
