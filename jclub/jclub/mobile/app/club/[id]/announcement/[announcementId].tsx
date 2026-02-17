import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemedText as Text } from '@/components/themed-text';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { api } from '@/services/api';

const PRIMARY_GREEN = '#3E8E41';

export default function EditAnnouncementScreen() {
    const { id, announcementId } = useLocalSearchParams(); // Club ID, Announcement ID
    const router = useRouter();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [status, setStatus] = useState<'draft' | 'published'>('draft');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchAnnouncement = async () => {
            try {
                const data = await api.getAnnouncement(announcementId as string);
                setTitle(data.title);
                setContent(data.content);
                setStatus(data.status);
            } catch (e: any) {
                Alert.alert('Error', e.message);
                router.back();
            } finally {
                setLoading(false);
            }
        };
        fetchAnnouncement();
    }, [announcementId]);

    const handleUpdate = async () => {
        if (!title || !content) {
            Alert.alert('Error', 'Judul dan konten harus diisi');
            return;
        }

        setSaving(true);
        try {
            await api.updateAnnouncement(announcementId as string, {
                title,
                content
            });
            Alert.alert('Sukses', 'Pengumuman berhasil diperbarui');
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        if (!title || !content) {
            Alert.alert('Error', 'Judul dan konten harus diisi');
            return;
        }

        Alert.alert(
            'Kirim Pengumuman',
            'Pengumuman akan dikirim ke semua member club. Lanjutkan?',
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Kirim',
                    onPress: async () => {
                        setSaving(true);
                        try {
                            // Update first to ensure we publish最新的 content
                            await api.updateAnnouncement(announcementId as string, {
                                title,
                                content
                            });
                            // Then publish
                            await api.publishAnnouncement(announcementId as string);
                            setStatus('published');
                            Alert.alert('Sukses', 'Pengumuman berhasil dikirim ke semua member');
                        } catch (e: any) {
                            Alert.alert('Error', e.message);
                        } finally {
                            setSaving(false);
                        }
                    }
                }
            ]
        );
    };

    const handleDelete = async () => {
        Alert.alert(
            'Hapus Pengumuman',
            'Apakah Anda yakin ingin menghapus pengumuman ini?',
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: async () => {
                        setSaving(true);
                        try {
                            await api.deleteAnnouncement(announcementId as string);
                            router.back();
                        } catch (e: any) {
                            Alert.alert('Error', e.message);
                        } finally {
                            setSaving(false);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={PRIMARY_GREEN} />
            </View>
        );
    }

    const isPublished = status === 'published';

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Pengumuman</Text>
                    <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                        <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <View style={styles.statusRow}>
                        <Text style={styles.label}>Status:</Text>
                        <View style={[styles.badge, isPublished ? styles.badgePublished : styles.badgeDraft]}>
                            <Text style={[styles.badgeText, isPublished ? styles.badgeTextPublished : styles.badgeTextDraft]}>
                                {isPublished ? 'Published' : 'Draft'}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.label}>Judul Pengumuman</Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Contoh: Jadwal Latihan Minggu Ini"
                        placeholderTextColor="#9E9E9E"
                        editable={!isPublished && !saving}
                    />

                    <Text style={styles.label}>Konten Pengumuman</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={content}
                        onChangeText={setContent}
                        multiline
                        numberOfLines={8}
                        placeholder="Tulis pengumuman untuk member club..."
                        placeholderTextColor="#9E9E9E"
                        textAlignVertical="top"
                        editable={!isPublished && !saving}
                    />

                    {!isPublished && (
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.button, styles.saveBtn]}
                                onPress={handleUpdate}
                                disabled={saving}
                            >
                                <Text style={styles.saveBtnText}>
                                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, styles.publishBtn]}
                                onPress={handlePublish}
                                disabled={saving}
                            >
                                <Ionicons name="send" size={20} color="#fff" />
                                <Text style={styles.publishBtnText}>
                                    {saving ? 'Mengirim...' : 'Kirim'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {isPublished && (
                        <View style={styles.publishedFooter}>
                            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                            <Text style={styles.publishedText}>Pengumuman ini telah terbit dan tidak dapat diubah.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    centered: { justifyContent: 'center', alignItems: 'center' },
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
    deleteBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
    content: { flex: 1 },
    section: { backgroundColor: '#fff', padding: 20, marginTop: 12 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', color: '#616161', marginBottom: 8 },
    input: {
        backgroundColor: '#FAFAFA',
        borderWidth: 1,
        borderColor: '#EEEEEE',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#1C1C1E',
        marginBottom: 16,
    },
    textArea: { height: 200, textAlignVertical: 'top' },
    buttonRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
    },
    saveBtn: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
    saveBtnText: { fontSize: 14, fontWeight: '600', color: '#616161' },
    publishBtn: { backgroundColor: PRIMARY_GREEN },
    publishBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
    badgePublished: { backgroundColor: '#E8F5E9' },
    badgeDraft: { backgroundColor: '#F5F5F5' },
    badgeText: { fontSize: 12, fontWeight: '700' },
    badgeTextPublished: { color: '#2E7D32' },
    badgeTextDraft: { color: '#757575' },
    publishedFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F8E9',
        padding: 16,
        borderRadius: 8,
        marginTop: 24,
        gap: 12
    },
    publishedText: { flex: 1, fontSize: 14, color: '#2E7D32', fontWeight: '500' },
});
