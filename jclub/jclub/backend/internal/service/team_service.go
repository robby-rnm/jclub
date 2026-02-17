package service

import (
	"errors"
	"math/rand"
	"reserve_game/internal/models"
	"reserve_game/internal/repository"
	"time"
)

type TeamService struct {
	Repo repository.Repository
}

func NewTeamService(repo repository.Repository) *TeamService {
	return &TeamService{Repo: repo}
}

func (s *TeamService) GetTeams(matchID string) ([]models.Team, error) {
	return s.Repo.GetTeamsByMatchID(matchID)
}

func (s *TeamService) GenerateTeams(matchID string) ([]models.Team, error) {
	var teams []models.Team
	err := s.Repo.RunTransaction(func(repo repository.Repository) error {
		// 1. Clear existing teams
		if err := repo.DeleteTeamsByMatchID(matchID); err != nil {
			return err
		}

		// 2. Fetch bookings
		bookings, err := repo.GetBookingsByMatchID(matchID)
		if err != nil {
			return err
		}

		// 3. Filter eligible (Confirmed + Paid)
		var gks []models.Booking
		var players []models.Booking

		for _, b := range bookings {
			if b.Status == models.StatusConfirmed && b.IsPaid {
				if b.Position == models.PositionGK {
					gks = append(gks, b)
				} else {
					players = append(players, b)
				}
			}
		}

		if len(gks) == 0 && len(players) == 0 {
			return errors.New("no eligible paid players found")
		}

		// 4. Shuffle
		rng := rand.New(rand.NewSource(time.Now().UnixNano()))
		rng.Shuffle(len(gks), func(i, j int) { gks[i], gks[j] = gks[j], gks[i] })
		rng.Shuffle(len(players), func(i, j int) { players[i], players[j] = players[j], players[i] })

		// 5. Create 3 Teams
		teamNames := []string{"Team A", "Team B", "Team C"}
		teamColors := []string{"#ef4444", "#3b82f6", "#10b981"} // Red, Blue, Green

		createdTeams := make([]*models.Team, 3)
		for i := 0; i < 3; i++ {
			createdTeams[i] = &models.Team{
				MatchID: matchID,
				Name:    teamNames[i],
				Color:   teamColors[i],
			}
			if err := repo.CreateTeam(createdTeams[i]); err != nil {
				return err
			}
		}

		// 6. Assign GKs
		for i, gk := range gks {
			teamIndex := i % 3
			member := &models.TeamMember{
				TeamID:    createdTeams[teamIndex].ID,
				UserID:    gk.UserID,
				BookingID: gk.ID,
			}
			if err := repo.CreateTeamMember(member); err != nil {
				return err
			}
		}

		// 7. Assign Players
		for i, player := range players {
			teamIndex := i % 3
			member := &models.TeamMember{
				TeamID:    createdTeams[teamIndex].ID,
				UserID:    player.UserID,
				BookingID: player.ID,
			}
			if err := repo.CreateTeamMember(member); err != nil {
				return err
			}
		}

		return nil
	})

	// Re-fetch with members
	if err == nil {
		teams, err = s.Repo.GetTeamsByMatchID(matchID)
	}

	return teams, err
}

func (s *TeamService) UpdateTeamMember(memberID string, newTeamID string) error {
	return s.Repo.UpdateTeamMember(memberID, newTeamID)
}

func (s *TeamService) UpdateTeamMemberSecure(memberID string, newTeamID string, requestingUserID string) error {
	// 1. Get Member
	member, err := s.Repo.GetTeamMemberByID(memberID)
	if err != nil {
		return errors.New("member not found")
	}

	// 2. Get Old Team to find MatchID
	oldTeam, err := s.Repo.GetTeamByID(member.TeamID)
	if err != nil {
		return errors.New("team not found")
	}

	// 3. Get Match to check Creator
	match, err := s.Repo.GetMatchByID(oldTeam.MatchID)
	if err != nil {
		return errors.New("match not found")
	}

	if match.CreatorID != requestingUserID {
		return errors.New("unauthorized: only match creator can manage teams")
	}

	// 4. Verify New Team belongs to same match (security sanity check)
	newTeam, err := s.Repo.GetTeamByID(newTeamID)
	if err != nil {
		return errors.New("target team not found")
	}
	if newTeam.MatchID != match.ID {
		return errors.New("target team belongs to a different match")
	}

	return s.Repo.UpdateTeamMember(memberID, newTeamID)
}
