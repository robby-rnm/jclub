import { StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { ThemedText as Text } from '@/components/themed-text';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { format, parseISO } from 'date-fns';
import { id as idID } from 'date-fns/locale';

const PRIMARY_GREEN = '#3E8E41';
const LIGHT_BG = '#FAFAFA';

export default function ReserveSlotScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const PRICE_PER_SLOT = 50000;

    // Timer logic
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
    const [match, setMatch] = useState<any>(null);
    const [counts, setCounts] = useState<{ [key: string]: number }>({});
    const [quotas, setQuotas] = useState<{ [key: string]: number }>({});
    const [prices, setPrices] = useState<{ [key: string]: number }>({});
    const [position, setPosition] = useState<string | null>(null);
    const [positionNames, setPositionNames] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!params.id) return;
        loadMatchAndSports();
    }, [params.id]);

    const loadMatchAndSports = async () => {
        try {
            const [matchData, sportsData] = await Promise.all([
                api.getMatch(params.id as string),
                api.getSports()
            ]);
            setMatch(matchData);

            // Find sport to get position names
            const sport = sportsData.find((s: any) => s.name === matchData.game_type);
            const names: { [key: string]: string } = {};
            if (sport) {
                sport.positions.forEach((p: any) => names[p.code] = p.name);
            }
            setPositionNames(names);

            // Parse Quotas
            const parsedQuotas: { [key: string]: number } = {};
            try {
                if (matchData.position_quotas) {
                    const q = JSON.parse(matchData.position_quotas);
                    // Ensure numbers
                    Object.keys(q).forEach(k => parsedQuotas[k] = parseInt(q[k]));
                }
            } catch (e) { console.error("Quota parse error", e); }
            setQuotas(parsedQuotas);

            // Parse Prices
            const parsedPrices: { [key: string]: number } = {};
            try {
                if (matchData.position_prices) {
                    const p = JSON.parse(matchData.position_prices);
                    Object.keys(p).forEach(k => parsedPrices[k] = parseInt(p[k]));
                }
            } catch (e) { console.error("Price parse error", e); }
            setPrices(parsedPrices);

            // Calculate Counts
            const currentCounts: { [key: string]: number } = {};
            if (matchData.bookings) {
                matchData.bookings.forEach((b: any) => {
                    if (b.status === 'confirmed') {
                        // Assuming Position in Booking JSON is now lowercase 'position' if we changed Booking too.
                        // Wait, I didn't verify Booking JSON Response in API for "Position".
                        // Booking struct: "Position Position".
                        // Let's assume lowercase because Booking model was updated?
                        // Re-reading my models.go edit: I updated `Club`, `Announcement`, `Notification`, `ClubMember`, `Match`.
                        // I did NOT update `Booking` struct in the diff I sent.
                        // Ah! I missed `Booking` struct in the `replace_file_content` call for `models.go`.
                        // The tool call output shows `type Booking struct` at the end but I didn't actually edit it in that tool call?
                        // Let me check the output of step 4259.
                        // It ended with `Bookings []Booking ...`.
                        // It did NOT show `type Booking struct` changes.
                        // So Booking struct still has Uppercase keys by default!
                        // This means `participants.tsx` change to `status`, `is_paid` etc might be WRONG if backend sends Uppercase.
                        // I MUST update `Booking` struct in `models.go` as well.
                        currentCounts[b.Position] = (currentCounts[b.Position] || 0) + 1;
                    }
                });
            }
            setCounts(currentCounts);

        } catch (e) {
            console.error("Failed to load data", e);
            alert("Failed to load match data");
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const formatCurrency = (amount: number) => {
        return `Rp ${amount.toLocaleString('id-ID').replace(',', '.')}`;
    };

    const handlePay = async () => {
        if (!position) {
            alert("Pilih posisi terlebih dahulu");
            return;
        }
        try {
            await api.joinMatch(params.id as string, position);
            alert("Pembayaran Berhasil! Kamu telah terdaftar.");
            router.replace(`/match/${params.id}`);
        } catch (e: any) {
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
                {match && (
                    <View style={styles.card}>
                        <Text style={styles.matchTitle}>{match.Title}</Text>
                        <Text style={styles.matchDate}>
                            {format(parseISO(match.Date), 'dd MMMM yyyy', { locale: idID })} • {format(parseISO(match.Date), 'HH:mm', { locale: idID })} WIB
                        </Text>
                        <Text style={styles.matchLocation}>{match.Location}</Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                            <View style={{ backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                                <Text style={{ color: '#2E7D32', fontSize: 12, fontWeight: '600' }}>{match.GameType}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Position Selection */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Pilih Posisi</Text>
                    <View style={styles.positionContainer}>
                        {Object.keys(quotas).map((code) => {
                            const count = counts[code] || 0;
                            const quota = quotas[code] || 0;
                            const isFull = count >= quota;
                            const isSelected = position === code;
                            // Default icon
                            let iconName: any = "accessibility";
                            if (code === 'gk') iconName = "sports-handball";
                            else if (code.includes('player')) iconName = "football-outline"; // Ionicon

                            // Use MaterialIcons for handball, Ionicons for others? 
                            // Quick hack: just use one lib if possible or conditional render.

                            return (
                                <TouchableOpacity
                                    key={code}
                                    style={[
                                        styles.positionOption,
                                        isSelected && styles.positionActive,
                                        isFull && styles.positionDisabled
                                    ]}
                                    onPress={() => !isFull && setPosition(code)}
                                    disabled={isFull}
                                >
                                    {code === 'gk' ? (
                                        <MaterialIcons name="sports-handball" size={24} color={isFull ? '#BDBDBD' : (isSelected ? PRIMARY_GREEN : '#757575')} />
                                    ) : (
                                        <Ionicons name="football-outline" size={24} color={isFull ? '#BDBDBD' : (isSelected ? PRIMARY_GREEN : '#757575')} />
                                    )}
                                    <View>
                                        <Text style={[styles.positionText, isSelected && styles.textActive, isFull && styles.textDisabled]}>
                                            {positionNames[code] || code.toUpperCase()}
                                        </Text>
                                        <Text style={{ fontSize: 10, color: isFull ? '#E57373' : '#9E9E9E' }}>
                                            {isFull ? 'FULL' : `${count}/${quota}`}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Price Breakdown */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Rincian Harga</Text>

                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Harga per slot</Text>
                        <Text style={styles.priceValue}>
                            {position ? formatCurrency(prices[position] || match?.Price || PRICE_PER_SLOT) : '-'}
                        </Text>
                    </View>

                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Jumlah slot</Text>
                        <Text style={styles.priceValue}>1x ({position ? (positionNames[position] || position) : '-'})</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.priceRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>
                            {position ? formatCurrency(prices[position] || match?.Price || PRICE_PER_SLOT) : '-'}
                        </Text>
                    </View>
                </View>

            </ScrollView >

            {/* Footer Button */}
            < SafeAreaView edges={['bottom']} style={styles.footer} >
                <TouchableOpacity style={[styles.payButton, !position && { opacity: 0.5 }]} onPress={handlePay} disabled={!position}>
                    <Text style={styles.payButtonText}>Lanjut Bayar</Text>
                </TouchableOpacity>
            </SafeAreaView >
        </View >
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
    positionContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    positionOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        backgroundColor: '#fff',
        gap: 8,
    },
    positionActive: {
        borderColor: PRIMARY_GREEN,
        backgroundColor: '#E8F5E9',
    },
    positionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#757575',
    },
    textActive: {
        color: PRIMARY_GREEN,
    },
    positionDisabled: {
        backgroundColor: '#F5F5F5',
        borderColor: '#EEEEEE',
        opacity: 0.7,
    },
    textDisabled: {
        color: '#BDBDBD',
    },
});
