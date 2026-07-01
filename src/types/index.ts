// User Types
export interface User {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string;
  totalBeers: number;
  totalGuinnessBeers: number; // NEW: Total Guinness beers count
  beersByYear: { [year: string]: number }; // { "2025": 12, "2026": 45 }
  guinnessByYear: { [year: string]: number }; // NEW: Guinness count by year
  friends: { [friendUid: string]: number }; // timestamp when became friends
  createdAt: string;
}

// Friend Types
export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  fromDisplayName: string;
  fromAvatar: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: number;
}

// Beer Types
export interface Beer {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  photoUrl: string;
  timestamp: number;
  year: number; // 2025, 2026, etc.
  isGuinness: boolean; // Is this a Guinness beer?
  location?: string; // e.g. "Kadıköy, İstanbul"
  reactions?: { [userId: string]: string }; // { "userId": "🍻" }
  comments?: Comment[];
}

// Comment Types
export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: number;
}

// Auth Types
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  initializing: boolean;
  emailVerified: boolean;
  register: (
    email: string,
    password: string,
    username: string,
    displayName: string
  ) => Promise<AuthResult>;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  resendVerificationEmail: () => Promise<AuthResult>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
  refreshUserData: () => Promise<void>;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

// Navigation Types
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  EmailVerification: undefined;
};

export type MainStackParamList = {
  Feed: undefined;
  Friends: undefined;
  Leaderboard: undefined;
  Profile: { userId?: string }; // undefined = own profile
  BeerDetail: { beerId: string };
};

export type RootStackParamList = AuthStackParamList & MainStackParamList;
