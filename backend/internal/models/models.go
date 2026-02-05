package models

import (
	"time"
)

type UserRole string

const (
	RoleAdmin  UserRole = "admin"
	RolePlayer UserRole = "player"
)

type Position string

const (
	PositionGK          Position = "gk"
	PositionPlayerFront Position = "player_front"
	PositionPlayerBack  Position = "player_back"
)

type BookingStatus string

const (
	StatusConfirmed BookingStatus = "confirmed"
	StatusWaitlist  BookingStatus = "waitlist"
	StatusCancelled BookingStatus = "cancelled"
)

type User struct {
	ID        string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name      string
	Email     string `gorm:"uniqueIndex"`
	Phone     string
	Avatar    string
	Provider  string // google, facebook
	Role      UserRole
	CreatedAt time.Time
	UpdatedAt time.Time
}

type Match struct {
	ID          string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Title       string
	Description string
	GameType    string
	Date        time.Time
	Location    string
	Price       float64
	MaxPlayers  int
	Status      string // open, closed
	CreatedAt   time.Time
	UpdatedAt   time.Time
	Bookings    []Booking `gorm:"foreignKey:MatchID"`
}

type Booking struct {
	ID            string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	MatchID       string `gorm:"index"` // Foreign key to Match
	UserID        string `gorm:"index"` // Foreign key to User
	User          User   `gorm:"foreignKey:UserID"`
	Position      Position
	Status        BookingStatus
	WaitlistOrder int // if status is waitlist, this tracks the order
	IsPaid        bool
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

type Team struct {
	ID        string       `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	MatchID   string       `gorm:"index"`
	Name      string       // Team A, Team B
	Color     string       // hex code or name
	Members   []TeamMember `gorm:"foreignKey:TeamID"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

type TeamMember struct {
	ID        string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	TeamID    string `gorm:"index"`
	UserID    string `gorm:"index"`
	User      User   `gorm:"foreignKey:UserID"`
	BookingID string `gorm:"index"` // Link to the booking that qualified them
}
