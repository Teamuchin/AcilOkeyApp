import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, Modal, Image, TouchableOpacity } from 'react-native';
import { Input, Button, ButtonGroup, ListItem, Avatar } from '@rneui/themed';
import { Icon } from '@rneui/themed';
import { supabase } from '../../lib/supabase'; // Your Supabase client

// --- Updated Interfaces for your Supabase data based on images ---
// These should match your Supabase table schema exactly
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
  game_status: 'open' | 'in_progress' | 'completed' | 'scheduled'; // Your game_stat ENUM values
  game_type: 'regular' | 'tournament'; // Your game_typ ENUM values
  // Note: organizer_id is a foreign key, but not directly in the games table columns you showed.
  // We'll need to select it if it's there or handle joining.
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
  user_level: 'Novice' | 'Skilled' | 'Expert' | null; // Yeni eklenen alan
}

// Yeni bir PlayerProfileModal bileşeni ekleyelim
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
          <View style={styles.headerLevel}>
            <Text style={styles.level}>🎯 {userData.user_level || 'Not set'}</Text>
          </View>
          <View style={styles.headerLocation}>
            <Text style={styles.location}>📍{userData.location || 'Not set'}</Text>
          </View>
          <View style={styles.imageContainer}>
            <Image 
              source={userData.profile_picture_url ? { uri: userData.profile_picture_url } : require('../../assets/user-icon.png')} 
              style={styles.userIcon}
              resizeMode="contain"
            />
          </View>
          
          <Text style={styles.modalTitle}>{userData.username || 'No Username'}</Text>
          
          <Text style={styles.bioText}>{userData.bio_text || 'No bio available'}</Text>

          <Text style={styles.onlineStatus}>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, { backgroundColor: userData.online_status ? '#34C759' : '#8E8E93' }]} />
              <Text style={styles.statusText}>{userData.online_status ? 'Online' : 'Offline'}</Text>
            </View>
          </Text>
          
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function SearchScreen() {
  const [selectedIndex, setSelectedIndex] = useState(0); // 0 for Games, 1 for Players
  const [searchQuery, setSearchQuery] = useState('');
  const [games, setGames] = useState<GameData[]>([]); // Using GameData
  const [Users, setUsers] = useState<UserData[]>([]); // Using UserData
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

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
    if (!searchQuery.trim()) {
      setGames([]);
      setUsers([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (selectedIndex === 0) { // Searching for Games (no change here)
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
          .or(`title.ilike.%${searchQuery}%,location_name.ilike.%${searchQuery}%,game_type.ilike.%${searchQuery}%`);

        if (searchError) throw searchError;
        setGames(data as GameData[]);
      } else { // UPDATED: Searching for Players (Users) by username only
        const { data, error: searchError } = await supabase
          .from('users')
          .select(`
            id,
            username,
            email,
            bio_text,
            phone_number,
            profile_picture_url,
            created_at,
            online_status,
            game_history_visibility,
            location,
            user_level
          `)
          .neq('id', currentUserId) // Exclude current user
          // The only change is this line:
          .ilike('username', `%${searchQuery}%`); // Search only the username column

        if (searchError) throw searchError;
        setUsers(data as UserData[]);
      }
    } catch (err: any) {
      console.error('Error during search:', err.message);
      setError('Search failed. Please try again.');
      Alert.alert('Search Error', 'Failed to perform search: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Render Functions for Game/Player Lists ---

  const renderGameItem = (game: GameData) => (
    <ListItem.Swipeable
      key={game.id}
      bottomDivider
      onPress={() => Alert.alert('Game Details', `View details for: ${game.title}`)}
      leftContent={
        <Button
          title="Info"
          icon={{ name: 'info', color: 'white' }}
          buttonStyle={{ minHeight: '100%' }}
        />
      }
      rightContent={
        <Button
          title="Join"
          icon={{ name: 'add', color: 'white' }}
          buttonStyle={{ minHeight: '100%', backgroundColor: 'green' }}
          onPress={() => Alert.alert('Join Game', `Join ${game.title}?`)}
        />
      }
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
      <ListItem.Chevron />
    </ListItem.Swipeable>
  );

  const renderPlayerItem = (user: UserData) => (
    <ListItem.Swipeable
      key={user.id}
      bottomDivider
      onPress={() => {
        setSelectedUser(user);
        setShowProfileModal(true);
      }}
      leftContent={
        <Button
          title="Message"
          icon={{ name: 'chatbox-outline', type: 'ionicon', color: 'white' }}
          buttonStyle={{ minHeight: '100%' }}
        />
      }
      rightContent={
        <Button
          title="Add Friend"
          icon={{ name: 'person-add-outline', type: 'ionicon', color: 'white' }}
          buttonStyle={{ minHeight: '100%', backgroundColor: '#007bff' }}
          onPress={() => Alert.alert('Add Friend', `Send request to ${user.username || 'Unknown'}?`)}
        />
      }
    >
      <Avatar
        source={user.profile_picture_url ? { uri: user.profile_picture_url } : { uri: 'https://via.placeholder.com/150' }}
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
            Users.length === 0 ? (
              <Text style={styles.noResultsText}>
                {searchQuery ? "No players found. Try adjusting your search." : "Search for players to see results."}
              </Text>
            ) : (
              Users.map(renderPlayerItem)
            )
          )}
        </ScrollView>
      )}

      <PlayerProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userData={selectedUser}
      />
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
    borderColor: '#D90106',
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
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  loadingListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
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
  level: {
    fontSize: 14,
    color: '#666',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
});