import React, { useState } from 'react';
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
import { useAuth } from '../../contexts/AuthContext';
import { createGroup } from '../../services/groupService';
import { MainStackParamList } from '../../types';

type CreateGroupScreenNavigationProp = StackNavigationProp<MainStackParamList, 'CreateGroup'>;

interface Props {
  navigation: CreateGroupScreenNavigationProp;
}

export default function CreateGroupScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [groupName, setGroupName] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // +7 gün
  );
  const [loading, setLoading] = useState<boolean>(false);

  const handleCreateGroup = async (): Promise<void> => {
    if (!groupName.trim()) {
      Alert.alert('Hata', 'Lütfen grup adı girin.');
      return;
    }

    if (groupName.length < 3) {
      Alert.alert('Hata', 'Grup adı en az 3 karakter olmalıdır.');
      return;
    }

    // Tarih validasyonu
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      Alert.alert('Hata', 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır.');
      return;
    }

    if (!user) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı.');
      return;
    }

    setLoading(true);

    const result = await createGroup(
      groupName.trim(),
      user.uid,
      user.displayName,
      user.avatar,
      start.toISOString(),
      end.toISOString()
    );

    setLoading(false);

    if (result.success && result.inviteCode) {
      Alert.alert(
        '🎉 Grup Oluşturuldu!',
        `Davet Kodu: ${result.inviteCode}\n\nArkadaşlarınla bu kodu paylaş!`,
        [
          {
            text: 'Tamam',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      Alert.alert('Hata', result.error || 'Grup oluşturulamadı.');
    }
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
                  colors={['#FF9500', '#FFB84D']}
                  style={styles.logoGradient}
                >
                  <Text style={styles.logoEmoji}>🍺</Text>
                </LinearGradient>
              </View>
              <Text style={styles.title}>Grup Oluştur</Text>
              <Text style={styles.subtitle}>Arkadaşlarınla bira sayın!</Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              {/* Name Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Grup Adı</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Örn: Takım Arkadaşları"
                    placeholderTextColor="#666"
                    value={groupName}
                    onChangeText={setGroupName}
                    maxLength={30}
                    editable={!loading}
                    autoFocus
                  />
                </View>
                <Text style={styles.hint}>{groupName.length}/30 karakter</Text>
              </View>

              {/* Date Inputs */}
              <View style={styles.dateRow}>
                <View style={[styles.inputWrapper, styles.dateInput]}>
                  <Text style={styles.label}>Başlangıç 📅</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#666"
                      value={startDate}
                      onChangeText={setStartDate}
                      editable={!loading}
                    />
                  </View>
                </View>

                <View style={[styles.inputWrapper, styles.dateInput]}>
                  <Text style={styles.label}>Bitiş 🏁</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#666"
                      value={endDate}
                      onChangeText={setEndDate}
                      editable={!loading}
                    />
                  </View>
                </View>
              </View>

              {/* Info Box */}
              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>ℹ️ Bilgi</Text>
                <Text style={styles.infoText}>• Grup oluşturulunca size özel bir davet kodu verilecek</Text>
                <Text style={styles.infoText}>• Bu kodu arkadaşlarınla paylaş!</Text>
                <Text style={styles.infoText}>• Yarışma tarihleri sonra değiştirilebilir</Text>
              </View>

              {/* Create Button */}
              <TouchableOpacity
                onPress={handleCreateGroup}
                disabled={loading}
                activeOpacity={0.9}
                style={styles.buttonWrapper}
              >
                <LinearGradient
                  colors={['#FF9500', '#FF7A00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.createButton, loading && styles.buttonDisabled]}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.createButtonText}>Grup Oluştur</Text>
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
    shadowColor: '#FF9500',
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
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  dateInput: {
    flex: 1,
    marginBottom: 0,
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
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    marginLeft: 4,
  },
  infoBox: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.2)',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF9500',
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
  createButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
