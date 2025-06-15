// src/components/GameParticipantsModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, ActivityIndicator, Alert, FlatList, Platform } from 'react-native';
import { Button, Icon, Avatar, ListItem } from '@rneui/themed';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
// --- CORRECT IMPORTS FOR NESTED NAVIGATION TYPES ---
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp, BottomTabScreenProps } from '@react-navigation/bottom-tabs'; // Import BottomTabScreenProps

// --- Define ALL relevant Param Lists ---
// Your App.tsx's main Stack Navigator (outside tabs)
type AppRootStackParamList = { // Renamed to avoid confusion with internal RootStackParamList
  Auth: undefined;
  MainApp: undefined; // This holds your BottomTabNavigator
  // Add other screens if they are direct children of the Root Stack
  // e.g., Profile: undefined;
  // e.g., MessageScreen: { receiverId: string; username: string; }; // If MessageScreen is accessible outside tabs
};

// Your BottomTabNavigator's param list
type MainTabParamList = { // Renamed to avoid confusion with internal RootTabParamList
  Search: undefined;
  MyGames: undefined;
  Messages: { // The 'Messages' tab which renders MessagesTabStack
    screen?: keyof MessagesTabStackParamList; // Allows navigating to specific screen within MessagesTabStack
    params?: MessagesTabStackParamList[keyof MessagesTabStackParamList]; // Pass params for that inner screen
  };
  // Add other tabs here if you have them
};

// Your MessagesTabStack's param list (nested within the 'Messages' tab)
type MessagesTabStackParamList = {
  ChatList: undefined;
  Chat: { receiverId: string; username: string };
};

// --- Define the COMPOSITE NavigationProp for this component ---
// This component is rendered within MyGamesScreen, which is a tab.
// So, its 'navigation' object comes from the BottomTabNavigator.
// It needs to navigate within the tabs, AND then within a tab's stack.
type GameParticipantsModalNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'MyGames'>, // Base: navigation from within 'MyGames' tab
  NativeStackNavigationProp<MessagesTabStackParamList, 'ChatList'> // Can navigate within the 'Messages' tab's stack (e.g. ChatList -> MessageScreen)
>;


// --- Interfaces for fetched data (unchanged) ---
interface GameData {
  id: string;
  title: string;
}

interface Participant {
  user_id: string;
  joined_at: string;
  status: string;
  user_profile: {
    id: string;
    username: string | null;
    profile_picture_url: string | null;
  } | null;
}

interface GameParticipantsModalProps {
  visible: boolean;
  onClose: () => void;
  game: GameData;
  currentUserId: string | null;
}

export default function GameParticipantsModal({ visible, onClose, game, currentUserId }: GameParticipantsModalProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<GameParticipantsModalNavigationProp>(); // Use the new Composite type

  useEffect(() => {
    async function fetchParticipants() {
      if (!game?.id) {
        setLoading(false);
        setError("No game ID provided to fetch participants.");
        return;
      }
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('Game_Participants')
          .select(`
            user_id,
            joined_at,
            status,
            user_profile:users!inner(id, username, profile_picture_url)
          `)
          .eq('game_id', game.id);

        if (fetchError) throw fetchError;

        const typedData = data.map(item => ({
          user_id: item.user_id,
          joined_at: item.joined_at,
          status: item.status,
          user_profile: item.user_profile ? {
            id: item.user_profile.id,
            username: item.user_profile.username,
            profile_picture_url: item.user_profile.profile_picture_url
          } : null
        })) as Participant[];

        setParticipants(typedData);
      } catch (err: any) {
        console.error('Error fetching game participants:', err.message);
        setError('Failed to load participants.');
        Alert.alert('Error', 'Failed to load participants: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    if (visible && game?.id) {
      fetchParticipants();
    } else if (!visible) {
      setParticipants([]);
      setError(null);
      setLoading(false);
    }
  }, [visible, game?.id]);

  const handleMessageUser = (participantUserId: string, participantUsername: string | null) => {
    onClose(); // Close the participants modal

    if (participantUserId === currentUserId) {
        Alert.alert("Cannot Message Self", "You cannot message yourself.");
        return;
    }
    // First navigate to Messages tab (which shows ChatList), then to Chat screen
    navigation.navigate('Messages', {
      screen: 'ChatList'
    });
    // Then navigate to Chat screen
    setTimeout(() => {
      navigation.navigate('Messages', {
        screen: 'Chat',
        params: {
          receiverId: participantUserId,
          username: participantUsername || 'Chat Partner'
        }
      });
    }, 100);
  };

  return (
    <Modal animationType="slide" transparent={false} visible={visible} onRequestClose={onClose}>
      <View style={modalStyles.modalContainer}>
        {/* Modal Header */}
        <View style={modalStyles.modalHeader}>
          <Text style={modalStyles.modalTitle}>Participants for "{game?.title || 'Game'}"</Text>
          <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
            <Icon name="close" type="material" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Conditional Rendering based on Loading/Error/Data */}
        {loading ? (
          <View style={modalStyles.loadingContainer}>
            <ActivityIndicator size="large" />
            <Text>Loading participants...</Text>
          </View>
        ) : error ? (
          <View style={modalStyles.errorContainer}>
            <Text style={modalStyles.errorText}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={participants}
            renderItem={({ item }) => (
              <ListItem bottomDivider key={item.user_id}>
                <Avatar
                  source={item.user_profile?.profile_picture_url ? { uri: item.user_profile.profile_picture_url } : { uri: 'https://via.placeholder.com/150' }}
                  rounded
                  size="medium"
                />
                <ListItem.Content>
                  <ListItem.Title>{item.user_profile?.username || 'Unknown User'}</ListItem.Title>
                  <ListItem.Subtitle>{item.status === 'organizer' ? 'Organizer' : 'Player'}</ListItem.Subtitle>
                </ListItem.Content>
                {item.user_id !== currentUserId && (
                  <Button
                    title="Message"
                    onPress={() => handleMessageUser(item.user_id, item.user_profile?.username || null)}
                    buttonStyle={modalStyles.messageButton}
                    titleStyle={modalStyles.messageButtonText}
                  />
                )}
                {item.user_id === currentUserId && (
                  <Text style={modalStyles.youText}>You</Text>
                )}
                <ListItem.Chevron />
              </ListItem>
            )}
            keyExtractor={item => item.user_id}
            contentContainerStyle={modalStyles.participantsList}
            ListEmptyComponent={
              <Text style={modalStyles.emptyListText}>No participants found.</Text>
            }
          />
        )}
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 50 : 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 16,
  },
  participantsList: {
    paddingBottom: 20,
  },
  messageButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  messageButtonText: {
    fontSize: 14,
    color: '#fff',
  },
  youText: {
    fontSize: 14,
    color: '#888',
    paddingHorizontal: 10,
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#888',
  },
});