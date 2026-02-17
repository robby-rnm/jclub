import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, View } from 'react-native';
import { ThemedText as Text } from '@/components/themed-text';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import DateTimePicker from '@react-native-community/datetimepicker';

const PRIMARY_GREEN = '#3E8E41';
const LIGHT_BG = '#FAFAFA';

export default function RescheduleScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();

    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState('');
    const [location, setLocation] = useState('');
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    useEffect(() => {
        if (id) {
            api.getMatch(id as string).then(m => {
                setDate(new Date(m.date));
                setTime(new Date(m.date));
                if (m.reschedule_reason) setReason(m.reschedule_reason);
                if (m.location) setLocation(m.location);
            });
        }
    }, [id]);

    const onDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || date;
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (selectedDate) setDate(selectedDate);
    };

    const onTimeChange = (event: any, selectedTime?: Date) => {
        const currentTime = selectedTime || time;
        if (Platform.OS === 'android') setShowTimePicker(false);
        if (selectedTime) setTime(selectedTime);
    };

    const handleSave = async () => {
        if (!reason) {
            alert("Please provide a reason for rescheduling");
            return;
        }
        setLoading(true);
        try {
            await api.updateMatch(id as string, {
                date: date.toISOString().split('T')[0],
                time: time.toTimeString().split(' ')[0].substring(0, 5),
                reschedule_reason: reason,
                location: location
            });
            alert("Match Rescheduled!");
            router.back();
        } catch (e: any) {
            alert(e.message || "Failed to update match");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <Stack.Screen options={{ headerShown: false }} />

            <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Reschedule Match</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.scrollContent} removeClippedSubviews={false}>
                <View style={styles.formCard}>
                    {/* Date & Time */}
                    <Text style={styles.sectionTitle}>New Schedule</Text>
                    <View style={styles.row}>
                        <View style={[styles.formGroup, { flex: 1, marginRight: 12, pointerEvents: 'auto' }]}>
                            <Text style={styles.label}>Date</Text>
                            {Platform.OS === 'web' ? (
                                <TextInput
                                    style={styles.input}
                                    value={date.toLocaleDateString()}
                                    editable={false}
                                />
                            ) : (
                                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.input, { pointerEvents: 'auto' }]}>
                                    <Text>{date.toLocaleDateString()}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <View style={[styles.formGroup, { flex: 1, pointerEvents: 'auto' }]}>
                            <Text style={styles.label}>Time</Text>
                            {Platform.OS === 'web' ? (
                                <TextInput
                                    style={styles.input}
                                    value={time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    editable={false}
                                />
                            ) : (
                                <TouchableOpacity onPress={() => setShowTimePicker(true)} style={[styles.input, { pointerEvents: 'auto' }]}>
                                    <Text>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
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

                    {/* Location */}
                    <View style={[styles.formGroup, { pointerEvents: 'auto' }]}>
                        <Text style={styles.label}>Location</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: '#fff', color: '#000' }]}
                            placeholder="e.g. Jaktim Futsal Arena"
                            placeholderTextColor="#999"
                            value={location}
                            onChangeText={setLocation}
                            editable={true}
                            pointerEvents="auto"
                        />
                    </View>

                    {/* Reason */}
                    <View style={[styles.formGroup, { pointerEvents: 'auto' }]}>
                        <Text style={styles.label}>Reason</Text>
                        <TextInput
                            style={[styles.input, { height: 80, textAlignVertical: 'top', backgroundColor: '#fff', color: '#000' }]}
                            placeholder="e.g. Rain delay, Field unavailable"
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={3}
                            value={reason}
                            onChangeText={setReason}
                        />
                    </View>
                </View>
            </ScrollView>

            <SafeAreaView edges={['bottom']} style={styles.footer}>
                <TouchableOpacity style={[styles.saveButton, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading}>
                    <Text style={styles.saveButtonText}>{loading ? "Saving..." : "Save Changes"}</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: LIGHT_BG, pointerEvents: 'auto' },
    headerSafeArea: { backgroundColor: '#fff' },
    header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', backgroundColor: '#fff' },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
    scrollContent: { padding: 20, pointerEvents: 'auto' },
    formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#EEEEEE', pointerEvents: 'auto' },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between', pointerEvents: 'auto' },
    formGroup: { marginBottom: 16, pointerEvents: 'auto' },
    label: { fontSize: 14, fontWeight: '600', color: '#1C1C1E', marginBottom: 8 },
    input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: '#1C1C1E', backgroundColor: '#FAFAFA', pointerEvents: 'auto' },
    footer: { backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    saveButton: { backgroundColor: PRIMARY_GREEN, paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
