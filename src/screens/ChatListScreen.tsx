// src/screens/ChatListScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Avatar, ListItem } from '@rneui/themed';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase'; // Adjust path as needed

type RootStackParamList = {
  Messages: undefined;
  Chat: { receiverId: string; username: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Interface for a user/contact
interface UserContact {
  id: string;
  username: string | null;
  profile_picture_url: string | null;
  // You might add last message, unread count here later
}

export default function ChatListScreen() {
  const [users, setUsers] = useState<UserContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NavigationProp>();

  // --- Change 1: currentUserId should be state, and initialized to null ---
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // --- Change 2: Fetch currentUserId and set it asynchronously ---
  useEffect(() => {
    // This effect runs once on component mount to get the initial user session
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUserId(session?.user?.id || null);
    };

    fetchSession();

    // Optionally, listen to auth state changes to keep currentUserId updated
    // if the user signs in/out while on this screen.
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user?.id || null);
    });

    return () => {
      authListener?.subscription.unsubscribe(); // Access the subscription property
    };
  }, []); // Empty dependency array means this effect runs once on mount


  // --- Change 3: fetchData useEffect now depends on currentUserId state ---
  useEffect(() => {
    async function fetchUsers() {
      // Only proceed if currentUserId is actually a string (not null)
      if (!currentUserId) {
        setLoading(false); // If no user, we're done loading for now
        setError("Please sign in to view your chats."); // Inform the user
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Fetch only accepted friends to show as chat partners
        const { data: friendsData, error: friendsError } = await supabase
          .from('Friendships')
          .select('user_id_1, user_id_2')
          .or(`user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`)
          .eq('status', 'accepted');

        if (friendsError) throw friendsError;

        // Get the friend IDs (the ones that aren't the current user)
        const friendIds = friendsData.map(friendship => 
          friendship.user_id_1 === currentUserId ? friendship.user_id_2 : friendship.user_id_1
        );

        // Fetch the user details for the friends
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('id, username, profile_picture_url')
          .in('id', friendIds);

        if (fetchError) throw fetchError;
        setUsers(data as UserContact[]);
      } catch (err: any) {
        console.error("Error fetching users for chat list:", err.message);
        setError("Failed to load chat contacts.");
        Alert.alert("Error", "Failed to load chat contacts: " + err.message);
      } finally {
        setLoading(false);
      }
    }

    // Call fetchUsers only when currentUserId is available and not null
    fetchUsers();
  }, [currentUserId]); // This effect now correctly depends on the `currentUserId` state

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      if (!currentUserId) {
        setError("Please sign in to view your chats.");
        return;
      }

      // Fetch only accepted friends to show as chat partners
      const { data: friendsData, error: friendsError } = await supabase
        .from('Friendships')
        .select('user_id_1, user_id_2')
        .or(`user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`)
        .eq('status', 'accepted');

      if (friendsError) throw friendsError;

      // Get the friend IDs (the ones that aren't the current user)
      const friendIds = friendsData.map(friendship => 
        friendship.user_id_1 === currentUserId ? friendship.user_id_2 : friendship.user_id_1
      );

      // Fetch the user details for the friends
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('id, username, profile_picture_url')
        .in('id', friendIds);

      if (fetchError) throw fetchError;
      setUsers(data as UserContact[]);
    } catch (err: any) {
      console.error("Error refreshing users:", err.message);
      setError("Failed to refresh chat contacts.");
    } finally {
      setRefreshing(false);
    }
  }, [currentUserId]);

  const renderItem = ({ item }: { item: UserContact }) => (
    <ListItem bottomDivider onPress={() => navigation.navigate('Chat', { receiverId: item.id, username: item.username || 'Chat Partner' })}>
      <Avatar
        source={item.profile_picture_url ? { uri: item.profile_picture_url } : { uri: 'https://via.placeholder.com/150' }}
        rounded
        size="medium"
      />
      <ListItem.Content>
        <ListItem.Title style={styles.username}>{item.username || 'Unknown User'}</ListItem.Title>
      </ListItem.Content>
      <ListItem.Chevron />
    </ListItem>
  );

  if (loading || currentUserId === null) { // Show loading while fetching user ID or data
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading chat list...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        {/* You might add a refresh button here */}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']} // Android
            tintColor="#2196F3" // iOS
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyListText}>No users found. Try connecting with others!</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  username: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#888',
  },
});