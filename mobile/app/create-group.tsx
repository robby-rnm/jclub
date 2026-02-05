import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Platform, Pressable } from 'react-native';
import { View } from 'react-native';
import { ThemedText as Text } from '@/components/themed-text';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { api } from '@/services/api';

const PRIMARY_GREEN = '#3E8E41';
const LIGHT_BG = '#FAFAFA';

import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateGroupScreen() {
    const router = useRouter();

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

    const onDateChange = (event: any, selectedDate?: Date) => {
        // On Web, event.nativeEvent.timestamp might effectively be the value, 
        // but typically selectedDate is passed correctly by the library wrapper.
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

    const handleCreate = async () => {
        if (!name || !location) {
            alert("Please fill all fields");
            return;
        }
        setLoading(true);
        try {
            await api.createMatch({
                title: name,
                description: description,
                game_type: gameType,
                location: location,
                price: parseInt(price),
                max_players: parseInt(slots),
                date: date.toISOString().split('T')[0],
                time: time.toTimeString().split(' ')[0].substring(0, 5)
            });
            alert("Match Created!");
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
                    <Text style={styles.headerTitle}>Buat Group Main</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>

                <View style={styles.formCard}>

                    {/* Tipe Permainan */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Tipe Permainan</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 4 }}>
                            {['Mini Soccer', 'Futsal', 'Badminton', 'Basket'].map((type, index) => (
                                <TouchableOpacity
                                    key={type}
                                    onPress={() => setGameType(type)}
                                    style={{
                                        paddingHorizontal: 16,
                                        paddingVertical: 8,
                                        borderRadius: 20,
                                        backgroundColor: gameType === type ? PRIMARY_GREEN : '#F5F5F5',
                                        marginRight: 8,
                                        borderWidth: 1,
                                        borderColor: gameType === type ? PRIMARY_GREEN : '#E0E0E0'
                                    }}
                                >
                                    <Text style={{
                                        color: gameType === type ? '#fff' : '#757575',
                                        fontWeight: '600',
                                        fontSize: 13
                                    }}>
                                        {type}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Nama Group */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Nama Group</Text>
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
                                <TouchableOpacity onPress={() => setShowDatePicker((prev) => !prev)} style={styles.inputIconContainer}>
                                    <View pointerEvents="none">
                                        <TextInput
                                            style={[styles.input, styles.inputWithIcon]}
                                            placeholder="mm / dd / yyyy"
                                            placeholderTextColor="#BDBDBD"
                                            value={date.toLocaleDateString()}
                                            editable={false}
                                        />
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
                                <TouchableOpacity onPress={() => setShowTimePicker((prev) => !prev)}>
                                    <View pointerEvents="none">
                                        <TextInput
                                            style={[styles.input, { textAlign: 'center' }]}
                                            placeholder="-- : --  --"
                                            placeholderTextColor="#BDBDBD"
                                            value={time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            editable={false}
                                        />
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
                        <Text style={styles.label}>Harga per Orang</Text>
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

            {/* Footer Button (Optional, not in screenshot but likely needed) */}
            < SafeAreaView edges={['bottom']} style={styles.footer} >
                <TouchableOpacity style={[styles.createButton, loading && { opacity: 0.7 }]} onPress={handleCreate} disabled={loading}>
                    <Text style={styles.createButtonText}>{loading ? "Creating..." : "Buat Group"}</Text>
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
