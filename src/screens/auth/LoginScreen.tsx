import { StackNavigationProp } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
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

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export default function LoginScreen({ navigation }: Props) {
  const { theme, colors } = useTheme();
  const { showError } = useModal();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const { login, loading } = useAuth();

  // Email validation
  const validateEmail = (text: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  // Handle email change with validation
  const handleEmailChange = (text: string): void => {
    setEmail(text);
    if (text.length > 0 && !validateEmail(text)) {
      setEmailError('Geçerli bir email adresi girin');
    } else {
      setEmailError('');
    }
  };

  // Handle password change with validation
  const handlePasswordChange = (text: string): void => {
    setPassword(text);
    if (text.length > 0 && text.length < 6) {
      setPasswordError('Şifre en az 6 karakter olmalı');
    } else {
      setPasswordError('');
    }
  };

  const handleLogin = async (): Promise<void> => {
    // Validate
    if (!email || !password) {
      showError('Hata', 'Lütfen email ve şifrenizi girin.');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Geçerli bir email adresi girin');
      return;
    }

    if (password.length < 6) {
      setPasswordError('Şifre en az 6 karakter olmalı');
      return;
    }

    const result = await login(email, password);
    if (!result.success) {
      showError('Giriş Hatası', result.error || 'Giriş yapılamadı.');
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Hell Yeah</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Welcome back</Text>
          </View>

          {/* Form Card */}
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <Text style={[styles.label, { color: colors.text }]}>Email</Text>
              <View style={[
                styles.inputContainer,
                { backgroundColor: theme === 'dark' ? '#2C2C2C' : '#F5F5F5', borderColor: colors.border },
                emailError ? { borderColor: colors.error, backgroundColor: theme === 'dark' ? '#3A2020' : 'rgba(255, 59, 48, 0.05)' } : null
              ]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="your@email.com"
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
              <Text style={[styles.label, { color: colors.text }]}>Password</Text>
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
                  <Text style={[styles.eyeIconText, { color: colors.textSecondary }]}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text style={[styles.errorText, { color: colors.error }]}>{passwordError}</Text>
              ) : null}
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => navigation.navigate('ForgotPassword')}
              disabled={loading}
            >
              <Text style={[styles.forgotPasswordText, { color: colors.textSecondary }]}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.9}
              style={[styles.loginButton, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
            >
              {loading ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <Text style={[styles.loginButtonText, { color: colors.background }]}>Log In</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textSecondary }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: theme === 'dark' ? '#2C2C2C' : '#F5F5F5', borderColor: colors.border }]}
              onPress={() => navigation.navigate('Register')}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Create Account</Text>
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
    paddingVertical: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    color: '#999',
    paddingHorizontal: 16,
    fontSize: 13,
    fontWeight: '500',
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  secondaryButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '600',
  },
});
