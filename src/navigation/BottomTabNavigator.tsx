// src/navigation/BottomTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; // Example icon library

// Import your screen components
import SearchScreen from '../screens/SearchScreen';
import MyGamesScreen from '../screens/MyGamesScreen';
import MessagesScreen from '../screens/MessagesScreen'; 

// Import the type definition for your tab navigator
import { RootTabParamList } from './types'; // Adjust path as needed

const Tab = createBottomTabNavigator<RootTabParamList>(); // <--- Use your type here

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap; // Type the iconName variable

          if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'MyGames') {
            iconName = focused ? 'game-controller' : 'game-controller-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbox' : 'chatbox-outline';
          } else {
            iconName = 'help-circle'; // Fallback
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
        headerShown: false, // Hide header on tab screens if you prefer custom headers
      })}
    >
      <Tab.Screen name="MyGames" component={MyGamesScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
    </Tab.Navigator>
  );
}