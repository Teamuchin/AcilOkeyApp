import React from 'react';
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import { Button } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import DropdownButton from './components/DropdownMenu';
import NotificationModal from './components/NotificationModal';
import UserProfileModal from './components/UserProfileModal';
import WigglingOkeyTile from './components/WigglingOkeyTile';

type RootStackParamList = {
  MainApp: undefined;
  Auth: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Register başarılı olduğunda çağrılacak fonksiyon
  const handleRegisterSuccess = () => {
    setShowProfileModal(true);
  };

  useEffect(() => {
    setLoading(true);
    
    // İlk session kontrolü
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        // Session varsa hemen isNewUser kontrolü yap
        checkIsNewUser(session.user.id);
      }
      setLoading(false);
    });

    // Auth state değişikliklerini dinle
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      
      if (_event === 'SIGNED_IN' && session) {
        try {
          // Online status güncelle
          await supabase
            .from('users')
            .update({ online_status: true })
            .eq('id', session.user.id);
            
          // Hemen isNewUser kontrolü yap
          const { data, error } = await supabase
            .from('users')
            .select('isNewUser')
            .eq('id', session.user.id)
            .single();

          if (!error && data?.isNewUser) {
            setShowProfileModal(true);
          }
        } catch (error) {
          console.error('Error:', error);
        }
      }
      
      setLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // isNewUser kontrolü için fonksiyon
  const checkIsNewUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('isNewUser')
        .eq('id', userId)
        .single();

      if (!error && data?.isNewUser) {
        setShowProfileModal(true);
      }
    } catch (error) {
      console.error('Error checking isNewUser:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading app...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {session && session.user ? (
          <Stack.Screen
            name="MainApp"
            component={BottomTabNavigator}
            options={{
              title: 'Acil Okey',
              headerStyle: {
                backgroundColor: '#D90106',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
                fontFamily: 'Poppins-Bold',
              },
              headerLeft: () => (
                <View style={{ marginRight: 8 }}>
                  <WigglingOkeyTile size="small" value={1} />
                </View>
              ),
              headerRight: () => (
                <View style={headerstyles.container}>
                  <NotificationModal />
                  <DropdownButton />
                </View>
              ),
              headerShown: true,
            }}
          />
        ) : (
          <Stack.Screen 
            name="Auth" 
            options={{ headerShown: false }}
          >
            {(props) => (
              <Auth 
                {...props} 
                onRegisterSuccess={handleRegisterSuccess}
              />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>

      {/* Modal'ı her zaman göster, session ve showProfileModal true ise */}
      {session && session.user && showProfileModal && (
        <UserProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </NavigationContainer>
  );
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