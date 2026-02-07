import { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { ThemedText as Text } from '@/components/themed-text';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { api } from '@/services/api';

const PRIMARY_GREEN = '#3E8E41';

export default function EditProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [avatar, setAvatar] = useState('');
    const [newAvatarUri, setNewAvatarUri] = useState<string | null>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await api.getProfile();
            setName(data.Name || '');
            setPhone(data.Phone || '');
            setEmail(data.Email || '');
            setAvatar(data.Avatar || '');
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setNewAvatarUri(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            let avatarUrl = avatar;
            if (newAvatarUri) {
                // Upload new avatar first
                avatarUrl = await api.uploadAvatar(newAvatarUri);
            }

            await api.updateProfile({ name, phone, avatar: avatarUrl });
            Alert.alert("Success", "Profile updated successfully");
            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const currentAvatar = newAvatarUri || avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=3E8E41&color=fff`;

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
                        <Image source={{ uri: currentAvatar }} style={styles.avatarImage} />
                        <View style={styles.editBadge}>
                            <Ionicons name="camera" size={20} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={pickImage}>
                        <Text style={styles.changePhotoText}>Ubah Foto Profil</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Nama Lengkap</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Nama Lengkap"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Nomor Telepon</Text>
                    <TextInput
                        style={styles.input}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="08xxxxxxxx"
                        keyboardType="phone-pad"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={[styles.input, styles.disabledInput]}
                        value={email}
                        editable={false}
                    />
                    <Text style={styles.helperText}>Email tidak dapat diubah</Text>
                </View>

            </ScrollView>

            <SafeAreaView edges={['bottom']} style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveButton, (loading || saving) && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={loading || saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
                    )}
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FCFCFC',
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
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 12,
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E0E0E0',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: PRIMARY_GREEN,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    changePhotoText: {
        color: PRIMARY_GREEN,
        fontWeight: '600',
        fontSize: 16,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1C1C1E',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#1C1C1E',
    },
    disabledInput: {
        backgroundColor: '#F5F5F5',
        color: '#757575',
    },
    helperText: {
        fontSize: 12,
        color: '#757575',
        marginTop: 6,
    },
    footer: {
        backgroundColor: '#fff',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    saveButton: {
        backgroundColor: PRIMARY_GREEN,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    }
});
