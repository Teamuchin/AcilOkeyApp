// src/screens/SearchScreen.tsx
import React, { useState, useEffect } from 'react';
<<<<<<< Updated upstream
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
=======
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, Modal, Image, TouchableOpacity, Platform } from 'react-native';
>>>>>>> Stashed changes
import { Input, Button, ButtonGroup, ListItem, Avatar } from '@rneui/themed';
import { Icon } from '@rneui/themed';
import { supabase } from '../../lib/supabase'; // Your Supabase client

// --- Updated Interfaces for your Supabase data ---
interface GameData {
  id: string; // uuid
  title: string; // text
  location_name: string; // text
  start_time: string; // timestamp (Supabase usually returns as ISO string)
  end_time: string | null; // timestamp (can be null)
  required_players: number; // int2
  current_players: number; // int2
  description: string | null; // text (can be null)
  created_at: string; // timestamp
  game_status: 'Scheduled' | 'Open' | 'Completed' | 'Cancelled'; // Based on game_status enum
  game_type: 'Beginner' | 'Intermediate' | 'Advanced' | 'Master'; // Based on user_level enum
}

interface UserData {
  id: string; // uuid (auth.uid())
  username: string | null; // text (can be null)
  email: string | null; // text (can be null)
  bio_text: string | null; // text (can be null)
  phone_number: string | null; // text (can be null)
  profile_picture_url: string | null; // text (can be null, usually stores URL)
  created_at: string; // timestamp
  online_status: boolean | null; // bool (can be null)
  game_history_visibility: boolean | null; // bool (can be null)
  location: string | null; // text (can be null)
<<<<<<< Updated upstream
  // latitude: number | null; // Removed - as per your database change
  // longitude: number | null; // Removed - as per your database change
  // last_location_update: string | null; // Removed - as it was tied to latitude/longitude
}

=======
  user_level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Master' | null; // Added based on your latest image for user_level
}

// --- PlayerProfileModal Component (Nested within SearchScreen) ---
const PlayerProfileModal = ({ visible, onClose, userData }: {
  visible: boolean;
  onClose: () => void;
  userData: UserData | null;
}) => {
  if (!visible || !userData) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          {/* Level and Location at the top right/left */}
          <View style={styles.headerLevel}>
            <Text style={styles.levelBadge}>🎯 {userData.user_level || 'Not set'}</Text>
          </View>
          <View style={styles.headerLocation}>
            <Text style={styles.locationBadge}>📍{userData.location || 'Not set'}</Text>
          </View>

          {/* User Image */}
          <View style={styles.imageContainer}>
            <Image
              source={userData.profile_picture_url ? { uri: userData.profile_picture_url } : require('../../assets/user-icon.png')}
              style={styles.userIcon}
              resizeMode="contain"
            />
          </View>

          {/* Username */}
          <Text style={styles.modalTitle}>{userData.username || 'No Username'}</Text>

          {/* Bio Text */}
          <Text style={styles.bioText}>{userData.bio_text || 'No bio available'}</Text>

          {/* Online Status */}
          <Text style={styles.onlineStatus}>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, { backgroundColor: userData.online_status ? '#34C759' : '#8E8E93' }]} />
              <Text style={styles.statusText}>{userData.online_status ? 'Online' : 'Offline'}</Text>
            </View>
          </Text>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
>>>>>>> Stashed changes

// --- Main SearchScreen Component ---
export default function SearchScreen() {
  const [selectedIndex, setSelectedIndex] = useState(0); // 0 for Games, 1 for Players
  const [searchQuery, setSearchQuery] = useState('');
  const [games, setGames] = useState<GameData[]>([]); // Using GameData
  const [users, setUsers] = useState<UserData[]>([]); // Using UserData
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null); // State for current user ID
<<<<<<< Updated upstream
=======
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null); // State to hold selected user for modal
  const [showProfileModal, setShowProfileModal] = useState(false); // State to control modal visibility
>>>>>>> Stashed changes

  useEffect(() => {
    // Get current user ID when component mounts
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  const handleSearch = async () => {
    // Optimization: if no search query, clear results immediately and return
    if (!searchQuery.trim()) {
      setGames([]);
      setUsers([]);
      return;
    }

    // Add a check for currentUserId before performing player search
    if (selectedIndex === 1 && currentUserId === null) {
        Alert.alert("Error", "User data is still loading. Please try searching for players again in a moment.");
        setLoading(false);
        return;
    }

    setLoading(true);
    setError(null);

    try {
      if (selectedIndex === 0) { // Searching for Games
        const { data, error: searchError } = await supabase
          .from('Game') // Make sure this matches your table name exactly, e.g., 'games' or 'Game'
          .select(`
            id,
            title,
            location_name,
            start_time,
            end_time,
            required_players,
            current_players,
            description,
            created_at,
            game_status,
            game_type
          `)
          // Filter by title and location_name only
          .or(`title.ilike.%${searchQuery}%,location_name.ilike.%${searchQuery}%`);

        if (searchError) throw searchError;
        setGames(data as GameData[]);
      } else { // Searching for Players (Users)
        let query = supabase.from('users').select(`
            id,
            username,
            email,
            bio_text,
            phone_number,
            profile_picture_url,
            created_at,
            online_status,
            game_history_visibility,
            location
          `)
          .ilike('username', `%${searchQuery}%`);

        // Apply neq('id', currentUserId) ONLY if currentUserId is available
        if (currentUserId) {
            query = query.neq('id', currentUserId);
        }

        const { data, error: searchError } = await query;

        if (searchError) throw searchError;
        if (data && Array.isArray(data)) {
          setUsers(data as UserData[]);
        } else {
          setUsers([]);
        }
      }
    } catch (err: any) {
      console.error('Error during search:', err.message);
      setError('Search failed. Please try again.');
      Alert.alert('Search Error', 'Failed to perform search: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- NEW: handleJoinGame function ---
  const handleJoinGame = async (gameId: string, gameTitle: string) => {
    if (!currentUserId) {
      Alert.alert("Error", "You must be logged in to join a game.");
      return;
    }

    setLoading(true); // Can show a temporary loading state or disable buttons
    try {
      // Check if user is already a participant (optional but good practice)
      const { data: existingParticipants, error: checkError } = await supabase
        .from('Game_Participants')
        .select('user_id')
        .eq('game_id', gameId)
        .eq('user_id', currentUserId)
        .limit(1);

      if (checkError) throw checkError;

      if (existingParticipants && existingParticipants.length > 0) {
        Alert.alert("Already Joined", `You are already a participant in "${gameTitle}".`);
        return;
      }

      // Insert new record into Game_Participants
      const { error: insertError } = await supabase
        .from('Game_Participants')
        .insert({
          game_id: gameId,
          user_id: currentUserId,
          joined_at: new Date().toISOString(),
          status: 'Joined', // Or whatever your default status for joining is
        });

      if (insertError) throw insertError;

      // --- Update current_players count in the Game table ---
      // This requires an RLS policy for UPDATE on Game table
      // AND your user_id (currentUserId) to match a policy (e.g., organizer can update count)
      // Or, a database function triggered on Game_Participants insert to auto-update Game.current_players
      // For simplicity, let's increment directly if RLS allows.
      const { error: updateGameError } = await supabase
        .rpc('increment_current_players', { _game_id: gameId }); // Using an RPC function (recommended)
      // Or, if you prefer direct update from client (ensure RLS allows):
      // .from('Game')
      // .update({ current_players: game.current_players + 1 }) // This is problematic if multiple join at once
      // .eq('id', gameId);

      if (updateGameError) {
        console.warn('Warning: Could not increment game players count:', updateGameError.message);
        // Alert.alert('Warning', 'Game joined, but players count might not be updated.');
      }

      Alert.alert("Success", `You have joined "${gameTitle}"!`);
      // Optionally, refresh search results or update UI to reflect join status
      // You might need to re-fetch games data if game.current_players needs to update visually
      handleSearch(); // Re-run search to update player counts
    } catch (err: any) {
      console.error('Error joining game:', err.message);
      Alert.alert("Error", `Failed to join "${gameTitle}": ` + err.message);
    } finally {
      setLoading(false);
    }
  };


  // --- Render Functions for Game/Player Lists ---

  const renderGameItem = (game: GameData) => (
    <ListItem
      key={game.id} // Key prop for ListItem
      bottomDivider
      onPress={() => Alert.alert('Game Details', `View details for: ${game.title}`)} // Main press for ListItem
    >
      <ListItem.Content>
        <ListItem.Title style={styles.listItemTitle}>{game.title}</ListItem.Title>
        <ListItem.Subtitle style={styles.listItemSubtitle}>
          <Icon name="medal-outline" type="ionicon" size={14} color="#555" /> {game.game_type} &middot;
          <Icon name="location-outline" type="ionicon" size={14} color="#555" /> {game.location_name}
          {/* Implement distance calculation here if needed */}
        </ListItem.Subtitle>
        <Text style={styles.listItemPlayers}>
          <Icon name="people" type="material" size={14} color="#555" /> {game.current_players}/{game.required_players} players
          &middot; <Icon name="time-outline" type="ionicon" size={14} color="#555" /> {new Date(game.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Text style={styles.listItemSubtitle}>Status: {game.game_status}</Text>
        {game.description && <Text style={styles.playerBio}>Description: {game.description}</Text>}
      </ListItem.Content>
      {/* --- Always visible Join Button --- */}
      <View style={styles.gameActionButtonContainer}>
        <Button
          title="Join"
          buttonStyle={styles.joinButton} // Apply specific style for the join button
          titleStyle={styles.joinButtonTitle}
          onPress={() => handleJoinGame(game.id, game.title)} // Call handleJoinGame
        />
      </View>
      <ListItem.Chevron /> {/* Optional chevron */}
    </ListItem>
  );

  const renderPlayerItem = (user: UserData) => ( // Changed 'player' to 'user' for clarity
    <ListItem.Swipeable
      key={user.id}
      bottomDivider
<<<<<<< Updated upstream
      onPress={() => Alert.alert('Player Profile', `View profile for: ${user.username || 'Unknown'}`)}
=======
      onPress={() => {
        setSelectedUser(user); // Set the user data for the modal
        setShowProfileModal(true); // Open the modal
      }}
>>>>>>> Stashed changes
      leftContent={
        <Button
          title="Message"
          icon={{ name: 'chatbox-outline', type: 'ionicon', color: 'white' }}
          buttonStyle={styles.swipeButton}
        />
      }
      rightContent={
        <Button
          title="Add Friend"
          icon={{ name: 'person-add-outline', type: 'ionicon', color: 'white' }}
          buttonStyle={[styles.swipeButton, { backgroundColor: '#007bff' }]}
          onPress={() => Alert.alert('Add Friend', `Send request to ${user.username || 'Unknown'}?`)}
        />
      }
    >
      <Avatar
        source={user.profile_picture_url ? { uri: user.profile_picture_url } : require('../../assets/user-icon.png')}
        rounded
        size="medium"
        containerStyle={styles.avatarContainer}
      />
      <ListItem.Content>
        <ListItem.Title style={styles.listItemTitle}>{user.username || 'No Username'}</ListItem.Title>
        <ListItem.Subtitle style={styles.listItemSubtitle}>
          {user.online_status !== null && (
            <Text style={{ color: user.online_status ? 'green' : 'gray' }}>
              {user.online_status ? 'Online' : 'Offline'}
            </Text>
          )}
          {user.location && <Text> &middot; {user.location}</Text>}
        </ListItem.Subtitle>
        {user.bio_text && <Text style={styles.playerBio}>{user.bio_text}</Text>}
      </ListItem.Content>
      <ListItem.Chevron />
    </ListItem.Swipeable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBarContainer}>
        <Input
          placeholder={selectedIndex === 0 ? "Search for games..." : "Search for players..."}
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={{ type: 'font-awesome', name: 'search', color: 'gray', size: 20, style: { marginRight: 10 } }}
          rightIcon={
            loading ? (
              <ActivityIndicator size="small" color="#0000ff" />
            ) : (
              <Icon
                name="send"
                type="material"
                color="gray"
                size={24}
                onPress={handleSearch}
              />
            )
          }
          containerStyle={styles.inputContainer}
        />
      </View>

      <ButtonGroup
        buttons={['Games', 'Players']}
        selectedIndex={selectedIndex}
        onPress={(value) => {
          setSelectedIndex(value);
          setSearchQuery('');
          setGames([]);
          setUsers([]);
        }}
        containerStyle={styles.buttonGroupContainer}
        selectedButtonStyle={styles.selectedButtonGroupButton}
        textStyle={styles.buttonGroupText}
        selectedTextStyle={styles.selectedButtonGroupText}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}
      {loading ? (
        <View style={styles.loadingListContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Searching...</Text>
        </View>
      ) : (
        <ScrollView style={styles.resultsContainer}>
          {selectedIndex === 0 ? (
            games.length === 0 ? (
              <Text style={styles.noResultsText}>
                {searchQuery ? "No games found. Try adjusting your search." : "Search for games to see results."}
              </Text>
            ) : (
              games.map(renderGameItem)
            )
          ) : (
            users.length === 0 ? (
              <Text style={styles.noResultsText}>
                {searchQuery ? "No players found. Try adjusting your search." : "Search for players to see results."}
              </Text>
            ) : (
              users.map(renderPlayerItem)
            )
          )}
        </ScrollView>
      )}
<<<<<<< Updated upstream
=======

      {/* Player Profile Modal */}
      <PlayerProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userData={selectedUser} // Pass the selected user's data to the modal
      />
>>>>>>> Stashed changes
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
    backgroundColor: '#f5f5f5',
  },
  searchBarContainer: {
    paddingHorizontal: 15,
    paddingBottom: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  inputContainer: {
    // Style for the Input component's container
  },
  buttonGroupContainer: {
    height: 40,
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 8,
    borderColor: '#ea2e3c',
  },
  selectedButtonGroupButton: {
    backgroundColor: '#ea2e3c',
  },
  buttonGroupText: {
    color: '#ea2e3c',
  },
  selectedButtonGroupText: {
    color: 'white',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 5,
    paddingTop: 5,
  },
  listItemTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  listItemSubtitle: {
    fontSize: 13,
    color: '#555',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  listItemPlayers: {
    fontSize: 13,
    color: '#555',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  playerBio: {
    fontSize: 13,
    color: '#777',
    marginTop: 5,
  },
  avatarContainer: {
    marginRight: 10,
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#888',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: 'red',
  },
  loadingListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
<<<<<<< Updated upstream
=======
  // Styles for PlayerProfileModal (moved from separate file)
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
    paddingTop: 70,
    borderWidth: 2,
    borderColor: '#D90106',
  },
  modalTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  bioContainer: {
    width: '100%',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
  },
  bioLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  bioText: {
    fontSize: 16,
    color: '#444',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 15,
  },
  levelContainer: {
    width: '100%',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
  },
  levelLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  levelText: {
    fontSize: 16,
    color: '#444',
  },
  location: {
    fontSize: 14,
    color: '#666',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  onlineStatus: {
    fontSize: 14,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: '#F2F2F7',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    backgroundColor: '#ea2e3c',
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 15,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  userIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  headerLevel: {
    position: 'absolute',
    top: 37,
    right: 10,
    zIndex: 1,
  },
  headerLocation: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  levelBadge: {
    fontSize: 14,
    color: '#666',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  locationBadge: {
    fontSize: 14,
    color: '#666',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  // NEW styles for the always-visible Join button
  gameActionButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10, // Adjust spacing from content
  },
  joinButton: {
    backgroundColor: 'green', // Green background for Join
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  joinButtonTitle: {
    color: 'white',
    fontSize: 14,
  },
  swipeButton: { // Style for Message/Add Friend buttons on player items
    minHeight: '100%', // Ensures button fills height of ListItem
  },
>>>>>>> Stashed changes
});