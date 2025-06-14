// src/screens/MessageScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Button, Icon, Avatar } from '@rneui/themed';
import { supabase } from '../../lib/supabase';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RealtimeChannel } from '@supabase/supabase-js'; // Import RealtimeChannel type

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender_username?: string;
}

interface UserProfile {
  id: string;
  username: string;
  profile_picture_url?: string;
}

export default function MessageScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [receiverProfile, setReceiverProfile] = useState<UserProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const navigation = useNavigation();
  const route = useRoute();
  const { receiverId } = route.params as { receiverId: string };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user?.id || null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id || null);
    });
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function fetchReceiverProfile() {
      if (!receiverId) return;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, username, profile_picture_url')
          .eq('id', receiverId)
          .single();

        if (error) throw error;
        setReceiverProfile(data);
        navigation.setOptions({ title: data.username || 'Chat' });
      } catch (error: any) {
        console.error('Error fetching receiver profile:', error.message);
        Alert.alert('Error', 'Could not load chat partner details.');
        setReceiverProfile(null);
      }
    }
    fetchReceiverProfile();
  }, [receiverId, navigation]);


  useEffect(() => {
    if (!currentUserId || !receiverId) {
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            id,
            sender_id,
            receiver_id,
            content,
            created_at,
            is_read,
            sender_profile:users!messages_sender_id_fkey1(username),
            receiver_profile:users!messages_receiver_id_fkey1(username)
          `)
          .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUserId})`)
        if (error) throw error;

        const formattedMessages = data.map((msg: any) => ({
          ...msg,
          sender_username: msg.sender_id === currentUserId ? 'Me' : msg.sender_profile?.username || 'Unknown User',
        }));

        setMessages(formattedMessages as Message[]);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

      } catch (error: any) {
        console.error('Error fetching messages:', error.message);
        Alert.alert('Error', 'Failed to load messages: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    let messagesChannel: RealtimeChannel | null = null; // Initialize with null and explicit type

    try {
        messagesChannel = supabase
            .channel(`chat_${[currentUserId, receiverId].sort().join('_')}`)
            .on('postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `and(sender_id.eq.${currentUserId},receiver_id.eq.${receiverId})` +
                    `|and(sender_id.eq.${receiverId},receiver_id.eq.${currentUserId})`
                },
                (payload) => {
                    console.log('Realtime message received:', payload);
                    const newMsgRaw = payload.new as Message;

                    let senderUsernameForRealtime: string | undefined;
                    if (newMsgRaw.sender_id === currentUserId) {
                        senderUsernameForRealtime = "Me";
                    } else if (newMsgRaw.sender_id === receiverId && receiverProfile) {
                        senderUsernameForRealtime = receiverProfile.username;
                    } else {
                        senderUsernameForRealtime = "Unknown User";
                    }

                    const newMessageWithUsername: Message = {
                        ...newMsgRaw,
                        sender_username: senderUsernameForRealtime,
                    };

                    setMessages(prevMessages => {
                        if (!prevMessages.some(msg => msg.id === newMessageWithUsername.id)) {
                            return [...prevMessages, newMessageWithUsername];
                        }
                        return prevMessages;
                    });
                    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                }
            )
            .subscribe((status) => {
                console.log('Realtime subscription status:', status);
                if (status === 'SUBSCRIBED') {
                    console.log(`Successfully subscribed to channel: chat_${[currentUserId, receiverId].sort().join('_')}`);
                }
            });

    } catch (e: any) {
        console.error('Error setting up Realtime subscription:', e.message);
        Alert.alert('Realtime Error', 'Failed to connect to real-time updates.');
    }


    return () => {
      if (messagesChannel) { // Ensure messagesChannel is not null before unsubscribing
        console.log('Unsubscribing from messages channel:', messagesChannel.topic);
        messagesChannel.unsubscribe();
        supabase.removeChannel(messagesChannel);
      }
    };
    // --- FIX END ---
  }, [currentUserId, receiverId, receiverProfile]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUserId || !receiverId) return;

    setSending(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUserId,
          receiver_id: receiverId,
          content: newMessage.trim(),
          is_read: false,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Add the new message to the local state immediately
      if (data) {
        const newMessageWithUsername: Message = {
          ...data,
          sender_username: 'Me',
        };
        setMessages(prevMessages => [...prevMessages, newMessageWithUsername]);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      }
      
      setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error.message);
      Alert.alert('Error', 'Failed to send message: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  if (loading && !currentUserId && !receiverProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading chat...</Text>
      </View>
    );
  }
  if (!currentUserId) {
      return (
          <View style={styles.loadingContainer}>
              <Text>Please sign in to view messages or current user ID not available.</Text>
          </View>
      );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContentContainer}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.sender_id === currentUserId ? styles.myMessage : styles.theirMessage,
            ]}
          >
            {msg.sender_id !== currentUserId && msg.sender_username && (
                <Text style={styles.senderName}>{msg.sender_username}</Text>
            )}
            <Text style={styles.messageContent}>{msg.content}</Text>
            <Text style={styles.messageTimestamp}>
              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type your message..."
          multiline
        />
        <Button
          icon={<Icon name="send" type="material" color="white" />}
          buttonStyle={styles.sendButton}
          onPress={handleSendMessage}
          disabled={sending || !newMessage.trim()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
  },
  messagesContentContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageBubble: {
    padding: 10,
    borderRadius: 8,
    maxWidth: '80%',
    marginBottom: 8,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#555',
  },
  messageContent: {
    fontSize: 16,
    color: '#333',
  },
  messageTimestamp: {
    fontSize: 10,
    color: '#777',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    minHeight: 40,
    maxHeight: 120,
  },
  sendButton: {
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});