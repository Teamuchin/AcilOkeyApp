// src/screens/MyGamesScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase'
import { Button, Icon } from '@rneui/themed'
import { useNavigation } from '@react-navigation/native';

// Import new components
import CreateGameModal from '../../components/CreateGameModal'; // Assuming path
import GameParticipantsModal from '../../components/GameParticipantsModal'; // NEW: Import GameParticipantsModal

// --- Updated Game Type to match Supabase schemas ---
interface GameData {
  id: string;
  title: string;
  game_type: string;
  location_name: string;
  start_time: string;
  end_time: string | null;
  required_players: number;
  current_players: number;
  description: string | null;
  game_status: string;
  // If you want organizer's name directly, add it to select query with join
  // organizer_username?: string;
}

// Data fetched will be an array of GameData
type GameListItem = GameData;

export default function MyGamesScreen() {
  const [games, setGames] = useState<GameListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isCreateGameModalVisible, setCreateGameModalVisible] = useState(false);
  const [isParticipantsModalVisible, setParticipantsModalVisible] = useState(false); // NEW: State for participants modal
  const [selectedGameForParticipants, setSelectedGameForParticipants] = useState<GameListItem | null>(null); // NEW: To pass game details

  const navigation = useNavigation();

  // Get current user ID on mount
  useEffect(() => {
    supabase.auth.getUser().then(response => {
      setCurrentUserId(response.data.user?.id || null);
    });
  }, []);

  // Fetch games when component mounts or user ID changes
  const fetchUserGames = async () => { // Made this a named function for re-use
    if (!currentUserId) {
      setLoading(false);
      setError("Please sign in to view your games.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('Game_Participants')
        .select(`
            game_id,
            Game (
              id,
              title,
              game_type,
              location_name,
              start_time,
              end_time,
              required_players,
              current_players,
              description,
              game_status
            )
          `)
        .eq('user_id', currentUserId)
        .order('Game(start_time)', { ascending: true });

      if (fetchError) throw fetchError;

      const userGames: GameListItem[] = data.map((gp: any) => ({
        ...gp.Game,
        players: `${gp.Game.current_players}/${gp.Game.required_players} Players`
      }));

      setGames(userGames);
    } catch (err: any) {
      console.error('Error fetching user games:', err.message);
      setError('Failed to load your games.');
      Alert.alert('Error', 'Failed to load games: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      fetchUserGames();
    }
  }, [currentUserId]);

  const renderGame = ({ item }: { item: GameListItem }) => (
    <View style={styles.card}>
      <Text style={styles.gameName}>{item.title}</Text>
      <View style={styles.row}>
        <Text style={styles.level}>{item.game_type}</Text>
        <Text style={styles.location}>{item.location_name}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.date}>{new Date(item.start_time).toLocaleDateString()}</Text>
        <Text style={styles.time}>{new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
      <Text style={styles.players}>{item.current_players}/{item.required_players} Players</Text>
      <View style={styles.buttonRow}>
        <Button
          title="Participants" // Changed button title
          type="outline"
          buttonStyle={styles.groupChatBtn}
          titleStyle={{ color: '#ea2e3c' }}
          onPress={() => {
            setSelectedGameForParticipants(item); // NEW: Set the game to pass
            setParticipantsModalVisible(true); // NEW: Open the participants modal
          }}
        />
        <Button
          title="Leave Game"
          type="clear"
          buttonStyle={styles.leaveGameBtn}
          titleStyle={{ color: '#ea2e3c' }}
          onPress={() => {
            Alert.alert('Leave Game', `Leave game: ${item.title}?`);
            // TODO: Implement logic to remove user from Game_Participants
          }}
        />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading your games...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.topText}>Your scheduled games</Text>
        <TouchableOpacity style={styles.createGameButton} onPress={() => setCreateGameModalVisible(true)}>
          <Icon name="add" type="material" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={games}
        renderItem={renderGame}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.gamesList}
        ListEmptyComponent={
          <View style={styles.emptyListContainer}>
            <Text style={styles.emptyListText}>You have no scheduled games.</Text>
            <Text style={styles.emptyListText}>Tap the '+' button to create one!</Text>
          </View>
        }
      />

      {/* Create Game Modal */}
      <CreateGameModal
        visible={isCreateGameModalVisible}
        onClose={() => setCreateGameModalVisible(false)}
        onGameCreated={fetchUserGames} // Re-fetch games after new game is created
        currentUserId={currentUserId}
      />

      {/* --- NEW: Game Participants Modal --- */}
      {selectedGameForParticipants && ( // Only render if a game is selected
        <GameParticipantsModal
          visible={isParticipantsModalVisible}
          onClose={() => {
            setParticipantsModalVisible(false);
            setSelectedGameForParticipants(null); // Clear selected game when closed
          }}
          game={selectedGameForParticipants} // Pass the selected game object
          currentUserId={currentUserId}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  topText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  createGameButton: {
    backgroundColor: '#ea2e3c',
    borderRadius: 30,
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  gamesList: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  gameName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  level: {
    backgroundColor: '#ea2e3c',
    color: '#fff',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 12,
    marginRight: 8,
  },
  location: {
    fontSize: 14,
    color: '#555',
  },
  date: {
    fontSize: 14,
    color: '#555',
  },
  time: {
    fontSize: 14,
    color: '#555',
    marginLeft: 15,
  },
  players: {
    fontSize: 13,
    color: '#888',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 10,
    marginTop: 10,
  },
  groupChatBtn: {
    borderColor: '#D90106',
    borderWidth: 1,
    borderRadius: 5,
  },
  leaveGameBtn: {
    // Styling for Leave Game button
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
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
    paddingHorizontal: 20,
  },
  emptyListText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
    marginBottom: 5,
  },
});