package handlers

import (
	"net/http"
	"reserve_game/internal/middleware"
	"reserve_game/internal/models"
	"reserve_game/internal/repository"
	"reserve_game/internal/service"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type Handler struct {
	BookingService *service.BookingService
	TeamService    *service.TeamService
	Repo           repository.Repository
}

func NewHandler(repo repository.Repository) *Handler {
	return &Handler{
		BookingService: service.NewBookingService(repo),
		TeamService:    service.NewTeamService(repo),
		Repo:           repo,
	}
}

// ... existing code ...

// Login
func (h *Handler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Mock user lookup/creation
	userID := "user-123"

	// Generate REAL JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(time.Hour * 72).Unix(),
	})

	tokenString, err := token.SignedString(middleware.SecretKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": tokenString,
		"user":  models.User{ID: userID, Name: "Test User", Role: "player"},
	})
}

// UpdateUser
func (h *Handler) UpdateUser(c *gin.Context) {
	// Assume UserID from middleware/context
	userID, exists := c.Get("userID")
	// For testing without middleware, let's hardcode or check header
	if !exists {
		// Just for testing flow, assume user-123
		userID = "user-123"
		// c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		// return
	}

	var req models.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.Repo.GetUserByID(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User not found"})
		return
	}

	if req.Name != "" {
		user.Name = req.Name
	}
	if req.Phone != "" {
		user.Phone = req.Phone
	}

	if err := h.Repo.UpdateUser(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
}

// DeleteUser
func (h *Handler) DeleteUser(c *gin.Context) {
	// Assume UserID from middleware/context
	userID, exists := c.Get("userID")
	// For testing without middleware
	if !exists {
		userID = "user-123"
	}

	if err := h.Repo.DeleteUser(userID.(string)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User account deleted"})
}

// SetPaymentStatus
func (h *Handler) SetPaymentStatus(c *gin.Context) {
	bookingID := c.Param("id")
	var req struct {
		IsPaid bool `json:"is_paid"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.BookingService.SetPaidStatus(bookingID, req.IsPaid); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Payment status updated"})
}

// GenerateTeams
func (h *Handler) GenerateTeams(c *gin.Context) {
	matchID := c.Param("id")
	teams, err := h.TeamService.GenerateTeams(matchID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, teams)
}

// GetTeams
func (h *Handler) GetTeams(c *gin.Context) {
	matchID := c.Param("id")
	teams, err := h.TeamService.GetTeams(matchID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, teams)
}

// CreateMatch - Admin only
func (h *Handler) CreateMatch(c *gin.Context) {
	var req models.CreateMatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Combine Date and Time
	dateTimeStr := req.Date + " " + req.Time
	date, err := time.Parse("2006-01-02 15:04", dateTimeStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date/time format. Use YYYY-MM-DD and HH:MM"})
		return
	}

	match := &models.Match{
		Title:       req.Title,
		Description: req.Description,
		GameType:    req.GameType,
		Date:        date,
		Location:    req.Location,
		Price:       float64(req.Price),
		MaxPlayers:  req.MaxPlayers,
		Status:      "open",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := h.Repo.CreateMatch(match); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, match)
}

// ListMatches
func (h *Handler) ListMatches(c *gin.Context) {
	matches, err := h.Repo.ListMatches(20)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, matches)
}

// GetMatch
func (h *Handler) GetMatch(c *gin.Context) {
	id := c.Param("id")
	match, err := h.Repo.GetMatchByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Match not found"})
		return
	}
	c.JSON(http.StatusOK, match)
}

// JoinMatch
func (h *Handler) JoinMatch(c *gin.Context) {
	var req models.JoinMatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Assume UserID from middleware/context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	booking, err := h.BookingService.JoinMatch(userID.(string), req.MatchID, req.Position)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, booking)
}

// CancelBooking
func (h *Handler) CancelBooking(c *gin.Context) {
	bookingID := c.Param("id")
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Assuming user is cancelling their own booking, not admin for now
	// Or check role from context
	isAdmin := false // Extract from context if stored

	if err := h.BookingService.CancelBooking(bookingID, userID.(string), isAdmin); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Booking cancelled"})
}
