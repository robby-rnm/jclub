import { StyleSheet, ScrollView, TouchableOpacity, Image, View as RNView, Share, Alert } from 'react-native';
import { View } from 'react-native';
import { ThemedText as Text } from '@/components/themed-text';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { api } from '@/services/api';

const PRIMARY_GREEN = '#3E8E41';
const LIGHT_BG = '#FAFAFA';

export default function MatchDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { id } = params;

    const [match, setMatch] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [teams, setTeams] = useState<any[]>([]);

    const handleShare = async () => {
        if (!match) return;
        try {
            const message = `🎮 Join my match!\n\n${match.title}\n📅 ${new Date(match.date).toLocaleDateString('id-ID')}\n📍 ${match.location}\n💰 Rp ${match.price?.toLocaleString()}\n👥 ${match.bookings?.length || 0}/${match.max_players} players\n\n🔗 Open in JClub: jclub://match/${match.id}\n\nBook now via JClub app!`;
            await Share.share({
                message,
                title: match.title,
            });
        } catch (error: any) {
            Alert.alert('Error', 'Failed to share match');
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (!id) return;

            const loadData = async () => {
                try {
                    console.log("[MatchDetail] Loading for ID:", id);
                    setErrorMsg(null);
                    const [matchData, userData, teamsData] = await Promise.all([
                        api.getMatch(id as string),
                        api.getProfile(),
                        api.getTeams(id as string).catch(() => [])
                    ]);
                    console.log("[MatchDetail] Match Data:", matchData ? "Found" : "Null");
                    setMatch(matchData);
                    setCurrentUser(userData);
                    setTeams(teamsData);
                } catch (err: any) {
                    console.error("[MatchDetail] Error:", err);
                    setErrorMsg(err.message || "Unknown error");
                } finally {
                    setLoading(false);
                }
            };

            loadData();
        }, [id])
    );

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#757575' }}>Loading...</Text>
            </View>
        );
    }

    if (errorMsg || !match) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <Ionicons name="alert-circle-outline" size={48} color="#D32F2F" />
                <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 16 }}>Gagal Memuat Match</Text>
                <Text style={{ color: '#757575', textAlign: 'center', marginTop: 8 }}>
                    ID: {id}
                </Text>
                <Text style={{ color: '#D32F2F', textAlign: 'center', marginTop: 8 }}>
                    Error: {errorMsg || "Match not found"}
                </Text>
                <TouchableOpacity onPress={() => router.replace('/(tabs)/group')} style={{ marginTop: 24, padding: 12, backgroundColor: '#E0E0E0', borderRadius: 8 }}>
                    <Text>Kembali ke List</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const currentPlayers = match.bookings ? match.bookings.length : 0;
    const progress = currentPlayers / match.max_players;

    const userIsJoined = match.bookings?.some((b: any) => b.user_id === currentUser?.id);

    const myTeam = teams.find(t => t.members.some((m: any) => m.user.id === currentUser?.id));
    const opponentTeams = teams.filter(t => t.id !== myTeam?.id);

    // Formatting helpers (can be moved to utils)
    const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;
    const formatDate = (isoString: string) => {
        const d = new Date(isoString);
        return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ` • ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')} WIB`;
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Pertandingan</Text>
                    <TouchableOpacity onPress={handleShare} style={styles.backButton}>
                        <Ionicons name="share-social-outline" size={24} color="#3E8E41" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Main Info Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                <View style={[styles.statusTag, { backgroundColor: '#E3F2FD', marginRight: 8, paddingHorizontal: 8, paddingVertical: 4 }]}>
                                    <Text style={[styles.statusText, { color: '#1976D2', fontSize: 10 }]}>{match.game_type || 'Activity'}</Text>
                                </View>
                                <View style={styles.statusTag}>
                                    <Text style={styles.statusText}>Open Slot</Text>
                                </View>
                            </View>
                            <Text style={styles.matchTitle}>{match.title}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="calendar-outline" size={20} color="#757575" />
                        </View>
                        <View>
                            <Text style={styles.infoLabel}>Tanggal & Waktu</Text>
                            <Text style={styles.infoValue}>{formatDate(match.date)}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="location-outline" size={20} color="#757575" />
                        </View>
                        <View>
                            <Text style={styles.infoLabel}>Lokasi</Text>
                            <Text style={styles.infoValue}>{match.location}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.iconContainer}>
                            <FontAwesome5 name="dollar-sign" size={18} color="#757575" style={{ marginLeft: 3 }} />
                        </View>
                        <View>
                            <Text style={styles.infoLabel}>Harga per Orang</Text>
                            <Text style={styles.infoValue}>{formatCurrency(match.price)}</Text>
                        </View>
                    </View>

                    {match.description && (
                        <View style={{ marginTop: 8, marginBottom: 16 }}>
                            <Text style={styles.infoLabel}>Deskripsi</Text>
                            <Text style={[styles.infoValue, { lineHeight: 20, marginTop: 4 }]}>{match.description}</Text>
                        </View>
                    )}

                    <View style={styles.divider} />

                    <View style={styles.progressSection}>
                        <View style={styles.progressLabels}>
                            <Text style={styles.progressLabelLeft}>Slot Terisi</Text>
                            <Text style={styles.progressLabelRight}>
                                <Text style={{ color: PRIMARY_GREEN, fontWeight: '700' }}>{currentPlayers}</Text> / {match.max_players} Pemain
                            </Text>
                        </View>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                        </View>
                    </View>

                    <View style={styles.noteBox}>
                        <Text style={styles.noteText}>💡 Masih ada {match.max_players - currentPlayers} slot tersisa. Gas join sebelum penuh!</Text>
                    </View>

                    {match.reschedule_reason && (
                        <View style={[styles.noteBox, { backgroundColor: '#FFF3E0', marginTop: 12 }]}>
                            <Text style={[styles.noteText, { color: '#E65100', fontWeight: 'bold' }]}>
                                ⚠️ Rescheduled: {match.reschedule_reason}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Match Stats Card */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>📊 Statistik Match</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{currentPlayers}</Text>
                            <Text style={styles.statLabel}>Joined</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{match.max_players - currentPlayers}</Text>
                            <Text style={styles.statLabel}>Available</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{teams.length}</Text>
                            <Text style={styles.statLabel}>Teams</Text>
                        </View>
                    </View>
                </View>

                {/* Rating Card (Coming Soon) */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>⭐ Rating & Ulasan</Text>
                    <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                            {[1,2,3,4,5].map((star) => (
                                <Ionicons key={star} name="star" size={28} color="#FFD700" />
                            ))}
                        </View>
                        <Text style={{ color: '#757575', fontSize: 14 }}>4.8/5 (120 ulasan)</Text>
                        <Text style={{ color: '#9E9E9E', fontSize: 12, marginTop: 8 }}>Fitur rating akan segera tersedia!</Text>
                    </View>
                </View>

                {/* Team Info Section */}
                {userIsJoined && teams.length > 0 && (
                    <View>
                        {myTeam ? (
                            <>
                                <Text style={styles.sectionTitle}>Tim Kamu</Text>
                                <View style={[styles.teamCard, { borderColor: PRIMARY_GREEN, borderWidth: 1.5 }]}>
                                    <View style={styles.teamHeader}>
                                        <Text style={[styles.teamName, { color: PRIMARY_GREEN }]}>{myTeam.name}</Text>
                                        <Ionicons name="shield-checkmark" size={20} color={PRIMARY_GREEN} />
                                    </View>
                                    {myTeam.members.map((member: any) => (
                                        <View key={member.id} style={styles.playerRow}>
                                            <View style={styles.playerAvatarSmall}>
                                                <Text style={{ fontSize: 10, fontWeight: 'bold' }}>
                                                    {member.user.name.substring(0, 2).toUpperCase()}
                                                </Text>
                                            </View>
                                            <Text style={[styles.playerText, member.user.id === currentUser?.id && { fontWeight: '700', color: PRIMARY_GREEN }]}>
                                                {member.user.name} {member.user.id === currentUser?.id && '(You)'}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </>
                        ) : (
                            <View style={[styles.noteBox, { marginBottom: 20 }]}>
                                <Text style={styles.noteText}>Tim belum dibagikan oleh Host.</Text>
                            </View>
                        )}

                        {opponentTeams.length > 0 && (
                            <>
                                <Text style={styles.sectionTitle}>Lawan</Text>
                                {opponentTeams.map(team => (
                                    <View key={team.id} style={styles.teamCard}>
                                        <View style={styles.teamHeader}>
                                            <Text style={styles.teamName}>{team.name}</Text>
                                        </View>
                                        {team.members.map((member: any) => (
                                            <View key={member.id} style={styles.playerRow}>
                                                <View style={styles.playerAvatarSmall}>
                                                    <Text style={{ fontSize: 10 }}>
                                                        {member.user.name.substring(0, 2).toUpperCase()}
                                                    </Text>
                                                </View>
                                                <Text style={styles.playerText}>{member.user.name}</Text>
                                            </View>
                                        ))}
                                    </View>
                                ))}
                            </>
                        )}
                    </View>
                )}

                {/* Organizer Card */}
                <View style={styles.organizerCard}>
                    <View style={styles.avatar}>
                        {match.club?.logo ? (
                            <Image source={{ uri: match.club.logo }} style={{ width: '100%', height: '100%', borderRadius: 24 }} />
                        ) : (
                            <Text style={styles.avatarText}>{(match.club?.name || match.creator?.name || 'U').substring(0, 2).toUpperCase()}</Text>
                        )}
                    </View>
                    <View style={styles.organizerInfo}>
                        <Text style={styles.organizerLabel}>Organizer</Text>
                        <Text style={styles.organizerName}>{match.club?.name || match.creator?.name || 'Unknown Club'}</Text>
                        <Text style={{ fontSize: 12, color: '#9E9E9E' }}>Admin: {match.creator?.name}</Text>
                    </View>
                    <View style={styles.hostTag}>
                        <Text style={styles.hostTagText}>Host</Text>
                    </View>
                </View>

                {/* Buttons */}
                <View style={styles.footerButtons}>
                    {!userIsJoined ? (
                        <TouchableOpacity style={styles.joinButton} onPress={() => router.push(`/match/${id}/reserve`)}>
                            <Text style={styles.joinButtonText}>Ikut Tanding</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={[styles.joinButton, { backgroundColor: '#E0E0E0', shadowOpacity: 0 }]}>
                            <Text style={[styles.joinButtonText, { color: '#757575' }]}>Kamu Sudah Terdaftar</Text>
                        </View>
                    )}

                    <TouchableOpacity style={styles.listButton} onPress={() => router.push(`/match/${id}/participants`)}>
                        <Text style={styles.listButtonText}>Lihat List Peserta</Text>
                    </TouchableOpacity>

                    {currentUser && match.creator?.id === currentUser.id && (
                        <>
                            <TouchableOpacity style={[styles.listButton, { marginTop: 12, borderColor: '#1976D2' }]} onPress={() => router.push(`/match/${id}/teams`)}>
                                <Text style={[styles.listButtonText, { color: '#1976D2' }]}>Manage Teams (Host)</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.listButton, { marginTop: 12, borderColor: '#F57C00' }]} onPress={() => router.push(`/match/${id}/edit`)}>
                                <Text style={[styles.listButtonText, { color: '#F57C00' }]}>Edit Match (Host)</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: LIGHT_BG,
    },
    headerSafeArea: {
        backgroundColor: '#fff',
    },
    header: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        backgroundColor: '#fff',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    matchTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1C1C1E',
        flex: 1,
        marginRight: 10,
    },
    statusTag: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        color: PRIMARY_GREEN,
        fontSize: 12,
        fontWeight: '600',
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 24,
        marginRight: 12,
        alignItems: 'center',
        marginTop: 2,
    },
    infoLabel: {
        fontSize: 14,
        color: '#9E9E9E',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 14,
        color: '#1C1C1E',
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#F5F5F5',
        marginVertical: 4,
    },
    progressSection: {
        marginTop: 12,
        marginBottom: 16,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressLabelLeft: {
        fontSize: 14,
        color: '#757575',
    },
    progressLabelRight: {
        fontSize: 14,
        color: '#757575',
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#F0F0F0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: PRIMARY_GREEN,
        borderRadius: 4,
    },
    noteBox: {
        backgroundColor: '#FAFAFA',
        padding: 12,
        borderRadius: 12,
    },
    noteText: {
        fontSize: 12,
        color: '#757575',
        lineHeight: 18,
    },
    organizerCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#43A047',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    organizerInfo: {
        flex: 1,
    },
    organizerLabel: {
        fontSize: 12,
        color: '#9E9E9E',
        marginBottom: 2,
    },
    organizerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    hostTag: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    hostTagText: {
        color: '#1976D2',
        fontSize: 12,
        fontWeight: '600',
    },
    footerButtons: {
        gap: 12,
    },
    joinButton: {
        backgroundColor: PRIMARY_GREEN,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#3E8E41',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    joinButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    listButton: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: PRIMARY_GREEN,
    },
    listButtonText: {
        color: PRIMARY_GREEN,
        fontSize: 16,
        fontWeight: '700',
    },
    statItem: {
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        minWidth: 80,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: PRIMARY_GREEN,
    },
    statLabel: {
        fontSize: 12,
        color: '#757575',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 12,
        marginTop: 24,
    },
    teamCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    teamHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
        paddingBottom: 8,
    },
    teamName: {
        fontSize: 16,
        fontWeight: '700',
    },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    playerAvatarSmall: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#E0E0E0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    playerText: {
        fontSize: 14,
        color: '#424242',
    },
});
