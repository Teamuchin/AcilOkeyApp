import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Platform, Vibration } from 'react-native';

// Import your screen components
import SearchScreen from '../screens/SearchScreen';
import MyGamesScreen from '../screens/MyGamesScreen';
import MessagesScreen from '../screens/MessagesScreen';

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
        tabBarActiveTintColor: 'tomato',
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
          } = props;

          return (
            <TouchableOpacity
              accessibilityState={accessibilityState}
              accessibilityLabel={accessibilityLabel}
              testID={testID}
              style={[
                style,
                Platform.select({
                  android: {
                    overflow: 'hidden',
                  },
                  default: {},
                }),
              ]}
              activeOpacity={1}
              onPress={(e) => {
                // Trigger vibration feedback (50ms duration)
                Vibration.vibrate(50);

                // Call the original onPress handler from props
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
      <Tab.Screen name="Messages" component={MessagesScreen} />
    </Tab.Navigator>
  );
} 