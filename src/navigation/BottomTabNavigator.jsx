// src/navigation/BottomTabNavigator.js

import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Platform, Vibration, View, Text, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';

// Import your screen components
import SearchScreen from '../screens/SearchScreen';
import MyGamesScreen from '../screens/MyGamesScreen';
import ChatListScreen from '../screens/ChatListScreen';
import MessageScreen from '../screens/MessagesScreen';

// Define types for the Messages stack
const MessagesStack = createNativeStackNavigator();

// Create a StyleSheet for your custom header
const headerStyles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: Platform.OS === 'ios' ? 44 : 56,
    backgroundColor: '#f0f0f0', // Sağ alttaki gri tonuna uygun renk.
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  titleContainer: {
    flexDirection: 'row', // Added to arrange title and status dot horizontally
    alignItems: 'center', // Added to align items vertically
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'left',
    marginRight: 8, // Add some space between the username and the status dot
  },
  reportButton: { // Yeni stil: Raporlama butonu için
    padding: 5,
    marginLeft: 10, // Solunda boşluk bırakır
  },
  statusDot: { // New style for the status dot
    width: 10,
    height: 10,
    borderRadius: 5,
  }
});

function CustomChatHeader({ navigation, route, options, back }) {
  const [onlineStatus, setOnlineStatus] = useState(route.params?.online_status || false);
  const username = route.params?.username || 'Chat';

  useEffect(() => {
    // Kullanıcının online durumunu kontrol et
    const checkOnlineStatus = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('online_status')
        .eq('username', username)
        .single();
      
      if (data) {
        setOnlineStatus(data.online_status);
      }
    };

    // İlk yüklemede kontrol et
    checkOnlineStatus();

    // Gerçek zamanlı güncellemeleri dinle
    const subscription = supabase
      .channel('online_status_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users',
        filter: `username=eq.${username}`
      }, (payload) => {
        console.log('Online status changed:', payload);
        setOnlineStatus(payload.new.online_status);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [username]);

  return (
    <View style={headerStyles.headerContainer}>
      {back && (
        <TouchableOpacity
          style={headerStyles.backButton}
          onPress={navigation.goBack}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      )}
      <View style={headerStyles.titleContainer}>
        <Text style={headerStyles.titleText}>{username}</Text>
        <View style={[headerStyles.statusDot, { backgroundColor: onlineStatus ? '#34C759' : '#8E8E93' }]} />
      </View>
      {/* Yeni: Raporlama butonu */}
      <TouchableOpacity
        style={headerStyles.reportButton}
        onPress={() => {
          // Burada raporlama işlemi için bir fonksiyon çağırabilirsiniz
          // Örneğin: Alert.alert('Kullanıcıyı Rapor Et', `${username} adlı kullanıcıyı raporlamak istediğinize emin misiniz?`);
          console.log(`${username} adlı kullanıcıyı rapor et`);
        }}
      >
        <Ionicons name="flag-outline" size={24} color="red" />
      </TouchableOpacity>
    </View>
  );
}

function MessagesTabStack() {
  return (
    <MessagesStack.Navigator>
      <MessagesStack.Screen
        name="Messages"
        component={ChatListScreen}
        options={{ headerShown: false }}
      />
      <MessagesStack.Screen
        name="Chat"
        component={MessageScreen}
        options={({ route }) => ({
          header: (props) => <CustomChatHeader {...props} />,
          headerBackTitleVisible: false,
        })}
      />
    </MessagesStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'MyGames') {
            iconName = focused ? 'game-controller' : 'game-controller-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbox' : 'chatbox-outline';
          } else {
            iconName = 'help-circle';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#D90106',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarButton: (props) => {
          const {
            onPress,
            children,
            accessibilityState,
            accessibilityLabel,
            testID,
            style,
            ...restProps
          } = props;

          return (
            <TouchableOpacity
              {...restProps}
              accessibilityState={accessibilityState}
              accessibilityLabel={accessibilityLabel}
              testID={testID}
              style={[
                style,
                Platform.select({
                  android: {
                    overflow: 'hidden',
                    android_ripple: { borderless: true, color: 'transparent' },
                  },
                  default: {},
                }),
              ]}
              activeOpacity={1}
              onPress={(e) => {
                Vibration.vibrate(50);
                if (onPress) {
                  onPress(e);
                }
              }}
            >
              {children}
            </TouchableOpacity>
          );
        },
      })}
    >
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="MyGames" component={MyGamesScreen} />
      <Tab.Screen name="Messages" component={MessagesTabStack} />
    </Tab.Navigator>
  );
}