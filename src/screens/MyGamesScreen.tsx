// src/screens/MyGamesScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { supabase } from '../../lib/supabase'
import { Button} from '@rneui/themed'

type Game = {
  id: string;
  name: string;
  level: string;
  location: string;
  date: string;
  time: string;
  players: string;
};

const mockGames: Game[] = [
  {
    id: '1',
    name: 'Evening Okey Session',
    level: 'Intermediate',
    location: 'Atölye Plus',
    date: 'Tue, June 2',
    time: '19:00',
    players: '3/4 Players',
  },
  {
    id: '2',
    name: 'Weekend Okey Tournament',
    level: 'Advanced',
    location: 'Cafe Luce',
    date: 'Mon, June 4',
    time: '19:30',
    players: '2/4 Players',
  },
  {
    id: '3',
    name: 'Ceng Okey Tournament',
    level: 'Beginner',
    location: 'Ceng Cantine',
    date: 'Mon, June 5',
    time: '17:30',
    players: '4/4 Players',
  },
  {
    id: '4',
    name: 'Acil Okey Team Match',
    level: 'Advanced',
    location: 'Solea',
    date: 'Mon, June 9',
    time: '19:30',
    players: '4/4 Players',
  },
];

export default function MyGamesScreen() {
  const renderGame = ({ item }: { item: Game }) => (
    <View style={styles.card}>
      <Text style={styles.gameName}>{item.name}</Text>
      <View style={styles.row}>
        <Text style={styles.level}>{item.level}</Text>
        <Text style={styles.location}>{item.location}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.date}>{item.date}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
      <Text style={styles.players}>{item.players}</Text>
      <View style={styles.buttonRow}>
        <Button
          title="Group Chat"
          type="outline"
          buttonStyle={styles.groupChatBtn}
          titleStyle={{ color: '#ea2e3c' }}
        />
        <Button
          title="Leave Game" 
          type="clear" 
          buttonStyle={styles.leaveGameBtn} 
          titleStyle={{ color: '#ea2e3c' }}/>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.topText}>Your scheduled games</Text>
      <FlatList
        data={mockGames}
        renderItem={renderGame}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.gamesList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 10,
    flex: 1,
  },
  topText: {
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 20,
    fontWeight: 'bold'
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
    justifyContent: 'space-between',
    marginBottom: 3,
    gap: 20,
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
    marginRight: 'auto',
  },
  date: {
    fontSize: 14,
    color: '#555',
  },
  time: {
    fontSize: 14,
    color: '#555',
    marginRight: 'auto',
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
  },
  groupChatBtn: {
    borderColor: '#ea2e3c',
    borderWidth: 1,
    borderRadius: 5,
    marginRight: 10,
  },
  leaveGameBtn: {
    backgroundColor: '#eee',
    borderRadius: 5,
  },
});