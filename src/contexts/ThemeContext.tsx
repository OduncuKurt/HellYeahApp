import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NavigationBar from 'expo-navigation-bar';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { colors, ThemeColors } from '../theme/colors';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('light'); // Default to light initially

  useEffect(() => {
    // Load saved theme or use system theme
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setThemeState(savedTheme);
        } else if (systemColorScheme) {
          setThemeState(systemColorScheme);
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      }
    };
    loadTheme();
  }, [systemColorScheme]);

  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    
    // Update Android navigation bar
    if (Platform.OS === 'android') {
      try {
        await NavigationBar.setBackgroundColorAsync(
          newTheme === 'dark' ? colors.dark.background : colors.light.background
        );
        await NavigationBar.setButtonStyleAsync(
          newTheme === 'dark' ? 'light' : 'dark'
        );
      } catch (error) {
        console.error('Failed to update navigation bar:', error);
      }
    }
    
    try {
      await AsyncStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const value = {
    theme,
    colors: colors[theme],
    toggleTheme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
