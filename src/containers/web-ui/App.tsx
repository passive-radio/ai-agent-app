import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ChatScreen from './src/screens/ChatScreen';
import { SessionProvider } from './src/hooks/useSession';
import { ModelProvider } from './src/hooks/useModel';

const Stack = createNativeStackNavigator();

export default function App() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <ModelProvider>
        <SessionProvider>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Chat"
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="Chat" component={ChatScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </SessionProvider>
      </ModelProvider>
    </SafeAreaProvider>
  );
}
