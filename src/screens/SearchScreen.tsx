import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
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
  game_history_visibility: boolean | null; // bool (can be null) - Using exact column name
  location: string | null; // text (can be null)
  // Note: rating, status (like 'online'), etc., were in previous Player interface
  // but are not explicitly in your 'users' table screenshot. Adjust as needed if you add them.
}


export default function SearchScreen() {
  const [selectedIndex, setSelectedIndex] = useState(0); // 0 for Games, 1 for Players
  const [searchQuery, setSearchQuery] = useState('');
  const [games, setGames] = useState<GameData[]>([]); // Using GameData
  const [Users, setUsers] = useState<UserData[]>([]); // Using UserData
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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
          .from('Users')
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
            location
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

  const renderPlayerItem = (user: UserData) => ( // Changed 'player' to 'user' for clarity
    <ListItem.Swipeable
      key={user.id}
      bottomDivider
      onPress={() => Alert.alert('Player Profile', `View profile for: ${user.username || 'Unknown'}`)}
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
});