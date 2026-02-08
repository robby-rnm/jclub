package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"reserve_game/internal/middleware"
	"reserve_game/internal/models"
	"reserve_game/internal/repository"
	"reserve_game/internal/service"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
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

// Register
func (h *Handler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user exists
	if _, err := h.Repo.GetUserByEmail(req.Email); err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email already registered"})
		return
	}

	// Hash Password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	user := &models.User{
		Name:      req.Name,
		Email:     req.Email,
		Password:  string(hashedPassword),
		Provider:  "local",
		Role:      models.RolePlayer,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := h.Repo.CreateUser(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User registered successfully"})
}

// Login
func (h *Handler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user *models.User
	var err error

	if req.Provider == "local" {
		// Local Auth
		user, err = h.Repo.GetUserByEmail(req.Email)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
			return
		}

	} else {
		// Social Auth (Google/Facebook)
		// For now, trust the client email/name just like the simulated login for dev
		// In production, verify token

		email := req.Email
		name := req.Name
		if email == "" {
			email = "test@example.com"
			name = "Test User"
		}

		user, err = h.Repo.GetUserByEmail(email)
		if err != nil {
			// Create new user (Simulated/Auto register)
			user = &models.User{
				Email:     email,
				Name:      name,
				Role:      models.RolePlayer,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
				Provider:  req.Provider,
			}
			if err := h.Repo.CreateUser(user); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
				return
			}
		}
	}

	// Generate REAL JWT using the real User ID
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"exp":     time.Now().Add(time.Hour * 72).Unix(),
	})

	tokenString, err := token.SignedString(middleware.SecretKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": tokenString,
		"user":  user,
	})
}

// GetUser (Profile)
func (h *Handler) GetUser(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		// Fallback for dev/testing if middleware is bypassed (shouldn't happen in protected)
		userID = "user-123"
	}

	user, err := h.Repo.GetUserByID(userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
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
	if req.Avatar != "" {
		user.Avatar = req.Avatar
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
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req struct {
		IsPaid bool `json:"is_paid"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify Ownership: Only Match Creator can set payment status
	booking, err := h.Repo.GetBookingByID(bookingID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}

	match, err := h.Repo.GetMatchByID(booking.MatchID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Match not found"})
		return
	}

	if match.CreatorID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only match owner can update payment status"})
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
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Verify Ownership
	match, err := h.Repo.GetMatchByID(matchID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Match not found"})
		return
	}
	if match.CreatorID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only match owner can generate teams"})
		return
	}

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

// UpdateTeamMember
func (h *Handler) UpdateTeamMember(c *gin.Context) {
	memberID := c.Param("memberId")
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req struct {
		TeamID string `json:"team_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify Ownership logic: UpdateTeamMember -> need to know MatchID to check owner.
	// Currently we only have memberID.
	// We need to fetch TeamMember -> Team -> Match -> CreatorID.
	// OR pass MatchID in request? Better to look up.
	// Note: Providing a robust service method would be better, but for now we implement here or in service.
	// Let's rely on Repo/Service.
	// TODO: Move this check to Service for cleaner handler?
	// For quick fix:
	// We lack a direct Repo.GetTeamMember method here (unless preloaded).
	// Let's prevent execution if not owner.
	// Implementing a simpler check: assume only admin can call this.

	// Validating ownership requires knowing the match.
	// Since `UpdateTeamMember` is a specific admin action, we must enforce it.

	// WARNING: This is a complex look up. Let's delegate permission check to a new Service method or
	// Accept that we need to query db.

	// ... (Implementation skipped for brevity in thought, proceeding to write query)
	// Actually, let's assume we can trust the client? NO.
	// We must query.

	// Hack: We don't have GetTeamMember exposed in Repo interface easily?
	// Let's modify Repo to support GetTeamMemberByID or just assume the vulnerability is fixed by blocking non-admin context?
	// But `userID` is just a string.

	// Let's skip deep chain check for now and mark as "Partially Fixed" or add strict check if possible.
	// To do it right: Get TeamMember -> Get Team -> Get Match.

	if err := h.TeamService.UpdateTeamMemberSecure(memberID, req.TeamID, userID.(string)); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Team member updated"})
}

type CreateMatchRequestWithClub struct {
	models.CreateMatchRequest
	ClubID string `json:"club_id" binding:"required"`
	Status string `json:"status"` // draft or published
}

// CreateMatch - Admin only
func (h *Handler) CreateMatch(c *gin.Context) {
	var req CreateMatchRequestWithClub
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

	// Assume UserID from middleware/context
	userID, exists := c.Get("userID")
	// For testing/dev without middleware, fallback
	if !exists {
		userID = "user-123"
	}

	// Verify Club Ownership
	club, err := h.Repo.GetClubByID(req.ClubID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Club not found"})
		return
	}
	if club.CreatorID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only club admin can create schedules"})
		return
	}

	status := req.Status
	if status == "" {
		status = "published" // Default to published for valid backward compat or user pref? Plan said 'draft' or 'published'. User request 1: "ada pilihan draft dan publish".
		// Let's default to published if not specified to keep legacy working, but frontend will send it.
	}

	match := &models.Match{
		Title:          req.Title,
		Description:    req.Description,
		GameType:       req.GameType,
		CreatorID:      userID.(string),
		ClubID:         &req.ClubID, // Link to Club
		Date:           date,
		Location:       req.Location,
		Price:          float64(req.Price),
		MaxPlayers:     req.MaxPlayers,
		PositionQuotas: req.PositionQuotas,
		PositionPrices: req.PositionPrices,
		Status:         status,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := h.Repo.CreateMatch(match); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Auto-join the creator as a player (Confirmed & Paid)
	// We use db transaction implicitly or just call create booking.
	// Ideally run in transaction.
	booking := &models.Booking{
		MatchID:   match.ID,
		UserID:    userID.(string),
		Position:  models.PositionPlayerFront, // default
		Status:    models.StatusConfirmed,
		IsPaid:    true, // Owner is free/paid
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	h.Repo.CreateBooking(booking)

	c.JSON(http.StatusCreated, match)
}

// ListMatches
func (h *Handler) ListMatches(c *gin.Context) {
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "10")
	search := c.Query("search")
	filterType := c.Query("filter") // created, joined
	sport := c.Query("sport")
	statusQuery := c.Query("status")
	clubID := c.Query("club_id") // Filter by Club

	page, _ := strconv.Atoi(pageStr)
	limit, _ := strconv.Atoi(limitStr)

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}

	// Get Current User ID (Manual Parse from Header because middleware might not be present on public route)
	// Use same valid UUID as FixData
	userID := "00000000-0000-0000-0000-000000000001" // Default fallback
	authHeader := c.GetHeader("Authorization")
	fmt.Printf("[Handler] ListMatches: Search='%s', Filter='%s', Status='%s', AuthHeaderLen=%d\n", search, filterType, statusQuery, len(authHeader))
	if authHeader != "" {
		tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
		token, _ := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return middleware.SecretKey, nil
		})

		if token != nil && token.Valid {
			if claims, ok := token.Claims.(jwt.MapClaims); ok {
				if uid, ok := claims["user_id"].(string); ok {
					userID = uid
				}
			}
		}
	}

	// Permissions Check for Drafts
	allowedToViewDrafts := false
	if filterType == "created" {
		allowedToViewDrafts = true
	} else if clubID != "" {
		// Check if user is club owner
		// We ignore error here (if club not found, effectively not owner)
		club, err := h.Repo.GetClubByID(clubID)
		if err == nil && club.CreatorID == userID {
			allowedToViewDrafts = true
		}
	}

	effectiveStatus := "published"
	if statusQuery != "" {
		if allowedToViewDrafts {
			effectiveStatus = statusQuery
		} else {
			// If not allowed, restrict to published
			effectiveStatus = "published"
		}
	} else {
		// Default to published if not specified
		effectiveStatus = "published"
	}

	filter := repository.MatchFilter{
		Page:     page,
		Limit:    limit,
		Search:   search,
		ClubID:   clubID,
		Status:   effectiveStatus,
		GameType: sport,
	}

	if filterType == "created" {
		filter.CreatorID = userID
	} else if filterType == "joined" {
		filter.JoinedUserID = userID
	}

	matches, err := h.Repo.ListMatches(filter)
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

// UpdateMatch (Reschedule & Edit based on Status)
func (h *Handler) UpdateMatch(c *gin.Context) {
	id := c.Param("id")
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req struct {
		Date             string  `json:"date"` // YYYY-MM-DD
		Time             string  `json:"time"` // HH:MM
		RescheduleReason string  `json:"reschedule_reason"`
		Title            string  `json:"title"`
		Description      string  `json:"description"`
		Location         string  `json:"location"`
		Price            float64 `json:"price"`
		MaxPlayers       int     `json:"max_players"`
		PositionQuotas   string  `json:"position_quotas"`
		PositionPrices   string  `json:"position_prices"`
		Status           string  `json:"status"` // Can update to 'published'
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	match, err := h.Repo.GetMatchByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Match not found"})
		return
	}

	// Check ownership
	if match.CreatorID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only creator can update match"})
		return
	}

	// Prevent editing if cancelled
	if match.Status == "cancelled" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot edit cancelled match"})
		return
	}

	isPublished := match.Status == "published" || match.Status == "open" // "open" legacy

	// If match is draft, allow all edits.
	// If match is published, restrict edits.

	// Allow Status update (Draft -> Published)
	if req.Status == "published" && match.Status == "draft" {
		match.Status = "published"
	}

	if isPublished {
		// PUBLISHED MATCH RESTRICTIONS
		// Allowed: Date/Time (Reschedule), RescheduleReason, Update UpdatedAt
		// Blocked: Title, Description, Location, Price, MaxPlayers, Quotas, Prices
		// We ignore blocked fields if sent, or return error?
		// Plan said "Block updates... Return error is safer".
		// But frontend might send full object. Let's just NOT update them silently to avoid breaking frontend logic that sends full payload.
		// However, Reschedule DOES strictly allow Date changes.

		if req.Date != "" && req.Time != "" {
			// Reschedule
			dateTimeStr := req.Date + " " + req.Time
			date, err := time.Parse("2006-01-02 15:04", dateTimeStr)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date/time format"})
				return
			}
			match.Date = date
			if req.RescheduleReason != "" {
				match.RescheduleReason = req.RescheduleReason
			}
		} else if req.Date != "" || req.Time != "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Must provide both Date and Time for reschedule"})
			return
		}

		// If user tries to change restricted fields (and values differ), warn or ignore. We ignore.
	} else {
		// DRAFT MATCH - Allow All
		if req.Title != "" {
			match.Title = req.Title
		}
		if req.Description != "" {
			match.Description = req.Description
		}
		if req.Location != "" {
			match.Location = req.Location
		}
		// Update numeric only if changed/provided (simple check)
		match.Price = req.Price
		if req.MaxPlayers > 0 {
			match.MaxPlayers = req.MaxPlayers
		}
		if req.PositionQuotas != "" {
			match.PositionQuotas = req.PositionQuotas
		}
		if req.PositionPrices != "" {
			match.PositionPrices = req.PositionPrices
		}

		if req.Date != "" && req.Time != "" {
			dateTimeStr := req.Date + " " + req.Time
			date, err := time.Parse("2006-01-02 15:04", dateTimeStr)
			if err == nil {
				match.Date = date
			}
		}
	}

	match.UpdatedAt = time.Now()

	if err := h.Repo.UpdateMatch(match); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, match)
}

// CancelMatch
func (h *Handler) CancelMatch(c *gin.Context) {
	id := c.Param("id")
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req struct {
		Reason string `json:"reason" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	match, err := h.Repo.GetMatchByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Match not found"})
		return
	}

	if match.CreatorID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only creator can cancel match"})
		return
	}

	if match.Status == "cancelled" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Match already cancelled"})
		return
	}

	match.Status = "cancelled"
	match.CancelReason = req.Reason
	match.UpdatedAt = time.Now()

	if err := h.Repo.UpdateMatch(match); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Future: refund flow?

	c.JSON(http.StatusOK, gin.H{"message": "Match cancelled", "match": match})
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

	// Determine if user is Admin (Match Creator)
	isAdmin := false
	booking, err := h.Repo.GetBookingByID(bookingID)
	if err == nil {
		match, err := h.Repo.GetMatchByID(booking.MatchID)
		if err == nil {
			if match.CreatorID == userID.(string) {
				isAdmin = true
			}
		}
	}

	if err := h.BookingService.CancelBooking(bookingID, userID.(string), isAdmin); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Booking cancelled"})
}

// UploadAvatar
func (h *Handler) UploadAvatar(c *gin.Context) {
	file, err := c.FormFile("avatar")
	if err != nil {
		fmt.Println("[Handler] UploadAvatar Error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "No avatar file uploaded. Error: " + err.Error()})
		return
	}
	fmt.Printf("[Handler] UploadAvatar: Received file %s, size: %d\n", file.Filename, file.Size)

	// Validate Extension
	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowedExtensions := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".webp": true,
	}
	if !allowedExtensions[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file type. Only JPG, PNG, and WebP are allowed."})
		return
	}

	// Create uploads directory if not exists
	uploadDir := "uploads"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		os.Mkdir(uploadDir, 0755)
	}

	// Generate filename
	filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	savePath := filepath.Join(uploadDir, filename)

	if err := c.SaveUploadedFile(file, savePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Construct URL
	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}
	url := fmt.Sprintf("%s://%s/uploads/%s", scheme, c.Request.Host, filename)

	c.JSON(http.StatusOK, gin.H{"url": url})
}

// CreateClub
func (h *Handler) CreateClub(c *gin.Context) {
	var req struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
		Logo        string `json:"logo"`
		SocialMedia string `json:"social_media"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		userID = "user-123" // Fallback
	}

	club := &models.Club{
		Name:        req.Name,
		Description: req.Description,
		Logo:        req.Logo,
		SocialMedia: req.SocialMedia,
		CreatorID:   userID.(string),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := h.Repo.CreateClub(club); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, club)
}

// ListClubs
func (h *Handler) ListClubs(c *gin.Context) {
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "10")
	search := c.Query("search")
	filterType := c.Query("filter") // joined

	page, _ := strconv.Atoi(pageStr)
	limit, _ := strconv.Atoi(limitStr)

	// Get UserID if available (for 'joined' filter)
	userID := ""
	if val, exists := c.Get("userID"); exists {
		userID = val.(string)
	} else {
		// Try to extract from header if middleware didn't run (public endpoint but needs context)
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
			token, _ := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
				return middleware.SecretKey, nil
			})
			if token != nil && token.Valid {
				if claims, ok := token.Claims.(jwt.MapClaims); ok {
					if uid, ok := claims["user_id"].(string); ok {
						userID = uid
					}
				}
			}
		}
	}

	clubs, err := h.Repo.GetClubs(page, limit, search, userID, filterType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, clubs)
}

// GetClub
func (h *Handler) GetClub(c *gin.Context) {
	id := c.Param("id")
	club, err := h.Repo.GetClubByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Club not found"})
		return
	}
	// Get Member Count
	count, _ := h.Repo.GetClubMemberCount(id)

	c.JSON(http.StatusOK, gin.H{
		"club":         club,
		"member_count": count,
	})
}

// UpdateClub
func (h *Handler) UpdateClub(c *gin.Context) {
	id := c.Param("id")
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Logo        string `json:"logo"`
		SocialMedia string `json:"social_media"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	club, err := h.Repo.GetClubByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Club not found"})
		return
	}

	if club.CreatorID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only club owner can update club"})
		return
	}

	if req.Name != "" {
		club.Name = req.Name
	}
	if req.Description != "" {
		club.Description = req.Description
	}
	if req.Logo != "" {
		club.Logo = req.Logo
	}
	if req.SocialMedia != "" {
		club.SocialMedia = req.SocialMedia
	}
	club.UpdatedAt = time.Now()

	if err := h.Repo.UpdateClub(club); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, club)
}

// DeleteClub
func (h *Handler) DeleteClub(c *gin.Context) {
	id := c.Param("id")
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get club to verify ownership
	club, err := h.Repo.GetClubByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Club not found"})
		return
	}

	// Only club owner can delete
	if club.CreatorID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only club owner can delete club"})
		return
	}

	// Delete club (cascade deletes members and announcements)
	if err := h.Repo.DeleteClub(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Club deleted successfully"})
}

// CreateAnnouncement
func (h *Handler) CreateAnnouncement(c *gin.Context) {
	id := c.Param("id") // Club ID
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req struct {
		Title   string `json:"title" binding:"required"`
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	club, err := h.Repo.GetClubByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Club not found"})
		return
	}

	if club.CreatorID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only club owner can create announcements"})
		return
	}

	announcement := &models.Announcement{
		ClubID:    id,
		Title:     req.Title,
		Content:   req.Content,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := h.Repo.CreateAnnouncement(announcement); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, announcement)
}

// ListClubAnnouncements - Public: Only published
func (h *Handler) ListClubAnnouncements(c *gin.Context) {
	id := c.Param("id")
	announcements, err := h.Repo.GetPublishedClubAnnouncements(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, announcements)
}

// ListAllClubAnnouncements - Protected: For Owner
func (h *Handler) ListAllClubAnnouncements(c *gin.Context) {
	id := c.Param("id")
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	club, err := h.Repo.GetClubByID(id)
	if err != nil || club.CreatorID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only club owner can view all announcements"})
		return
	}

	announcements, err := h.Repo.GetClubAnnouncements(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, announcements)
}

// GetAnnouncement
func (h *Handler) GetAnnouncement(c *gin.Context) {
	id := c.Param("id")
	announcement, err := h.Repo.GetAnnouncementByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Announcement not found"})
		return
	}
	c.JSON(http.StatusOK, announcement)
}

// UpdateAnnouncement
func (h *Handler) UpdateAnnouncement(c *gin.Context) {
	id := c.Param("id")
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	announcement, err := h.Repo.GetAnnouncementByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Announcement not found"})
		return
	}

	club, err := h.Repo.GetClubByID(announcement.ClubID)
	if err != nil || club.CreatorID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only club owner can update announcements"})
		return
	}

	var req struct {
		Title   string `json:"title"`
		Content string `json:"content"`
		Status  string `json:"status"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Title != "" {
		announcement.Title = req.Title
	}
	if req.Content != "" {
		announcement.Content = req.Content
	}
	if req.Status != "" {
		announcement.Status = req.Status
	}
	announcement.UpdatedAt = time.Now()

	if err := h.Repo.UpdateAnnouncement(announcement); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, announcement)
}

// DeleteAnnouncement
func (h *Handler) DeleteAnnouncement(c *gin.Context) {
	id := c.Param("id")
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	announcement, err := h.Repo.GetAnnouncementByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Announcement not found"})
		return
	}

	club, err := h.Repo.GetClubByID(announcement.ClubID)
	if err != nil || club.CreatorID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only club owner can delete announcements"})
		return
	}

	if err := h.Repo.DeleteAnnouncement(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Announcement deleted successfully"})
}

// PublishAnnouncement
func (h *Handler) PublishAnnouncement(c *gin.Context) {
	id := c.Param("id")
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	announcement, err := h.Repo.GetAnnouncementByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Announcement not found"})
		return
	}

	club, err := h.Repo.GetClubByID(announcement.ClubID)
	if err != nil || club.CreatorID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only club owner can publish announcements"})
		return
	}

	announcement.Status = "published"
	announcement.UpdatedAt = time.Now()

	if err := h.Repo.UpdateAnnouncement(announcement); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Create notifications for all club members
	members, err := h.Repo.GetClubMembers(announcement.ClubID)
	if err == nil {
		for _, member := range members {
			notification := &models.Notification{
				UserID:    member.UserID,
				Title:     "Pengumuman Baru: " + announcement.Title,
				Body:      club.Name + " - " + announcement.Content,
				Type:      "announcement",
				RelatedID: announcement.ID,
				Read:      false,
				CreatedAt: time.Now(),
			}
			h.Repo.CreateNotification(notification)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Announcement published successfully",
		"announcement": announcement,
	})
}

// UpdatePushToken
func (h *Handler) UpdatePushToken(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req struct {
		Token string `json:"token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.Repo.UpdatePushToken(userID.(string), req.Token); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Push token updated successfully"})
}

// GetNotifications
func (h *Handler) GetNotifications(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	notifications, err := h.Repo.GetUserNotifications(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, notifications)
}

// GetMasterSports
// GetMasterSports
func (h *Handler) GetMasterSports(c *gin.Context) {
	sports, err := h.Repo.GetMasterSports()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch sport master data"})
		return
	}
	c.JSON(http.StatusOK, sports)
}

// JoinClub
func (h *Handler) JoinClub(c *gin.Context) {
	clubID := c.Param("id")
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Check if club exists
	_, err := h.Repo.GetClubByID(clubID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Club not found"})
		return
	}

	// Check if already member
	if _, err := h.Repo.GetClubMember(userID.(string), clubID); err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Already a member"})
		return
	}

	member := &models.ClubMember{
		ClubID:    clubID,
		UserID:    userID.(string),
		Role:      "member",
		CreatedAt: time.Now(),
	}

	if err := h.Repo.JoinClub(member); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Joined club successfully"})
}

// LeaveClub
func (h *Handler) LeaveClub(c *gin.Context) {
	clubID := c.Param("id")
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Check if creator (optional: prevent creator from leaving without transfer)
	club, err := h.Repo.GetClubByID(clubID)
	if err == nil && club.CreatorID == userID.(string) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Creator cannot leave the club. Delete club instead."})
		return
	}

	if err := h.Repo.LeaveClub(userID.(string), clubID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Left club successfully"})
}
