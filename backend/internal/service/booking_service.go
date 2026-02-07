package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"reserve_game/internal/models"
	"reserve_game/internal/repository"
	"time"
)

type BookingService struct {
	Repo repository.Repository
}

func NewBookingService(repo repository.Repository) *BookingService {
	return &BookingService{Repo: repo}
}

func (s *BookingService) JoinMatch(userID string, matchID string, position models.Position) (*models.Booking, error) {
	var booking *models.Booking

	err := s.Repo.RunTransaction(func(repo repository.Repository) error {
		// 1. Get Match for Quotas (WITH LOCK)
		match, err := repo.GetMatchByIDLock(matchID)
		if err != nil {
			return err
		}

		// 2. Get existing bookings
		bookings, err := repo.GetBookingsByMatchID(matchID)
		if err != nil {
			return err
		}

		// 3. Check if user already booked
		for _, b := range bookings {
			if b.UserID == userID && b.Status != models.StatusCancelled {
				return errors.New("user already booked for this match")
			}
		}

		// 4. Calculate status based on quota
		confirmedCount := 0
		maxWaitlistOrder := 0
		for _, b := range bookings {
			if b.Position == position {
				if b.Status == models.StatusConfirmed {
					confirmedCount++
				} else if b.Status == models.StatusWaitlist {
					if b.WaitlistOrder > maxWaitlistOrder {
						maxWaitlistOrder = b.WaitlistOrder
					}
				}
			}
		}

		// Parse Quota from Match
		quota := 0
		// Default quotas if empty
		if match.PositionQuotas == "" {
			switch position {
			case models.PositionGK:
				quota = 2 // Default
			default:
				quota = 15 // Default
			}
		} else {
			var quotas map[string]int
			if err := json.Unmarshal([]byte(match.PositionQuotas), &quotas); err != nil {
				// Fallback if bad JSON
				quota = 15
			} else {
				if q, ok := quotas[string(position)]; ok {
					quota = q
				} else {
					quota = 0 // Position not allowed? or unlimited? Let's say 0 means blocked/waitlist only if strict.
					// Or maybe generic player default.
					// Let's assume if not implicit, it's 0 (full/waitlist).
					// But for backward compatibility with existing "player_front", "player_back",
					// we should handle safely.
					if position == "player" || position == "player_front" || position == "player_back" {
						// Check if there is a generic "player" quota
						if qDetails, ok := quotas["player"]; ok {
							quota = qDetails
						} else {
							// Try "player_front" specifically
							if qPF, okPF := quotas["player_front"]; okPF {
								quota = qPF
							} else {
								quota = 100 // Fallback open
							}
						}
					}
				}
			}
		}

		status := models.StatusConfirmed
		waitlistOrder := 0
		if confirmedCount >= quota {
			status = models.StatusWaitlist
			waitlistOrder = maxWaitlistOrder + 1
		}

		// 4. Create booking
		newBooking := &models.Booking{
			MatchID:       matchID,
			UserID:        userID,
			Position:      position,
			Status:        status,
			WaitlistOrder: waitlistOrder,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		if err := repo.CreateBooking(newBooking); err != nil {
			return err
		}
		booking = newBooking
		return nil
	})

	return booking, err
}

func (s *BookingService) CancelBooking(bookingID string, userID string, isAdmin bool) error {
	return s.Repo.RunTransaction(func(repo repository.Repository) error {
		booking, err := repo.GetBookingByID(bookingID)
		if err != nil {
			return err
		}

		if booking.UserID != userID && !isAdmin {
			fmt.Printf("[CancelBooking] Denied. BookingUserID=%s, RequestUserID=%s, IsAdmin=%v\n", booking.UserID, userID, isAdmin)
			return errors.New("unauthorized to cancel this booking")
		}

		if booking.Status == models.StatusCancelled {
			return errors.New("booking already cancelled")
		}

		wasConfirmed := false
		if booking.Status == models.StatusConfirmed {
			wasConfirmed = true
		}

		// Update to cancelled
		booking.Status = models.StatusCancelled
		booking.WaitlistOrder = 0
		if err := repo.UpdateBooking(booking); err != nil {
			return err
		}

		// If confirmed booking was cancelled, try to promote a waitlist user
		if wasConfirmed {
			waitlist, err := repo.GetWaitlist(booking.MatchID, booking.Position)
			if err != nil {
				return err
			}

			if len(waitlist) > 0 {
				nextBooking := &waitlist[0] // Get first waitlist (ordered by waitlist_order ASC)
				nextBooking.Status = models.StatusConfirmed
				nextBooking.WaitlistOrder = 0
				if err := repo.UpdateBooking(nextBooking); err != nil {
					return err
				}
			}
		}

		return nil
	})
}

func (s *BookingService) SetPaidStatus(bookingID string, isPaid bool) error {
	return s.Repo.RunTransaction(func(repo repository.Repository) error {
		booking, err := repo.GetBookingByID(bookingID)
		if err != nil {
			return err
		}

		booking.IsPaid = isPaid
		return repo.UpdateBooking(booking)
	})
}
