import { StyleSheet, ScrollView, TouchableOpacity, View, FlatList } from 'react-native';
import { ThemedText as Text } from '@/components/themed-text';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { api } from '@/services/api';

const PRIMARY_GREEN = '#3E8E41';
const LIGHT_BG = '#FAFAFA';

interface Participant {
    id: string;
    name: string;
    initials: string;
    isHost?: boolean;
    status: 'Paid' | 'Waitlist';
    avatarColor: string;
}

const COLORS = ['#EC407A', '#FFA726', '#EF5350', '#AB47BC', '#5C6BC0', '#42A5F5', '#26A69A'];

export default function ParticipantListScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [matchDetails, setMatchDetails] = useState<any>(null);

    useEffect(() => {
        if (!params.id) return;
        api.getMatch(params.id as string).then(data => {
            setMatchDetails(data);
            // Map bookings to participants
            const mapped = (data.Bookings || []).map((b: any, index: number) => ({
                id: b.ID,
                name: b.User?.Name || 'Unknown Player',
                initials: (b.User?.Name || 'U').substring(0, 2).toUpperCase(),
                isHost: false, // Backend doesn't link creator to booking yet explicitly, mock for now
                status: (b.IsPaid ? 'Paid' : 'Waitlist') as 'Paid' | 'Waitlist',
                avatarColor: COLORS[index % COLORS.length]
            }));
            setParticipants(mapped);
        }).catch(console.error);
    }, [params.id]);

    const renderItem = ({ item }: { item: Participant }) => (
        <View style={styles.participantCard}>
            <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
                <Text style={styles.avatarText}>{item.initials}</Text>
            </View>

            <View style={styles.infoContainer}>
                <View style={styles.nameRow}>
                    <Text style={styles.nameText}>{item.name}</Text>
                    {item.isHost && (
                        <View style={styles.hostTag}>
                            <Text style={styles.hostTagText}>Host</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.statusTag}>
                <Text style={styles.statusText}>{item.status}</Text>
            </View>
        </View>
    );

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
                    <View>
                        <Text style={styles.headerTitle}>List Peserta</Text>
                        <View style={styles.subtitleRow}>
                            <Ionicons name="people-outline" size={16} color={PRIMARY_GREEN} style={{ marginRight: 4 }} />
                            <Text style={styles.headerSubtitle}>
                                {participants.length} / {matchDetails?.MaxPlayers || '-'} Pemain
                            </Text>
                        </View>
                    </View>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Info Box */}
                <View style={styles.infoBox}>
                    <Text style={styles.infoBoxText}>💡 Pembentukan tim dilakukan saat slot penuh</Text>
                </View>

                {/* List */}
                {participants.length === 0 ? (
                    <Text style={{ textAlign: 'center', color: '#888', marginTop: 20 }}>Belum ada peserta.</Text>
                ) : (
                    participants.map((item) => (
                        <View key={item.id} style={styles.wrapper}>
                            {renderItem({ item })}
                        </View>
                    ))
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
        height: 64, // Slightly taller for subtitle
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
    subtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    headerSubtitle: {
        fontSize: 14,
        color: PRIMARY_GREEN,
        fontWeight: '600',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    infoBox: {
        backgroundColor: '#E3F2FD', // Light blueish
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#BBDEFB',
    },
    infoBoxText: {
        color: '#1565C0',
        fontSize: 14,
        lineHeight: 20,
    },
    wrapper: {
        marginBottom: 12,
    },
    participantCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
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
        marginRight: 8,
    },
    hostTag: {
        backgroundColor: '#E0F2F1',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    hostTagText: {
        color: '#00695C',
        fontSize: 12,
        fontWeight: '600',
    },
    statusTag: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        color: PRIMARY_GREEN,
        fontSize: 12,
        fontWeight: '600',
    },
});
