package models

import "time"

type CreateMatchRequest struct {
	Title          string `json:"title" binding:"required"`
	Description    string `json:"description"`
	GameType       string `json:"game_type"`
	Date           string `json:"date" binding:"required"` // YYYY-MM-DD
	Time           string `json:"time" binding:"required"` // HH:MM
	Location       string `json:"location" binding:"required"`
	Price          int    `json:"price" binding:"required"`
	MaxPlayers     int    `json:"max_players" binding:"required"`
	PositionQuotas string `json:"position_quotas"` // JSON string
	PositionPrices string `json:"position_prices"` // JSON string
}

type JoinMatchRequest struct {
	MatchID  string   `json:"match_id"`
	Date     string   `json:"date"` // Optional if joining by date
	Position Position `json:"position" binding:"required,oneof=gk player_front player_back"`
}

type RegisterRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Provider string `json:"provider" binding:"required,oneof=google facebook local"`
	Token    string `json:"token"`    // Optional for local
	Email    string `json:"email"`    // Required for local
	Password string `json:"password"` // Required for local
	Name     string `json:"name"`     // Optional, only for simulated social login fallback
}

type UpdateUserRequest struct {
	Name   string `json:"name"`
	Phone  string `json:"phone"`
	Avatar string `json:"avatar"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type MatchResponse struct {
	ID       string           `json:"id"`
	Date     time.Time        `json:"date"`
	Status   string           `json:"status"`
	Bookings []Booking        `json:"bookings"`
	Counts   map[Position]int `json:"counts"`
}
