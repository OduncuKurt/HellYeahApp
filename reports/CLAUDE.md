# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hell Yeah App is a React Native (Expo) mobile application for tracking beer consumption with camera integration. The app features user authentication, group management with invite codes, and Firebase backend integration. The project has been fully migrated to TypeScript.

## Tech Stack

- **React Native** with **Expo SDK ~54**
- **TypeScript** (fully migrated)
- **Firebase** (Realtime Database, Storage, Auth with AsyncStorage persistence)
- **React Navigation** (Stack Navigator with deep linking)
- **Expo Camera** & **Image Picker**
- React Native Gesture Handler & Reanimated

## Development Commands

```bash
# Start development server
npm start
# or
npx expo start

# Clear cache and start
npx expo start -c

# Run on platforms
npm run android
npm run ios
npm run web

# TypeScript type checking
npx tsc --noEmit

# Expo diagnostics
npx expo-doctor
```

## Architecture

### App Entry Point
`App.tsx` wraps the app with `GestureHandlerRootView` and `AuthProvider`, then renders `AppNavigator`.

### Authentication Flow
- `AuthContext` (`src/contexts/AuthContext.tsx`) manages Firebase authentication state using `onAuthStateChanged`
- Persists auth state with AsyncStorage via `getReactNativePersistence`
- Supports email/password registration, login, and anonymous login
- User data synced between Firebase Auth and Realtime Database at `users/{uid}`
- `AppNavigator` conditionally renders `AuthStackNavigator` or `MainStackNavigator` based on auth state

### Navigation Structure
**Auth Stack** (unauthenticated users):
- `LoginScreen` - Email/password login + anonymous login option
- `RegisterScreen` - New user registration

**Main Stack** (authenticated users):
- `GroupListScreen` - Display user's groups (max 3)
- `CreateGroupScreen` - Create new group with auto-generated invite code
- `JoinGroupScreen` - Join group via invite code or deep link

**Deep Linking:**
- Prefix: `hellyeahapp://`
- Join group route: `hellyeahapp://invite/:inviteCode`
- Configuration in `AppNavigator.tsx:54-68`

### Firebase Configuration
`firebaseConfig.ts` at project root initializes Firebase with AsyncStorage persistence for React Native Auth. Exports:
- `auth` - Firebase Auth instance
- `database` - Realtime Database instance
- `storage` - Firebase Storage instance

**Important:** Firebase Auth must use `initializeAuth` with `getReactNativePersistence(AsyncStorage)` for React Native (not `getAuth`).

### State Management
- **Global:** `AuthContext` provides user state and auth methods across the app
- **Local:** Component state with `useState` for UI interactions
- **Firebase Sync:** Real-time listeners via `onAuthStateChanged` and database refs

### Group System
`src/services/groupService.ts` handles all group operations:
- `createGroup()` - Creates group with unique 6-char invite code, adds creator as first member
- `joinGroupByInviteCode()` - Validates invite code, checks 3-group limit, adds user as member
- `getUserGroups()` - Fetches user's groups from `users/{uid}/groups`
- `getGroupDetails()` - Retrieves group info from `groups/{groupId}`
- `leaveGroup()` - Removes user from group members and user's group list

**Group limit:** Each user can be in maximum 3 groups (enforced in `createGroup` and `joinGroupByInviteCode`).

### Type System
All types defined in `src/types/index.ts`:
- `User` - User profile with groups dictionary
- `Group` - Group data with members dictionary and invite code
- `GroupMember` - Member metadata (joinedAt, displayName, avatar)
- `Beer` - Beer consumption record with photo
- `AuthContextType` - Auth context interface
- Navigation types: `AuthStackParamList`, `MainStackParamList`

### Firebase Data Structure
```
users/
  {userId}/
    displayName: string
    avatar: string (emoji)
    totalBeers: number
    createdAt: ISO string
    groups/
      {groupId}: true

groups/
  {groupId}/
    name: string
    createdBy: userId
    createdAt: ISO string
    totalBeers: number
    inviteCode: string (6 chars)
    members/
      {userId}/
        joinedAt: ISO string
        displayName: string
        avatar: string (emoji)

images/
  {deviceId}/
    {timestamp}.jpg
```

## Configuration Files

- `app.json` - Expo configuration with camera/gallery permissions, deep linking scheme (`hellyeahapp`), and plugin setup
- `tsconfig.json` - TypeScript config for React Native with Expo
- `babel.config.js` - Babel preset for Expo

## Code Patterns

### Firebase Operations
Always use TypeScript types for Firebase data:
```typescript
import { User } from '../types';
import { ref, get, set } from 'firebase/database';
import { database } from '../config/firebase';

// Type-safe read
const userRef = ref(database, `users/${userId}`);
const snapshot = await get(userRef);
const userData: User = snapshot.val();

// Type-safe write
await set(userRef, userData);
```

### Navigation
Use typed navigation props:
```typescript
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../types';

type GroupListScreenProp = StackNavigationProp<MainStackParamList, 'GroupList'>;

interface Props {
  navigation: GroupListScreenProp;
}
```

### Auth Context Usage
```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, loading, login, logout } = useAuth();

  if (loading) return <ActivityIndicator />;
  if (!user) return null;

  // Use user data
}
```

## Development Notes

- **TypeScript strict mode** - All files must be type-safe
- **Firebase Auth persistence** - Uses AsyncStorage, not default browser persistence
- **Invite codes** - Generated as 6 random uppercase alphanumeric characters, must be unique across all groups
- **Deep linking** - Test with `npx uri-scheme open hellyeahapp://invite/ABC123 --ios` or `--android`
- **Max groups** - Users limited to 3 groups, enforced in `groupService.ts`
- **Avatar system** - Uses emoji strings stored in database
- **Firebase keys** - User IDs used directly as Firebase keys (no sanitization needed)

## Project Structure

```
src/
  contexts/
    AuthContext.tsx       # Global auth state management
  navigation/
    AppNavigator.tsx      # Root navigator with auth flow
  screens/
    auth/
      LoginScreen.tsx     # Login + anonymous login
      RegisterScreen.tsx  # New user registration
    groups/
      GroupListScreen.tsx # User's groups list
      CreateGroupScreen.tsx # Create new group
      JoinGroupScreen.tsx # Join via invite code
  services/
    groupService.ts       # Group CRUD operations
  types/
    index.ts             # All TypeScript type definitions
  utils/
    inviteCode.ts        # Invite code generation
    deviceInfo.js        # Device ID utilities (legacy JS)

firebaseConfig.ts        # Firebase initialization
App.tsx                  # App entry point
```

## Key Implementation Details

1. **Firebase Auth must be initialized with AsyncStorage persistence** for React Native compatibility
2. **Invite codes** are 6-character uppercase alphanumeric strings, validated for uniqueness before group creation
3. **Deep linking** is configured to handle `hellyeahapp://invite/:inviteCode` URLs for group invitations
4. **User groups** are stored as a dictionary in both `users/{uid}/groups` and `groups/{groupId}/members` for bidirectional querying
5. **Auth state changes** automatically sync user data from Firebase Realtime Database to local state
6. **Anonymous login** creates a temporary user account with default display name "Misafir" and avatar "👤"
