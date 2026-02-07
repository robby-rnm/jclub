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

    useFocusEffect(
        useCallback(() => {
            loadProfile();
        }, [])
    );

    const loadProfile = async () => {
        try {
            const data = await api.getProfile();
            setUser(data);
        } catch (e) {
            console.error(e);
            // If failed, maybe token expired or network error
        } finally {
            setLoading(false);
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
    const avatarUri = user.Avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.Name)}&background=3E8E41&color=fff`;
    const memberDate = user.CreatedAt ? new Date(user.CreatedAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : 'Unknown';

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header / Profile Card */}
            <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                <View style={styles.headerContent}>
                    <View style={styles.avatarContainer}>
                        <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                    </View>
                    <Text style={styles.userName}>{user.Name}</Text>
                    <Text style={styles.userEmail}>{user.Email}</Text>
                    <View style={styles.memberTag}>
                        <Text style={styles.memberTagText}>Member sejak {memberDate}</Text>
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Account Settings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Akun Saya</Text>
                    <View style={styles.menuCard}>
                        <MenuRow icon="person-outline" label="Edit Profile" onPress={() => router.push('/profile/edit')} />
                        <View style={styles.divider} />
                        <MenuRow icon="notifications-outline" label="Notifikasi" onPress={() => { }} />
                        <View style={styles.divider} />
                        <MenuRow icon="card-outline" label="Metode Pembayaran" onPress={() => { }} />
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
