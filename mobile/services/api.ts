import { Platform } from 'react-native';

const API_URL = Platform.select({
    android: 'http://10.0.2.2:8080/api',
    ios: 'http://localhost:8080/api',
    web: 'http://localhost:8080/api',
    default: 'http://localhost:8080/api',
});

// Types
export interface Match {
    ID: string;
    Title: string;
    Description: string;
    GameType: string;
    Date: string; // ISO string from Go time.Time
    Location: string;
    Price: number;
    MaxPlayers: number;
    Status: string;
    Bookings: any[]; // Define Booking type if needed
}

export interface CreateMatchRequest {
    title: string;
    description?: string;
    game_type?: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    location: string;
    price: number;
    max_players: number;
}

export const api = {
    async getMatches(): Promise<Match[]> {
        const res = await fetch(`${API_URL}/matches`);
        if (!res.ok) throw new Error('Failed to fetch matches');
        return res.json();
    },

    async getMatch(id: string): Promise<Match> {
        const res = await fetch(`${API_URL}/matches/${id}`);
        if (!res.ok) throw new Error('Failed to fetch match');
        return res.json();
    },

    async createMatch(data: CreateMatchRequest): Promise<Match> {
        // Basic auth for now or skip if public/mocked
        // The backend logic for CreateMatch is protected, but we haven't implemented login flow fully in UI
        // For now, let's assume public or I'll add a dummy token if needed.
        // Backend `middleware.AuthMiddleware` checks header.
        // I should probably Implement Login first if I want to use Protected routes.
        // Or I can temporarily disable auth in backend for testing, OR just implement login.
        // User requested "connect", so I should try to do it right.
        const token = await getToken();
        const res = await fetch(`${API_URL}/matches`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(err || 'Failed to create match');
        }
        return res.json();
    },

    async joinMatch(matchId: string, position: string = 'player_front'): Promise<any> {
        const token = await getToken();
        const res = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ match_id: matchId, position }),
        });
        if (!res.ok) throw new Error('Failed to join match');
        return res.json();
    },

    async updateProfile(data: { name: string; phone: string }): Promise<any> {
        const token = await getToken();
        const res = await fetch(`${API_URL}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.text(); // or res.json() depending on backend
            throw new Error('Failed to update profile');
        }
        return res.json();
    },

    async deleteAccount(): Promise<any> {
        const token = await getToken();
        const res = await fetch(`${API_URL}/profile`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Failed to delete account');
        return res.json();
    },

    async login(provider: string = 'google', token: string = 'dummy'): Promise<{ token: string, user: any }> {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider, token })
        });
        if (!res.ok) throw new Error('Login failed');
        return res.json();
    }
};

// Simple in-memory token storage for demo
let _token = '';
async function getToken() {
    if (_token) return _token;
    // Auto-login for demo since we don't have a real Google/FB flow set up in frontend yet
    try {
        const data = await api.login();
        _token = data.token;
        return _token;
    } catch (e) {
        console.error("Auto-login failed", e);
        return '';
    }
}
