# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hell Yeah App is a React Native (Expo) social drinking tracker app. Users track beer consumption with photos, connect with friends, and compete on leaderboards. Built with TypeScript and Firebase backend.

## Commands

```bash
# Development
npm start                 # Start Expo development server
npm run android           # Run on Android emulator/device
npm run ios               # Run on iOS simulator (Mac only)
npm run web               # Run in web browser
npx expo start -c         # Start with cache cleared

# Type checking
npx tsc --noEmit          # TypeScript type checking

# Diagnostics
npx expo-doctor           # Expo diagnostics
```

## Architecture

### Tech Stack
- **Framework:** React Native 0.81.5 with Expo ~54.0.25
- **Language:** TypeScript 5.9 (strict mode enabled)
- **Backend:** Firebase (Realtime Database, Storage, Auth)
- **Navigation:** React Navigation 7+ (Stack Navigator)
- **State Management:** React Context API (AuthContext, ThemeContext)

### Project Structure
```
src/
├── contexts/          # AuthContext (auth state), ThemeContext (light/dark)
├── navigation/        # AppNavigator with auth-conditional routing
├── screens/           # auth/, beer/, feed/, friends/, leaderboard/, profile/
├── services/          # beerService, friendService, userService (Firebase operations)
├── components/        # ReactionBar, EmojiPicker, CommentSection, WebCompat*
├── theme/             # colors.ts (light/dark theme definitions)
├── types/             # TypeScript interfaces (User, Beer, Comment, FriendRequest)
└── utils/             # Helper functions
```

### Firebase Data Structure
- `users/{uid}` - User profiles with stats (totalBeers, beersByYear, friends)
- `usernames/{lowercase_username}` - Username → UID lookup for uniqueness
- `beers/{beerId}` - Beer posts with reactions and comments
- `friendRequests/{toUserId}/{fromUserId}` - Pending friend requests

### Key Patterns

**Firebase Auth Persistence (Required for React Native):**
```typescript
import { getReactNativePersistence } from 'firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'
// Auth must use AsyncStorage persistence, not default browser persistence
```

**Context Hook Usage:**
```typescript
const { user, login, logout } = useAuth()
const { theme, colors, toggleTheme } = useTheme()
```

**Service Return Pattern:**
```typescript
const result = await addBeer(...)
if (!result.success) {
  Alert.alert('Error', result.error || 'Unknown error')
  return
}
```

**Navigation Types:**
```typescript
type MainStackParamList = {
  Feed: undefined
  Friends: undefined
  Profile: { userId?: string }
  BeerDetail: { beerId: string }
}
```

### Important Conventions

1. **Usernames:** Stored lowercase, searchable via `usernames/{username}` → UID lookup
2. **Avatars:** Emoji strings (e.g., "🍺", "🎉")
3. **Timestamps:** `Date.now()` milliseconds for all records
4. **Guinness Tracking:** Separate counters (`totalGuinnessBeers`, `guinnessByYear`)
5. **Comments:** Stored as objects in Firebase, converted to arrays by services
6. **Reactions:** One emoji per user per beer (overwrites previous)
7. **Deep Linking:** Scheme is `hellyeahapp://`
8. **Bidirectional Friends:** Both users' `friends` objects updated on accept

### Web Compatibility
Custom wrapper components (`WebCompatScrollView`, `WebCompatTouchable`) handle platform differences between mobile and web.
