import { StyleSheet, ScrollView, TouchableOpacity, Image, Platform, View, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemedText as Text } from '@/components/themed-text';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { api, Match, Club } from '@/services/api';

// Exact colors from image analysis
const PRIMARY_GREEN = '#3E8E41';
const BTN_GREEN = '#2E7D32'; // Slightly darker for buttons if needed, or keeping unified
const BG_COLOR = '#F5F5F5';
const TEXT_DARK = '#1C1C1E';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [matches, setMatches] = useState<Match[]>([]); // "Info Hari Ini" matches
  const [myMatches, setMyMatches] = useState<Match[]>([]); // "Jadwal Tanding Kamu"
  const [myClubs, setMyClubs] = useState<Club[]>([]);  // "Club Saya"
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      // Parallel fetch
      const [matchesData, myMatchesData, clubsData, profileData] = await Promise.all([
        api.getMatches(1, 10), // Latest matches for "Info Hari Ini"
        api.getMatches(1, 10, '', 'joined'), // My Joined Matches
        api.getClubs(1, 5, '', 'joined'), // My Joined Clubs
        api.getProfile().catch(() => null)
      ]);

      if (profileData) setCurrentUser(profileData);
      setMatches(matchesData.reverse());
      setMyMatches(myMatchesData);
      setMyClubs(clubsData);
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // ... (keep format helpers)
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY_GREEN} />}
      >

        {/* Header Section (Keep as is) */}
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>Halo, {currentUser?.name || "Guest"} 👋</Text>
            <Text style={styles.subGreeting}>Siap main hari ini?</Text>
          </View>
        </View>

        {/* Action Card - Floating */}
        <View style={styles.actionCardContainer}>
          <View style={styles.actionCard}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/my-clubs')}>
              <Ionicons name="albums-outline" size={24} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>My Club</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 12, backgroundColor: '#F57C00' }]} onPress={() => router.push('/create-group')}>
              <Ionicons name="add-circle-outline" size={24} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>Buat Match</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Hari Ini (Stats) */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Info Hari Ini</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="calendar-outline" size={24} color={PRIMARY_GREEN} />
              </View>
              <Text style={styles.statLabel}>Match Tersedia</Text>
              <Text style={[styles.statValue, { color: PRIMARY_GREEN }]}>{matches.length}</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.iconCircle, { backgroundColor: '#FFEBEE' }]}>
                <Ionicons name="location-outline" size={24} color="#D32F2F" />
              </View>
              <Text style={styles.statLabel}>Club diikuti</Text>
              <Text style={[styles.statValue, { color: '#D32F2F' }]}>{myClubs.length}</Text>
            </View>
          </View>
        </View>

        {/* Jadwal Tanding Kamu (NEW) */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Jadwal Tanding Kamu</Text>
          {myMatches.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
              {myMatches.map((match) => (
                <TouchableOpacity
                  key={match.id}
                  style={styles.matchCard}
                  onPress={() => router.push(`/match/${match.id}`)}
                >
                  <View style={styles.matchDateBadge}>
                    <Text style={styles.matchDateText}>{formatDate(match.date)}</Text>
                    <Text style={styles.matchTimeText}>{formatTime(match.date)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.matchTitle} numberOfLines={1}>{match.title}</Text>
                    <Text style={styles.matchLocation} numberOfLines={1}>{match.location}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Belum ada jadwal tanding.</Text>
            </View>
          )}
        </View>

        {/* Club Saya Section */}
        {myClubs.length > 0 ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Club Saya</Text>
            {myClubs.map((club) => (
              <TouchableOpacity key={club.id} style={[styles.groupCard, { borderColor: PRIMARY_GREEN, borderWidth: 1.5 }]} onPress={() => router.push(`/club/${club.id}`)}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupTitle}>{club.name}</Text>
                  <View style={[styles.tag, { backgroundColor: PRIMARY_GREEN }]}>
                    <Text style={[styles.tagText, { color: '#fff' }]}>Member</Text>
                  </View>
                </View>
                <View style={styles.groupInfoRow}>
                  <Text style={styles.groupInfoText} numberOfLines={2}>{club.description || "No description"}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Club Saya</Text>
            <View style={{ padding: 20, alignItems: 'center', backgroundColor: '#fff', borderRadius: 16 }}>
              <Text style={{ color: '#888' }}>Belum mengikuti club apapun.</Text>
            </View>
          </View>
        )}



        {/* End of content */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA', // Very light grey/white background
  },
  header: {
    backgroundColor: PRIMARY_GREEN,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingBottom: 80, // Increased to make room for overlapping card
    paddingHorizontal: 24,
  },
  headerContent: {
    marginBottom: 0, // No extra margin needed with larger paddingBottom
  },
  greeting: {
    fontSize: 24, // Slightly larger
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subGreeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  actionCardContainer: {
    marginTop: -60, // Deeper overlap
    paddingHorizontal: 20,
    marginBottom: 24,
    zIndex: 1, // Ensure it sits on top
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 24, // Larger radius for the card itself
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 }, // Deeper shadow
    shadowOpacity: 0.12, // slightly stronger shadow
    shadowRadius: 16,
    elevation: 8,
    gap: 16,
    ...Platform.select({
      web: {
        boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.12)',
      },
    }),
  },
  primaryBtn: {
    backgroundColor: '#2E7D32', // Slightly darker green for contrast
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16, // More rounded buttons
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryBtn: {
    backgroundColor: '#F5F5F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  secondaryBtnText: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontSize: 16,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    color: PRIMARY_GREEN,
    fontWeight: '600',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
  },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
    flex: 1,
    marginRight: 8,
    lineHeight: 22,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  groupInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupInfoText: {
    fontSize: 14,
    color: '#616161',
    fontWeight: '500',
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
  },
  playerCountText: {
    fontSize: 14,
    fontWeight: '500',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    width: 250,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  matchDateBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    marginRight: 12,
  },
  matchDateText: {
    fontSize: 14,
    fontWeight: '700',
    color: PRIMARY_GREEN,
  },
  matchTimeText: {
    fontSize: 12,
    color: PRIMARY_GREEN,
  },
  matchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 4,
  },
  matchLocation: {
    fontSize: 12,
    color: '#757575',
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  emptyText: {
    color: '#888',
  },
});
