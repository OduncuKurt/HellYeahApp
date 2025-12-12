import React from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';

import { useAuth } from '../contexts/AuthContext';
import { AuthStackParamList, MainStackParamList } from '../types';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Main Screens
import FeedScreen from '../screens/feed/FeedScreen';
import FriendsScreen from '../screens/friends/FriendsScreen';
import LeaderboardScreen from '../screens/leaderboard/LeaderboardScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import BeerDetailScreen from '../screens/beer/BeerDetailScreen';

const AuthStack = createStackNavigator<AuthStackParamList>();
const MainStack = createStackNavigator<MainStackParamList>();

// Auth Stack - Giriş yapmamış kullanıcılar için
function AuthStackNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#1a1a1a' },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

// Main Stack - Giriş yapmış kullanıcılar için
function MainStackNavigator() {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#1a1a1a' },
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
  const { user, initializing } = useAuth();

  // İlk yüklenme sırasında loading göster
  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9500" />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      {user ? <MainStackNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
});
