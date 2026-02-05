package repository

import (
	"reserve_game/internal/models"

	"gorm.io/gorm"
)

type Repository interface {
	CreateUser(user *models.User) error
	GetUserByEmail(email string) (*models.User, error)
	GetUserByID(id string) (*models.User, error)
	UpdateUser(user *models.User) error
	DeleteUser(id string) error

	CreateMatch(match *models.Match) error
	GetMatchByDate(date string) (*models.Match, error) // date as string YYYY-MM-DD for simplicity in query
	GetMatchByID(id string) (*models.Match, error)

	CreateBooking(booking *models.Booking) error
	GetBookingsByMatchID(matchID string) ([]models.Booking, error)
	UpdateBooking(booking *models.Booking) error
	ListMatches(limit int) ([]models.Match, error)
	GetBookingByID(id string) (*models.Booking, error)
	GetWaitlist(matchID string, position models.Position) ([]models.Booking, error)
	GetTeamsByMatchID(matchID string) ([]models.Team, error)
	CreateTeam(team *models.Team) error
	CreateTeamMember(member *models.TeamMember) error
	DeleteTeamsByMatchID(matchID string) error
	RunTransaction(fn func(repo Repository) error) error
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) CreateTeam(team *models.Team) error {
	return r.db.Create(team).Error
}

func (r *repository) CreateTeamMember(member *models.TeamMember) error {
	return r.db.Create(member).Error
}

func (r *repository) GetTeamsByMatchID(matchID string) ([]models.Team, error) {
	var teams []models.Team
	err := r.db.Preload("Members.User").Where("match_id = ?", matchID).Find(&teams).Error
	return teams, err
}

func (r *repository) DeleteTeamsByMatchID(matchID string) error {
	return r.db.Delete(&models.Team{}, "match_id = ?", matchID).Error
}

func (r *repository) ListMatches(limit int) ([]models.Match, error) {
	var matches []models.Match
	err := r.db.Order("date ASC").Limit(limit).Find(&matches).Error
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
	err := r.db.Preload("Bookings").First(&match, "id = ?", id).Error
	return &match, err
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
