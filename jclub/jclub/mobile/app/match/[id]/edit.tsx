import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Platform, Pressable, Alert } from 'react-native';
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

export default function EditMatchScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();

    // Form State
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [gameType, setGameType] = useState('Mini Soccer');
    const [price, setPrice] = useState('50000');
    const [slots, setSlots] = useState('28');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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

    // Original Data (for change detection or reference)
    const [originalMatch, setOriginalMatch] = useState<any>(null);

    const [status, setStatus] = useState('published');
    const [rescheduleReason, setRescheduleReason] = useState('');

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const [sportsData, matchData] = await Promise.all([
                api.getSports(),
                api.getMatch(id as string)
            ]);

            setSports(sportsData);
            setOriginalMatch(matchData);
            setStatus(matchData.status || 'published');

            // Populate Form
            setName(matchData.title);
            setLocation(matchData.location);
            setDescription(matchData.description || '');
            setGameType(matchData.game_type);
            setPrice(matchData.price.toString());
            setSlots(matchData.max_players.toString());
            setDate(new Date(matchData.date));
            // Handle time parsing carefully if it includes date or just time
            // Assuming matchData.date is full timestamp or we combine date + time
            // For now using date object as base
            const timeObj = new Date(matchData.date); // Or separate field if available?
            setTime(timeObj);

            setRescheduleReason(matchData.reschedule_reason || '');

            // Populate Complex State (Quotas & Prices)
            if (matchData.position_quotas) {
                const quotas = JSON.parse(matchData.position_quotas);
                const stringQuotas: any = {};
                Object.keys(quotas).forEach(k => stringQuotas[k] = quotas[k].toString());
                setPositionQuotas(stringQuotas);
            }

            if (matchData.position_prices) {
                const prices = JSON.parse(matchData.position_prices);
                const stringPrices: any = {};
                let customFound = false;
                Object.keys(prices).forEach(k => {
                    stringPrices[k] = prices[k].toString();
                    if (prices[k] !== matchData.price) customFound = true;
                });
                setPositionPrices(stringPrices);
                setIsCustomPrice(customFound);
            }

            // Find and select sport object
            const sport = sportsData.find((s: any) => s.name === matchData.game_type);
            if (sport) {
                setSelectedSport(sport);
            } else {
                // Try to fallback/find by loose match or default
                if (sportsData.length > 0) setSelectedSport(sportsData[0]);
            }

        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to load match details");
            router.back();
        } finally {
            setLoading(false);
        }
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

    const handleSave = async (targetStatus?: string) => {
        if (!name || !location) {
            Alert.alert("Error", "Please fill all fields");
            return;
        }

        // Parse quotas & prices
        const quotas: { [key: string]: number } = {};
        const prices: { [key: string]: number } = {};
        let totalQuota = 0;

        if (selectedSport) {
            Object.keys(positionQuotas).forEach(key => {
                const val = parseInt(positionQuotas[key]) || 0;
                quotas[key] = val;
                totalQuota += val;

                if (isCustomPrice) {
                    prices[key] = parseInt(positionPrices[key]) || parseInt(price);
                } else {
                    prices[key] = parseInt(price);
                }
            });
        } else {
            // Fallback
            quotas['player'] = parseInt(slots);
            prices['player'] = parseInt(price);
            totalQuota = parseInt(slots);
        }

        // Validate slots match
        if (selectedSport && totalQuota !== parseInt(slots)) {
            Alert.alert("Validation Error", `Total quota (${totalQuota}) does not match Total Slots (${slots}). Please adjust position quotas.`);
            return;
        }

        const isPublished = status === 'published' || status === 'open';
        const finalStatus = targetStatus || status;

        // If published, ensure reschedule reason if date changed (optional check)
        if (isPublished) {
            // Check if date changed
            // const originalDate = new Date(originalMatch.date);
            // if (date.getTime() !== originalDate.getTime() && !rescheduleReason) {
            //      Alert.alert("Required", "Please provide a Reschedule Reason.");
            //      return;
            // }
        }

        setSaving(true);
        try {
            const updateData: any = {
                title: name,
                description: description,
                location: location,
                price: parseInt(price),
                max_players: parseInt(slots),
                position_quotas: JSON.stringify(quotas),
                position_prices: JSON.stringify(prices),
                date: date.toISOString().split('T')[0],
                time: time.toTimeString().split(' ')[0].substring(0, 5),
                status: finalStatus,
                reschedule_reason: rescheduleReason
            };

            await api.updateMatch(id as string, updateData);
            Alert.alert("Success", targetStatus === 'published' ? "Match Published!" : "Match Updated!");
            router.back();
        } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to update");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = async () => {
        Alert.alert(
            "Cancel Match",
            "Are you sure you want to cancel this match? This action cannot be undone.",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: async () => {
                        setSaving(true);
                        try {
                            // Assuming we want a reason prompt, but standard alert input is tricky in RN without library or custom modal.
                            // For MVP, we'll use a hardcoded reason or generic one, or rely on Reschedule Reason field if user filled it?
                            // Let's use "Cancelled by Host" as default reason for now, or use rescheduleReason if available.
                            const reason = rescheduleReason || "Cancelled by Host";
                            await api.cancelMatch(id as string, reason);
                            Alert.alert("Cancelled", "Match has been cancelled.");
                            router.back();
                        } catch (e: any) {
                            Alert.alert("Error", e.message || "Failed to cancel");
                            setSaving(false);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#757575' }}>Loading...</Text>
            </View>
        );
    }

    // UI Helpers
    const isPublished = status === 'published' || status === 'open';
    const isDraft = status === 'draft';
    const isRestricted = isPublished; // Published matches have restricted editing

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
                    <Text style={styles.headerTitle}>Edit Jadwal</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>

                {isPublished && (
                    <View style={{ backgroundColor: '#FFF3E0', padding: 12, borderRadius: 8, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="information-circle" size={20} color="#E65100" style={{ marginRight: 8 }} />
                        <Text style={{ color: '#E65100', fontSize: 13, flex: 1 }}>
                            Match is Published. Only date, time, and reason can be edited.
                        </Text>
                    </View>
                )}

                <View style={styles.formCard}>

                    {/* Tipe Permainan (Display Only) */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Tipe Permainan</Text>
                        <View style={{ padding: 12, backgroundColor: '#F5F5F5', borderRadius: 12 }}>
                            <Text style={{ fontWeight: '600', color: '#1C1C1E' }}>{gameType}</Text>
                            <Text style={{ fontSize: 12, color: '#757575', marginTop: 4 }}>Note: Cannot change sport type once created.</Text>
                        </View>
                    </View>

                    {/* Nama Group */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Nama Jadwal</Text>
                        <TextInput
                            style={[styles.input, isRestricted && styles.disabledInput]}
                            placeholder="Mini Soccer Jumat Fun"
                            placeholderTextColor="#BDBDBD"
                            value={name}
                            onChangeText={setName}
                            editable={!isRestricted}
                        />
                    </View>

                    {/* Tanggal & Waktu */}
                    <View style={styles.row}>
                        <View style={[styles.formGroup, { flex: 1, marginRight: 12 }]}>
                            <Text style={styles.label}>Tanggal</Text>
                            {Platform.OS === 'web' ? (
                                <TextInput
                                    style={styles.input}
                                    value={date.toLocaleDateString()}
                                    editable={false}
                                />
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
                                <TextInput
                                    style={styles.input}
                                    value={time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    editable={false}
                                />
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
                        <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} />
                    )}
                    {Platform.OS !== 'web' && showTimePicker && (
                        <DateTimePicker value={time} mode="time" display="default" onChange={onTimeChange} />
                    )}

                    {/* Reschedule Reason (Only visible if published) */}
                    {isPublished && (
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Alasan Reschedule / Note</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Kenapa jadwal berubah?"
                                placeholderTextColor="#BDBDBD"
                                value={rescheduleReason}
                                onChangeText={setRescheduleReason}
                            />
                        </View>
                    )}

                    {/* Lokasi */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Lokasi</Text>
                        <TextInput
                            style={[styles.input, isRestricted && styles.disabledInput]}
                            placeholder="Pilih lapangan"
                            placeholderTextColor="#BDBDBD"
                            value={location}
                            onChangeText={setLocation}
                            editable={true}
                        />
                    </View>

                    {/* Deskripsi */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Deskripsi</Text>
                        <TextInput
                            style={[styles.input, { height: 80, textAlignVertical: 'top' }, isRestricted && styles.disabledInput]}
                            placeholder="Contoh: Bawa air minum sendiri, main santai"
                            placeholderTextColor="#BDBDBD"
                            multiline
                            numberOfLines={3}
                            value={description}
                            onChangeText={setDescription}
                            editable={!isRestricted}
                        />
                    </View>

                    {/* Harga per Orang */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Harga Dasar per Orang</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={[styles.input, isRestricted && styles.disabledInput]}
                                value={`Rp ${parseInt(price || '0').toLocaleString('id-ID')}`}
                                onChangeText={(t) => {
                                    if (isRestricted) return;
                                    const numeric = t.replace(/[^0-9]/g, '');
                                    setPrice(numeric);
                                }}
                                keyboardType="numeric"
                                editable={!isRestricted}
                            />
                            {!isRestricted && (
                                <View style={styles.spinButtons}>
                                    <TouchableOpacity onPress={incrementPrice}>
                                        <MaterialIcons name="arrow-drop-up" size={16} color="#757575" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={decrementPrice}>
                                        <MaterialIcons name="arrow-drop-down" size={16} color="#757575" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, justifyContent: 'space-between' }}>
                            <View>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1C1C1E' }}>Harga Berbeda per Posisi</Text>
                                <Text style={{ fontSize: 12, color: '#757575' }}>Atur harga khusus untuk posisi tertentu</Text>
                            </View>
                            <Switch
                                trackColor={{ false: "#767577", true: PRIMARY_GREEN }}
                                thumbColor={"#f4f3f4"}
                                onValueChange={(val) => !isRestricted && setIsCustomPrice(val)}
                                value={isCustomPrice}
                                disabled={isRestricted}
                            />
                        </View>
                    </View>

                    {/* Total Slot Pemain */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Total Slot Pemain</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={[styles.input, isRestricted && styles.disabledInput]}
                                value={slots}
                                onChangeText={(t) => !isRestricted && setSlots(t)}
                                keyboardType="numeric"
                                editable={!isRestricted}
                            />
                            {!isRestricted && (
                                <View style={styles.spinButtons}>
                                    <TouchableOpacity onPress={incrementSlots}>
                                        <MaterialIcons name="arrow-drop-up" size={16} color="#757575" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={decrementSlots}>
                                        <MaterialIcons name="arrow-drop-down" size={16} color="#757575" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Quota Settings */}
                    {selectedSport && (
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Distribusi Posisi</Text>

                            <View style={{ gap: 12 }}>
                                {selectedSport.positions.map((pos: any) => {
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
                                                        if (isRestricted) return;
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
                                                    disabled={isRestricted}
                                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                                                >
                                                    <MaterialIcons
                                                        name={isSelected ? "check-box" : "check-box-outline-blank"}
                                                        size={24}
                                                        color={isSelected ? PRIMARY_GREEN : '#BDBDBD'}
                                                    />
                                                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#1C1C1E' }}>{pos.name}</Text>
                                                </TouchableOpacity>
                                            </View>

                                            {isSelected && (
                                                <View>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 32, marginTop: 8 }}>
                                                        <Text style={{ fontSize: 14, color: '#757575' }}>Jumlah Slot:</Text>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                            {!isRestricted && (
                                                                <TouchableOpacity
                                                                    onPress={() => {
                                                                        const current = parseInt(positionQuotas[pos.code] || '0');
                                                                        if (current > 1) {
                                                                            updateQuota(pos.code, (current - 1).toString());
                                                                        }
                                                                    }}
                                                                    style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#BDBDBD', alignItems: 'center', justifyContent: 'center' }}
                                                                >
                                                                    <MaterialIcons name="remove" size={16} color="#757575" />
                                                                </TouchableOpacity>
                                                            )}

                                                            <View style={{ minWidth: 24, alignItems: 'center' }}>
                                                                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1C1C1E' }}>{positionQuotas[pos.code]}</Text>
                                                            </View>

                                                            {!isRestricted && (
                                                                <TouchableOpacity
                                                                    onPress={() => {
                                                                        const current = parseInt(positionQuotas[pos.code] || '0');
                                                                        updateQuota(pos.code, (current + 1).toString());
                                                                    }}
                                                                    style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: PRIMARY_GREEN, alignItems: 'center', justifyContent: 'center' }}
                                                                >
                                                                    <MaterialIcons name="add" size={16} color="#fff" />
                                                                </TouchableOpacity>
                                                            )}
                                                        </View>
                                                    </View>

                                                    {isCustomPrice && (
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 32, marginTop: 12 }}>
                                                            <Text style={{ fontSize: 14, color: '#757575' }}>Harga:</Text>
                                                            <TextInput
                                                                style={{ borderBottomWidth: 1, borderBottomColor: '#E0E0E0', paddingVertical: 4, width: 100, textAlign: 'right', fontSize: 14, fontWeight: '600', color: '#1C1C1E' }}
                                                                keyboardType="numeric"
                                                                value={positionPrices[pos.code] || price}
                                                                onChangeText={(val) => !isRestricted && updatePositionPrice(pos.code, val.replace(/[^0-9]/g, ''))}
                                                                placeholder={price}
                                                                editable={!isRestricted}
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
                    )}

                </View >

            </ScrollView >

            < SafeAreaView edges={['bottom']} style={styles.footer} >
                <View style={{ gap: 12 }}>
                    {isDraft ? (
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity style={[styles.createButton, { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: PRIMARY_GREEN }, saving && { opacity: 0.7 }]} onPress={() => handleSave('draft')} disabled={saving}>
                                <Text style={[styles.createButtonText, { color: PRIMARY_GREEN }]}>{saving ? "Saving..." : "Simpan Draft"}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.createButton, { flex: 1 }, saving && { opacity: 0.7 }]} onPress={() => handleSave('published')} disabled={saving}>
                                <Text style={styles.createButtonText}>{saving ? "Publishing..." : "Publish"}</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={[styles.createButton, saving && { opacity: 0.7 }]} onPress={() => handleSave()} disabled={saving}>
                            <Text style={styles.createButtonText}>{saving ? "Saving..." : "Simpan Perubahan"}</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.createButton, { backgroundColor: '#FFEBEE', marginTop: 4 }]}
                        onPress={handleCancel}
                        disabled={saving}
                    >
                        <Text style={[styles.createButtonText, { color: '#D32F2F' }]}>Cancel Match</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView >
        </View >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: LIGHT_BG },
    headerSafeArea: { backgroundColor: '#fff' },
    header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', backgroundColor: '#fff' },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
    scrollContent: { padding: 20, paddingBottom: 40 },
    formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#EEEEEE', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    formGroup: { marginBottom: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    label: { fontSize: 14, fontWeight: '600', color: '#1C1C1E', marginBottom: 8 },
    subLabel: { fontSize: 12, color: '#757575' },
    input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: '#1C1C1E', backgroundColor: '#FAFAFA' },
    inputWithIcon: { paddingRight: 40 },
    inputIconContainer: { position: 'relative', justifyContent: 'center', minHeight: 48 },
    inputIcon: { position: 'absolute', right: 12 },
    inputContainer: { position: 'relative', justifyContent: 'center' },
    spinButtons: { position: 'absolute', right: 12, height: '100%', justifyContent: 'center', flexDirection: 'column' },
    footer: { backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    createButton: { backgroundColor: PRIMARY_GREEN, paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#3E8E41', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    createButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    disabledInput: { backgroundColor: '#F5F5F5', color: '#9E9E9E', borderColor: '#EEEEEE' },
});
