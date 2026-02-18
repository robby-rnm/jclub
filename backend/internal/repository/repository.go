package repository

import (
	"fmt"
	"reserve_game/internal/models"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type MatchFilter struct {
	Page         int
	Limit        int
	CreatorID    string
	JoinedUserID string
	Search       string
	ClubID       string // Filter by Club
	Status       string // draft, published, cancelled, or closed
	GameType     string // Sport type
}

type Repository interface {
	CreateUser(user *models.User) error
	GetUserByEmail(email string) (*models.User, error)
	GetUserByID(id string) (*models.User, error)
	GetAllUsers() ([]models.User, error)
	UpdateUser(user *models.User) error
	DeleteUser(id string) error

	CreateMatch(match *models.Match) error
	GetMatchByDate(date string) (*models.Match, error) // date as string YYYY-MM-DD for simplicity in query
	GetMatchByID(id string) (*models.Match, error)
	GetMatchByIDLock(id string) (*models.Match, error) // For Locking
	UpdateMatch(match *models.Match) error

	CreateBooking(booking *models.Booking) error
	GetBookingsByMatchID(matchID string) ([]models.Booking, error)
	UpdateBooking(booking *models.Booking) error
	ListMatches(filter MatchFilter) ([]models.Match, error)
	GetBookingByID(id string) (*models.Booking, error)
	GetWaitlist(matchID string, position models.Position) ([]models.Booking, error)
	GetTeamsByMatchID(matchID string) ([]models.Team, error)
	CreateTeam(team *models.Team) error
	CreateTeamMember(member *models.TeamMember) error
	GetTeamByID(id string) (*models.Team, error)
	GetTeamMemberByID(id string) (*models.TeamMember, error)
	DeleteTeamsByMatchID(matchID string) error
	RunTransaction(fn func(repo Repository) error) error
	FixData() error
	UpdateTeamMember(memberID string, newTeamID string) error
	GetMasterSports() ([]models.Sport, error)

	// Club Methods
	CreateClub(club *models.Club) error
	GetClubs(page, limit int, search string, userID string, filterType string) ([]models.Club, error)
	GetClubByID(id string) (*models.Club, error)
	JoinClub(member *models.ClubMember) error
	LeaveClub(userID, clubID string) error
	GetClubMember(userID, clubID string) (*models.ClubMember, error)
	UpdateClub(club *models.Club) error
	DeleteClub(clubID string) error
	GetClubMemberCount(clubID string) (int64, error)
	GetClubMembers(clubID string) ([]models.ClubMember, error)

	// Announcement Methods
	CreateAnnouncement(announcement *models.Announcement) error
	GetClubAnnouncements(clubID string) ([]models.Announcement, error)
	GetPublishedClubAnnouncements(clubID string) ([]models.Announcement, error)
	GetAnnouncementByID(id string) (*models.Announcement, error)
	UpdateAnnouncement(announcement *models.Announcement) error
	DeleteAnnouncement(id string) error

	// Notification Methods
	CreateNotification(notification *models.Notification) error
	GetUserNotifications(userID string) ([]models.Notification, error)
	MarkNotificationAsRead(id string) error

	// User Methods
	UpdatePushToken(userID, token string) error
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) CreateClub(club *models.Club) error {
	return r.db.Create(club).Error
}

func (r *repository) GetClubs(page, limit int, search string, userID string, filterType string) ([]models.Club, error) {
	var clubs []models.Club
	query := r.db.Preload("Creator").Order("created_at DESC")

	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("name ILIKE ? OR description ILIKE ?", searchPattern, searchPattern)
	}

	if filterType == "joined" && userID != "" {
		// Subquery for clubs joined by user
		subquery := r.db.Table("club_members").Select("club_id").Where("user_id = ?", userID)
		query = query.Where("id IN (?)", subquery)
	} else if filterType == "created" && userID != "" {
		query = query.Where("creator_id = ?", userID)
	}

	offset := (page - 1) * limit
	err := query.Limit(limit).Offset(offset).Find(&clubs).Error
	return clubs, err
}

func (r *repository) JoinClub(member *models.ClubMember) error {
	return r.db.Create(member).Error
}

func (r *repository) LeaveClub(userID, clubID string) error {
	return r.db.Delete(&models.ClubMember{}, "user_id = ? AND club_id = ?", userID, clubID).Error
}

func (r *repository) GetClubMember(userID, clubID string) (*models.ClubMember, error) {
	var member models.ClubMember
	err := r.db.Where("user_id = ? AND club_id = ?", userID, clubID).First(&member).Error
	return &member, err
}

func (r *repository) GetClubByID(id string) (*models.Club, error) {
	var club models.Club
	err := r.db.Preload("Creator").First(&club, "id = ?", id).Error
	return &club, err
}

func (r *repository) UpdateClub(club *models.Club) error {
	return r.db.Save(club).Error
}

func (r *repository) DeleteClub(clubID string) error {
	// Delete in transaction to ensure consistency
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Delete all club members
		if err := tx.Where("club_id = ?", clubID).Delete(&models.ClubMember{}).Error; err != nil {
			return err
		}
		// Delete all announcements
		if err := tx.Where("club_id = ?", clubID).Delete(&models.Announcement{}).Error; err != nil {
			return err
		}
		// Delete the club itself
		if err := tx.Delete(&models.Club{}, "id = ?", clubID).Error; err != nil {
			return err
		}
		return nil
	})
}

func (r *repository) CreateAnnouncement(announcement *models.Announcement) error {
	return r.db.Create(announcement).Error
}

func (r *repository) GetClubAnnouncements(clubID string) ([]models.Announcement, error) {
	var announcements []models.Announcement
	err := r.db.Where("club_id = ?", clubID).Order("created_at DESC").Find(&announcements).Error
	return announcements, err
}

func (r *repository) GetPublishedClubAnnouncements(clubID string) ([]models.Announcement, error) {
	var announcements []models.Announcement
	err := r.db.Where("club_id = ? AND status = ?", clubID, "published").Order("created_at DESC").Find(&announcements).Error
	return announcements, err
}

func (r *repository) GetAnnouncementByID(id string) (*models.Announcement, error) {
	var announcement models.Announcement
	err := r.db.First(&announcement, "id = ?", id).Error
	return &announcement, err
}

func (r *repository) UpdateAnnouncement(announcement *models.Announcement) error {
	return r.db.Save(announcement).Error
}

func (r *repository) DeleteAnnouncement(id string) error {
	return r.db.Delete(&models.Announcement{}, "id = ?", id).Error
}

func (r *repository) GetClubMembers(clubID string) ([]models.ClubMember, error) {
	var members []models.ClubMember
	err := r.db.Preload("User").Where("club_id = ?", clubID).Find(&members).Error
	return members, err
}

func (r *repository) CreateNotification(notification *models.Notification) error {
	return r.db.Create(notification).Error
}

func (r *repository) GetUserNotifications(userID string) ([]models.Notification, error) {
	var notifications []models.Notification
	err := r.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&notifications).Error
	return notifications, err
}

func (r *repository) MarkNotificationAsRead(id string) error {
	return r.db.Model(&models.Notification{}).Where("id = ?", id).Update("read", true).Error
}

func (r *repository) UpdatePushToken(userID, token string) error {
	return r.db.Model(&models.User{}).Where("id = ?", userID).Update("push_token", token).Error
}

func (r *repository) GetClubMemberCount(clubID string) (int64, error) {
	var count int64
	err := r.db.Model(&models.ClubMember{}).Where("club_id = ?", clubID).Count(&count).Error
	return count, err
}

func (r *repository) GetMasterSports() ([]models.Sport, error) {
	var sports []models.Sport
	err := r.db.Preload("Positions").Find(&sports).Error
	return sports, err
}

func (r *repository) FixData() error {
	// Use a valid UUID for the test user to satisfy Postgres strict type checks
	// This UUID should match what is used in Handlers fallback
	testUserID := "00000000-0000-0000-0000-000000000001"

	// 1. Assign orphaned matches to test user
	if err := r.db.Model(&models.Match{}).Where("creator_id IS NULL").Update("creator_id", testUserID).Error; err != nil {
		return err
	}
	// 2. Assign orphaned bookings to test user (optional)
	// 3. Assign orphaned matches to a default club (Temporary Fix for Dev)
	defaultClubID := "a131fef9-cd3e-4c00-bc13-06f9fd6e1285"
	if err := r.db.Model(&models.Match{}).Where("club_id IS NULL").Update("club_id", defaultClubID).Error; err != nil {
		return err
	}
	return nil
}

func (r *repository) CreateTeam(team *models.Team) error {
	return r.db.Create(team).Error
}

func (r *repository) CreateTeamMember(member *models.TeamMember) error {
	return r.db.Create(member).Error
}

func (r *repository) GetTeamByID(id string) (*models.Team, error) {
	var team models.Team
	err := r.db.First(&team, "id = ?", id).Error
	return &team, err
}

func (r *repository) GetTeamMemberByID(id string) (*models.TeamMember, error) {
	var member models.TeamMember
	err := r.db.Preload("User").First(&member, "id = ?", id).Error
	return &member, err
}

func (r *repository) UpdateTeamMember(memberID string, newTeamID string) error {
	return r.db.Model(&models.TeamMember{}).Where("id = ?", memberID).Update("team_id", newTeamID).Error
}

func (r *repository) GetTeamsByMatchID(matchID string) ([]models.Team, error) {
	var teams []models.Team
	err := r.db.Preload("Members.User").Where("match_id = ?", matchID).Find(&teams).Error
	return teams, err
}

func (r *repository) DeleteTeamsByMatchID(matchID string) error {
	// Manual Cascade: Delete members first
	// 1. Get Team IDs
	var teamIDs []string
	r.db.Model(&models.Team{}).Where("match_id = ?", matchID).Pluck("id", &teamIDs)

	if len(teamIDs) > 0 {
		// 2. Delete Members
		if err := r.db.Delete(&models.TeamMember{}, "team_id IN ?", teamIDs).Error; err != nil {
			return err
		}
	}

	// 3. Delete Teams
	return r.db.Delete(&models.Team{}, "match_id = ?", matchID).Error
}

func (r *repository) ListMatches(filter MatchFilter) ([]models.Match, error) {
	fmt.Printf("[Repo] ListMatches: %+v\n", filter)
	var matches []models.Match
	now := time.Now()
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	query := r.db.Preload("Bookings").Preload("Creator").Preload("Club").Order("date ASC")

	// Only filter by date if looking for public matches (browsing)
	// If filtering by "My Created" or "My Joined", show history too.
	if filter.CreatorID == "" && filter.JoinedUserID == "" {
		query = query.Where("date >= ?", startOfDay)
	}

	if filter.CreatorID != "" {
		query = query.Where("creator_id = ?", filter.CreatorID)
	}

	if filter.JoinedUserID != "" {
		// Use Subquery to avoid DISTINCT/ORDER BY issues
		// SELECT * FROM matches WHERE id IN (SELECT match_id FROM bookings WHERE user_id = ? AND status = 'confirmed')
		subquery := r.db.Table("bookings").Select("match_id").Where("user_id = ? AND status = 'confirmed'", filter.JoinedUserID)
		query = query.Where("id IN (?)", subquery)
	}

	if filter.ClubID != "" {
		query = query.Where("club_id = ?", filter.ClubID)
	}

	if filter.Status != "" {
		// If Status is "all", we don't filter (useful for owners)
		// Otherwise exact match (e.g. "published", "draft")
		if filter.Status != "all" {
			// Handle legacy "open" vs "published" if needed, but we try to stick to "published"
			// If we have mixed data, we might need OR.
			if filter.Status == "published" {
				query = query.Where("status = ? OR status = ?", "published", "open")
			} else {
				query = query.Where("status = ?", filter.Status)
			}
		}
	}

	if filter.GameType != "" {
		query = query.Where("game_type = ?", filter.GameType)
	}

	if filter.Search != "" {
		searchPattern := "%" + filter.Search + "%"
		// Using ILIKE for Postgres or LIKE for others. Gorm usually abstracts or we rely on specific driver.
		// Assuming Postgres:
		query = query.Where("title ILIKE ? OR location ILIKE ?", searchPattern, searchPattern)
	}

	offset := (filter.Page - 1) * filter.Limit
	err := query.Limit(filter.Limit).Offset(offset).Find(&matches).Error
	return matches, err
}

func (r *repository) GetBookingByID(id string) (*models.Booking, error) {
	var booking models.Booking
	err := r.db.First(&booking, "id = ?", id).Error
	return &booking, err
}

func (r *repository) RunTransaction(fn func(repo Repository) error) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		txRepo := NewRepository(tx)
		return fn(txRepo)
	})
}

func (r *repository) CreateUser(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *repository) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	err := r.db.Where("email = ?", email).First(&user).Error
	return &user, err
}

func (r *repository) GetUserByID(id string) (*models.User, error) {
	var user models.User
	err := r.db.First(&user, "id = ?", id).Error
	return &user, err
}

func (r *repository) UpdateUser(user *models.User) error {
	return r.db.Save(user).Error
}

func (r *repository) DeleteUser(id string) error {
	return r.db.Delete(&models.User{}, "id = ?", id).Error
}

func (r *repository) CreateMatch(match *models.Match) error {
	return r.db.Create(match).Error
}

func (r *repository) GetMatchByDate(date string) (*models.Match, error) {
	var match models.Match
	// Assuming date stored as timestamp at midnight or we query range
	// For simplicity, let's assume one match per day and we query by date part
	err := r.db.Where("DATE(date) = ?", date).First(&match).Error
	return &match, err
}

func (r *repository) GetMatchByID(id string) (*models.Match, error) {
	var match models.Match
	err := r.db.Preload("Bookings.User").Preload("Bookings").Preload("Creator").Preload("Club").First(&match, "id = ?", id).Error
	return &match, err
}

func (r *repository) GetMatchByIDLock(id string) (*models.Match, error) {
	var match models.Match
	// Lock the row for update
	// Note: Preloads might not be locked, but we only need to lock the Match row to serialize access.
	// We don't necessarily need preloads here if we just want to lock, but JoinMatch uses preloads?
	// Actually JoinMatch fetches Bookings separately.
	// We just need the Match QUOTA info.
	err := r.db.Clauses(clause.Locking{Strength: "UPDATE"}).First(&match, "id = ?", id).Error
	return &match, err
}

func (r *repository) UpdateMatch(match *models.Match) error {
	return r.db.Save(match).Error
}

func (r *repository) CreateBooking(booking *models.Booking) error {
	return r.db.Create(booking).Error
}

func (r *repository) GetBookingsByMatchID(matchID string) ([]models.Booking, error) {
	var bookings []models.Booking
	err := r.db.Where("match_id = ?", matchID).Find(&bookings).Error
	return bookings, err
}

func (r *repository) UpdateBooking(booking *models.Booking) error {
	return r.db.Save(booking).Error
}

func (r *repository) GetWaitlist(matchID string, position models.Position) ([]models.Booking, error) {
	var bookings []models.Booking
	err := r.db.Where("match_id = ? AND position = ? AND status = ?", matchID, position, models.StatusWaitlist).
		Order("waitlist_order ASC").Find(&bookings).Error
	return bookings, err
}


// GetAllUsers - get all users
func (r *repository) GetAllUsers() ([]models.User, error) {
	var users []models.User
	err := r.db.Find(&users).Error
	return users, err
}
