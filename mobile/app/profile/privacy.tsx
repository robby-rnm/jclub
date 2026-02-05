import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText as Text } from '@/components/themed-text';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function PrivacyScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Privacy Policy</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>1. Informasi yang Kami Kumpulkan</Text>
                <Text style={styles.paragraph}>
                    Kami mengumpulkan informasi pribadi seperti nama, email, dan nomor telepon saat Anda mendaftar untuk keperluan layanan.
                </Text>

                <Text style={styles.sectionTitle}>2. Penggunaan Informasi</Text>
                <Text style={styles.paragraph}>
                    Informasi digunakan untuk memverifikasi akun, memproses pemesanan, dan meningkatkan pengalaman pengguna di aplikasi kami.
                </Text>

                <Text style={styles.sectionTitle}>3. Keamanan Data</Text>
                <Text style={styles.paragraph}>
                    Kami berkomitmen menjaga keamanan data Anda dan tidak akan membagikannya kepada pihak ketiga tanpa persetujuan, kecuali diwajibkan oleh hukum.
                </Text>

                <Text style={styles.sectionTitle}>4. Hak Pengguna</Text>
                <Text style={styles.paragraph}>
                    Anda berhak untuk mengakses, mengubah, atau menghapus data pribadi Anda melalui pengaturan akun di aplikasi.
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
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
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1C1C1E',
        marginTop: 16,
        marginBottom: 8,
    },
    paragraph: {
        fontSize: 14,
        color: '#616161',
        lineHeight: 22,
        textAlign: 'justify',
    },
});
