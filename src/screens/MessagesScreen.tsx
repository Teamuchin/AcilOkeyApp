// src/screens/MessageScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Button, Icon } from '@rneui/themed';
import { supabase } from '../../lib/supabase';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RealtimeChannel } from '@supabase/supabase-js';

// --- Interfaces (no change) ---
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Use a ref to hold receiver profile to avoid it being a dependency in the main effect
  const receiverProfileRef = useRef<UserProfile | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const navigation = useNavigation();
  const route = useRoute();
  const { receiverId } = route.params as { receiverId: string };

  // Effect 1: Get the current user
  useEffect(() => {
    const fetchUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUserId(session?.user?.id ?? null);
    };
    fetchUserSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user?.id ?? null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Effect 2: The main data and real-time setup hook
  useEffect(() => {
    // Don't run if we don't have the necessary IDs
    if (!currentUserId || !receiverId) {
      setLoading(false);
      return;
    }

    let messagesChannel: RealtimeChannel;

    const setup = async () => {
      setLoading(true);

      // --- Step 1: Fetch receiver profile and initial messages ---
      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('id, username, profile_picture_url')
          .eq('id', receiverId)
          .single();
        
        if (profileError) throw profileError;
        
        // Store profile in ref and set navigation title
        receiverProfileRef.current = profileData;
        navigation.setOptions({ title: profileData.username || 'Chat' });

        // Fetch initial messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*, sender_profile:users!messages_sender_id_fkey1(username)')
          .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUserId})`)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        const formattedMessages = messagesData.map((msg: any) => ({
          ...msg,
          sender_username: msg.sender_id === currentUserId ? 'Me' : (msg.sender_profile?.username || 'Unknown'),
        }));
        setMessages(formattedMessages);

      } catch (error: any) {
        console.error('Error during initial data fetch:', error.message);
        Alert.alert('Error', 'Failed to load chat data.');
      } finally {
        setLoading(false);
      }

      // --- Step 2: Set up the real-time subscription ---
      const channelName = `chat_${[currentUserId, receiverId].sort().join('_')}`;
      messagesChannel = supabase
        .channel(channelName, { config: { broadcast: { self: true } } })
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            const newMsg = payload.new as Message;
            
            // Filter to ensure the message belongs to this conversation
            const isForThisChat = 
              (newMsg.sender_id === currentUserId && newMsg.receiver_id === receiverId) ||
              (newMsg.sender_id === receiverId && newMsg.receiver_id === currentUserId);

            if (isForThisChat) {
              setMessages(prevMessages => {
                if (prevMessages.find(msg => msg.id === newMsg.id)) {
                  return prevMessages; // Already exists, do nothing
                }
                const newMessageWithUsername: Message = {
                  ...newMsg,
                  sender_username: newMsg.sender_id === currentUserId ? 'Me' : (receiverProfileRef.current?.username || 'Unknown'),
                };
                return [...prevMessages, newMessageWithUsername];
              });
            }
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Realtime subscribed to ${channelName}`);
          }
          if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
            console.error('Realtime subscription error:', err || status);
            // Optionally, you can attempt a reconnect here, but often Supabase handles this.
            // For now, we just log the error.
          }
        });
    };

    setup();

    // --- Step 3: Cleanup function ---
    return () => {
      if (messagesChannel) {
        console.log(`Unsubscribing from ${messagesChannel.topic}`);
        supabase.removeChannel(messagesChannel);
      }
    };

    // This effect should ONLY re-run if the chat participants change.
  }, [currentUserId, receiverId]);

  // Effect 3: Scroll to bottom when messages list is updated
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);


  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUserId || !receiverId) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUserId,
          receiver_id: receiverId,
          content: content,
          is_read: false,
        });

      if (error) {
        setNewMessage(content); // Restore message on failure
        throw error;
      }
      // Let the real-time listener handle adding the message to the state
    } catch (error: any) {
      console.error('Error sending message:', error.message);
      Alert.alert('Error', 'Failed to send message: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  // --- JSX Rendering (no major changes) ---
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading Chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContentContainer}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.sender_id === currentUserId ? styles.myMessage : styles.theirMessage,
            ]}
          >
            {msg.sender_id !== currentUserId && (
                <Text style={styles.senderName}>{receiverProfileRef.current?.username || 'User'}</Text>
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
          loading={sending}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

// --- Styles (no change) ---
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
        borderRadius: 12,
        maxWidth: '80%',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2,
      },
      myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#DCF8C6',
      },
      theirMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#FFFFFF',
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
        backgroundColor: '#f0f2f5',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: Platform.OS === 'ios' ? 10 : 8,
        marginRight: 10,
        minHeight: 40,
        maxHeight: 120,
      },
      sendButton: {
        backgroundColor: '#007bff',
        borderRadius: 25,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
      },
});