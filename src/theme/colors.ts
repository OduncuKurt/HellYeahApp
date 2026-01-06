export const colors = {
  light: {
    primary: '#000000',
    background: '#FAFAFA',
    card: '#FFFFFF',
    text: '#000000',
    textSecondary: '#666666',
    border: '#E0E0E0',
    error: '#FF3B30',
    tint: '#000000',
    tabIconDefault: '#ccc',
    tabIconSelected: '#000',
  },
  dark: {
    primary: '#FFFFFF',
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#AAAAAA',
    border: '#333333',
    error: '#FF453A',
    tint: '#FFFFFF',
    tabIconDefault: '#666',
    tabIconSelected: '#FFF',
  },
};

export type ThemeColors = typeof colors.light;
