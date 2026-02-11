import { StackNavigationProp } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { useTheme } from '../../contexts/ThemeContext';
import { AuthStackParamList } from '../../types';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

export default function RegisterScreen({ navigation }: Props) {
  const { theme, colors } = useTheme();
  const { showError, showSuccess } = useModal();
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
      } else {
        setUsernameError(''); // Kullanılabilir ise hata mesajını temizle
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
      showError('Hata', 'Lütfen tüm alanları doldurun.');
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
      showError('Kayıt Hatası', result.error || 'Kayıt oluşturulamadı.');
    } else {
      showSuccess('Başarılı', 'Hesabınız oluşturuldu!');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
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
            <Text style={[styles.backButtonText, { color: colors.text }]}>← Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Join us today</Text>
          </View>

            {/* Form Card */}
            <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Username Input */}
              <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: colors.text }]}>Kullanıcı Adı</Text>
                <View style={[
                  styles.inputContainer,
                  { backgroundColor: theme === 'dark' ? '#2C2C2C' : '#F5F5F5', borderColor: colors.border },
                  usernameError ? { borderColor: colors.error, backgroundColor: theme === 'dark' ? '#3A2020' : 'rgba(255, 59, 48, 0.05)' } : null,
                  usernameAvailable === true ? { borderColor: '#34C759', backgroundColor: theme === 'dark' ? '#1A2A1E' : 'rgba(52, 199, 89, 0.05)' } : null
                ]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="kullanici_adi"
                    placeholderTextColor={colors.textSecondary}
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
                {usernameError && !checkingUsername ? (
                  <Text style={[styles.errorText, { color: colors.error }]}>{usernameError}</Text>
                ) : usernameAvailable === true && !checkingUsername ? (
                  <Text style={styles.successText}>Kullanılabilir</Text>
                ) : checkingUsername ? (
                  <Text style={[styles.hintText, { color: colors.textSecondary }]}>Kontrol ediliyor...</Text>
                ) : (
                  <Text style={[styles.hintText, { color: colors.textSecondary }]}>3-20 karakter, harf, rakam ve _</Text>
                )}
              </View>

              {/* Name Input */}
              <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: colors.text }]}>Ad Soyad</Text>
                <View style={[
                  styles.inputContainer,
                  { backgroundColor: theme === 'dark' ? '#2C2C2C' : '#F5F5F5', borderColor: colors.border },
                  displayNameError ? { borderColor: colors.error, backgroundColor: theme === 'dark' ? '#3A2020' : 'rgba(255, 59, 48, 0.05)' } : null
                ]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Adın Soyadın"
                    placeholderTextColor={colors.textSecondary}
                    value={displayName}
                    onChangeText={handleDisplayNameChange}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>
                {displayNameError ? (
                  <Text style={[styles.errorText, { color: colors.error }]}>{displayNameError}</Text>
                ) : null}
              </View>

              {/* Email Input */}
              <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: colors.text }]}>E-posta</Text>
                <View style={[
                  styles.inputContainer,
                  { backgroundColor: theme === 'dark' ? '#2C2C2C' : '#F5F5F5', borderColor: colors.border },
                  emailError ? { borderColor: colors.error, backgroundColor: theme === 'dark' ? '#3A2020' : 'rgba(255, 59, 48, 0.05)' } : null
                ]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="ornek@email.com"
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={handleEmailChange}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    editable={!loading}
                  />
                </View>
                {emailError ? (
                  <Text style={[styles.errorText, { color: colors.error }]}>{emailError}</Text>
                ) : null}
              </View>

              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: colors.text }]}>Şifre</Text>
                <View style={[
                  styles.inputContainer,
                  { backgroundColor: theme === 'dark' ? '#2C2C2C' : '#F5F5F5', borderColor: colors.border },
                  passwordError ? { borderColor: colors.error, backgroundColor: theme === 'dark' ? '#3A2020' : 'rgba(255, 59, 48, 0.05)' } : null
                ]}>
                  <TextInput
                    style={[styles.input, styles.inputWithIcon, { color: colors.text }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textSecondary}
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
                  <Text style={[styles.errorText, { color: colors.error }]}>{passwordError}</Text>
                ) : passwordStrength ? (
                  <View style={styles.strengthContainer}>
                    <View style={styles.strengthBars}>
                      <View style={[
                        styles.strengthBar,
                        { backgroundColor: colors.border },
                        passwordStrength === 'weak' && styles.strengthWeak,
                        passwordStrength === 'medium' && styles.strengthMedium,
                        passwordStrength === 'strong' && styles.strengthStrong,
                      ]} />
                      <View style={[
                        styles.strengthBar,
                        { backgroundColor: colors.border },
                        (passwordStrength === 'medium' || passwordStrength === 'strong') && styles.strengthMedium,
                        passwordStrength === 'strong' && styles.strengthStrong,
                      ]} />
                      <View style={[
                        styles.strengthBar,
                        { backgroundColor: colors.border },
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
                <Text style={[styles.label, { color: colors.text }]}>Şifre Tekrar</Text>
                <View style={[
                  styles.inputContainer,
                  { backgroundColor: theme === 'dark' ? '#2C2C2C' : '#F5F5F5', borderColor: colors.border },
                  confirmPasswordError ? { borderColor: colors.error, backgroundColor: theme === 'dark' ? '#3A2020' : 'rgba(255, 59, 48, 0.05)' } : null
                ]}>
                  <TextInput
                    style={[styles.input, styles.inputWithIcon, { color: colors.text }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textSecondary}
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
                  <Text style={[styles.errorText, { color: colors.error }]}>{confirmPasswordError}</Text>
                ) : null}
              </View>

              {/* Register Button */}
              <TouchableOpacity
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.9}
                style={[styles.registerButton, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
              >
                {loading ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <Text style={[styles.registerButtonText, { color: colors.background }]}>Create Account</Text>
                )}
              </TouchableOpacity>

              {/* Login Link */}
              <TouchableOpacity
                style={styles.loginLink}
                onPress={() => navigation.goBack()}
                disabled={loading}
              >
                <Text style={[styles.loginLinkText, { color: colors.textSecondary }]}>
                  Already have an account?{' '}
                  <Text style={[styles.loginLinkBold, { color: colors.text }]}>Log In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
  },
  inputSuccess: {
    borderColor: '#34C759',
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
    fontWeight: '500',
  },
  hintText: {
    color: '#999',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
  inputWithIcon: {
    paddingRight: 60,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  eyeIconText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 6,
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
    backgroundColor: '#E0E0E0',
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
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  registerButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  loginLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginLinkText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  loginLinkBold: {
    color: '#000',
    fontWeight: '700',
  },
});
