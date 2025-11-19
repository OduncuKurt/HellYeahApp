import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { getUserGroups } from '../../services/groupService';
import { Group, MainStackParamList } from '../../types';

type GroupListScreenNavigationProp = StackNavigationProp<MainStackParamList, 'GroupList'>;

interface Props {
  navigation: GroupListScreenNavigationProp;
}

export default function GroupListScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadGroups = async (): Promise<void> => {
    if (!user) return;

    try {
      const userGroups = await getUserGroups(user.uid);
      setGroups(userGroups);
    } catch (error) {
      console.error('Load groups error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Ekran focus olduğunda grupları yeniden yükle
  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [user])
  );

  const handleRefresh = (): void => {
    setRefreshing(true);
    loadGroups();
  };

  const handleLogout = async (): Promise<void> => {
    await logout();
  };

  const renderGroupItem = ({ item }: { item: Group }) => {
    const memberCount = Object.keys(item.members || {}).length;

    return (
      <TouchableOpacity
        style={styles.groupCard}
        onPress={() => navigation.navigate('GroupDetail', { groupId: item.id })}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['rgba(255, 149, 0, 0.1)', 'rgba(255, 149, 0, 0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.groupCardGradient}
        >
          <View style={styles.groupHeader}>
            <View style={styles.emojiContainer}>
              <LinearGradient
                colors={['#FF9500', '#FFB84D']}
                style={styles.emojiGradient}
              >
                <Text style={styles.groupEmoji}>🍺</Text>
              </LinearGradient>
            </View>
            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>{item.name}</Text>
              <Text style={styles.groupStats}>
                {item.totalBeers} bira • {memberCount} kişi
              </Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </View>
          <View style={styles.inviteCodeBox}>
            <Text style={styles.inviteCodeLabel}>Davet Kodu:</Text>
            <Text style={styles.inviteCode}>{item.inviteCode}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>📭</Text>
      <Text style={styles.emptyText}>Henüz bir grubun yok</Text>
      <Text style={styles.emptySubtext}>Yeni grup oluştur veya davet linkiyle katıl!</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['#0F0F0F', '#1A1A1A', '#0F0F0F']}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF9500" />
            <Text style={styles.loadingText}>Gruplar yükleniyor...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0F0F0F', '#1A1A1A', '#0F0F0F']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Gruplarım</Text>
            <Text style={styles.subtitle}>Hoş geldin, {user?.displayName}! 🍺</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.logoutButtonGradient}
            >
              <Text style={styles.logoutIcon}>🚪</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <FlatList
          data={groups}
          renderItem={renderGroupItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            groups.length === 0 && styles.listContentEmpty,
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FF9500"
              colors={['#FF9500']}
            />
          }
        />

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateGroup')}
            activeOpacity={0.9}
            style={styles.buttonWrapper}
          >
            <LinearGradient
              colors={['#FF9500', '#FF7A00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createButton}
            >
              <Text style={styles.buttonText}>+ Yeni Grup</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('JoinGroup', { inviteCode: '' })}
            activeOpacity={0.9}
            style={styles.buttonWrapper}
          >
            <LinearGradient
              colors={['#34C759', '#30B350']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.joinButton}
            >
              <Text style={styles.buttonText}>🔗 Gruba Katıl</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  logoutButton: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  logoutButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoutIcon: {
    fontSize: 20,
  },
  listContent: {
    padding: 24,
    paddingTop: 0,
  },
  listContentEmpty: {
    flex: 1,
  },
  groupCard: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  groupCardGradient: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  emojiContainer: {
    marginRight: 16,
    overflow: 'hidden',
    borderRadius: 16,
  },
  emojiGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  groupEmoji: {
    fontSize: 28,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  groupStats: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  arrow: {
    fontSize: 28,
    color: '#FF9500',
    fontWeight: '300',
  },
  inviteCodeBox: {
    backgroundColor: 'rgba(15, 15, 15, 0.6)',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  inviteCodeLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  inviteCode: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF9500',
    letterSpacing: 1.5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  footer: {
    padding: 24,
    paddingTop: 12,
    gap: 12,
  },
  buttonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  createButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  joinButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  limitWarning: {
    fontSize: 13,
    color: '#FF9500',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 4,
  },
});
