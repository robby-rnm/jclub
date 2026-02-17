import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemedText as Text } from '@/components/themed-text';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { api } from '@/services/api';

const PRIMARY_GREEN = '#3E8E41';

export default function CreateClubScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Nama club harus diisi');
            return;
        }

        setLoading(true);
        try {
            await api.createClub({ name, description });
            Alert.alert('Sukses', 'Club berhasil dibuat', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Gagal membuat club');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Buat Club Baru</Text>
                    <View style={{ width: 24 }} />
                </View>
            </SafeAreaView>

            <ScrollView style={styles.content}>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Nama Club</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Contoh: Jakarta Football Club"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Deskripsi</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Deskripsi singkat tentang club..."
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                    />
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity 
                    style={[styles.submitBtn, loading && styles.disabledBtn]} 
                    onPress={handleCreate}
                    disabled={loading}
                >
                    <Text style={styles.submitBtnText}>{loading ? 'Memproses...' : 'Buat Club'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    content: {
        flex: 1,
        padding: 20,
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
        backgroundColor: '#FAFAFA',
        borderWidth: 1,
        borderColor: '#EEEEEE',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: '#1C1C1E',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
    },
    submitBtn: {
        backgroundColor: PRIMARY_GREEN,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    disabledBtn: {
        backgroundColor: '#A5D6A7',
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
