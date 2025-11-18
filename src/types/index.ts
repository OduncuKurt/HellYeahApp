// User Types
export interface User {
  uid: string;
  email: string;
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
}

export interface GroupMember {
  joinedAt: string;
  displayName: string;
  avatar: string;
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
}

// Auth Types
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  initializing: boolean;
  register: (email: string, password: string, displayName: string) => Promise<AuthResult>;
  login: (email: string, password: string) => Promise<AuthResult>;
  loginAnonymously: () => Promise<AuthResult>;
  logout: () => Promise<AuthResult>;
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
};

export type MainStackParamList = {
  GroupList: undefined;
  CreateGroup: undefined;
  JoinGroup: { inviteCode: string };
  GroupDetail: { groupId: string };
};

export type RootStackParamList = AuthStackParamList & MainStackParamList;
