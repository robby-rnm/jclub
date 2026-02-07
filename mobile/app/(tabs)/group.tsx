import { StyleSheet, ScrollView, TouchableOpacity, View, RefreshControl, TextInput, FlatList, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemedText as Text } from '@/components/themed-text';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useEffect } from 'react';
import { api, Club } from '@/services/api';

const PRIMARY_GREEN = '#3E8E41';
const TEXT_DARK = '#1C1C1E';

export default function ClubScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const filterType = (params.filter as string) || '';

    const insets = useSafeAreaInsets();
    const [clubs, setClubs] = useState<Club[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // Filter
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Filter Change Effect
    useEffect(() => {
        setPage(1);
        setHasMore(true);
        fetchClubs(1, false);
    }, [debouncedSearch, filterType]);

    const fetchClubs = async (pageNum: number, shouldAppend: boolean = false) => {
        try {
            if (pageNum === 1) setLoadingMore(false);

            const [clubsData, profileData] = await Promise.all([
                api.getClubs(pageNum, 10, debouncedSearch, filterType),
                pageNum === 1 ? api.getProfile().catch(() => null) : Promise.resolve(null)
            ]);

            if (profileData) setCurrentUser(profileData);

            if (clubsData.length < 10) setHasMore(false);
            else setHasMore(true);

            if (shouldAppend) {
                setClubs(prev => {
                    const existingIds = new Set(prev.map(c => c.id));
                    const newClubs = clubsData.filter(c => !existingIds.has(c.id));
                    return [...prev, ...newClubs];
                });
            } else {
                setClubs(clubsData);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingMore(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (clubs.length === 0) {
                fetchClubs(1, false);
            }
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        setPage(1);
        setHasMore(true);
        await fetchClubs(1, false);
        setRefreshing(false);
    };

    const loadMore = () => {
        if (!hasMore || loadingMore || refreshing) return;
        setLoadingMore(true);
        const nextPage = page + 1;
        setPage(nextPage);
        fetchClubs(nextPage, true);
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{filterType === 'created' ? 'Club Kelolaan' : 'Clubs'}</Text>
                    <TouchableOpacity
                        style={styles.createBtnHeader}
                        onPress={() => router.push('/club/create')}
                    >
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Search Section */}
                <View style={styles.filterSection}>
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#9E9E9E" style={{ marginLeft: 8 }} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Cari club..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#9E9E9E"
                        />
                    </View>
                </View>
            </SafeAreaView>

            <FlatList
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY_GREEN} />}
                data={clubs}
                keyExtractor={(item) => item.id}
                renderItem={({ item: club }) => (
                    <TouchableOpacity style={styles.clubCard} onPress={() => router.push(`/club/${club.id}`)}>
                        <View style={styles.cardHeader}>
                            {/* Logo Placeholder */}
                            <View style={styles.logoContainer}>
                                {club.logo ? (
                                    <Image source={{ uri: club.logo }} style={styles.logo} />
                                ) : (
                                    <View style={[styles.logo, styles.logoPlaceholder]}>
                                        <Text style={styles.logoInitial}>{club.name.charAt(0).toUpperCase()}</Text>
                                    </View>
                                )}
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.clubName}>{club.name}</Text>
                                <Text style={styles.clubDesc} numberOfLines={2}>{club.description || 'No description'}</Text>
                                <View style={styles.metaRow}>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="person-outline" size={12} color="#9E9E9E" />
                                        <Text style={styles.metaText}>{club.creator?.name || 'Unknown'}</Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="people-outline" size={12} color="#9E9E9E" />
                                        <Text style={styles.metaText}>{(club.member_count || 0) + ' Pengikut'}</Text>
                                    </View>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={48} color="#BDBDBD" />
                        <Text style={styles.emptyText}>Tidak ada club ditemukan.</Text>
                        <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/club/create')}>
                            <Text style={styles.createBtnText}>Buat Club Baru</Text>
                        </TouchableOpacity>
                    </View>
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                    loadingMore ? (
                        <View style={{ padding: 20 }}>
                            <Text style={{ textAlign: 'center', color: '#999' }}>Loading more...</Text>
                        </View>
                    ) : null
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    createBtnHeader: {
        backgroundColor: PRIMARY_GREEN,
        borderRadius: 20,
        padding: 4,
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
    },
    clubCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
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
        fontSize: 24,
        fontWeight: '700',
        color: PRIMARY_GREEN,
    },
    clubName: {
        fontSize: 16,
        fontWeight: '700',
        color: TEXT_DARK,
        marginBottom: 4,
    },
    clubDesc: {
        fontSize: 13,
        color: '#757575',
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 4,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: '#9E9E9E',
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
    createBtn: {
        marginTop: 12,
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: PRIMARY_GREEN,
        borderRadius: 20,
    },
    createBtnText: {
        color: '#fff',
        fontWeight: '600',
    },
});
