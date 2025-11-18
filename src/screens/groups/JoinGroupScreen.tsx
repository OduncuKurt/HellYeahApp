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
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0F0F0F', '#1A1A1A', '#0F0F0F']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.backButtonText}>← Geri</Text>
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={['#34C759', '#30B350']}
                  style={styles.logoGradient}
                >
                  <Text style={styles.logoEmoji}>🔗</Text>
                </LinearGradient>
              </View>
              <Text style={styles.title}>Gruba Katıl</Text>
              <Text style={styles.subtitle}>Arkadaşından aldığın kodu gir</Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              {/* Code Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Davet Kodu</Text>
                <View style={styles.inputContainer}>
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
                </View>
                <Text style={styles.hint}>Format: BEER-XXXX (örn: BEER-2A5X)</Text>
              </View>

              {/* Info Box */}
              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>ℹ️ Nasıl Çalışır?</Text>
                <Text style={styles.infoText}>1. Arkadaşından davet kodunu al</Text>
                <Text style={styles.infoText}>2. Kodu yukarıya gir</Text>
                <Text style={styles.infoText}>3. Gruba katıl ve birlikte sayın!</Text>
              </View>

              {/* Join Button */}
              <TouchableOpacity
                onPress={handleJoinGroup}
                disabled={loading}
                activeOpacity={0.9}
                style={styles.buttonWrapper}
              >
                <LinearGradient
                  colors={['#34C759', '#30B350']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.joinButton, loading && styles.buttonDisabled]}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.joinButtonText}>Gruba Katıl</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9500',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  logoEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 8,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 10,
    marginLeft: 4,
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  input: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 22,
    color: '#FFF',
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 2,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.2)',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#34C759',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  infoText: {
    fontSize: 13,
    color: '#CCC',
    marginBottom: 6,
    lineHeight: 20,
    fontWeight: '500',
  },
  buttonWrapper: {
    marginTop: 8,
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
  joinButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
