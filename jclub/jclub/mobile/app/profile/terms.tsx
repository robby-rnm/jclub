import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText as Text } from '@/components/themed-text';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function TermsScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Syarat & Ketentuan</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>1. Pendahuluan</Text>
                <Text style={styles.paragraph}>
                    Selamat datang di aplikasi Reserve Game. Dengan menggunakan aplikasi ini, Anda menyetujui syarat dan ketentuan yang berlaku.
                </Text>

                <Text style={styles.sectionTitle}>2. Penggunaan Aplikasi</Text>
                <Text style={styles.paragraph}>
                    Aplikasi ini digunakan untuk memesan slot bermain futsal/mini soccer. Pengguna wajib memberikan informasi yang benar saat mendaftar.
                </Text>

                <Text style={styles.sectionTitle}>3. Pembayaran & Pembatalan</Text>
                <Text style={styles.paragraph}>
                    Pembayaran dilakukan sesuai dengan metode yang tersedia. Pembatalan slot mungkin dikenakan biaya sesuai kebijakan penyelenggara.
                </Text>

                <Text style={styles.sectionTitle}>4. Perilaku Pengguna</Text>
                <Text style={styles.paragraph}>
                    Pengguna diharapkan menjaga sportivitas dan etika baik di dalam aplikasi maupun saat bermain di lapangan.
                </Text>

                <Text style={styles.sectionTitle}>5. Perubahan Syarat</Text>
                <Text style={styles.paragraph}>
                    Kami berhak mengubah syarat dan ketentuan ini sewaktu-waktu tanpa pemberitahuan sebelumnya.
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
