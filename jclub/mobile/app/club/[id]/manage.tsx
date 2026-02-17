import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemedText as Text } from '@/components/themed-text';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { api } from '@/services/api';

const PRIMARY_GREEN = '#3E8E41';

export default function ManageClubScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    // Club Details
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [logo, setLogo] = useState('');
    const [instagram, setInstagram] = useState('');

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        loadClubData();
    }, [id]);

    const loadClubData = async () => {
        try {
            const data = await api.getClub(id as string);
            // API now returns { club: ..., member_count: ... }
            const club = data.club || data; // Handle both old/new structure if transition
            console.log("Manage Club Data Loaded:", club);

            setName(club.Name || club.name || '');
            setDescription(club.Description || club.description || '');
            setLogo(club.Logo || club.logo || '');

            const socialMediaStr = club.SocialMedia || club.social_media;
            if (socialMediaStr) {
                try {
                    const socials = JSON.parse(socialMediaStr);
                    setInstagram(socials.instagram || '');
                } catch (e) { console.error("Social parse error", e); }
            }
        } catch (e) {
            Alert.alert('Error', 'Gagal memuat data club');
            router.back();
        } finally {
            setInitialLoading(false);
        }
    };

    const handleUpdateClub = async () => {
        setLoading(true);
        try {
            const socialMedia = JSON.stringify({ instagram });
            await api.updateClub(id as string, {
                name,
                description,
                logo,
                social_media: socialMedia
            });
            Alert.alert('Sukses', 'Data club diperbarui');
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleManageAnnouncements = () => {
        router.push(`/club/${id}/announcements`);
    };


    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            uploadLogo(result.assets[0].uri);
        }
    };

    const uploadLogo = async (uri: string) => {
        setLoading(true);
        try {
            const uploadedUrl = await api.uploadClubLogo(uri);
            setLogo(uploadedUrl);

            // Auto-save club with new logo
            const socialMedia = JSON.stringify({ instagram });
            await api.updateClub(id as string, {
                name,
                description,
                logo: uploadedUrl,
                social_media: socialMedia
            });

            Alert.alert('Sukses', 'Logo berhasil diupload dan disimpan');
        } catch (e: any) {
            Alert.alert("Upload Gagal", e.message);
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return <View style={styles.center}><Text>Loading...</Text></View>;

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Kelola Club</Text>
                    <View style={{ width: 24 }} />
                </View>
            </SafeAreaView>

            <ScrollView style={styles.content}>
                {/* Logo Section */}
                <View style={styles.logoSection}>
                    <TouchableOpacity onPress={pickImage} style={styles.logoContainer}>
                        {logo ? (
                            <Image source={{ uri: logo }} style={styles.logo} />
                        ) : (
                            <View style={styles.logoPlaceholder}>
                                <Ionicons name="camera" size={32} color="#9E9E9E" />
                            </View>
                        )}
                        <View style={styles.editBadge}>
                            <Ionicons name="pencil" size={12} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.helperText}>Ketuk untuk ubah logo</Text>
                </View>

                {/* Info Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Info Club</Text>

                    <Text style={styles.label}>Nama Club</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        editable={!loading}
                    />

                    <Text style={styles.label}>Deskripsi</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        multiline numberOfLines={3}
                        editable={!loading}
                    />

                    <Text style={styles.label}>Instagram Username</Text>
                    <View style={styles.inputWithIcon}>
                        <Ionicons name="logo-instagram" size={20} color="#E1306C" style={styles.inputIcon} />
                        <TextInput
                            style={styles.flexInput}
                            value={instagram}
                            onChangeText={setInstagram}
                            placeholder="@username"
                            editable={!loading}
                        />
                    </View>

                    <TouchableOpacity style={styles.updateBtn} onPress={handleUpdateClub} disabled={loading}>
                        <Text style={styles.btnText}>{loading ? 'Menyimpan...' : 'Simpan Perubahan'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Announcement Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pengumuman</Text>


                    <TouchableOpacity style={styles.announcementBtn} onPress={handleManageAnnouncements}>
                        <Ionicons name="megaphone-outline" size={24} color={PRIMARY_GREEN} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.announcementBtnTitle}>Kelola Pengumuman</Text>
                            <Text style={styles.announcementBtnDesc}>Lihat, edit, dan kirim pengumuman</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9E9E9E" />
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#EEEEEE',
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
    content: { flex: 1 },

    logoSection: { alignItems: 'center', padding: 20, backgroundColor: '#fff', marginBottom: 12 },
    logoContainer: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden', position: 'relative' },
    logo: { width: '100%', height: '100%' },
    logoPlaceholder: { width: '100%', height: '100%', backgroundColor: '#EEEEEE', alignItems: 'center', justifyContent: 'center' },
    editBadge: { position: 'absolute', bottom: 0, right: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.6)', height: 24, alignItems: 'center', justifyContent: 'center' },
    helperText: { fontSize: 12, color: '#9E9E9E', marginTop: 8 },

    section: { backgroundColor: '#fff', padding: 20, marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', color: '#616161', marginBottom: 6, marginTop: 4 },
    input: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#EEEEEE', borderRadius: 8, padding: 12, fontSize: 14, color: '#1C1C1E' },
    textArea: { height: 80, textAlignVertical: 'top' },

    inputWithIcon: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#EEEEEE', borderRadius: 8 },
    inputIcon: { marginLeft: 12 },
    flexInput: { flex: 1, padding: 12, fontSize: 14, color: '#1C1C1E' },

    updateBtn: { backgroundColor: PRIMARY_GREEN, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 16 },
    btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

    announcementBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    announcementBtnTitle: { fontSize: 14, fontWeight: '600', color: '#1C1C1E', marginBottom: 4 },
    announcementBtnDesc: { fontSize: 12, color: '#757575' },
});
