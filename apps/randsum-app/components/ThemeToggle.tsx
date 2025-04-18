import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Switch, Text, useTheme } from 'react-native-paper';
import { useThemeContext } from './ThemeProvider';

type ThemeToggleProps = {
  label?: string;
};

export function ThemeToggle({ label = 'Dark Mode' }: ThemeToggleProps) {
  const { isDarkMode, toggleTheme } = useThemeContext();
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {label && <Text style={{ color: theme.colors.onSurface }}>{label}</Text>}
      <Switch
        value={isDarkMode}
        onValueChange={() => toggleTheme(isDarkMode ? 'light' : 'dark')}
        color={theme.colors.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
