import { LinkingOptions, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Linking from 'expo-linking';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { AuthStackParamList, MainStackParamList } from '../types';

// Auth Screens
import EmailVerificationScreen from '../screens/auth/EmailVerificationScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Screens
import BeerDetailScreen from '../screens/beer/BeerDetailScreen';
import FeedScreen from '../screens/feed/FeedScreen';
import FriendsScreen from '../screens/friends/FriendsScreen';
import LeaderboardScreen from '../screens/leaderboard/LeaderboardScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const AuthStack = createStackNavigator<AuthStackParamList>();
const MainStack = createStackNavigator<MainStackParamList>();

// Auth Stack - Giriş yapmamış kullanıcılar için
function AuthStackNavigator() {
  const { colors } = useTheme();
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="EmailVerification" component={EmailVerificationScreen} />
    </AuthStack.Navigator>
  );
}

// Main Stack - Giriş yapmış kullanıcılar için
function MainStackNavigator() {
  const { colors } = useTheme();
  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <MainStack.Screen name="Feed" component={FeedScreen} />
      <MainStack.Screen name="Friends" component={FriendsScreen} />
      <MainStack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <MainStack.Screen name="Profile" component={ProfileScreen} />
      <MainStack.Screen name="BeerDetail" component={BeerDetailScreen} />
    </MainStack.Navigator>
  );
}

// Deep Linking Configuration (opsiyonel - şimdilik basit)
const linking: LinkingOptions<any> = {
  prefixes: [Linking.createURL('/'), 'hellyeahapp://'],
  config: {
    screens: {
      Feed: 'feed',
      Friends: 'friends',
      Leaderboard: 'leaderboard',
      Profile: 'profile/:userId?',
      BeerDetail: 'beer/:beerId',
    },
  },
};

// Ana Navigator
export default function AppNavigator() {
  const { user, initializing, emailVerified } = useAuth();
  const { theme, colors } = useTheme();

  // İlk yüklenme sırasında loading göster
  if (initializing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const navigationTheme = theme === 'dark' ? DarkTheme : DefaultTheme;

  // Email doğrulanmamışsa verification ekranında tut
  const showVerification = user && !emailVerified;

  return (
    <NavigationContainer linking={linking} theme={navigationTheme}>
      {!user ? (
        <AuthStackNavigator />
      ) : showVerification ? (
        // Email doğrulanmamış: kendi stack içinde EmailVerification göster
        <AuthStack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: colors.background } }}>
          <AuthStack.Screen name="EmailVerification" component={EmailVerificationScreen} />
        </AuthStack.Navigator>
      ) : (
        <MainStackNavigator />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
