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

// Main Screens
import GroupListScreen from '../screens/groups/GroupListScreen';
import CreateGroupScreen from '../screens/groups/CreateGroupScreen';
import JoinGroupScreen from '../screens/groups/JoinGroupScreen';

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
      <MainStack.Screen name="GroupList" component={GroupListScreen} />
      <MainStack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <MainStack.Screen name="JoinGroup" component={JoinGroupScreen} />
    </MainStack.Navigator>
  );
}

// Deep Linking Configuration
const linking: LinkingOptions<any> = {
  prefixes: [Linking.createURL('/'), 'hellyeahapp://'],
  config: {
    screens: {
      GroupList: 'groups',
      JoinGroup: {
        path: 'invite/:inviteCode',
        parse: {
          inviteCode: (inviteCode: string) => inviteCode,
        },
      },
      CreateGroup: 'create',
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
