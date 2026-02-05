package service

import (
	"errors"
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
		// 1. Get existing bookings
		bookings, err := repo.GetBookingsByMatchID(matchID)
		if err != nil {
			return err
		}

		// 2. Check if user already booked
		for _, b := range bookings {
			if b.UserID == userID && b.Status != models.StatusCancelled {
				return errors.New("user already booked for this match")
			}
		}

		// 3. Calculate status based on quota
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

		quota := 0
		switch position {
		case models.PositionGK:
			quota = 3
		case models.PositionPlayerFront:
			quota = 14
		case models.PositionPlayerBack:
			quota = 13
		default:
			return errors.New("invalid position")
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
