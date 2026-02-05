import { StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { ThemedText as Text } from '@/components/themed-text';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { api } from '@/services/api';

const PRIMARY_GREEN = '#3E8E41';
const LIGHT_BG = '#FAFAFA';

export default function ReserveSlotScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [slotCount, setSlotCount] = useState(1);
    const PRICE_PER_SLOT = 50000;

    // Timer logic
    const [timeLeft, setTimeLeft] = useState(299); // 4:59 in seconds

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleIncrement = () => {
        if (slotCount < 5) setSlotCount(prev => prev + 1);
    };

    const handleDecrement = () => {
        if (slotCount > 1) setSlotCount(prev => prev - 1);
    };

    const formatCurrency = (amount: number) => {
        return `Rp ${amount.toLocaleString('id-ID').replace(',', '.')}`;
    };

    const handlePay = async () => {
        // Logic for "Reserve/Join"
        // In real app, this might trigger Payment Gateway.
        // For now, we hit the Join Match API.
        try {
            // Loop for slot count or adjust API to accept slot count? 
            // Backend JoinBooking is usually single user. 
            // If "Reserve 5 slots", we might need to create 5 bookings or a group booking.
            // For simplicity now, let's just book 1 for the current user and ignore slotCount > 1 warning,
            // OR assume backend handles quantity (it doesn't yet).
            // Let's just book 1 for demo purposes or show valid error if slot > 1 not supported yet.

            if (slotCount > 1) {
                alert("Currently restricted to 1 slot per user for beta.");
                return;
            }

            await api.joinMatch(params.id as string);
            alert("Pembayaran Berhasil! Kamu telah terdaftar.");
            router.replace(`/match/${params.id}`);
        } catch (e) {
            console.error(e);
            alert("Gagal melakukan booking. " + e.message);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Reserve Slot</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Timer Alert */}
                <View style={styles.timerCard}>
                    <Ionicons name="time-outline" size={24} color="#D32F2F" style={{ marginRight: 12 }} />
                    <View>
                        <Text style={styles.timerLabel}>Selesaikan reservasi dalam</Text>
                        <Text style={styles.timerValue}>{formatTime(timeLeft)}</Text>
                    </View>
                </View>

                {/* Match Info */}
                <View style={styles.card}>
                    <Text style={styles.matchTitle}>Mini Soccer Jumat Fun</Text>
                    <Text style={styles.matchDate}>Jumat, 5 Februari 2026 • 18:00 WIB</Text>
                    <Text style={styles.matchLocation}>Lapangan GBK, Jakarta Pusat</Text>
                </View>

                {/* Slot Selection */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Pilih Jumlah Slot</Text>

                    <View style={styles.counterContainer}>
                        <TouchableOpacity
                            style={[styles.counterBtn, slotCount <= 1 && styles.counterBtnDisabled]}
                            onPress={handleDecrement}
                            disabled={slotCount <= 1}
                        >
                            <MaterialIcons name="remove" size={24} color={slotCount <= 1 ? '#BDBDBD' : '#757575'} />
                        </TouchableOpacity>

                        <View style={styles.countDisplay}>
                            <Text style={styles.countText}>{slotCount}</Text>
                            <Text style={styles.slotLabel}>Slot</Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.counterBtn, styles.counterBtnActive]}
                            onPress={handleIncrement}
                            disabled={slotCount >= 5}
                        >
                            <MaterialIcons name="add" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.maxSlotText}>Maksimal 5 slot per orang</Text>
                </View>

                {/* Price Breakdown */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Rincian Harga</Text>

                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Harga per slot</Text>
                        <Text style={styles.priceValue}>{formatCurrency(PRICE_PER_SLOT)}</Text>
                    </View>

                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Jumlah slot</Text>
                        <Text style={styles.priceValue}>{slotCount}x</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.priceRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>{formatCurrency(PRICE_PER_SLOT * slotCount)}</Text>
                    </View>
                </View>

            </ScrollView>

            {/* Footer Button */}
            <SafeAreaView edges={['bottom']} style={styles.footer}>
                <TouchableOpacity style={styles.payButton} onPress={handlePay}>
                    <Text style={styles.payButtonText}>Lanjut Bayar</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: LIGHT_BG,
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
        paddingBottom: 40,
    },
    timerCard: {
        backgroundColor: '#FFEBEE',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FFCDD2',
    },
    timerLabel: {
        fontSize: 14,
        color: '#455A64',
        marginBottom: 2,
    },
    timerValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#D32F2F',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    matchTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 8,
    },
    matchDate: {
        fontSize: 14,
        color: '#546E7A',
        marginBottom: 4,
    },
    matchLocation: {
        fontSize: 14,
        color: '#546E7A',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 20,
    },
    counterContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        gap: 24,
    },
    counterBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    counterBtnDisabled: {
        backgroundColor: '#FAFAFA',
    },
    counterBtnActive: {
        backgroundColor: '#2E7D32',
    },
    countDisplay: {
        alignItems: 'center',
    },
    countText: {
        fontSize: 32,
        fontWeight: '600',
        color: '#2E7D32',
        lineHeight: 38,
    },
    slotLabel: {
        fontSize: 14,
        color: '#546E7A',
    },
    maxSlotText: {
        textAlign: 'center',
        fontSize: 12,
        color: '#90A4AE',
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    priceLabel: {
        fontSize: 14,
        color: '#546E7A',
    },
    priceValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 12,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2E7D32',
    },
    footer: {
        backgroundColor: '#fff',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    payButton: {
        backgroundColor: '#2E7D32',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#2E7D32',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    payButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
