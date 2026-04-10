import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ScannerScreen } from './src/screens/ScannerScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { useAuth } from './src/store/auth';

const Stack = createNativeStackNavigator();

export default function App() {
  const { token } = useAuth();

  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#0f172a',
          headerTitleStyle: { fontWeight: '700', fontSize: 16 },
          headerShadowVisible: false,
          headerBackTitleVisible: false,
        }}>
          {!token ? (
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          ) : (
            <>
              <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Scanner" component={ScannerScreen} options={{ headerShown: false, presentation: 'fullScreenModal' }} />
              <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'My Attendance' }} />
              <Stack.Screen name="Trip" component={HomeScreen} options={{ title: 'Active Trip' }} />
              <Stack.Screen name="Profile" component={HomeScreen} options={{ title: 'My Profile' }} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
