// src/navigation/BottomTabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Platform, Vibration } from 'react-native';

// Import your screen components
import SearchScreen from '../screens/SearchScreen';
import MyGamesScreen from '../screens/MyGamesScreen';
import ChatListScreen from '../screens/ChatListScreen';
import MessageScreen from '../screens/MessagesScreen';

// Define types for the Messages stack
const MessagesStack = createNativeStackNavigator();

function MessagesTabStack() {
  return (
    <MessagesStack.Navigator>
      <MessagesStack.Screen
        name="Messages"
        component={ChatListScreen}
        options={{ title: 'Messages', headerBackTitleVisible: false }}
      />
      <MessagesStack.Screen
        name="Chat"
        component={MessageScreen}
        options={({ route }) => ({
          title: route.params?.username || 'Chat',
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