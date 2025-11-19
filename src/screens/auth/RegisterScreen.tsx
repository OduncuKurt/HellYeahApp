import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import { AuthStackParamList } from '../../types';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

export default function RegisterScreen({ navigation }: Props) {
  const [username, setUsername] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [usernameError, setUsernameError] = useState<string>('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState<boolean>(false);
  const [displayNameError, setDisplayNameError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>('');
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | ''>('');
  const { register, loading, checkUsernameAvailability } = useAuth();
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);

  // Email validation
  const validateEmail = (text: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  // Email domain validation - popüler domainleri kontrol et
  const validateEmailDomain = (text: string): { valid: boolean; error: string } => {
    if (!validateEmail(text)) {
      return { valid: false, error: 'Geçerli bir email adresi girin' };
    }

    const domain = text.split('@')[1]?.toLowerCase();

    // Popüler email domainleri
    const validDomains = [
      'gmail.com',
      'hotmail.com',
      'outlook.com',
      'yahoo.com',
      'icloud.com',
      'yandex.com',
      'mail.com',
      'protonmail.com',
      'live.com',
      'msn.com',
      'aol.com',
      // Türkiye domainleri
      'hotmail.com.tr',
      'outlook.com.tr',
      'yahoo.com.tr',
    ];

    // Yaygın yazım hataları
    const invalidDomains = [
      'gmal.com', 'gmial.com', 'gmail.co', 'gmai.com', 'gamil.com', 'gnail.com',
      'hotmal.com', 'hotmial.com', 'hotmail.co',
      'outlok.com', 'outloo.com',
      'yaho.com', 'yahooo.com',
    ];

    // Geçerli domain mi kontrol et
    const isValidDomain = validDomains.includes(domain) ||
                          domain.endsWith('.edu.tr') ||
                          domain.endsWith('.edu') ||
                          domain.endsWith('.gov.tr') ||
                          domain.endsWith('.org') ||
                          domain.endsWith('.net');

    // Yazım hatası veya geçersiz domain
    if (invalidDomains.includes(domain) || !isValidDomain) {
      return {
        valid: false,
        error: 'Geçerli bir email adresi girin'
      };
    }

    return { valid: true, error: '' };
  };

  // Password strength calculator
  const calculatePasswordStrength = (text: string): 'weak' | 'medium' | 'strong' | '' => {
    if (text.length === 0) return '';
    if (text.length < 6) return 'weak';

    let strength = 0;
    if (text.length >= 8) strength++;
    if (/[a-z]/.test(text) && /[A-Z]/.test(text)) strength++;
    if (/\d/.test(text)) strength++;
    if (/[^a-zA-Z\d]/.test(text)) strength++;

    if (strength >= 3) return 'strong';
    if (strength >= 1) return 'medium';
    return 'weak';
  };

  // DisplayName validation
  const validateDisplayName = (text: string): { valid: boolean; error: string } => {
    const trimmed = text.trim();

    if (trimmed.length === 0) {
      return { valid: false, error: '' };
    }

    if (trimmed.length < 2) {
      return { valid: false, error: 'En az 2 karakter olmalı' };
    }

    // Sadece sayı mı kontrol et
    if (/^\d+$/.test(trimmed)) {
      return { valid: false, error: 'İsim sadece sayılardan oluşamaz' };
    }

    // En az 1 harf içermeli (Türkçe dahil)
    if (!/[a-zA-ZçÇğĞıİöÖşŞüÜ]/.test(trimmed)) {
      return { valid: false, error: 'En az bir harf içermeli' };
    }

    // Sadece izin verilen karakterler: harf, rakam, boşluk, tire, alt çizgi
    if (!/^[a-zA-ZçÇğĞıİöÖşŞüÜ0-9\s\-_]+$/.test(trimmed)) {
      return { valid: false, error: 'Özel karakterler kullanılamaz' };
    }

    return { valid: true, error: '' };
  };

  // Username validation
  const validateUsername = (text: string): { valid: boolean; error: string } => {
    const trimmed = text.trim().toLowerCase();

    if (trimmed.length === 0) {
      return { valid: false, error: '' };
    }

    if (trimmed.length < 3) {
      return { valid: false, error: 'En az 3 karakter olmalı' };
    }

    if (trimmed.length > 20) {
      return { valid: false, error: 'En fazla 20 karakter olabilir' };
    }

    // Sadece harf, rakam ve alt çizgi
    if (!/^[a-z0-9_]+$/.test(trimmed)) {
      return { valid: false, error: 'Sadece harf, rakam ve _ kullanılabilir' };
    }

    // Rakamla başlayamaz
    if (/^\d/.test(trimmed)) {
      return { valid: false, error: 'Rakamla başlayamaz' };
    }

    return { valid: true, error: '' };
  };

  // Handle username change with debounced availability check
  const handleUsernameChange = (text: string): void => {
    const cleaned = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(cleaned);
    setUsernameAvailable(null);

    // Clear previous timeout
    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }

    if (cleaned.length === 0) {
      setUsernameError('');
      return;
    }

    const validation = validateUsername(cleaned);
    if (!validation.valid) {
      setUsernameError(validation.error);
      return;
    }

    setUsernameError('');
    setCheckingUsername(true);

    // Debounce the availability check
    usernameCheckTimeout.current = setTimeout(async () => {
      const isAvailable = await checkUsernameAvailability(cleaned);
      setUsernameAvailable(isAvailable);
      setCheckingUsername(false);
      if (!isAvailable) {
        setUsernameError('Bu kullanıcı adı zaten alınmış');
      }
    }, 500);
  };

  // Handle input changes with validation
  const handleDisplayNameChange = (text: string): void => {
    setDisplayName(text);
    if (text.length > 0) {
      const validation = validateDisplayName(text);
      setDisplayNameError(validation.error);
    } else {
      setDisplayNameError('');
    }
  };

  const handleEmailChange = (text: string): void => {
    setEmail(text);
    if (text.length > 0) {
      const validation = validateEmailDomain(text);
      if (!validation.valid) {
        setEmailError(validation.error);
      } else {
        setEmailError('');
      }
    } else {
      setEmailError('');
    }
  };

  const handlePasswordChange = (text: string): void => {
    setPassword(text);
    const strength = calculatePasswordStrength(text);
    setPasswordStrength(strength);

    if (text.length > 0 && text.length < 6) {
      setPasswordError('Şifre en az 6 karakter olmalı');
    } else {
      setPasswordError('');
    }

    // Check confirm password match
    if (confirmPassword && text !== confirmPassword) {
      setConfirmPasswordError('Şifreler eşleşmiyor');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (text: string): void => {
    setConfirmPassword(text);
    if (text.length > 0 && text !== password) {
      setConfirmPasswordError('Şifreler eşleşmiyor');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleRegister = async (): Promise<void> => {
    // Validate all fields
    if (!username || !displayName || !email || !password || !confirmPassword) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      setUsernameError(usernameValidation.error || 'Geçerli bir kullanıcı adı girin');
      return;
    }

    if (usernameAvailable === false) {
      setUsernameError('Bu kullanıcı adı zaten alınmış');
      return;
    }

    const nameValidation = validateDisplayName(displayName);
    if (!nameValidation.valid) {
      setDisplayNameError(nameValidation.error || 'Geçerli bir isim girin');
      return;
    }

    const emailValidation = validateEmailDomain(email);
    if (!emailValidation.valid) {
      setEmailError(emailValidation.error);
      return;
    }

    if (password.length < 6) {
      setPasswordError('Şifre en az 6 karakter olmalı');
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Şifreler eşleşmiyor');
      return;
    }

    const result = await register(email, password, username, displayName);
    if (!result.success) {
      Alert.alert('Kayıt Hatası', result.error || 'Kayıt oluşturulamadı.');
    } else {
      Alert.alert('Başarılı', 'Hesabınız oluşturuldu!');
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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
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
              <Text style={styles.title}>Hesap Oluştur</Text>
              <Text style={styles.subtitle}>Hemen aramıza katıl!</Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              {/* Username Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Kullanıcı Adı</Text>
                <View style={[
                  styles.inputContainer,
                  usernameError ? styles.inputError : null,
                  usernameAvailable === true ? styles.inputSuccess : null
                ]}>
                  <TextInput
                    style={styles.input}
                    placeholder="kullanici_adi"
                    placeholderTextColor="#666"
                    value={username}
                    onChangeText={handleUsernameChange}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                  {checkingUsername && (
                    <ActivityIndicator
                      size="small"
                      color="#FF9500"
                      style={styles.inputIcon}
                    />
                  )}
                  {!checkingUsername && usernameAvailable === true && (
                    <Text style={styles.availableIcon}>✓</Text>
                  )}
                </View>
                {usernameError ? (
                  <Text style={styles.errorText}>{usernameError}</Text>
                ) : usernameAvailable === true ? (
                  <Text style={styles.successText}>Kullanılabilir</Text>
                ) : (
                  <Text style={styles.hintText}>3-20 karakter, harf, rakam ve _</Text>
                )}
              </View>

              {/* Name Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Ad Soyad</Text>
                <View style={[
                  styles.inputContainer,
                  displayNameError ? styles.inputError : null
                ]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Adın Soyadın"
                    placeholderTextColor="#666"
                    value={displayName}
                    onChangeText={handleDisplayNameChange}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>
                {displayNameError ? (
                  <Text style={styles.errorText}>{displayNameError}</Text>
                ) : null}
              </View>

              {/* Email Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>E-posta</Text>
                <View style={[
                  styles.inputContainer,
                  emailError ? styles.inputError : null
                ]}>
                  <TextInput
                    style={styles.input}
                    placeholder="ornek@email.com"
                    placeholderTextColor="#666"
                    value={email}
                    onChangeText={handleEmailChange}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    editable={!loading}
                  />
                </View>
                {emailError ? (
                  <Text style={styles.errorText}>{emailError}</Text>
                ) : null}
              </View>

              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Şifre</Text>
                <View style={[
                  styles.inputContainer,
                  passwordError ? styles.inputError : null
                ]}>
                  <TextInput
                    style={[styles.input, styles.inputWithIcon]}
                    placeholder="••••••••"
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={handlePasswordChange}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.eyeIconText}>
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {passwordError ? (
                  <Text style={styles.errorText}>{passwordError}</Text>
                ) : passwordStrength ? (
                  <View style={styles.strengthContainer}>
                    <View style={styles.strengthBars}>
                      <View style={[
                        styles.strengthBar,
                        passwordStrength === 'weak' && styles.strengthWeak,
                        passwordStrength === 'medium' && styles.strengthMedium,
                        passwordStrength === 'strong' && styles.strengthStrong,
                      ]} />
                      <View style={[
                        styles.strengthBar,
                        (passwordStrength === 'medium' || passwordStrength === 'strong') && styles.strengthMedium,
                        passwordStrength === 'strong' && styles.strengthStrong,
                      ]} />
                      <View style={[
                        styles.strengthBar,
                        passwordStrength === 'strong' && styles.strengthStrong,
                      ]} />
                    </View>
                    <Text style={[
                      styles.strengthText,
                      passwordStrength === 'weak' && styles.strengthTextWeak,
                      passwordStrength === 'medium' && styles.strengthTextMedium,
                      passwordStrength === 'strong' && styles.strengthTextStrong,
                    ]}>
                      {passwordStrength === 'weak' && 'Zayıf'}
                      {passwordStrength === 'medium' && 'Orta'}
                      {passwordStrength === 'strong' && 'Güçlü'}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Şifre Tekrar</Text>
                <View style={[
                  styles.inputContainer,
                  confirmPasswordError ? styles.inputError : null
                ]}>
                  <TextInput
                    style={[styles.input, styles.inputWithIcon]}
                    placeholder="••••••••"
                    placeholderTextColor="#666"
                    value={confirmPassword}
                    onChangeText={handleConfirmPasswordChange}
                    secureTextEntry={!showConfirmPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.eyeIconText}>
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {confirmPasswordError ? (
                  <Text style={styles.errorText}>{confirmPasswordError}</Text>
                ) : null}
              </View>

              {/* Register Button */}
              <TouchableOpacity
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.9}
                style={styles.buttonWrapper}
              >
                <LinearGradient
                  colors={['#FF9500', '#FF7A00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.registerButton, loading && styles.buttonDisabled]}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.registerButtonText}>Kayıt Ol</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Login Link */}
              <TouchableOpacity
                style={styles.loginLink}
                onPress={() => navigation.goBack()}
                disabled={loading}
              >
                <Text style={styles.loginLinkText}>
                  Zaten hesabın var mı?{' '}
                  <Text style={styles.loginLinkBold}>Giriş Yap</Text>
                </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputError: {
    borderColor: 'rgba(255, 59, 48, 0.5)',
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
  },
  inputSuccess: {
    borderColor: 'rgba(52, 199, 89, 0.5)',
    backgroundColor: 'rgba(52, 199, 89, 0.05)',
  },
  inputIcon: {
    position: 'absolute',
    right: 16,
  },
  availableIcon: {
    position: 'absolute',
    right: 16,
    fontSize: 18,
    color: '#34C759',
    fontWeight: '700',
  },
  successText: {
    color: '#34C759',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  hintText: {
    color: '#666',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
  },
  inputWithIcon: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  eyeIconText: {
    fontSize: 20,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  strengthBars: {
    flexDirection: 'row',
    flex: 1,
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  strengthWeak: {
    backgroundColor: '#FF3B30',
  },
  strengthMedium: {
    backgroundColor: '#FF9500',
  },
  strengthStrong: {
    backgroundColor: '#34C759',
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'right',
  },
  strengthTextWeak: {
    color: '#FF3B30',
  },
  strengthTextMedium: {
    color: '#FF9500',
  },
  strengthTextStrong: {
    color: '#34C759',
  },
  buttonWrapper: {
    marginTop: 8,
  },
  registerButton: {
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
  registerButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginLinkText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  loginLinkBold: {
    color: '#FF9500',
    fontWeight: '700',
  },
});
