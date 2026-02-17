import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemedText as Text } from '@/components/themed-text';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { api } from '@/services/api';

const PRIMARY_GREEN = '#3E8E41';

export default function CreateAnnouncementScreen() {
    const { id } = useLocalSearchParams(); // Club ID
    const router = useRouter();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSaveDraft = async () => {
        if (!title || !content) {
            Alert.alert('Error', 'Judul dan konten harus diisi');
            return;
        }

        setLoading(true);
        try {
            await api.createAnnouncement(id as string, {
                title,
                content
            });
            Alert.alert('Sukses', 'Draft pengumuman berhasil disimpan', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setLoading(false);
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
                        setLoading(true);
                        try {
                            // Create announcement first
                            const announcement = await api.createAnnouncement(id as string, {
                                title,
                                content
                            });

                            // Then publish it
                            await api.publishAnnouncement(announcement.id);

                            Alert.alert('Sukses', 'Pengumuman berhasil dikirim ke semua member', [
                                { text: 'OK', onPress: () => router.back() }
                            ]);
                        } catch (e: any) {
                            Alert.alert('Error', e.message);
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Buat Pengumuman</Text>
                    <View style={{ width: 24 }} />
                </View>
            </SafeAreaView>

            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.label}>Judul Pengumuman</Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Contoh: Jadwal Latihan Minggu Ini"
                        placeholderTextColor="#9E9E9E"
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
                    />

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.button, styles.draftBtn]}
                            onPress={handleSaveDraft}
                            disabled={loading}
                        >
                            <Ionicons name="document-outline" size={20} color="#616161" />
                            <Text style={styles.draftBtnText}>
                                {loading ? 'Menyimpan...' : 'Simpan Draft'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.publishBtn]}
                            onPress={handlePublish}
                            disabled={loading}
                        >
                            <Ionicons name="send" size={20} color="#fff" />
                            <Text style={styles.publishBtnText}>
                                {loading ? 'Mengirim...' : 'Kirim'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={20} color="#2196F3" />
                        <Text style={styles.infoText}>
                            Draft akan disimpan dan bisa diedit nanti. Kirim akan langsung mengirim notifikasi ke semua member club.
                        </Text>
                    </View>
                </View>
            </ScrollView>
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
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
    content: { flex: 1 },
    section: { backgroundColor: '#fff', padding: 20, marginTop: 12 },
    label: { fontSize: 14, fontWeight: '600', color: '#616161', marginBottom: 8, marginTop: 12 },
    input: {
        backgroundColor: '#FAFAFA',
        borderWidth: 1,
        borderColor: '#EEEEEE',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#1C1C1E',
    },
    textArea: { height: 160, textAlignVertical: 'top' },
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
    draftBtn: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
    draftBtnText: { fontSize: 14, fontWeight: '600', color: '#616161' },
    publishBtn: { backgroundColor: PRIMARY_GREEN },
    publishBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#E3F2FD',
        padding: 12,
        borderRadius: 8,
        marginTop: 16,
        gap: 8,
    },
    infoText: { flex: 1, fontSize: 12, color: '#1976D2', lineHeight: 18 },
});
