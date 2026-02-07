import { StyleSheet, View, FlatList, TouchableOpacity, TextInput, RefreshControl, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemedText as Text } from '@/components/themed-text';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useEffect } from 'react';
import { api, Match } from '@/services/api';

const PRIMARY_GREEN = '#3E8E41';
const TEXT_DARK = '#1C1C1E';

export default function MatchesScreen() {
    const router = useRouter();
    const [matches, setMatches] = useState<Match[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    // Search & Filter
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Sport Filter
    const [sports, setSports] = useState<any[]>([]);
    const [selectedSport, setSelectedSport] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

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

    const fetchMatches = async () => {
        try {
            // Fetch matches (default filter checks date >= today)
            const data = await api.getMatches(1, 20, debouncedSearch, '', '', selectedSport, 'published'); // Force published for public list
            setMatches(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchMatches();
        }, [debouncedSearch, selectedSport])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchMatches();
    };

    const formatDate = (isoString: string) => {
        const d = new Date(isoString);
        return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ` • ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')} WIB`;
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Jadwal Pertandingan</Text>
                </View>

                {/* Search Section */}
                <View style={styles.filterSection}>
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#9E9E9E" style={{ marginLeft: 8 }} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Cari pertandingan..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#9E9E9E"
                        />
                    </View>

                    {/* Sport Filter */}
                    <View style={{ marginTop: 12 }}>
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
                            contentContainerStyle={{ paddingRight: 20 }}
                        />
                    </View>
                </View>
            </SafeAreaView>

            <FlatList
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY_GREEN} />}
                data={matches}
                keyExtractor={(item) => item.id}
                renderItem={({ item: match }) => (
                    <TouchableOpacity style={styles.matchCard} onPress={() => router.push(`/match/${match.id}`)}>
                        <View style={styles.matchHeader}>
                            <Text style={styles.matchTitle}>{match.title}</Text>
                            <View style={[styles.statusTag, { backgroundColor: '#E8F5E9' }]}>
                                <Text style={[styles.statusText, { color: PRIMARY_GREEN }]}>Open</Text>
                            </View>
                        </View>

                        {/* Club Name */}
                        {match.club && (
                            <View style={styles.clubInfo}>
                                <Ionicons name="shield-checkmark-outline" size={14} color={PRIMARY_GREEN} />
                                <Text style={styles.clubName}>{match.club.name}</Text>
                            </View>
                        )}

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
                                <Text style={styles.footerText}>Quota: {match.max_players} Pemain</Text>
                            </View>
                            <Text style={styles.price}>
                                {match.price === 0 ? 'Gratis' : `Rp ${match.price.toLocaleString('id-ID')}`}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={48} color="#BDBDBD" />
                        <Text style={styles.emptyText}>Tidak ada pertandingan ditemukan.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    headerSafeArea: {
        backgroundColor: '#fff',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: TEXT_DARK,
    },
    filterSection: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingBottom: 16,
        paddingTop: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: TEXT_DARK,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    matchCard: {
        backgroundColor: '#fff',
        marginBottom: 12,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
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
    clubInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 4,
    },
    clubName: {
        fontSize: 12,
        fontWeight: '600',
        color: PRIMARY_GREEN,
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
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        gap: 12,
    },
    emptyText: {
        color: '#9E9E9E',
        fontSize: 16,
    },
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
});
