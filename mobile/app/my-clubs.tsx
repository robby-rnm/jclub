import { StyleSheet, View, FlatList, TouchableOpacity, RefreshControl, Image, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemedText as Text } from '@/components/themed-text';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { api, Club } from '@/services/api';

const PRIMARY_GREEN = '#3E8E41';

export default function MyClubsScreen() {
    const router = useRouter();
    const [clubs, setClubs] = useState<Club[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchMyClubs = async () => {
        try {
            // Fetch clubs created by the user
            const data = await api.getClubs(1, 100, '', 'created');
            setClubs(data);
        } catch (e) {
            console.error('Failed to fetch my clubs:', e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchMyClubs();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchMyClubs();
        setRefreshing(false);
    };

    const handleDelete = (club: Club) => {
        Alert.alert(
            'Hapus Club',
            `Apakah Anda yakin ingin menghapus "${club.name}"? Semua data termasuk member dan pengumuman akan dihapus.`,
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.deleteClub(club.id);
                            Alert.alert('Sukses', 'Club berhasil dihapus');
                            fetchMyClubs(); // Refresh list
                        } catch (e: any) {
                            Alert.alert('Error', e.message || 'Gagal menghapus club');
                        }
                    }
                }
            ]
        );
    };

    const renderClubCard = ({ item }: { item: Club }) => (
        <TouchableOpacity
            style={styles.clubCard}
            onPress={() => router.push(`/club/${item.id}`)}
        >
            <View style={styles.clubCardContent}>
                {item.logo ? (
                    <Image source={{ uri: item.logo }} style={styles.clubLogo} />
                ) : (
                    <View style={styles.clubLogoPlaceholder}>
                        <Ionicons name="people" size={24} color="#9E9E9E" />
                    </View>
                )}

                <View style={styles.clubInfo}>
                    <Text style={styles.clubName}>{item.name}</Text>
                    <Text style={styles.clubDesc} numberOfLines={2}>{item.description}</Text>
                </View>
            </View>

            <View style={styles.clubActions}>
                <TouchableOpacity
                    style={styles.editBtn}
                    onPress={(e) => {
                        e.stopPropagation();
                        router.push(`/club/${item.id}/manage`);
                    }}
                >
                    <Ionicons name="create-outline" size={20} color={PRIMARY_GREEN} />
                    <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={(e) => {
                        e.stopPropagation();
                        handleDelete(item);
                    }}
                >
                    <Ionicons name="trash-outline" size={20} color="#D32F2F" />
                    <Text style={styles.deleteBtnText}>Hapus</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="albums-outline" size={64} color="#BDBDBD" />
            <Text style={styles.emptyTitle}>Belum Ada Club</Text>
            <Text style={styles.emptyDesc}>Anda belum membuat club apapun.</Text>
            <TouchableOpacity
                style={styles.createBtn}
                onPress={() => router.push('/club/create')}
            >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.createBtnText}>Buat Club Baru</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Club</Text>
                    <TouchableOpacity onPress={() => router.push('/club/create')} style={styles.addBtn}>
                        <Ionicons name="add" size={24} color={PRIMARY_GREEN} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <FlatList
                data={clubs}
                renderItem={renderClubCard}
                keyExtractor={(item) => item.id}
                contentContainerStyle={clubs.length === 0 ? styles.emptyList : styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY_GREEN} />
                }
                ListEmptyComponent={!loading ? renderEmpty : null}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    backBtn: { padding: 4 },
    addBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },

    list: { padding: 16 },
    emptyList: { flex: 1 },

    clubCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    clubCardContent: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    clubLogo: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 12,
    },
    clubLogoPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#EEEEEE',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    clubInfo: { flex: 1 },
    clubName: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 4 },
    clubDesc: { fontSize: 14, color: '#757575', lineHeight: 20 },

    clubActions: {
        flexDirection: 'row',
        gap: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
    },
    editBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        backgroundColor: '#E8F5E9',
        borderRadius: 8,
        gap: 6,
    },
    editBtnText: { fontSize: 14, fontWeight: '600', color: PRIMARY_GREEN },
    deleteBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        backgroundColor: '#FFEBEE',
        borderRadius: 8,
        gap: 6,
    },
    deleteBtnText: { fontSize: 14, fontWeight: '600', color: '#D32F2F' },

    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1E', marginTop: 16 },
    emptyDesc: { fontSize: 14, color: '#757575', marginTop: 8, textAlign: 'center' },
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: PRIMARY_GREEN,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 24,
        gap: 8,
    },
    createBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
