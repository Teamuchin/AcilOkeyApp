// src/components/CreateGameModal.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Alert, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Button, Input, ButtonGroup } from '@rneui/themed';
import { Icon } from '@rneui/themed'; // For Icons
import DateTimePicker from '@react-native-community/datetimepicker'; // For date/time pickers
import { supabase } from '../lib/supabase'; // Adjust path as needed

interface CreateGameModalProps {
  visible: boolean;
  onClose: () => void;
  onGameCreated: () => void; // Callback to refresh MyGamesScreen
  currentUserId: string | null; // The ID of the user creating the game
}

export default function CreateGameModal({ visible, onClose, onGameCreated, currentUserId }: CreateGameModalProps) {
  const [title, setTitle] = useState('');
  const [locationName, setLocationName] = useState('');
  const [requiredPlayers, setRequiredPlayers] = useState('4');
  const [description, setDescription] = useState('');
  const [gameTypeIndex, setGameTypeIndex] = useState(0); // Index for game_type ButtonGroup
  const [gameStatusIndex, setGameStatusIndex] = useState(0); // Index for game_status ButtonGroup (e.g., Scheduled)

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date()); // Holds both date and time
  const [loading, setLoading] = useState(false);

  // --- CRITICAL FIX: Update these arrays to EXACTLY match your database ENUMs ---
  // Based on user_level enum: Beginner, Intermediate, Advanced, Master
  const gameTypes = ['Novice', 'Skilled', 'Expert'];
  // Based on game_status enum: Scheduled, Open, Completed, Cancelled
  const gameStatuses = ['scheduled', 'open', 'completed', 'cancelled'];

  const onCreateGame = async () => {
    if (!currentUserId) {
      Alert.alert('Error', 'User not logged in to create a game.');
      return;
    }
    if (!title.trim() || !locationName.trim() || !requiredPlayers.trim()) {
      Alert.alert('Error', 'Please fill in all required fields (Title, Location, Players).');
      return;
    }
    const numPlayers = parseInt(requiredPlayers);
    // Standard Okey is  players. Adjust validation based on your game's needs.
    if (numPlayers < 2 || numPlayers > 4) {
      Alert.alert('Error', 'Required players must be between 2 and 4.');
      return;
    }

    setLoading(true);
    try {
      const { data: gameData, error: gameError } = await supabase
        .from('Game') // Your Game table name
        .insert({
          title: title.trim(),
          location_name: locationName.trim(),
          start_time: selectedDate.toISOString(), // Send as ISO string
          required_players: numPlayers, // Use parsed number
          current_players: 1, // Organizer is the first player
          description: description.trim() || null,
          game_type: gameTypes[gameTypeIndex], // Value from CORRECTED gameTypes array
          game_status: gameStatuses[0], // Force 'Scheduled' as initial status (index 0 of CORRECTED gameStatuses array)
          // If you add organizer_id to Game table, uncomment this:
          // organizer_id: currentUserId,
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // --- Add organizer to Game_Participants table ---
      const { error: participantError } = await supabase
        .from('Game_Participants')
        .insert({
          game_id: gameData.id,
          user_id: currentUserId,
          joined_at: new Date().toISOString(),
          status: 'Organizer', // Use a valid status for Game_Participants (e.g., 'organizer' or 'joined')
        });

      if (participantError) throw participantError;

      Alert.alert('Success', 'Game created successfully!');
      // Reset form fields
      setTitle('');
      setLocationName('');
      setRequiredPlayers('4'); // Reset default to 4 players for next time
      setDescription('');
      setGameTypeIndex(0);
      setGameStatusIndex(0); // Reset to 0 (Scheduled)
      setSelectedDate(new Date());

      onGameCreated(); // Call callback to refresh parent list and close modal

    } catch (error: any) {
      console.error('Error creating game:', error.message);
      Alert.alert('Error', 'Failed to create game: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, newDate: Date | undefined) => {
    const currentDate = newDate || selectedDate; // Use selectedDate if newDate is undefined
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);
  };

  const onTimeChange = (event: any, newTime: Date | undefined) => {
    const currentTime = newTime || selectedDate; // Use selectedDate if newTime is undefined
    setShowTimePicker(Platform.OS === 'ios');
    // Combine date and new time
    const updatedDate = new Date(selectedDate);
    updatedDate.setHours(currentTime.getHours());
    updatedDate.setMinutes(currentTime.getMinutes());
    setSelectedDate(updatedDate);
  };

  return (
    <Modal animationType="slide" transparent={false} visible={visible} onRequestClose={onClose}>
      <View style={modalStyles.modalContainer}>
        <View style={modalStyles.modalHeader}>
          <Text style={modalStyles.modalTitle}>Create New Game</Text>
          <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
            <Icon name="close" type="material" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={modalStyles.modalContent}>
          <Input
            label="Game Title"
            placeholder="e.g., Evening Okey Session"
            value={title}
            onChangeText={setTitle}
            containerStyle={modalStyles.inputContainer}
          />
          <Input
            label="Location Name"
            placeholder="e.g., Atölye Plus"
            value={locationName}
            onChangeText={setLocationName}
            containerStyle={modalStyles.inputContainer}
          />
          <Input
            label="Required Players"
            placeholder="e.g., 4 (Including Yourself)" // Updated placeholder
            keyboardType="numeric"
            value={requiredPlayers}
            onChangeText={(text) => setRequiredPlayers(text.replace(/[^0-9]/g, ''))} // Allow only numbers
            containerStyle={modalStyles.inputContainer}
          />
          <Input
            label="Description (Optional)"
            placeholder="Any specific rules or notes"
            value={description}
            onChangeText={setDescription}
            multiline
            containerStyle={modalStyles.inputContainer}
          />

          <View style={modalStyles.dateTimeContainer}>
            <Text style={modalStyles.dateTimeLabel}>Date & Time</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={modalStyles.dateTimeButton}>
              <Text>{selectedDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowTimePicker(true)} style={modalStyles.dateTimeButton}>
              <Text>{selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="time"
              display="default"
              onChange={onTimeChange}
            />
          )}

          <Text style={modalStyles.label}>Game Type</Text>
          <ButtonGroup
            buttons={gameTypes} // Uses corrected gameTypes
            selectedIndex={gameTypeIndex}
            onPress={setGameTypeIndex}
            containerStyle={modalStyles.buttonGroupContainer}
          />

          {/* Game Status is usually "Scheduled" on creation, so no ButtonGroup needed here */}
          {/* If you add it back, ensure it uses `gameStatuses` correct from DB */}

        </ScrollView>

        <View style={modalStyles.modalFooter}>
          <Button
            title="Create Game"
            onPress={onCreateGame}
            disabled={loading}
            loading={loading}
            buttonStyle={modalStyles.createButton}
          />
        </View>
      </View>
    </Modal>
  );
}

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
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  dateTimeContainer: {
    marginBottom: 15,
  },
  dateTimeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  dateTimeButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonGroupContainer: {
    marginBottom: 20,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  createButton: {
    backgroundColor: '#ea2e3c',
    borderRadius: 10,
    paddingVertical: 12,
  },
});