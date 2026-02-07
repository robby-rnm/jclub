import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Platform, Pressable } from 'react-native';
import { View } from 'react-native';
import { ThemedText as Text } from '@/components/themed-text';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { api } from '@/services/api';

const PRIMARY_GREEN = '#3E8E41';
const LIGHT_BG = '#FAFAFA';

import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateGroupScreen() {
    const router = useRouter();

    const { clubId } = useLocalSearchParams();

    // Form State
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [gameType, setGameType] = useState('Mini Soccer');
    const [price, setPrice] = useState('50000');
    const [slots, setSlots] = useState('28');
    const [isAutoLeague, setIsAutoLeague] = useState(true);
    const [loading, setLoading] = useState(false);

    // Date & Time State
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [time, setTime] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Master Data State
    const [sports, setSports] = useState<any[]>([]);
    const [selectedSport, setSelectedSport] = useState<any>(null);
    const [positionQuotas, setPositionQuotas] = useState<{ [key: string]: string }>({});
    const [isCustomPrice, setIsCustomPrice] = useState(false);
    const [positionPrices, setPositionPrices] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        loadSports();
    }, []);

    const loadSports = async () => {
        try {
            const data = await api.getSports();
            setSports(data);
            if (data.length > 0) {
                selectSport(data[0]);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to load sports");
        }
    };

    const selectSport = (sport: any) => {
        setSelectedSport(sport);
        setGameType(sport.name);

        // Initialize quotas from default values
        const initialQuotas: { [key: string]: string } = {};
        const initialPrices: { [key: string]: string } = {};
        let total = 0;
        sport.positions.forEach((pos: any) => {
            initialQuotas[pos.code] = pos.default_quota.toString();
            initialPrices[pos.code] = price;
            total += pos.default_quota;
        });
        setPositionQuotas(initialQuotas);
        setPositionPrices(initialPrices);
        // setSlots(total.toString()); // Optional: Auto-set slots?
    };

    const updateQuota = (code: string, val: string) => {
        setPositionQuotas(prev => ({ ...prev, [code]: val }));
    };

    const updatePositionPrice = (code: string, val: string) => {
        setPositionPrices(prev => ({ ...prev, [code]: val }));
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || date;
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    const onTimeChange = (event: any, selectedTime?: Date) => {
        const currentTime = selectedTime || time;
        if (Platform.OS === 'android') {
            setShowTimePicker(false);
        }
        if (selectedTime) {
            setTime(selectedTime);
        }
    };

    const incrementPrice = () => {
        const current = parseInt(price) || 0;
        setPrice((current + 5000).toString());
    };

    const decrementPrice = () => {
        const current = parseInt(price) || 0;
        if (current >= 5000) {
            setPrice((current - 5000).toString());
        }
    };

    const incrementSlots = () => {
        const current = parseInt(slots) || 0;
        setSlots((current + 1).toString());
    };

    const decrementSlots = () => {
        const current = parseInt(slots) || 0;
        if (current > 1) {
            setSlots((current - 1).toString());
        }
    };

    const handleCreate = async (status: 'draft' | 'published') => {
        if (!name || !location) {
            alert("Please fill all fields");
            return;
        }

        if (!clubId) {
            alert("Error: No Club ID found. Please create a schedule from a Club.");
            return;
        }

        // Parse quotas & prices
        const quotas: { [key: string]: number } = {};
        const prices: { [key: string]: number } = {};
        let totalQuota = 0;

        if (selectedSport) {
            // positionQuotas now only contains selected positions
            Object.keys(positionQuotas).forEach(key => {
                const val = parseInt(positionQuotas[key]) || 0;
                quotas[key] = val;
                totalQuota += val;

                // Price logic
                if (isCustomPrice) {
                    prices[key] = parseInt(positionPrices[key]) || parseInt(price);
                } else {
                    prices[key] = parseInt(price);
                }
            });
        } else {
            // Fallback if no sport selected (shouldn't happen)
            quotas['player'] = parseInt(slots);
            prices['player'] = parseInt(price);
            totalQuota = parseInt(slots); // Fix validation bypass logic here if needed
        }

        // Auto-update total slots to match quota if sport matches
        // Or strictly validate. Let's validate.
        if (totalQuota !== parseInt(slots)) {
            alert(`Total quota (${totalQuota}) does not match Total Slots (${slots})`);
            return;
        }

        setLoading(true);
        try {
            await api.createMatch(clubId as string, {
                title: name,
                description: description,
                game_type: gameType,
                location: location,
                price: parseInt(price), // Default/Base price
                max_players: parseInt(slots),
                position_quotas: JSON.stringify(quotas),
                position_prices: JSON.stringify(prices),
                date: date.toISOString().split('T')[0],
                time: time.toTimeString().split(' ')[0].substring(0, 5)
            }, status);
            alert(status === 'draft' ? "Draft Saved!" : "Match Published!");
            router.back();
        } catch (e: any) {
            alert(e.message || "Failed to create");
        } finally {
            setLoading(false);
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
                    <Text style={styles.headerTitle}>Buat Jadwal</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>

                <View style={styles.formCard}>

                    {/* Tipe Permainan */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Tipe Permainan</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 4 }}>
                            {sports.map((sport, index) => (
                                <TouchableOpacity
                                    key={sport.code}
                                    onPress={() => selectSport(sport)}
                                    style={{
                                        paddingHorizontal: 16,
                                        paddingVertical: 8,
                                        borderRadius: 20,
                                        backgroundColor: selectedSport?.code === sport.code ? PRIMARY_GREEN : '#F5F5F5',
                                        marginRight: 8,
                                        borderWidth: 1,
                                        borderColor: selectedSport?.code === sport.code ? PRIMARY_GREEN : '#E0E0E0'
                                    }}
                                >
                                    <Text style={{
                                        color: selectedSport?.code === sport.code ? '#fff' : '#757575',
                                        fontWeight: '600',
                                        fontSize: 13
                                    }}>
                                        {sport.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Nama Group */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Nama Jadwal</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Mini Soccer Jumat Fun"
                            placeholderTextColor="#BDBDBD"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    {/* Tanggal & Waktu */}
                    <View style={styles.row}>
                        <View style={[styles.formGroup, { flex: 1, marginRight: 12 }]}>
                            <Text style={styles.label}>Tanggal</Text>
                            {Platform.OS === 'web' ? (
                                <View style={styles.inputIconContainer}>
                                    <View pointerEvents="none" style={{ zIndex: 1 }}>
                                        <TextInput
                                            style={[styles.input, styles.inputWithIcon]}
                                            placeholder="mm / dd / yyyy"
                                            placeholderTextColor="#BDBDBD"
                                            value={date.toLocaleDateString()}
                                            editable={false}
                                        />
                                        <Ionicons name="calendar-outline" size={20} color="#757575" style={[styles.inputIcon, { top: 12 }]} />
                                    </View>
                                    <DateTimePicker
                                        value={date}
                                        mode="date"
                                        display="default"
                                        onChange={onDateChange}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            opacity: 1, // Keep it 'visible' to browser
                                            color: 'transparent',
                                            backgroundColor: 'transparent',
                                            borderWidth: 0,
                                            cursor: 'pointer',
                                            zIndex: 100
                                        } as any}
                                    />
                                </View>
                            ) : (
                                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.inputIconContainer}>
                                    <View style={[styles.input, styles.inputWithIcon, { justifyContent: 'center' }]}>
                                        <Text style={{ fontSize: 14, color: '#1C1C1E' }}>
                                            {date.toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <Ionicons name="calendar-outline" size={20} color="#757575" style={[styles.inputIcon, { top: 12 }]} />
                                </TouchableOpacity>
                            )}
                        </View>
                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Waktu</Text>
                            {Platform.OS === 'web' ? (
                                <View style={styles.inputIconContainer}>
                                    <View pointerEvents="none" style={{ zIndex: 1 }}>
                                        <TextInput
                                            style={[styles.input, { textAlign: 'center' }]}
                                            placeholder="-- : --  --"
                                            placeholderTextColor="#BDBDBD"
                                            value={time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            editable={false}
                                        />
                                    </View>
                                    <DateTimePicker
                                        value={time}
                                        mode="time"
                                        display="default"
                                        onChange={onTimeChange}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            opacity: 1,
                                            color: 'transparent',
                                            backgroundColor: 'transparent',
                                            borderWidth: 0,
                                            cursor: 'pointer',
                                            zIndex: 100
                                        } as any}
                                    />
                                </View>
                            ) : (
                                <TouchableOpacity onPress={() => setShowTimePicker(true)}>
                                    <View style={[styles.input, { justifyContent: 'center', alignItems: 'center' }]}>
                                        <Text style={{ fontSize: 14, color: '#1C1C1E' }}>
                                            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {Platform.OS !== 'web' && showDatePicker && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display="default"
                            onChange={onDateChange}
                        />
                    )}
                    {Platform.OS !== 'web' && showTimePicker && (
                        <DateTimePicker
                            value={time}
                            mode="time"
                            display="default"
                            onChange={onTimeChange}
                        />
                    )}

                    {/* Lokasi */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Lokasi</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Pilih lapangan"
                            placeholderTextColor="#BDBDBD"
                            value={location}
                            onChangeText={setLocation}
                        />
                    </View>

                    {/* Deskripsi */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Deskripsi</Text>
                        <TextInput
                            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                            placeholder="Contoh: Bawa air minum sendiri, main santai"
                            placeholderTextColor="#BDBDBD"
                            multiline
                            numberOfLines={3}
                            value={description}
                            onChangeText={setDescription}
                        />
                    </View>

                    {/* Harga per Orang */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Harga Dasar per Orang</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                value={`Rp ${parseInt(price || '0').toLocaleString('id-ID')}`}
                                onChangeText={(t) => {
                                    const numeric = t.replace(/[^0-9]/g, '');
                                    setPrice(numeric);
                                }}
                                keyboardType="numeric"
                            />
                            <View style={styles.spinButtons}>
                                <TouchableOpacity onPress={incrementPrice}>
                                    <MaterialIcons name="arrow-drop-up" size={16} color="#757575" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={decrementPrice}>
                                    <MaterialIcons name="arrow-drop-down" size={16} color="#757575" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, justifyContent: 'space-between' }}>
                            <View>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1C1C1E' }}>Harga Berbeda per Posisi</Text>
                                <Text style={{ fontSize: 12, color: '#757575' }}>Atur harga khusus untuk posisi tertentu (misal GK)</Text>
                            </View>
                            <Switch
                                trackColor={{ false: "#767577", true: PRIMARY_GREEN }}
                                thumbColor={"#f4f3f4"}
                                onValueChange={(val) => {
                                    setIsCustomPrice(val);
                                    // Reset prices to base price when disabling
                                    if (!val && positionPrices) {
                                        const resetPrices: any = {};
                                        Object.keys(positionPrices).forEach(k => resetPrices[k] = price);
                                        setPositionPrices(resetPrices);
                                    }
                                }}
                                value={isCustomPrice}
                            />
                        </View>
                    </View>

                    {/* Total Slot Pemain */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Total Slot Pemain</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                value={slots}
                                onChangeText={setSlots}
                                keyboardType="numeric"
                            />
                            <View style={styles.spinButtons}>
                                <TouchableOpacity onPress={incrementSlots}>
                                    <MaterialIcons name="arrow-drop-up" size={16} color="#757575" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={decrementSlots}>
                                    <MaterialIcons name="arrow-drop-down" size={16} color="#757575" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>



                    {/* Quota Settings */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Distribusi Posisi</Text>
                        <Text style={[styles.subLabel, { marginBottom: 12 }]}>Pilih posisi yang ingin dibuka dan atur jumlah slotnya.</Text>

                        <View style={{ gap: 12 }}>
                            {selectedSport?.positions.map((pos: any) => {
                                const isSelected = positionQuotas.hasOwnProperty(pos.code);
                                return (
                                    <View key={pos.code} style={{
                                        borderWidth: 1,
                                        borderColor: isSelected ? PRIMARY_GREEN : '#EEEEEE',
                                        borderRadius: 12,
                                        backgroundColor: '#fff',
                                        padding: 12,
                                        opacity: isSelected ? 1 : 0.6
                                    }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: isSelected ? 8 : 0 }}>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    if (isSelected) {
                                                        const newQuotas = { ...positionQuotas };
                                                        delete newQuotas[pos.code];
                                                        setPositionQuotas(newQuotas);
                                                    } else {
                                                        setPositionQuotas({
                                                            ...positionQuotas,
                                                            [pos.code]: pos.default_quota.toString()
                                                        });
                                                    }
                                                }}
                                                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                                            >
                                                <MaterialIcons
                                                    name={isSelected ? "check-box" : "check-box-outline-blank"}
                                                    size={24}
                                                    color={isSelected ? PRIMARY_GREEN : '#BDBDBD'}
                                                />
                                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1C1C1E' }}>{pos.name}</Text>
                                            </TouchableOpacity>

                                            {!isSelected && (
                                                <Text style={{ fontSize: 14, color: '#9E9E9E' }}>Default: {pos.default_quota}</Text>
                                            )}
                                        </View>

                                        {isSelected && (
                                            <View>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 32, marginTop: 8 }}>
                                                    <Text style={{ fontSize: 14, color: '#757575' }}>Jumlah Slot:</Text>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                const current = parseInt(positionQuotas[pos.code] || '0');
                                                                if (current > 1) {
                                                                    updateQuota(pos.code, (current - 1).toString());
                                                                }
                                                            }}
                                                            style={{
                                                                width: 32, height: 32, borderRadius: 16,
                                                                borderWidth: 1, borderColor: '#BDBDBD',
                                                                alignItems: 'center', justifyContent: 'center'
                                                            }}
                                                        >
                                                            <MaterialIcons name="remove" size={16} color="#757575" />
                                                        </TouchableOpacity>

                                                        <View style={{ minWidth: 24, alignItems: 'center' }}>
                                                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1C1C1E' }}>
                                                                {positionQuotas[pos.code]}
                                                            </Text>
                                                        </View>

                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                const current = parseInt(positionQuotas[pos.code] || '0');
                                                                updateQuota(pos.code, (current + 1).toString());
                                                            }}
                                                            style={{
                                                                width: 32, height: 32, borderRadius: 16,
                                                                backgroundColor: PRIMARY_GREEN,
                                                                alignItems: 'center', justifyContent: 'center'
                                                            }}
                                                        >
                                                            <MaterialIcons name="add" size={16} color="#fff" />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>

                                                {isCustomPrice && (
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 32, marginTop: 12 }}>
                                                        <Text style={{ fontSize: 14, color: '#757575' }}>Harga:</Text>
                                                        <TextInput
                                                            style={{
                                                                borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
                                                                paddingVertical: 4, width: 100, textAlign: 'right',
                                                                fontSize: 14, fontWeight: '600', color: '#1C1C1E'
                                                            }}
                                                            keyboardType="numeric"
                                                            value={positionPrices[pos.code] || price}
                                                            onChangeText={(val) => updatePositionPrice(pos.code, val.replace(/[^0-9]/g, ''))}
                                                            placeholder={price}
                                                        />
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                )
                            })}
                        </View>
                        <Text style={[styles.subLabel, { marginTop: 12, color: '#9E9E9E' }]}>
                            Total: {Object.values(positionQuotas).reduce((a, b) => a + (parseInt(b) || 0), 0)} (Pastikan sama dengan Total Slot)
                        </Text>
                    </View>

                    {/* Auto League Switch */}
                    <View style={styles.switchRow}>
                        <View>
                            <Text style={styles.label}>Auto League</Text>
                            <Text style={styles.subLabel}>Sistem otomatis atur liga</Text>
                        </View>
                        <Switch
                            trackColor={{ false: "#767577", true: PRIMARY_GREEN }}
                            thumbColor={"#f4f3f4"}
                            ios_backgroundColor="#3e3e3e"
                            onValueChange={setIsAutoLeague}
                            value={isAutoLeague}
                        />
                    </View>

                </View >

            </ScrollView >

            {/* Footer Buttons */}
            <SafeAreaView edges={['bottom']} style={styles.footer}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity
                        style={[styles.createButton, { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: PRIMARY_GREEN }, loading && { opacity: 0.7 }]}
                        onPress={() => handleCreate('draft')}
                        disabled={loading}
                    >
                        <Text style={[styles.createButtonText, { color: PRIMARY_GREEN }]}>{loading ? "Saving..." : "Simpan Draft"}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.createButton, { flex: 1 }, loading && { opacity: 0.7 }]}
                        onPress={() => handleCreate('published')}
                        disabled={loading}
                    >
                        <Text style={styles.createButtonText}>{loading ? "Publishing..." : "Publish Sekarang"}</Text>
                    </TouchableOpacity>
                </View>
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
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    formGroup: {
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1C1C1E',
        marginBottom: 8,
    },
    subLabel: {
        fontSize: 12,
        color: '#757575',
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        color: '#1C1C1E',
        backgroundColor: '#FAFAFA',
    },
    inputWithIcon: {
        paddingRight: 40,
    },
    inputIconContainer: {
        position: 'relative',
        justifyContent: 'center',
        minHeight: 48,
    },
    inputIcon: {
        position: 'absolute',
        right: 12,
    },
    inputContainer: {
        position: 'relative',
        justifyContent: 'center',
    },
    spinButtons: {
        position: 'absolute',
        right: 12,
        height: '100%',
        justifyContent: 'center',
        flexDirection: 'column',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
    },
    footer: {
        backgroundColor: '#fff',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    createButton: {
        backgroundColor: PRIMARY_GREEN,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#3E8E41',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
