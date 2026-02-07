import { StyleSheet, View, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemedText as Text } from '@/components/themed-text';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';

const PRIMARY_GREEN = '#3E8E41';

interface Announcement {
    id: string;
    title: string;
    content: string;
    status: 'draft' | 'published';
    created_at: string;
}

export default function AnnouncementListScreen() {
    const { id } = useLocalSearchParams(); // Club ID
    const router = useRouter();

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadAnnouncements = useCallback(async () => {
        try {
            const data = await api.getAnnouncementsForOwner(id as string);
            setAnnouncements(data || []);
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id]);

    useEffect(() => {
        loadAnnouncements();
    }, [loadAnnouncements]);

    const onRefresh = () => {
        setRefreshing(true);
        loadAnnouncements();
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const isPublished = status === 'published';
        return (
            <View style={[styles.badge, isPublished ? styles.badgePublished : styles.badgeDraft]}>
                <Text style={[styles.badgeText, isPublished ? styles.badgeTextPublished : styles.badgeTextDraft]}>
                    {isPublished ? 'Published' : 'Draft'}
                </Text>
            </View>
        );
    };

    const renderAnnouncement = ({ item }: { item: Announcement }) => (
        <TouchableOpacity
            style={styles.announcementCard}
            onPress={() => router.push(`/club/${id}/announcement/${item.id}`)}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.announcementTitle} numberOfLines={1}>{item.title}</Text>
                <StatusBadge status={item.status} />
            </View>
            <Text style={styles.announcementContent} numberOfLines={2}>{item.content}</Text>
            <View style={styles.cardFooter}>
                <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</Text>
                <Ionicons name="chevron-forward" size={16} color="#9E9E9E" />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Pengumuman</Text>
                    <TouchableOpacity
                        onPress={() => router.push(`/club/${id}/announcement/create`)}
                        style={styles.addBtn}
                    >
                        <Ionicons name="add" size={24} color={PRIMARY_GREEN} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <FlatList
                data={announcements}
                renderItem={renderAnnouncement}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY_GREEN]} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="megaphone-outline" size={64} color="#E0E0E0" />
                            <Text style={styles.emptyText}>Belum ada pengumuman</Text>
                            <TouchableOpacity
                                style={styles.createBtnEmpty}
                                onPress={() => router.push(`/club/${id}/announcement/create`)}
                            >
                                <Text style={styles.createBtnText}>Buat Pengumuman Baru</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null
                }
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
    listContent: { padding: 16, paddingBottom: 32 },
    announcementCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    announcementTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', flex: 1, marginRight: 8 },
    announcementContent: { fontSize: 14, color: '#616161', lineHeight: 20, marginBottom: 12 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dateText: { fontSize: 12, color: '#9E9E9E' },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    badgePublished: { backgroundColor: '#E8F5E9' },
    badgeDraft: { backgroundColor: '#F5F5F5' },
    badgeText: { fontSize: 10, fontWeight: '700' },
    badgeTextPublished: { color: '#2E7D32' },
    badgeTextDraft: { color: '#757575' },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { fontSize: 16, color: '#9E9E9E', marginTop: 16, marginBottom: 24 },
    createBtnEmpty: { backgroundColor: PRIMARY_GREEN, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
    createBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
