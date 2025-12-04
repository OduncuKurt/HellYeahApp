// User Types
export interface User {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string;
  totalBeers: number;
  createdAt: string;
  groups: { [groupId: string]: boolean };
}

// Group Types
export interface Group {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  totalBeers: number;
  inviteCode: string;
  members: { [userId: string]: GroupMember };
  startDate: string; // Yarışma başlangıç tarihi (ISO string)
  endDate: string; // Yarışma bitiş tarihi (ISO string)
  beers?: { [beerId: string]: Beer }; // Grupta eklenen biralar
}

export interface GroupMember {
  joinedAt: string;
  displayName: string;
  avatar: string;
  beerCount: number; // Kullanıcının bu gruptaki bira sayısı
}

// Beer Types
export interface Beer {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  photoUrl: string;
  timestamp: number;
  reactions?: { [userId: string]: string };
  comments?: { [commentId: string]: Comment };
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
  register: (
    email: string,
    password: string,
    username: string,
    displayName: string
  ) => Promise<AuthResult>;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
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
};

export type MainStackParamList = {
  GroupList: undefined;
  CreateGroup: undefined;
  JoinGroup: { inviteCode: string };
  GroupDetail: { groupId: string };
};

export type RootStackParamList = AuthStackParamList & MainStackParamList;
