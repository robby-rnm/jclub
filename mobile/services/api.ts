import { Platform } from 'react-native';
import { uploadAsync, FileSystemUploadType } from 'expo-file-system/legacy';
import Constants from 'expo-constants';

const getBaseUrl = () => {
    if (Platform.OS === 'web') return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081/api';

    const debuggerHost = Constants.expoConfig?.hostUri;
    const localhost = debuggerHost?.split(':')[0];

    if (!localhost) {
        return 'http://192.168.99.211:8081/api'; // Fallback if no debugger (e.g. built APK without env)
    }

    if (Platform.OS === 'android') {
        // return `http://10.0.2.2:8081/api`; // If using Emulator
        return `http://${localhost}:8081/api`; // If using physical device via LAN
    }

    return `http://${localhost}:8081/api`;
}

const API_URL = getBaseUrl();

// Types
export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar: string;
    provider: string;
    role: string;
}

export interface Match {
    id: string;
    title: string;
    description: string;
    game_type: string;
    date: string; // ISO string from Go time.Time
    location: string;
    price: number;
    max_players: number;
    status: string;
    reschedule_reason?: string;
    position_quotas?: string; // JSON string
    position_prices?: string; // JSON string
    bookings: any[]; // Define Booking type if needed
    creator?: User;
    club_id?: string;
    club?: Club;
}

export interface Club {
    id: string;
    name: string;
    description: string;
    logo: string;
    creator_id: string;
    creator?: User;
    social_media?: string; // JSON string
    member_count?: number;
}

export interface GetClubResponse {
    club: Club;
    member_count: number;
}

export interface CreateMatchRequest {
    title: string;
    description?: string;
    game_type?: string;
    club_id: string; // Required
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    location: string;
    price: number;
    max_players: number;
    position_quotas?: string; // JSON string
    position_prices?: string; // JSON string
    status?: string; // 'draft' | 'published'
}

export interface PositionMaster {
    code: string;
    name: string;
    default_quota: number;
}

export interface SportMaster {
    name: string;
    code: string;
    positions: PositionMaster[];
}

export const api = {
    async getMatches(page: number = 1, limit: number = 10, search: string = '', filter: string = 'all', clubId: string = '', sport: string = '', status: string = ''): Promise<Match[]> {
        const token = await getToken();
        console.log(`[API] getMatches params: page=${page} search=${search} filter=${filter} clubId=${clubId} sport=${sport} status=${status}`);
        const params: any = {
            page: page.toString(),
            limit: limit.toString(),
            search,
            filter
        };
        if (clubId) params.club_id = clubId;
        if (sport) params.sport = sport;
        if (status) params.status = status;

        const queryParams = new URLSearchParams(params);
        const res = await fetch(`${API_URL}/matches?${queryParams.toString()}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Failed to fetch matches');
        return res.json();
    },

    async getClubs(page: number = 1, limit: number = 10, search: string = '', filter: string = ''): Promise<Club[]> {
        const token = await getToken();
        const params: any = {
            page: page.toString(),
            limit: limit.toString(),
            search
        };
        if (filter) params.filter = filter;

        const queryParams = new URLSearchParams(params);

        // Pass token to allow filtering by userID (joined)
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_URL}/clubs?${queryParams.toString()}`, {
            headers
        });
        if (!res.ok) throw new Error('Failed to fetch clubs');
        return res.json();
    },

    async getClub(id: string): Promise<GetClubResponse> {
        const res = await fetch(`${API_URL}/clubs/${id}`);
        if (!res.ok) throw new Error('Failed to fetch club');
        return res.json();
    },

    async createClub(data: { name: string; description?: string; logo?: string }): Promise<Club> {
        const token = await getToken();
        const res = await fetch(`${API_URL}/clubs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create club');
        return res.json();
    },

    async joinClub(clubId: string): Promise<any> {
        const token = await getToken();
        const res = await fetch(`${API_URL}/clubs/${clubId}/join`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Failed to join club');
        return res.json();
    },

    async leaveClub(clubId: string): Promise<any> {
        const token = await getToken();
        const res = await fetch(`${API_URL}/clubs/${clubId}/leave`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Failed to leave club');
        return res.json();
    },


    async getClubAnnouncements(clubId: string): Promise<any[]> {
        const res = await fetch(`${API_URL}/clubs/${clubId}/announcements`);
        if (!res.ok) throw new Error('Failed to fetch announcements');
        return res.json();
    },

    async getAnnouncementsForOwner(clubId: string): Promise<any[]> {
        const token = await getToken();
        const res = await fetch(`${API_URL}/clubs/${clubId}/announcements/manage`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch management announcements');
        return res.json();
    },

    async createAnnouncement(clubId: string, data: { title: string; content: string }): Promise<any> {
        const token = await getToken();
        const res = await fetch(`${API_URL}/clubs/${clubId}/announcements`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create announcement');
        return res.json();
    },

    async updateClub(id: string, data: { name?: string; description?: string; logo?: string; social_media?: string }): Promise<Club> {
        const token = await getToken();
        const res = await fetch(`${API_URL}/clubs/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update club');
        return res.json();
    },

    async uploadClubLogo(uri: string): Promise<string> {
        return this.uploadAvatar(uri); // Reuse upload logic (it just uploads to /upload and returns URL)
    },

    async deleteClub(id: string): Promise<any> {
        const token = await getToken();
        const res = await fetch(`${API_URL}/clubs/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Failed to delete club');
        return res.json();
    },

    // Announcement methods
    async getAnnouncement(id: string): Promise<any> {
        const token = await getToken();
        const res = await fetch(`${API_URL}/announcements/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch announcement');
        return res.json();
    },

    async updateAnnouncement(id: string, data: { title?: string; content?: string; status?: string }): Promise<any> {
        const token = await getToken();
        const res = await fetch(`${API_URL}/announcements/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update announcement');
        return res.json();
    },

    async deleteAnnouncement(id: string): Promise<any> {
        const token = await getToken();
        const res = await fetch(`${API_URL}/announcements/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to delete announcement');
        return res.json();
    },

    async publishAnnouncement(id: string): Promise<any> {
        const token = await getToken();
        const res = await fetch(`${API_URL}/announcements/${id}/publish`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to publish announcement');
        return res.json();
    },

    // Notification methods
    async updatePushToken(token: string): Promise<any> {
        const authToken = await getToken();
        const res = await fetch(`${API_URL}/profile/push-token`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ token }),
        });
        if (!res.ok) throw new Error('Failed to update push token');
        return res.json();
    },

    async getNotifications(): Promise<any[]> {
        const token = await getToken();
        const res = await fetch(`${API_URL}/notifications`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch notifications');
        return res.json();
    },

    async getSports(): Promise<SportMaster[]> {
        const res = await fetch(`${API_URL}/master/sports`);
        if (!res.ok) throw new Error('Failed to fetch sports');
        return res.json();
    },

    async getMatch(id: string): Promise<Match> {
        console.log(`[API] getMatch id=${id}`);
        const token = await getToken();
        const res = await fetch(`${API_URL}/matches/${id}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Fetch failed (${res.status}): ${text}`);
        }
        return res.json();
    },

    async createMatch(data: CreateMatchRequest): Promise<Match> {
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

    async updateMatch(id: string, matchData: any): Promise<Match> {
        const token = await getToken();
        // Ensure quotas/prices are stringified if object
        if (typeof matchData.position_quotas === 'object') matchData.position_quotas = JSON.stringify(matchData.position_quotas);
        if (typeof matchData.position_prices === 'object') matchData.position_prices = JSON.stringify(matchData.position_prices);

        const res = await fetch(`${API_URL}/matches/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(matchData),
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(err || 'Failed to update match');
        }
        return res.json();
    },

    async cancelMatch(id: string, reason: string): Promise<any> {
        const token = await getToken();
        const res = await fetch(`${API_URL}/matches/${id}/cancel`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ reason }),
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(err || 'Failed to cancel match');
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
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to join match');
        }
        return res.json();
    },

    async setPaymentStatus(bookingId: string, isPaid: boolean): Promise<any> {
        const token = await getToken();
        // Assume backend has PUT /bookings/:id/pay
        const res = await fetch(`${API_URL}/bookings/${bookingId}/pay`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ is_paid: isPaid }),
        });
        if (!res.ok) throw new Error('Failed to update payment status');
        return res.json();
    },

    async cancelBooking(bookingId: string): Promise<any> {
        const token = await getToken();
        const res = await fetch(`${API_URL}/bookings/${bookingId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Failed to cancel booking');
        return res.json();
    },

    async getProfile(): Promise<any> {
        const token = await getToken();
        // If no token, we can't get profile.
        // In real app, getToken should handle redirect to login or throw error.
        if (!token || token === 'dummy-token') {
            // For demo, if using dummy token, maybe return null or throw. 
            // But existing logic tries to auto-login.
        }

        const res = await fetch(`${API_URL}/profile`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            throw new Error('Failed to fetch profile');
        }
        return res.json();
    },



    async uploadAvatar(uri: string): Promise<string> {
        const token = await getToken();
        console.log(`[API] Uploading avatar: ${uri}`);

        try {
            const res = await uploadAsync(`${API_URL}/upload`, uri, {
                fieldName: 'avatar',
                httpMethod: 'POST',
                uploadType: FileSystemUploadType.MULTIPART,
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (res.status !== 200) {
                console.error(`[API] Upload failed status: ${res.status} body: ${res.body}`);
                throw new Error(`Failed to upload avatar: ${res.status}`);
            }
            const data = JSON.parse(res.body);
            return data.url;
        } catch (e) {
            console.error(`[API] Upload exception:`, e);
            throw e;
        }
    },

    async updateProfile(data: { name: string; phone: string; avatar?: string }): Promise<any> {
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
            },
        });
        if (!res.ok) throw new Error('Failed to delete account');
        return res.json();
    },

    async register(data: any): Promise<any> {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Registration failed');
        }
        return res.json();
    },

    async updateTeamMember(memberId: string, teamId: string): Promise<any> {
        const token = await getToken();
        const res = await fetch(`${API_URL}/teams/members/${memberId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ team_id: teamId }),
        });
        if (!res.ok) throw new Error('Failed to update team member');
        return res.json();
    },

    async getTeams(matchId: string): Promise<any> {
        const res = await fetch(`${API_URL}/matches/${matchId}/teams`);
        if (!res.ok) throw new Error('Failed to fetch teams');
        return res.json();
    },

    async generateTeams(matchId: string): Promise<any> {
        const token = await getToken();
        const res = await fetch(`${API_URL}/matches/${matchId}/teams/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to generate teams');
        }
        return res.json();
    },

    async login(provider: string = 'google', token: string = 'dummy', email?: string, name?: string, password?: string): Promise<{ token: string, user: any }> {
        const body: any = { provider, token, email, name };
        if (password) {
            body.password = password;
        }

        console.log("SENDING LOGIN:", JSON.stringify(body));

        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const err = await res.json();
            console.error("LOGIN ERROR:", JSON.stringify(err));
            throw new Error(err.error || 'Login failed');
        }
        return res.json();
    }
};

// Simple in-memory token storage for demo
let _token = '';

// localStorage key for web
const TOKEN_STORAGE_KEY = 'jclub_auth_token';
const AUTO_LOGIN_ENABLED = process.env.EXPO_PUBLIC_AUTO_LOGIN === 'true';

function loadTokenFromStorage(): string {
    if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(TOKEN_STORAGE_KEY) || '';
    }
    return '';
}

function saveTokenToStorage(token: string) {
    if (typeof window !== 'undefined' && window.localStorage) {
        if (token) {
            localStorage.setItem(TOKEN_STORAGE_KEY, token);
        } else {
            localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
    }
}

export function setAuthToken(token: string) {
    _token = token;
    saveTokenToStorage(token);
}

async function getToken() {
    // First check memory
    if (_token) return _token;
    
    // Then check localStorage (for web persistence)
    const storedToken = loadTokenFromStorage();
    if (storedToken) {
        _token = storedToken;
        return _token;
    }

    // Auto-login only if explicitly enabled (for development)
    if (AUTO_LOGIN_ENABLED) {
        console.log("[API] Auto-logging in as user1...");
        try {
            const data = await api.login('local', 'dummy', 'robby.juli@gmail.com', 'Robby Juli', '123456');
            setAuthToken(data.token);
            return data.token;
        } catch (e) {
            console.error("[API] Auto-login failed:", e);
            return '';
        }
    }
    
    return '';
}
