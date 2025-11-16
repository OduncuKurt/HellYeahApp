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
} from 'react-native';
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

    if (!user) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı.');
      return;
    }

    setLoading(true);

    const result = await createGroup(
      groupName.trim(),
      user.uid,
      user.displayName,
      user.avatar
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
        <Text style={styles.headerTitle}>Yeni Grup</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.emoji}>🍺</Text>
        <Text style={styles.title}>Grup Oluştur</Text>
        <Text style={styles.subtitle}>Arkadaşlarınla bira sayın!</Text>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Grup Adı</Text>
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
            <Text style={styles.hint}>{groupName.length}/30 karakter</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>ℹ️ Bilgi</Text>
            <Text style={styles.infoText}>• Maksimum 3 gruba üye olabilirsiniz</Text>
            <Text style={styles.infoText}>• Grup oluşturulunca size özel bir davet kodu verilecek</Text>
            <Text style={styles.infoText}>• Bu kodu arkadaşlarınla paylaş!</Text>
          </View>

          <TouchableOpacity
            style={[styles.createButton, loading && styles.buttonDisabled]}
            onPress={handleCreateGroup}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>Grup Oluştur</Text>
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
    fontSize: 18,
    color: '#fff',
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
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
  createButton: {
    backgroundColor: '#FF9500',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
