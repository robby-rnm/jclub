import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { SessionProvider, useSession } from '../ctx';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { session, isLoading } = useSession();

  // If loading, show splash or spinner?
  if (isLoading) {
    return <Slot />;
  }

  // If not authenticated, show Login (or handle in screens / use segments)
  // For simplicity, we let the screens handle redirect or just conditionally render here?
  // Expo Router recommends using a Group for protected routes
  // But let's just use stack and navigate

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {!session ? (
          <Stack.Screen name="login" />
        ) : (
          <Stack.Screen name="(tabs)" />
        )}
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <RootLayoutNav />
    </SessionProvider>
  );
}
