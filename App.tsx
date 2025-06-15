import React from 'react'
import 'react-native-url-polyfill/auto'
import 'react-native-get-random-values'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Profile from './components/Profile'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { Session } from '@supabase/supabase-js'
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import { Button } from '@rneui/themed'; // If using RNElements buttons
import { Ionicons } from '@expo/vector-icons'; // For icons
import DropdownButton from './components/DropdownMenu';
import NotificationModal from './components/NotificationModal';
import WigglingOkeyTile from './components/WigglingOkeyTile'; // Add this import

type RootStackParamList = {
  MainApp: undefined;
  Auth: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false);
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  if (loading) { // Show a loading indicator while checking session
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading app...</Text>
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {session && session.user ? (
          <Stack.Screen
            name="MainApp"
            component={BottomTabNavigator}
            options={{ 
              title: '', // Remove title to make room for custom header
              headerStyle: {
                backgroundColor: '#D90106',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
                fontFamily: 'Poppins-Bold',
              },
              headerRight: () => (
                <View style={headerstyles.rightContainer}>
                  <NotificationModal/>
                  <DropdownButton/>
                </View>
              ),
              headerShown: true
            }}
          />
        ) : (
          <Stack.Screen name="Auth" component={Auth} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const headerstyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  buttonContainer: {
    marginHorizontal: 2,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});