import { StyleSheet, ScrollView, TouchableOpacity, Image, View as RNView } from 'react-native';
import { View } from 'react-native';
import { ThemedText as Text } from '@/components/themed-text';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { api } from '@/services/api';

const PRIMARY_GREEN = '#3E8E41';
const LIGHT_BG = '#FAFAFA';

export default function MatchDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { id } = params;

    const [match, setMatch] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        api.getMatch(id as string)
            .then(data => setMatch(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#757575' }}>Loading...</Text>
            </View>
        );
    }

    if (!match) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#757575' }}>Match not found</Text>
            </View>
        );
    }

    const currentPlayers = match.Bookings ? match.Bookings.length : 0;
    const progress = currentPlayers / match.MaxPlayers;

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
                    <Text style={styles.headerTitle}>Detail Group</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Main Info Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                <View style={[styles.statusTag, { backgroundColor: '#E3F2FD', marginRight: 8, paddingHorizontal: 8, paddingVertical: 4 }]}>
                                    <Text style={[styles.statusText, { color: '#1976D2', fontSize: 10 }]}>{match.GameType || 'Activity'}</Text>
                                </View>
                                <View style={styles.statusTag}>
                                    <Text style={styles.statusText}>Open Slot</Text>
                                </View>
                            </View>
                            <Text style={styles.matchTitle}>{match.Title}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="calendar-outline" size={20} color="#757575" />
                        </View>
                        <View>
                            <Text style={styles.infoLabel}>Tanggal & Waktu</Text>
                            <Text style={styles.infoValue}>{formatDate(match.Date)}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="location-outline" size={20} color="#757575" />
                        </View>
                        <View>
                            <Text style={styles.infoLabel}>Lokasi</Text>
                            <Text style={styles.infoValue}>{match.Location}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.iconContainer}>
                            <FontAwesome5 name="dollar-sign" size={18} color="#757575" style={{ marginLeft: 3 }} />
                        </View>
                        <View>
                            <Text style={styles.infoLabel}>Harga per Orang</Text>
                            <Text style={styles.infoValue}>{formatCurrency(match.Price)}</Text>
                        </View>
                    </View>

                    {match.Description && (
                        <View style={{ marginTop: 8, marginBottom: 16 }}>
                            <Text style={styles.infoLabel}>Deskripsi</Text>
                            <Text style={[styles.infoValue, { lineHeight: 20, marginTop: 4 }]}>{match.Description}</Text>
                        </View>
                    )}

                    <View style={styles.divider} />

                    <View style={styles.progressSection}>
                        <View style={styles.progressLabels}>
                            <Text style={styles.progressLabelLeft}>Slot Terisi</Text>
                            <Text style={styles.progressLabelRight}>
                                <Text style={{ color: PRIMARY_GREEN, fontWeight: '700' }}>{currentPlayers}</Text> / {match.MaxPlayers} Pemain
                            </Text>
                        </View>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                        </View>
                    </View>

                    <View style={styles.noteBox}>
                        <Text style={styles.noteText}>💡 Masih ada {match.MaxPlayers - currentPlayers} slot tersisa. Gas join sebelum penuh!</Text>
                    </View>
                </View>

                {/* Organizer Card (Mocked for now as backend doesn't return creator) */}
                <View style={styles.organizerCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>AD</Text>
                    </View>
                    <View style={styles.organizerInfo}>
                        <Text style={styles.organizerLabel}>Organizer</Text>
                        <Text style={styles.organizerName}>Admin User</Text>
                    </View>
                    <View style={styles.hostTag}>
                        <Text style={styles.hostTagText}>Host</Text>
                    </View>
                </View>

                {/* Buttons */}
                <View style={styles.footerButtons}>
                    <TouchableOpacity style={styles.joinButton} onPress={() => router.push(`/match/${id}/reserve`)}>
                        <Text style={styles.joinButtonText}>Join Group</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.listButton} onPress={() => router.push(`/match/${id}/participants`)}>
                        <Text style={styles.listButtonText}>Lihat List Peserta</Text>
                    </TouchableOpacity>
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
});
