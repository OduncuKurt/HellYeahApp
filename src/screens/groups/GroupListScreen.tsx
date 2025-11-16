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
        activeOpacity={0.7}
      >
        <View style={styles.groupHeader}>
          <Text style={styles.groupEmoji}>🍺</Text>
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9500" />
        <Text style={styles.loadingText}>Gruplar yükleniyor...</Text>
      </View>
    );
  }

  const canCreateGroup = groups.length < 3;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Gruplarım</Text>
          <Text style={styles.subtitle}>Hoş geldin, {user?.displayName}! 🍺</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
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
          style={[styles.createButton, !canCreateGroup && styles.buttonDisabled]}
          onPress={() => navigation.navigate('CreateGroup')}
          disabled={!canCreateGroup}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>+ Yeni Grup</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.joinButton}
          onPress={() => navigation.navigate('JoinGroup', { inviteCode: '' })}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>🔗 Gruba Katıl</Text>
        </TouchableOpacity>

        {!canCreateGroup && (
          <Text style={styles.limitWarning}>⚠️ Maksimum 3 gruba üye olabilirsiniz</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
  },
  logoutButton: {
    padding: 8,
  },
  logoutIcon: {
    fontSize: 24,
  },
  listContent: {
    padding: 24,
    paddingTop: 0,
  },
  listContentEmpty: {
    flex: 1,
  },
  groupCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupEmoji: {
    fontSize: 40,
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  groupStats: {
    fontSize: 14,
    color: '#999',
  },
  arrow: {
    fontSize: 24,
    color: '#666',
  },
  inviteCodeBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inviteCodeLabel: {
    fontSize: 12,
    color: '#999',
  },
  inviteCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF9500',
    letterSpacing: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  footer: {
    padding: 24,
    paddingTop: 12,
    gap: 12,
  },
  createButton: {
    backgroundColor: '#FF9500',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  limitWarning: {
    fontSize: 12,
    color: '#FF9500',
    textAlign: 'center',
  },
});
