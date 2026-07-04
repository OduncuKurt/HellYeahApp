import { StackNavigationProp } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { useTheme } from '../../contexts/ThemeContext';
import { AuthStackParamList } from '../../types';

type EmailVerificationScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'EmailVerification'>;

interface Props {
  navigation: EmailVerificationScreenNavigationProp;
}

const RESEND_COOLDOWN = 60; // saniye
const POLL_INTERVAL = 5000; // 5 saniyede bir kontrol

export default function EmailVerificationScreen({ navigation: _navigation }: Props) {
  const { theme, colors } = useTheme();
  const { showError, showSuccess } = useModal();
  const { user, logout, resendVerificationEmail, checkEmailVerified } = useAuth();

  const [cooldown, setCooldown] = useState<number>(0);
  const [checking, setChecking] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);

  // Animasyonlar
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Giriş animasyonu
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // 🍺 ikonu için pulse animasyonu
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Cooldown sayacı
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Email doğrulama polling - her 5 saniyede kontrol et
  // FIX C-06: AuthContext'ın checkEmailVerified'ını kullan (token refresh dahil)
  const checkVerification = useCallback(async () => {
    try {
      await checkEmailVerified();
      // Doğrulandıysa auth state listener otomatik güncelleyecek
    } catch {
      // sessizce geç
    }
  }, [checkEmailVerified]);

  useEffect(() => {
    const interval = setInterval(checkVerification, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [checkVerification]);

  // emailVerified değişirse (auth state listener'dan) - navigator zaten yönlendirecek
  // Bu ekranda kaldığımız sürece poll ediyoruz

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    const result = await resendVerificationEmail();
    setResending(false);

    if (result.success) {
      setCooldown(RESEND_COOLDOWN);
      showSuccess(
        'Email Gönderildi! 🍺',
        `Doğrulama emaili ${user?.email ?? ''} adresine tekrar gönderildi. Spam klasörünü de kontrol etmeyi unutma!`
      );
    } else {
      showError('Hata', result.error || 'Email gönderilemedi.');
    }
  };

  // FIX C-06: checkEmailVerified ile token refresh dahil kontrol
  const handleCheckNow = async () => {
    setChecking(true);
    try {
      const verified = await checkEmailVerified();
      if (!verified) {
        showError(
          'Henüz Doğrulanmadı',
          'Emailindeki linke henüz tıklamadın. Spam klasörünü de kontrol et!'
        );
      }
      // Eğer doğrulandıysa auth state listener devreye girer
    } catch {
      showError('Hata', 'Kontrol edilemedi. Tekrar dene.');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const isDark = theme === 'dark';
  const maskedEmail = user?.email
    ? user.email.replace(/(.{2}).+(@.+)/, '$1***$2')
    : '';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Top - Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={[styles.logoutText, { color: colors.textSecondary }]}>Çıkış Yap</Text>
        </TouchableOpacity>

        {/* İkon */}
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
          <View style={[styles.iconBg, { backgroundColor: isDark ? '#1A1A1A' : '#FFF8F0' }]}>
            <Text style={styles.iconEmoji}>🍺</Text>
          </View>
          <View style={styles.envelopeOverlay}>
            <Text style={styles.envelopeEmoji}>✉️</Text>
          </View>
        </Animated.View>

        {/* Başlık */}
        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: colors.text }]}>
            Emailini Doğrula
          </Text>
          <Text style={[styles.brandTag, { color: '#F59E0B' }]}>
            HELL YEAH! 🤘
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            <Text style={[styles.emailHighlight, { color: colors.text }]}>{maskedEmail}</Text>
            {'\n'}adresine doğrulama linki gönderdik.
          </Text>
        </View>

        {/* Bilgi Kartı */}
        <View style={[styles.infoCard, {
          backgroundColor: isDark ? '#1C1C1E' : '#FFF',
          borderColor: isDark ? '#2C2C2E' : '#E5E7EB',
        }]}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📬</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Email kutunu aç ve gelen linke tıkla
            </Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]} />
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🚫</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Mail gelmedi mi?{' '}
              <Text style={{ color: '#F59E0B', fontWeight: '600' }}>Spam klasörünü</Text>
              {' '}kontrol et
            </Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]} />
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>⏱️</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Linke tıkladıktan sonra bu ekran{' '}
              <Text style={{ fontWeight: '600', color: colors.text }}>otomatik</Text>
              {' '}açılacak
            </Text>
          </View>
        </View>

        {/* Butonlar */}
        <View style={styles.buttonsSection}>
          {/* Doğrulandı mı kontrol et */}
          <TouchableOpacity
            style={[styles.checkBtn, { backgroundColor: colors.primary }]}
            onPress={handleCheckNow}
            disabled={checking}
            activeOpacity={0.85}
          >
            {checking ? (
              <ActivityIndicator color={isDark ? '#000' : '#FFF'} size="small" />
            ) : (
              <Text style={[styles.checkBtnText, { color: isDark ? '#000' : '#FFF' }]}>
                ✓  Doğruladım, Kontrol Et
              </Text>
            )}
          </TouchableOpacity>

          {/* Tekrar gönder */}
          <TouchableOpacity
            style={[
              styles.resendBtn,
              {
                backgroundColor: 'transparent',
                borderColor: cooldown > 0 ? colors.border : '#F59E0B',
                opacity: cooldown > 0 ? 0.6 : 1,
              }
            ]}
            onPress={handleResend}
            disabled={cooldown > 0 || resending}
            activeOpacity={0.75}
          >
            {resending ? (
              <ActivityIndicator color="#F59E0B" size="small" />
            ) : (
              <Text style={[
                styles.resendBtnText,
                { color: cooldown > 0 ? colors.textSecondary : '#F59E0B' }
              ]}>
                {cooldown > 0
                  ? `Tekrar gönder (${cooldown}s)`
                  : '📧  Email Tekrar Gönder'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoutBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '500',
  },
  iconContainer: {
    marginTop: 24,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  iconEmoji: {
    fontSize: 56,
  },
  envelopeOverlay: {
    position: 'absolute',
    bottom: 0,
    right: -8,
    backgroundColor: '#F59E0B',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  envelopeEmoji: {
    fontSize: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  brandTag: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '500',
  },
  emailHighlight: {
    fontWeight: '700',
  },
  infoCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 32,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  infoIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  infoDivider: {
    height: 1,
    marginHorizontal: 20,
  },
  buttonsSection: {
    width: '100%',
    gap: 12,
  },
  checkBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  checkBtnText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  resendBtn: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  resendBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
