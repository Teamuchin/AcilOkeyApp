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
  full_name: string | null; // text (can be null)
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

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (selectedIndex === 0) { // Fetch Games
        const { data, error: gamesError } = await supabase
          .from('Game')
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
          `);

        if (gamesError) throw gamesError;
        setGames(data as GameData[]);
      } else { // Fetch Players (Users)
        const { data, error: usersError } = await supabase
          .from('Users')
          .select(`
            id,
            username,
            email,
            full_name,
            bio_text,
            phone_number,
            profile_picture_url,
            created_at,
            online_status,
            game_history_visibility,
            location
          `);

        if (usersError) throw usersError;
        setUsers(data as UserData[]);
      }
    } catch (err: any) {
      console.error('Error fetching data from Supabase:', err.message);
      setError('Failed to load data. Please try again.');
      Alert.alert('Error', 'Failed to load data from Supabase: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedIndex]);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      if (selectedIndex === 0) { // Searching for Games
        const { data, error: searchError } = await supabase
          .from('games')
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
          .ilike('title', `%${searchQuery}%`)
          .or(`location_name.ilike.%${searchQuery}%,game_type.ilike.%${searchQuery}%`); // Search across multiple fields

        if (searchError) throw searchError;
        setGames(data as GameData[]);
      } else { // Searching for Players (Users)
        const { data, error: searchError } = await supabase
          .from('Users')
          .select(`
            id,
            username,
            email,
            full_name,
            bio_text,
            phone_number,
            profile_picture_url,
            created_at,
            online_status,
            game_history_visibility,
            location
          `)
          .ilike('username', `%${searchQuery}%`)
          .or(`bio_text.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`); // Search across multiple fields

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
          <Text style={styles.listItemSubtitle}>{user.full_name || 'No Name'} &middot; </Text>
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
        }}
        containerStyle={styles.buttonGroupContainer}
        selectedButtonStyle={styles.selectedButtonGroupButton}
        textStyle={styles.buttonGroupText}
        selectedTextStyle={styles.selectedButtonGroupText}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}
      {loading && games.length === 0 && Users.length === 0 ? (
        <View style={styles.loadingListContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Loading data...</Text>
        </View>
      ) : (
        <ScrollView style={styles.resultsContainer}>
          {selectedIndex === 0 ? (
            games.length === 0 ? (
              <Text style={styles.noResultsText}>No games found. Try adjusting your search or filters.</Text>
            ) : (
              games.map(renderGameItem)
            )
          ) : (
            Users.length === 0 ? (
              <Text style={styles.noResultsText}>No players found. Try adjusting your search or filters.</Text>
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
    borderColor: 'tomato',
  },
  selectedButtonGroupButton: {
    backgroundColor: 'tomato',
  },
  buttonGroupText: {
    color: 'tomato',
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