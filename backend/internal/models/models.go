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
	PositionDefender    Position = "defender"
	PositionMidfielder  Position = "midfielder"
	PositionForward     Position = "forward"
)

type BookingStatus string

const (
	StatusConfirmed BookingStatus = "confirmed"
	StatusWaitlist  BookingStatus = "waitlist"
	StatusCancelled BookingStatus = "cancelled"
)

type User struct {
	ID        string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	Name      string    `json:"name"`
	Email     string    `gorm:"uniqueIndex" json:"email"`
	Phone     string    `json:"phone"`
	Password  string    `json:"-"` // Hidden from JSON
	Avatar    string    `json:"avatar"`
	Provider  string    `json:"provider"` // google, facebook, local
	Role      UserRole  `json:"role"`
	PushToken string    `json:"push_token"` // Expo push notification token
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Club struct {
	ID          string       `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	Name        string       `json:"name"`
	Description string       `json:"description"`
	Logo        string       `json:"logo"` // URL or path
	CreatorID   string       `gorm:"index" json:"creator_id"`
	Creator     User         `gorm:"foreignKey:CreatorID" json:"creator"`
	Members     []ClubMember `gorm:"foreignKey:ClubID" json:"members"`
	SocialMedia string       `json:"social_media"` // JSON string: {"instagram": "...", "facebook": "..."}
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
	MemberCount int          `gorm:"-" json:"member_count"` // Computed field
}

type Announcement struct {
	ID        string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	ClubID    string    `gorm:"index" json:"club_id"`
	Club      Club      `gorm:"foreignKey:ClubID" json:"club"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	Status    string    `gorm:"default:'draft'" json:"status"` // draft, published
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Notification struct {
	ID        string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	UserID    string    `gorm:"index" json:"user_id"`
	User      User      `gorm:"foreignKey:UserID" json:"user"`
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	Type      string    `json:"type"`       // announcement, match, etc
	RelatedID string    `json:"related_id"` // ClubID or MatchID or AnnouncementID
	Read      bool      `gorm:"default:false" json:"read"`
	CreatedAt time.Time `json:"created_at"`
}

type ClubMember struct {
	ID        string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	ClubID    string    `gorm:"index" json:"club_id"`
	UserID    string    `gorm:"index" json:"user_id"`
	User      User      `gorm:"foreignKey:UserID" json:"user"`
	Role      string    `json:"role"` // admin, member
	CreatedAt time.Time `json:"created_at"`
}

type Match struct {
	ID          string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	GameType    string `json:"game_type"`

	ClubID *string `gorm:"index" json:"club_id"`
	Club   Club    `gorm:"foreignKey:ClubID" json:"club"`

	CreatorID        string    `gorm:"index" json:"creator_id"`
	Creator          User      `gorm:"foreignKey:CreatorID" json:"creator"`
	Date             time.Time `json:"date"`
	Location         string    `json:"location"`
	Price            float64   `json:"price"`
	MaxPlayers       int       `json:"max_players"`
	Status           string    `json:"status"` // draft, published, cancelled
	RescheduleReason string    `json:"reschedule_reason"`
	CancelReason     string    `json:"cancel_reason"`
	PositionQuotas   string    `json:"position_quotas"` // JSON: {"gk": 2, "player_front": 5}
	PositionPrices   string    `json:"position_prices"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
	Bookings         []Booking `gorm:"foreignKey:MatchID" json:"bookings"`
}

type Booking struct {
	ID            string        `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	MatchID       string        `gorm:"index" json:"match_id"`
	Match         Match         `gorm:"foreignKey:MatchID" json:"match"`
	UserID        string        `gorm:"index" json:"user_id"`
	User          User          `gorm:"foreignKey:UserID" json:"user"`
	Position      Position      `json:"position"` // "gk", "player_front", etc.
	Status        BookingStatus `gorm:"default:'confirmed'" json:"status"`
	IsPaid        bool          `gorm:"default:false" json:"is_paid"`
	WaitlistOrder int           `gorm:"default:0" json:"waitlist_order"` // 0 if confirmed, 1+ if waitlist
	CreatedAt     time.Time     `json:"created_at"`
	UpdatedAt     time.Time     `json:"updated_at"`
}

type Team struct {
	ID        string       `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	MatchID   string       `gorm:"index" json:"match_id"`
	Name      string       `json:"name"`  // Team A, Team B
	Color     string       `json:"color"` // hex code or name
	Members   []TeamMember `gorm:"foreignKey:TeamID" json:"members"`
	CreatedAt time.Time    `json:"created_at"`
	UpdatedAt time.Time    `json:"updated_at"`
}

type TeamMember struct {
	ID        string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	TeamID    string `gorm:"index" json:"team_id"`
	UserID    string `gorm:"index" json:"user_id"`
	User      User   `gorm:"foreignKey:UserID" json:"user"`
	BookingID string `gorm:"index" json:"booking_id"` // Link to the booking that qualified them
}

type Sport struct {
	ID        string          `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name      string          `json:"name"`
	Code      string          `gorm:"uniqueIndex" json:"code"`
	Positions []SportPosition `gorm:"foreignKey:SportID" json:"positions"`
}

type SportPosition struct {
	ID           string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	SportID      string `gorm:"index" json:"-"`
	Code         string `json:"code"`
	Name         string `json:"name"`
	DefaultQuota int    `json:"default_quota"`
}

// Deprecated: used for static response previously
type SportMaster struct {
	Name      string           `json:"name"`
	Code      string           `json:"code"`
	Positions []PositionMaster `json:"positions"`
}

// Deprecated
type PositionMaster struct {
	Code         string `json:"code"`
	Name         string `json:"name"`
	DefaultQuota int    `json:"default_quota"`
}
