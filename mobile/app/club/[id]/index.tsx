import { StyleSheet, View, ScrollView, TouchableOpacity, RefreshControl, Image, FlatList, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemedText as Text } from '@/components/themed-text';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useEffect } from 'react';
import { api, Club, Match } from '@/services/api';

const PRIMARY_GREEN = '#3E8E41';
const TEXT_DARK = '#1C1C1E';

export default function ClubDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [club, setClub] = useState<Club | null>(null);
    const [matches, setMatches] = useState<Match[]>([]);
    const [memberCount, setMemberCount] = useState(0);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [selectedSport, setSelectedSport] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('published');
    const [sports, setSports] = useState<any[]>([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const [isMember, setIsMember] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Fetch Sports
    useEffect(() => {
        const fetchSports = async () => {
            try {
                const data = await api.getSports();
                setSports([{ code: '', name: 'Semua' }, ...data]);
            } catch (e) { console.error(e); }
        };
        fetchSports();
    }, []);

    const fetchData = async () => {
        try {
            // First fetch club and profile to determine ownership
            // We can paralleize but for matches filter we need to know if we are owner (or just try fetching all)
            // Ideally we need to know ownership to set default filter? 
            // Let's fetch basic info first.
            const [clubRes, profileRes] = await Promise.all([
                api.getClub(id as string),
                api.getProfile().catch(() => null)
            ]);

            const clubData = clubRes.club;
            const profileData = profileRes;

            setClub(clubData);
            setMemberCount(clubRes.member_count);
            if (profileData) setCurrentUser(profileData);

            const isOwner = profileData && clubData && profileData.id === clubData.creator_id;

            // Determine effective status
            // If user explicitly selected something, use it. 
            // If not (initial load), set default based on role?
            // But setSelectedStatus is state. We use selectedStatus.
            // Note: IF we want Owner to see ALL by default, we should have initialized selectedStatus='all' conditionally?
            // Hard to do in useState init. We can do it here if needed, but let's stick to 'published' default or what state says.
            // Actually, for Owner we might want to default to 'all'. 
            // Let's keep it simple: Default 'published' for everyone, Owner can toggle.

            const [matchesData, myClubs, announcementsData] = await Promise.all([
                api.getMatches(1, 20, debouncedSearch, 'all', id as string, selectedSport, selectedStatus), // Pass sport and status
                api.getClubs(1, 100, '', 'joined'),
                api.getClubAnnouncements(id as string)
            ]);

            setMatches(matchesData);
            setAnnouncements(announcementsData);

            // Check membership
            const memberCheck = myClubs.some(c => c.id === (id as string));
            setIsMember(memberCheck);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinLeave = async () => {
        if (!club) return;
        setActionLoading(true);
        try {
            if (isMember) {
                await api.leaveClub(club.id);
                setIsMember(false);
                setMemberCount(prev => Math.max(0, prev - 1));
                alert("Berhasil keluar dari club");
            } else {
                await api.joinClub(club.id);
                setIsMember(true);
                setMemberCount(prev => prev + 1);
                alert("Berhasil bergabung ke club");
            }
        } catch (e: any) {
            alert(e.message);
        } finally {
            setActionLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [id, debouncedSearch, selectedSport, selectedStatus]) // Dependency on filters
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const formatDate = (isoString: string) => {
        const d = new Date(isoString);
        return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ` • ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')} WIB`;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'draft': return { bg: '#FFF3E0', color: '#EF6C00', label: 'Draft' };
            case 'cancelled': return { bg: '#FFEBEE', color: '#D32F2F', label: 'Cancelled' };
            default: return { bg: '#E8F5E9', color: PRIMARY_GREEN, label: 'Published' };
        }
    };

    const isOwner = currentUser?.id === club?.creator_id;

    if (loading && !club) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading...</Text>
            </View>
        );
    }

    if (!club) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Club not found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{club?.name}</Text>
                    <TouchableOpacity onPress={handleJoinLeave} disabled={actionLoading} style={{ padding: 8 }}>
                        {actionLoading ? (
                            <Text style={{ color: PRIMARY_GREEN }}>...</Text>
                        ) : isMember ? (
                            <Text style={{ color: '#D32F2F', fontWeight: '600' }}>Leave</Text>
                        ) : (
                            <Text style={{ color: PRIMARY_GREEN, fontWeight: '600' }}>Join</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <FlatList
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY_GREEN} />}
                ListHeaderComponent={() => (
                    <View style={styles.clubInfo}>
                        <View style={styles.logoContainer}>
                            {club?.logo ? (
                                <Image source={{ uri: club.logo }} style={styles.logo} />
                            ) : (
                                <View style={[styles.logo, styles.logoPlaceholder]}>
                                    <Text style={styles.logoInitial}>{club?.name.charAt(0).toUpperCase()}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.clubName}>{club?.name}</Text>
                        <Text style={styles.clubDesc}>{club?.description}</Text>

                        {/* Member Count & Socials */}
                        <View style={styles.statsRow}>
                            <Ionicons name="people" size={16} color="#757575" />
                            <Text style={styles.statsText}>{memberCount} Pengikut</Text>
                        </View>

                        {club?.social_media && (
                            <View style={styles.socialRow}>
                                {JSON.parse(club.social_media || '{}').instagram && (
                                    <View style={styles.socialTag}>
                                        <Ionicons name="logo-instagram" size={16} color="#fff" />
                                        <Text style={styles.socialText}>{JSON.parse(club.social_media).instagram}</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Manage Button (Owner Only) */}
                        {isOwner && (
                            <TouchableOpacity
                                style={styles.manageBtn}
                                onPress={() => router.push(`/club/${club.id}/manage`)}
                            >
                                <Ionicons name="settings-outline" size={16} color="#616161" />
                                <Text style={styles.manageText}>Kelola Club</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.actionBtn,
                                { backgroundColor: isMember ? '#FFEBEE' : PRIMARY_GREEN, marginTop: 12 }
                            ]}
                            onPress={handleJoinLeave}
                            disabled={actionLoading}
                        >
                            <Text style={[styles.actionBtnText, { color: isMember ? '#D32F2F' : '#fff' }]}>
                                {isMember ? 'Keluar Club' : 'Gabung Club'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        {/* Search & Filters */}
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color="#9E9E9E" style={{ marginLeft: 8 }} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Cari jadwal..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholderTextColor="#9E9E9E"
                            />
                        </View>

                        {/* Sport Filter */}
                        <View style={{ width: '100%', marginBottom: 12 }}>
                            <FlatList
                                data={sports}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(item) => item.code || 'all'}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[styles.filterChip, selectedSport === item.code && styles.filterChipActive]}
                                        onPress={() => setSelectedSport(item.code)}
                                    >
                                        <Text style={[styles.filterChipText, selectedSport === item.code && styles.filterChipTextActive]}>
                                            {item.name}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>

                        {/* Status Filter (Owner Only) */}
                        {isOwner && (
                            <View style={{ width: '100%', flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                                {['all', 'published', 'draft'].map(status => (
                                    <TouchableOpacity
                                        key={status}
                                        style={[styles.statusFilterChip, selectedStatus === status && styles.statusFilterChipActive]}
                                        onPress={() => setSelectedStatus(status)}
                                    >
                                        <Text style={[styles.statusFilterText, selectedStatus === status && styles.statusFilterTextActive]}>
                                            {status === 'all' ? 'Semua' : status.charAt(0).toUpperCase() + status.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Jadwal Main</Text>
                            {/* Only show create schedule if admin/creator */}
                            {isOwner && (
                                <TouchableOpacity onPress={() => router.push({ pathname: "/create-group", params: { clubId: club?.id } })}>
                                    <Text style={{ color: PRIMARY_GREEN, fontWeight: '600' }}>+ Buat Jadwal</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}
                data={matches}
                keyExtractor={(item) => item.id}
                renderItem={({ item: match }) => {
                    const badge = getStatusBadge(match.status);
                    return (
                        <TouchableOpacity style={styles.matchCard} onPress={() => router.push(`/match/${match.id}`)}>
                            <View style={styles.matchHeader}>
                                <Text style={styles.matchTitle}>{match.title}</Text>
                                <View style={[styles.statusTag, { backgroundColor: badge.bg }]}>
                                    <Text style={[styles.statusText, { color: badge.color }]}>{badge.label}</Text>
                                </View>
                            </View>
                            {/* Game Type Badge */}
                            <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                                <View style={{ backgroundColor: '#F5F5F5', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                                    <Text style={{ fontSize: 10, color: '#757575', textTransform: 'uppercase' }}>
                                        {sports.find(s => s.code === match.game_type)?.name || match.game_type}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.infoRow}>
                                <Ionicons name="calendar-outline" size={16} color="#757575" />
                                <Text style={styles.infoText}>{formatDate(match.date)}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Ionicons name="location-outline" size={16} color="#757575" />
                                <Text style={styles.infoText}>{match.location}</Text>
                            </View>
                            <View style={styles.footer}>
                                <View style={styles.footerItem}>
                                    <Ionicons name="people-outline" size={16} color="#757575" />
                                    <Text style={styles.footerText}>{match.bookings ? match.bookings.filter((b: any) => b.status === 'confirmed').length : 0}/{match.max_players}</Text>
                                </View>
                                <Text style={styles.price}>Rp {match.price.toLocaleString('id-ID')}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>Belum ada jadwal main.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    manageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        marginTop: 8,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        gap: 4
    },
    manageText: {
        fontSize: 12,
        color: '#616161',
        fontWeight: '600'
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 6
    },
    statsText: {
        fontSize: 14,
        color: '#757575',
        fontWeight: '500'
    },
    socialRow: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 8
    },
    socialTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E1306C', // Instagram color
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6
    },
    socialText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600'
    },
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        backgroundColor: '#fff',
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    clubInfo: {
        padding: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        overflow: 'hidden',
        marginBottom: 12,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    logoPlaceholder: {
        backgroundColor: '#E8F5E9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoInitial: {
        fontSize: 32,
        fontWeight: '700',
        color: PRIMARY_GREEN,
    },
    clubName: {
        fontSize: 20,
        fontWeight: '700',
        color: TEXT_DARK,
        marginBottom: 4,
    },
    clubDesc: {
        fontSize: 14,
        color: '#616161',
        textAlign: 'center',
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#EEEEEE',
        marginVertical: 16,
    },
    sectionHeader: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: TEXT_DARK,
    },
    matchCard: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginBottom: 12,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    matchHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    matchTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: TEXT_DARK,
    },
    statusTag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 6,
    },
    infoText: {
        fontSize: 14,
        color: '#616161',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F5F5F5',
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    footerText: {
        fontSize: 14,
        color: '#757575',
    },
    price: {
        fontSize: 14,
        fontWeight: '700',
        color: PRIMARY_GREEN,
    },
    emptyState: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: '#9E9E9E',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        marginTop: 12,
        marginBottom: 8,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: TEXT_DARK,
    },
    actionBtn: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 120,
    },
    actionBtnText: {
        fontSize: 14,
        fontWeight: '600',
    },
    // Filter Styles
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    filterChipActive: {
        backgroundColor: PRIMARY_GREEN,
        borderColor: PRIMARY_GREEN,
    },
    filterChipText: {
        fontSize: 14,
        color: '#757575',
        fontWeight: '500',
    },
    filterChipTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    statusFilterChip: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    statusFilterChipActive: {
        backgroundColor: '#E8F5E9',
        borderColor: PRIMARY_GREEN,
    },
    statusFilterText: {
        fontSize: 12,
        color: '#757575',
        fontWeight: '500',
    },
    statusFilterTextActive: {
        color: PRIMARY_GREEN,
        fontWeight: '700',
    },
});
