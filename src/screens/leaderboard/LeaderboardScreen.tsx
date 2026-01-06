import { StackNavigationProp } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getFriends } from '../../services/friendService';
import { MainStackParamList, User } from '../../types';

type LeaderboardScreenNavigationProp = StackNavigationProp<MainStackParamList, 'Leaderboard'>;

interface Props {
  navigation: LeaderboardScreenNavigationProp;
}

interface LeaderboardEntry {
  user: User;
  rank: number;
  beers: number;
}

export default function LeaderboardScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { colors, theme } = useTheme();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const availableYears = [2024, 2025, 2026, 2027];

  useEffect(() => {
    loadLeaderboard();
  }, [selectedYear]);

  const loadLeaderboard = async (): Promise<void> => {
    if (!user) return;

    try {
      const friends = await getFriends(user.uid);
      const allUsers = [user, ...friends];

      // Her kullanıcının seçili yıldaki bira sayısını al
      const entries: LeaderboardEntry[] = allUsers
        .map((u) => ({
          user: u,
          rank: 0,
          beers: u.beersByYear?.[selectedYear.toString()] || 0,
        }))
        .sort((a, b) => b.beers - a.beers)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

      setLeaderboard(entries);
    } catch (error) {
      console.error('Load leaderboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankDisplay = (rank: number): string => {
    switch (rank) {
      case 1:
        return '1st';
      case 2:
        return '2nd';
      case 3:
        return '3rd';
      default:
        return `${rank}th`;
    }
  };

  const renderLeaderboardItem = ({ item }: { item: LeaderboardEntry }) => {
    const isCurrentUser = item.user.uid === user?.uid;

    return (
      <TouchableOpacity
        style={[styles.leaderboardCard, isCurrentUser && styles.currentUserCard]}
        onPress={() => navigation.navigate('Profile', { userId: item.user.uid })}
        activeOpacity={0.8}
      >
        <View style={styles.rankContainer}>
          <Text style={[styles.rankText, item.rank <= 3 && styles.topRankText]}>
            {getRankDisplay(item.rank)}
          </Text>
        </View>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{item.user.displayName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, isCurrentUser && styles.currentUserText]}>
            {item.user.displayName}
            {isCurrentUser && ' (You)'}
          </Text>
          <Text style={styles.username}>@{item.user.username}</Text>
        </View>
        <View style={styles.beerCount}>
          <Text style={styles.beerNumber}>{item.beers}</Text>
          <Text style={styles.beerLabel}>beers</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>No beers in {selectedYear} yet</Text>
      <Text style={styles.emptySubtext}>Be the first!</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Leaderboard</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Year Selector */}
      <View style={[styles.yearSelector, { backgroundColor: colors.card }]}>
        {availableYears.map((year) => (
          <TouchableOpacity
            key={year}
            style={[styles.yearBtn, { backgroundColor: selectedYear === year ? colors.primary : theme === 'dark' ? '#2C2C2C' : '#F5F5F5' }]}
            onPress={() => setSelectedYear(year)}
          >
            <Text
              style={[
                styles.yearText,
                { color: selectedYear === year ? colors.background : colors.textSecondary }
              ]}
            >
              {year}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Leaderboard */}
      <FlatList
        data={leaderboard}
        renderItem={({ item }) => {
            const isCurrentUser = item.user.uid === user?.uid;
            return (
              <TouchableOpacity
                style={[
                  styles.leaderboardCard,
                  { backgroundColor: colors.card, borderColor: isCurrentUser ? colors.primary : colors.border }
                ]}
                onPress={() => navigation.navigate('Profile', { userId: item.user.uid })}
                activeOpacity={0.8}
              >
                <View style={styles.rankContainer}>
                  <Text style={[styles.rankText, { color: item.rank <= 3 ? colors.text : colors.textSecondary }]}>
                    {getRankDisplay(item.rank)}
                  </Text>
                </View>
                <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.avatarText, { color: colors.background }]}>{item.user.displayName.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: colors.text }]}>
                    {item.user.displayName}
                    {isCurrentUser && ' (You)'}
                  </Text>
                  <Text style={[styles.username, { color: colors.textSecondary }]}>@{item.user.username}</Text>
                </View>
                <View style={styles.beerCount}>
                  <Text style={[styles.beerNumber, { color: colors.text }]}>{item.beers}</Text>
                  <Text style={[styles.beerLabel, { color: colors.textSecondary }]}>beers</Text>
                </View>
              </TouchableOpacity>
            );
        }}
        keyExtractor={(item) => item.user.uid}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No beers in {selectedYear} yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Be the first!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 28,
    color: '#000',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  yearSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 8,
    backgroundColor: '#FFF',
  },
  yearBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  activeYearBtn: {
    backgroundColor: '#000',
  },
  yearText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeYearText: {
    color: '#FFF',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  leaderboardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  currentUserCard: {
    borderColor: '#000',
    borderWidth: 2,
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
  },
  topRankText: {
    color: '#000',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  currentUserText: {
    color: '#000',
  },
  username: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  beerCount: {
    alignItems: 'flex-end',
  },
  beerNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  beerLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CCC',
  },
});
