import { StyleSheet, ScrollView, TouchableOpacity, View, Image, Alert, ActivityIndicator } from 'react-native';
import { ThemedText as Text } from '@/components/themed-text';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSession } from '../../ctx';
import { api } from '@/services/api';
import { useState, useCallback } from 'react';

const PRIMARY_GREEN = '#3E8E41';
const DANGER_RED = '#D32F2F';

export default function ProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { signOut, session } = useSession();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [userStats, setUserStats] = useState<any>(null);
    const [achievements, setAchievements] = useState<any[]>([]);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);

    useFocusEffect(
        useCallback(() => {
            loadProfile();
            loadStats();
        }, [])
    );

    const loadProfile = async () => {
        try {
            const data = await api.getProfile();
            setUser(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const [statsData, achievementsData, leaderboardData] = await Promise.all([
                api.getUserStats().catch(() => null),
                api.getAchievements().catch(() => []),
                api.getLeaderboard().catch(() => [])
            ]);
            if (statsData) setUserStats(statsData);
            if (achievementsData) setAchievements(achievementsData);
            if (leaderboardData) setLeaderboard(leaderboardData);
        } catch (e) {
            console.error("Failed to load stats:", e);
        }
    };

    const handleSignOut = () => {
        Alert.alert(
            "Sign Out",
            "Apakah anda yakin ingin keluar?",
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Keluar",
                    style: "destructive",
                    onPress: () => {
                        signOut();
                        router.replace('/login');
                    }
                }
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Hapus Akun",
            "Tindakan ini tidak dapat dibatalkan. Semua data anda akan hilang.",
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Hapus Akun",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await api.deleteAccount();
                            signOut();
                            router.replace('/login');
                        } catch (e) {
                            Alert.alert('Error', 'Gagal menghapus akun');
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={PRIMARY_GREEN} />
            </View>
        );
    }

    if (!user) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text>Gagal memuat profil</Text>
                <TouchableOpacity onPress={loadProfile} style={{ marginTop: 16 }}>
                    <Text style={{ color: PRIMARY_GREEN }}>Coba Lagi</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Fallbacks
    const avatarUri = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3E8E41&color=fff`;
    const memberDate = user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : 'Unknown';

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header / Profile Card */}
            <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                <View style={styles.headerContent}>
                    <View style={styles.avatarContainer}>
                        <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                    </View>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <View style={styles.memberTag}>
                        <Text style={styles.memberTagText}>Member sejak {memberDate}</Text>
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* My Stats Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📊 Statistik Saya</Text>
                    <View style={styles.menuCard}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 }}>
                            <View style={{ alignItems: 'center' }}>
                                <Text style={{ fontSize: 24, fontWeight: 'bold', color: PRIMARY_GREEN }}>
                                    {userStats?.matches_created || 0}
                                </Text>
                                <Text style={{ fontSize: 12, color: '#757575' }}>Match Dibuat</Text>
                            </View>
                            <View style={{ alignItems: 'center' }}>
                                <Text style={{ fontSize: 24, fontWeight: 'bold', color: PRIMARY_GREEN }}>
                                    {userStats?.matches_joined || 0}
                                </Text>
                                <Text style={{ fontSize: 12, color: '#757575' }}>Match Diikuti</Text>
                            </View>
                            <View style={{ alignItems: 'center' }}>
                                <Text style={{ fontSize: 24, fontWeight: 'bold', color: PRIMARY_GREEN }}>
                                    {userStats?.clubs_count || 0}
                                </Text>
                                <Text style={{ fontSize: 12, color: '#757575' }}>Club</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Achievements Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🎖️ Achievement</Text>
                    <View style={styles.menuCard}>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingVertical: 12 }}>
                            {achievements.length > 0 ? achievements.map((achievement: any) => (
                                <View key={achievement.id} style={{ alignItems: 'center', margin: 8, opacity: achievement.unlocked ? 1 : 0.4 }}>
                                    <View style={{ 
                                        width: 50, height: 50, borderRadius: 25, 
                                        backgroundColor: achievement.unlocked ? '#FFD700' : '#E0E0E0', 
                                        alignItems: 'center', justifyContent: 'center' 
                                    }}>
                                        <Text style={{ fontSize: 24 }}>{achievement.icon}</Text>
                                    </View>
                                    <Text style={{ fontSize: 10, marginTop: 4, textAlign: 'center' }}>{achievement.name}</Text>
                                </View>
                            )) : (
                                <>
                                    <View style={{ alignItems: 'center', margin: 8, opacity: 0.4 }}>
                                        <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center' }}>
                                            <Text style={{ fontSize: 24 }}>🏆</Text>
                                        </View>
                                        <Text style={{ fontSize: 10, marginTop: 4 }}>Loading...</Text>
                                    </View>
                                </>
                            )}
                        </View>
                    </View>
                </View>

                {/* Leaderboard Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🏆 Leaderboard</Text>
                    <View style={styles.menuCard}>
                        {leaderboard.length > 0 ? leaderboard.map((player: any, index: number) => (
                            <View key={player.rank}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
                                    <Text style={{ fontSize: 16, fontWeight: 'bold', width: 30 }}>
                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${player.rank}`}
                                    </Text>
                                    <Text style={{ flex: 1, fontSize: 14 }}>{player.name}</Text>
                                    <Text style={{ fontSize: 14, color: '#757575' }}>{player.matches} matches</Text>
                                </View>
                                {index < leaderboard.length - 1 && <View style={{ borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }} />}
                            </View>
                        )) : (
                            <>
                                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
                                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#FFD700', width: 30 }}>🥇</Text>
                                    <Text style={{ flex: 1, fontSize: 14 }}>Loading...</Text>
                                </View>
                            </>
                        )}
                    </View>
                </View>

                {/* Social Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>👥 Sosial</Text>
                    <View style={styles.menuCard}>
                        <MenuRow icon="person-add-outline" label="Tambah Teman" onPress={() => { Alert.alert('Coming Soon', 'Fitur add friend akan segera tersedia!') }} />
                        <View style={styles.divider} />
                        <MenuRow icon="people-outline" label="Daftar Teman" onPress={() => { Alert.alert('Coming Soon', 'Fitur friends list akan segera tersedia!') }} />
                        <View style={styles.divider} />
                        <MenuRow icon="chatbubbles-outline" label="Pesan & Chat" onPress={() => { Alert.alert('Coming Soon', 'Fitur chat akan segera tersedia!') }} />
                    </View>
                </View>

                {/* Account Settings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Akun Saya</Text>
                    <View style={styles.menuCard}>
                        <MenuRow icon="chatbubbles-outline" label="Pesan & Chat" onPress={() => { Alert.alert('Coming Soon', 'Fitur chat akan segera tersedia!') }} />
                        <View style={styles.divider} />
                        <MenuRow icon="person-outline" label="Edit Profile" onPress={() => router.push('/profile/edit')} />
                        <View style={styles.divider} />
                        <MenuRow icon="notifications-outline" label="Notifikasi" onPress={() => { }} />
                        <View style={styles.divider} />
                        <MenuRow icon="card-outline" label="Metode Pembayaran" onPress={() => { Alert.alert('Coming Soon', 'Fitur payment akan segera tersedia!') }} />
                    </View>
                </View>

                {/* General Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Umum</Text>
                    <View style={styles.menuCard}>
                        <MenuRow icon="help-circle-outline" label="Bantuan & Support" onPress={() => { }} />
                        <View style={styles.divider} />
                        <MenuRow icon="document-text-outline" label="Syarat & Ketentuan" onPress={() => router.push('/profile/terms')} />
                        <View style={styles.divider} />
                        <MenuRow icon="lock-closed-outline" label="Privacy Policy" onPress={() => router.push('/profile/privacy')} />
                    </View>
                </View>

                {/* Danger Zone */}
                <View style={styles.section}>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
                        <Ionicons name="log-out-outline" size={20} color={DANGER_RED} />
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
                        <Text style={styles.deleteText}>Hapus Akun</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.versionText}>Version 1.0.0</Text>

            </ScrollView>
        </View>
    );
}

function MenuRow({ icon, label, onPress }: { icon: any, label: string, onPress: () => void }) {
    return (
        <TouchableOpacity style={styles.menuRow} onPress={onPress}>
            <View style={styles.menuRowLeft}>
                <Ionicons name={icon} size={22} color="#555" />
                <Text style={styles.menuLabel}>{label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FCFCFC',
    },
    header: {
        backgroundColor: PRIMARY_GREEN,
        paddingBottom: 40,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        alignItems: 'center',
    },
    headerContent: {
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#FFA000',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    userName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 12,
    },
    memberTag: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    memberTagText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    scrollContent: {
        padding: 20,
        paddingTop: 0, // Header overlap handled by margin
        marginTop: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 12,
        marginLeft: 4,
    },
    menuCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingVertical: 4,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F5F5F5',
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
    },
    menuRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    menuLabel: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginLeft: 38, // indent to align with text
    },
    logoutButton: {
        backgroundColor: '#FFEBEE',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        marginBottom: 16,
    },
    logoutText: {
        color: DANGER_RED,
        fontWeight: '700',
        fontSize: 16,
        marginLeft: 8,
    },
    deleteButton: {
        alignItems: 'center',
        padding: 8,
    },
    deleteText: {
        color: '#757575',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    versionText: {
        textAlign: 'center',
        color: '#9E9E9E',
        fontSize: 12,
        marginBottom: 40,
    }
});
