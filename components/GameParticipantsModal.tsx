// src/components/GameParticipantsModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, ActivityIndicator, Alert, FlatList, Platform } from 'react-native';
import { Button, Icon, Avatar, ListItem } from '@rneui/themed';
import { supabase } from '../lib/supabase'; // Adjust path
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Define the RootStackParamList type from your App.tsx or types.ts file
// This is crucial for type-safe navigation
type RootStackParamList = {
  MessageScreen: { receiverId: string; username: string };
  // Add other routes here that this modal might navigate to (e.g., Profile screen)
};

// Type the navigation prop for this component
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// --- Interfaces for fetched data ---
interface GameData { // Re-using the GameData type from MyGamesScreen
  id: string;
  title: string;
  // Add any other game details you want to display in the modal header
}

interface Participant {
  user_id: string; // From Game_Participants
  joined_at: string; // From Game_Participants
  status: string; // From Game_Participants (e.g., 'joined', 'organizer')
  // Joined user profile details (from public.users table)
  user_profile: { // Alias from select query
    id: string;
    username: string | null;
    profile_picture_url: string | null;
  } | null; // user_profile can be null if no matching user found,
            // though 'inner' join should ensure it's always present if the FK is good.
}

// --- Props for the Modal Component ---
interface GameParticipantsModalProps {
  visible: boolean;
  onClose: () => void;
  game: GameData; // The game object passed from MyGamesScreen
  currentUserId: string | null; // The ID of the currently logged-in user
}

export default function GameParticipantsModal({ visible, onClose, game, currentUserId }: GameParticipantsModalProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<NavigationProp>(); // Initialize navigation with type

  // --- useEffect to fetch participants when modal becomes visible or game changes ---
  useEffect(() => {
    async function fetchParticipants() {
      if (!game?.id) { // Ensure a game ID is provided
        setLoading(false);
        setError("No game ID provided to fetch participants.");
        return;
      }
      setLoading(true);
      setError(null); // Clear previous errors

      try {
        const { data, error: fetchError } = await supabase
          .from('Game_Participants')
          .select(`
            user_id,
            joined_at,
            status,
            user_profile:users!inner(id, username, profile_picture_url)
          `)
          .eq('game_id', game.id); // Filter by the specific game ID

        if (fetchError) throw fetchError;

        // Correctly map and type the fetched data
        // Supabase returns user_profile as an object (or null if not inner join). No need for [0] index access.
        const typedData = data.map(item => ({
          user_id: item.user_id,
          joined_at: item.joined_at,
          status: item.status,
          user_profile: item.user_profile ? { // Ensure user_profile is not null before accessing its properties
            id: item.user_profile.id,
            username: item.user_profile.username,
            profile_picture_url: item.user_profile.profile_picture_url
          } : null // Assign null if user_profile itself is null (shouldn't happen with !inner)
        })) as Participant[];

        setParticipants(typedData); // Update state with fetched participants
      } catch (err: any) {
        console.error('Error fetching game participants:', err.message);
        setError('Failed to load participants.');
        Alert.alert('Error', 'Failed to load participants: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    if (visible && game?.id) { // Only fetch when modal is visible AND game ID is available
      fetchParticipants();
    } else if (!visible) { // When modal is closed, reset state to clean up for next open
      setParticipants([]);
      setError(null);
      setLoading(false);
    }
  }, [visible, game?.id]); // Re-run effect when modal visibility or game ID changes

  // --- Handler for messaging a specific user ---
  const handleMessageUser = (participantUserId: string, participantUsername: string | null) => {
    onClose(); // Close the participants modal

    if (participantUserId === currentUserId) {
        Alert.alert("Cannot Message Self", "You cannot message yourself.");
        return;
    }
    // Navigate to the MessageScreen, passing receiverId and username as parameters
    navigation.navigate('MessageScreen', { receiverId: participantUserId, username: participantUsername || 'Chat Partner' });
  };

  // --- Render UI ---
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
                  <ListItem.Title>
                    <Text>{item.user_profile?.username || 'Unknown User'}</Text>
                  </ListItem.Title>
                  <ListItem.Subtitle>
                    <Text>{item.status === 'organizer' ? 'Organizer' : 'Player'}</Text>
                  </ListItem.Subtitle>
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
            keyExtractor={item => item.user_id} // Unique key extractor for FlatList
            contentContainerStyle={modalStyles.participantsList}
            ListEmptyComponent={ // Component to render when list is empty
              <Text style={modalStyles.emptyListText}>No participants found.</Text>
            }
          />
        )}
      </View>
    </Modal>
  );
}

// --- Styles for the Modal Component ---
const modalStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 50 : 0, // Adjust for iOS notch/status bar
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
    backgroundColor: '#007bff', // Blue color for message button
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