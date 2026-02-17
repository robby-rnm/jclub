import { StyleSheet, ScrollView, TouchableOpacity, View, Alert } from 'react-native';
import { ThemedText as Text } from '@/components/themed-text';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { api } from '@/services/api';

const PRIMARY_GREEN = '#3E8E41';

export default function TeamManagementScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const matchID = params.id as string;

    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    const [isCreator, setIsCreator] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [teamData, matchData, userData] = await Promise.all([
                api.getTeams(matchID),
                api.getMatch(matchID),
                api.getProfile()
            ]);

            // Check Access
            const isMatchCreator = matchData.creator?.id === userData.id;
            setIsCreator(isMatchCreator);

            // Allow everyone to view, but only creator can manage
            // if (matchData.creator?.id !== userData.id) {
            //     Alert.alert("Akses Ditolak", "Hanya host yang dapat mengatur team.");
            //     router.back();
            //     return;
            // }

            setTeams(teamData);
        } catch (e) {
            console.error(e);
            Alert.alert("Gagal", "Gagal memuat data team");
            router.back();
        } finally {
            setLoading(false);
        }
    };
    const handleMove = (member: any, currentTeamID: string) => {
        if (!isCreator) return;

        // Show options to move to other teams
        const otherTeams = teams.filter(t => t.id !== currentTeamID);
        const options: { text: string; onPress?: () => void; style?: "default" | "cancel" | "destructive" }[] = otherTeams.map(t => ({
            text: `Pindah ke ${t.name}`,
            onPress: async () => {
                try {
                    await api.updateTeamMember(member.id, t.id);
                    loadData(); // Reload full list
                } catch (e) {
                    Alert.alert("Gagal", "Gagal memindahkan pemain");
                }
            }
        }));
        options.push({ text: "Batal", style: "cancel" });

        Alert.alert(
            `Pindah Pemain: ${member.user.name}`,
            "Pilih team tujuan:",
            options
        );
    };

    return (
        <View style={styles.container}>
            <View style={{ height: 40 }} />
            {/* Simple Header workaround or restore full header if needed, but let's just make it properly structural first */}
            <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{isCreator ? "Manage Teams" : "Team List"}</Text>
                    <TouchableOpacity onPress={loadData}>
                        <Ionicons name="refresh" size={24} color="#000" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* Content */}
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Host Controls */}
                {isCreator && (
                    <View style={styles.hostControls}>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: teams.length > 0 ? '#F44336' : PRIMARY_GREEN }]}
                            onPress={async () => {
                                try {
                                    setGenerating(true);
                                    await api.generateTeams(matchID);
                                    setTimeout(() => loadData(), 1000); // Delay slightly
                                } catch (e) {
                                    Alert.alert("Gagal", "Gagal generate teams");
                                } finally {
                                    setGenerating(false);
                                }
                            }}
                            disabled={generating}
                        >
                            {generating ? (
                                <Text style={styles.actionButtonText}>Processing...</Text>
                            ) : (
                                <Text style={styles.actionButtonText}>
                                    {teams.length > 0 ? "Reset & Bagi Ulang Team" : "Generate Teams Otomatis"}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {teams.length > 0 && (
                            <Text style={styles.helperText}>Tap pemain untuk memindahkan ke team lain.</Text>
                        )}
                    </View>
                )}

                {teams.map((team, index) => (
                    <View key={team.id} style={styles.teamCard}>
                        <View style={[styles.teamHeader, { borderLeftColor: team.color || '#000' }]}>
                            <Text style={styles.teamName}>{team.name}</Text>
                            <Text style={styles.teamCount}>{team.members?.length || 0} Pemain</Text>
                        </View>

                        <View style={styles.memberList}>
                            {team.members?.map((member: any) => (
                                <TouchableOpacity
                                    key={member.id}
                                    style={styles.memberRow}
                                    onPress={() => handleMove(member, team.id)}
                                    disabled={!isCreator}
                                >
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>{member.user.name.charAt(0)}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.memberName}>{member.user.name}</Text>
                                    </View>
                                    {isCreator && <Ionicons name="swap-horizontal" size={20} color="#BDBDBD" />}
                                </TouchableOpacity>
                            ))}
                            {(!team.members || team.members.length === 0) && (
                                <Text style={styles.noMembers}>Kosong</Text>
                            )}
                        </View>
                    </View>
                ))}

                {/* Empty State */}
                {teams.length === 0 && !loading && (
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={48} color="#BDBDBD" />
                        <Text style={styles.emptyText}>Belum ada pembagian team.</Text>
                        {!isCreator && <Text style={[styles.emptyText, { marginTop: 8 }]}>Tunggu Host membagikan team.</Text>}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
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
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        textAlign: 'center',
        color: '#757575',
    },
    teamCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        overflow: 'hidden',
    },
    teamHeader: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderLeftWidth: 4,
    },
    teamName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    teamCount: {
        fontSize: 12,
        color: '#757575',
    },
    memberList: {
        padding: 8,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 8,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E0E0E0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    avatarText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#616161',
    },
    memberName: {
        fontSize: 14,
        color: '#424242',
    },
    noMembers: {
        padding: 16,
        textAlign: 'center',
        color: '#9E9E9E',
        fontSize: 12,
    },
    hostControls: {
        marginBottom: 20,
    },
    actionButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    helperText: {
        fontSize: 12,
        color: '#757575',
        marginTop: 8,
        textAlign: 'center',
    }
});
