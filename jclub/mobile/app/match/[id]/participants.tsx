import { StyleSheet, ScrollView, TouchableOpacity, View, Alert } from 'react-native';
import { ThemedText as Text } from '@/components/themed-text';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { api, Match } from '@/services/api';
import { format, parseISO } from 'date-fns';
import { id as idID } from 'date-fns/locale';

const PRIMARY_GREEN = '#3E8E41';
const LIGHT_BG = '#FAFAFA';
const COLORS = ['#E57373', '#81C784', '#64B5F6', '#FFD54F', '#BA68C8', '#4DB6AC'];

export const renderInitials = (name?: string) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
};

interface Booking {
    id: string;
    user_id: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
    status: 'confirmed' | 'waitlist' | 'cancelled';
    is_paid: boolean;
    waitlist_order: number;
}

export default function ParticipantListScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [matchDetails, setMatchDetails] = useState<Match | null>(null);
    const [confirmed, setConfirmed] = useState<Booking[]>([]);
    const [waitlist, setWaitlist] = useState<Booking[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchMatch(), fetchUser()]);
        setLoading(false);
    };

    const fetchUser = async () => {
        try {
            const user = await api.getProfile();
            setCurrentUser(user);
        } catch (e) {
            console.error("Failed to load user", e);
        }
    };

    const fetchMatch = async () => {
        try {
            const data = await api.getMatch(params.id as string);
            setMatchDetails(data);
            processBookings(data.bookings || []);
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Gagal memuat data match");
        }
    };

    const processBookings = (bookings: any[]) => {
        const conf: Booking[] = [];
        const wait: Booking[] = [];

        bookings.forEach((b: any) => {
            // Map backend/API response to local Booking interface if needed
            // Handle both Lowercase (new) and PascalCase (old) from backend to be safe
            const status = b.status || b.Status;

            if (status === 'confirmed') {
                conf.push(b);
            } else if (status === 'waitlist') {
                wait.push(b);
            }
        });

        // Ensure waitlist is sorted
        wait.sort((a, b) => a.waitlist_order - b.waitlist_order);
        setConfirmed(conf);
        setWaitlist(wait);
    };

    // Owner logic
    const creatorId = matchDetails?.creator?.id || matchDetails?.creator_id;
    const isOwner = creatorId && currentUser?.id === creatorId;
    const canManage = isOwner;

    const togglePayment = async (booking: Booking) => {
        if (!canManage) return;

        try {
            const newStatus = !booking.is_paid;
            await api.setPaymentStatus(booking.id, newStatus);
            // Optimistic update
            const updated = confirmed.map(b => b.id === booking.id ? { ...b, is_paid: newStatus } : b);
            setConfirmed(updated);
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Gagal update status pembayaran");
        }
    };

    const cancelBooking = async (booking: Booking) => {
        const isSelf = booking.user?.id === currentUser?.id;
        const action = isSelf ? "Keluar" : "Hapus";

        Alert.alert(
            `Konfirmasi ${action}`,
            `Yakin ingin ${isSelf ? "keluar dari group" : "menghapus pemain ini"}?`,
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Ya",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await api.cancelBooking(booking.id);
                            fetchMatch(); // Refresh data from server to be safe
                        } catch (e) {
                            Alert.alert("Gagal", "Gagal membatalkan booking");
                        }
                    }
                }
            ]
        );
    };

    const renderItem = (item: Booking, index: number, isWaitlist: boolean) => {
        const itemUserId = item.user_id || item.user?.id;
        const currentUserId = currentUser?.id;
        const isSelf = currentUserId && itemUserId === currentUserId;

        return (
            <View key={item.id} style={styles.participantCard}>
                <View style={[styles.avatar, { backgroundColor: COLORS[index % COLORS.length] }]}>
                    <Text style={styles.avatarText}>{renderInitials(item.user?.name)}</Text>
                </View>

                <View style={styles.infoContainer}>
                    <View style={styles.nameRow}>
                        <Text style={styles.nameText}>{item.user?.name || 'Unknown User'}</Text>
                        {isSelf && (
                            <View style={{ marginLeft: 6, backgroundColor: '#E0E0E0', paddingHorizontal: 6, borderRadius: 4 }}>
                                <Text style={{ fontSize: 10, color: '#616161' }}>You</Text>
                            </View>
                        )}
                        {(matchDetails?.creator_id === itemUserId) && (
                            <View style={styles.hostTag}>
                                <Text style={styles.hostTagText}>Host</Text>
                            </View>
                        )}
                    </View>
                    {!isWaitlist && (
                        <Text style={styles.emailText}>{item.user?.email}</Text>
                    )}
                    {isWaitlist && (
                        <Text style={[styles.emailText, { color: '#E65100' }]}>Antrian #{item.waitlist_order}</Text>
                    )}
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    {!isWaitlist && (
                        <TouchableOpacity
                            onPress={() => togglePayment(item)}
                            disabled={!canManage}
                            style={[
                                styles.statusTag,
                                { backgroundColor: item.is_paid ? '#E8F5E9' : '#FFEBEE' }
                            ]}
                        >
                            <Text style={[
                                styles.statusText,
                                { color: item.is_paid ? '#2E7D32' : '#C62828' }
                            ]}>
                                {item.is_paid ? "Lunas" : "Belum Bayar"}
                            </Text>
                            {canManage && (
                                <Ionicons name="pencil-outline" size={12} color={item.is_paid ? '#2E7D32' : '#C62828'} style={{ marginLeft: 4 }} />
                            )}
                        </TouchableOpacity>
                    )}

                    {canManage && (
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => cancelBooking(item)}
                        >
                            <Ionicons name="trash-outline" size={20} color="#E53935" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
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
                    <Text style={styles.headerTitle}>Daftar Peserta</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Confirmed Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Pemain ({confirmed.length})</Text>
                    <Text style={styles.sectionSubtitle}>Slot: {matchDetails?.max_players || 0}</Text>
                </View>

                {confirmed.length === 0 ? (
                    <Text style={styles.emptyText}>Belum ada pemain terdaftar.</Text>
                ) : (
                    confirmed.map((item, index) => renderItem(item, index, false))
                )}

                {/* Waitlist Section */}
                {waitlist.length > 0 && (
                    <>
                        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                            <Text style={styles.sectionTitle}>Waiting List ({waitlist.length})</Text>
                            <View style={styles.waitlistBadge}>
                                <Text style={styles.waitlistBadgeText}>Antrian</Text>
                            </View>
                        </View>
                        <View style={styles.infoBox}>
                            <Text style={styles.infoBoxText}>💡 Jika ada pemain batal, urutan pertama otomatis masuk.</Text>
                        </View>
                        {waitlist.map((item, index) => renderItem(item, index, true))}
                    </>
                )}

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
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#757575',
    },
    emptyText: {
        textAlign: 'center',
        color: '#9E9E9E',
        marginVertical: 20,
    },
    participantCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
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
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    avatarText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    infoContainer: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    nameText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1C1C1E',
        marginBottom: 2,
    },
    emailText: {
        fontSize: 12,
        color: '#757575',
    },
    statusTag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionBtn: {
        padding: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    waitlistBadge: {
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    waitlistBadgeText: {
        color: '#E65100',
        fontSize: 12,
        fontWeight: '700',
    },
    infoBox: {
        backgroundColor: '#FFF3E0',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FFE0B2',
    },
    infoBoxText: {
        color: '#E65100',
        fontSize: 12,
        lineHeight: 18,
    },
    hostTag: {
        marginLeft: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#E1F5FE',
        borderRadius: 8,
    },
    hostTagText: {
        color: '#0277BD',
        fontSize: 10,
        fontWeight: '700',
    },
});
