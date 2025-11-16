import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { joinGroupByInviteCode } from '../../services/groupService';
import { validateInviteCode, normalizeInviteCode } from '../../utils/inviteCode';
import { MainStackParamList } from '../../types';

type JoinGroupScreenNavigationProp = StackNavigationProp<MainStackParamList, 'JoinGroup'>;
type JoinGroupScreenRouteProp = RouteProp<MainStackParamList, 'JoinGroup'>;

interface Props {
  navigation: JoinGroupScreenNavigationProp;
  route: JoinGroupScreenRouteProp;
}

export default function JoinGroupScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const [inviteCode, setInviteCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Deep link'ten gelen invite code varsa otomatik doldur
  useEffect(() => {
    if (route.params?.inviteCode) {
      setInviteCode(route.params.inviteCode);
    }
  }, [route.params?.inviteCode]);

  const handleJoinGroup = async (): Promise<void> => {
    const normalizedCode = normalizeInviteCode(inviteCode);

    if (!normalizedCode) {
      Alert.alert('Hata', 'Lütfen davet kodunu girin.');
      return;
    }

    if (!validateInviteCode(normalizedCode)) {
      Alert.alert('Hata', 'Geçersiz davet kodu formatı.\nFormat: BEER-XXXX');
      return;
    }

    if (!user) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı.');
      return;
    }

    setLoading(true);

    const result = await joinGroupByInviteCode(
      normalizedCode,
      user.uid,
      user.displayName,
      user.avatar
    );

    setLoading(false);

    if (result.success) {
      Alert.alert(
        '🎉 Gruba Katıldın!',
        'Artık bu gruptaki biralara erişebilirsin!',
        [
          {
            text: 'Tamam',
            onPress: () => navigation.navigate('GroupList'),
          },
        ]
      );
    } else {
      Alert.alert('Hata', result.error || 'Gruba katılınamadı.');
    }
  };

  const formatInviteCode = (text: string): void => {
    // Otomatik BEER- ekle ve formatla
    let formatted = text.toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (formatted.length > 0 && !formatted.startsWith('BEER')) {
      formatted = 'BEER-' + formatted.substring(0, 4);
    } else if (formatted.length > 4) {
      formatted = formatted.substring(0, 4) + '-' + formatted.substring(4, 8);
    }

    setInviteCode(formatted);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.backButtonText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gruba Katıl</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.emoji}>🔗</Text>
        <Text style={styles.title}>Davet Kodu Gir</Text>
        <Text style={styles.subtitle}>Arkadaşından aldığın kodu gir</Text>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Davet Kodu</Text>
            <TextInput
              style={styles.input}
              placeholder="BEER-XXXX"
              placeholderTextColor="#666"
              value={inviteCode}
              onChangeText={formatInviteCode}
              maxLength={9}
              autoCapitalize="characters"
              editable={!loading}
              autoFocus={!route.params?.inviteCode}
            />
            <Text style={styles.hint}>Format: BEER-XXXX (örn: BEER-2A5X)</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>ℹ️ Nasıl Çalışır?</Text>
            <Text style={styles.infoText}>1. Arkadaşından davet kodunu al</Text>
            <Text style={styles.infoText}>2. Kodu yukarıya gir</Text>
            <Text style={styles.infoText}>3. Gruba katıl ve birlikte sayın!</Text>
          </View>

          <TouchableOpacity
            style={[styles.joinButton, loading && styles.buttonDisabled]}
            onPress={handleJoinGroup}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.joinButtonText}>Gruba Katıl</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    color: '#FF9500',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    color: '#fff',
    borderWidth: 2,
    borderColor: '#3a3a3a',
    textAlign: 'center',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF9500',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
    lineHeight: 18,
  },
  joinButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
