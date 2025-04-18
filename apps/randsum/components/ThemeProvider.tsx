import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { CustomDarkTheme, CustomLightTheme } from '@/theme';

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: (theme: ThemeType) => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  toggleTheme: () => {},
  isDarkMode: false,
});

export const useThemeContext = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>('system');
  
  // Determine if we're in dark mode based on theme setting and system preference
  const isDarkMode = 
    theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  
  // Get the appropriate theme object
  const paperTheme = isDarkMode ? CustomDarkTheme : CustomLightTheme;
  
  // Function to toggle between themes
  const toggleTheme = (newTheme: ThemeType) => {
    setTheme(newTheme);
  };
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDarkMode }}>
      <PaperProvider theme={paperTheme}>
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
}
