import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Dimensions, ActivityIndicator, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

// Enum değerlerini tanımlayalım
enum UserLevel {
  Novice = 'Novice',
  Skilled = 'Skilled',
  Expert = 'Expert'
}

enum Location {
  İstanbul = 'İstanbul',
  Eskişehir = 'Eskişehir',
  İzmir = 'İzmir',
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
  location: Location | null;
  user_level: UserLevel | null; // enum tipini belirtelim
  // Note: rating, status (like 'online'), etc., were in previous Player interface
  // but are not explicitly in your 'users' table screenshot. Adjust as needed if you add them.
}

// Sample icons array - replace with your actual icons
const userIcons = [
  require('../assets/user-icon.png'),
  require('../assets/user-icon-2.png'),
  require('../assets/user-icon-3.png'),
  require('../assets/user-icon-4.png'),
];

const UserProfileModal: React.FC<UserProfileModalProps> = ({ visible, onClose }) => {
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(userIcons[0]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedBio, setEditedBio] = useState('');
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [editedUsername, setEditedUsername] = useState('');
  const [showLocationSelector, setShowLocationSelector] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchUserData();
    }
  }, [visible]);

  useEffect(() => {
    if (isEditMode) {
      setEditedUsername(userData?.username || '');
    }
  }, [isEditMode, userData?.username]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user found!');

      const { data, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      
      if (data) {
        setUserData(data as UserData);
        if (data.profile_picture_url) {
          setSelectedIcon({ uri: data.profile_picture_url });
        }
      }
    } catch (err: any) {
      console.error('Error fetching user data:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBio = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          bio_text: editedBio,
          username: editedUsername 
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setUserData(prev => prev ? { 
        ...prev, 
        bio_text: editedBio,
        username: editedUsername 
      } : null);
      setIsEditMode(false);
    } catch (err: any) {
      console.error('Error updating profile:', err.message);
      setError(err.message);
    }
  };

  const handleLevelUpdate = async (newLevel: UserLevel) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: updateError } = await supabase
        .from('users')
        .update({ user_level: newLevel })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setUserData(prev => prev ? { ...prev, user_level: newLevel } : null);
      setShowLevelSelector(false);
    } catch (err: any) {
      console.error('Error updating level:', err.message);
      setError(err.message);
    }
  };

  const handleLocationUpdate = async (newLocation: Location) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: updateError } = await supabase
        .from('users')
        .update({ location: newLocation })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setUserData(prev => prev ? { ...prev, location: newLocation } : null);
      setShowLocationSelector(false);
    } catch (err: any) {
      console.error('Error updating location:', err.message);
      setError(err.message);
    }
  };

  const renderIconItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.iconItem}
      onPress={() => {
        setSelectedIcon(item);
        setShowIconSelector(false);
      }}
    >
      <Image source={item} style={styles.iconOption} resizeMode="contain" />
    </TouchableOpacity>
  );

  const handleClose = () => {
    setIsEditMode(false);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          {loading ? (
            <ActivityIndicator size="large" color="#2196F3" />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => {
                  if (isEditMode) {
                    handleSaveBio();
                  } else {
                    setEditedBio(userData?.bio_text || '');
                    setEditedUsername(userData?.username || '');
                    setIsEditMode(true);
                  }
                }}
              >
                <MaterialIcons 
                  name={isEditMode ? "save" : "edit"} 
                  size={24} 
                  color="#2196F3" 
                />
              </TouchableOpacity>

              <View style={styles.headerLevel}>
                {isEditMode ? (
                  <TouchableOpacity 
                    onPress={() => setShowLevelSelector(true)}
                    style={[styles.levelButton, { marginRight: -9 }]}
                  >
                    <Text style={styles.level}>
                      🎯 {userData?.user_level || 'Select Level'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  userData?.user_level && (
                    <Text style={[styles.level, { marginRight: 0 }]}>🎯 {userData.user_level}</Text>
                  )
                )}
              </View>
              <View style={styles.headerLocation}>
                {isEditMode ? (
                  <TouchableOpacity 
                    onPress={() => setShowLocationSelector(true)}
                    style={[styles.location, { borderWidth: 1, borderColor: '#f2f2f2' }]}
                  >
                    <Text>📍{userData?.location || 'Select Location'}</Text>
                  </TouchableOpacity>
                ) : (
                  userData?.location && (
                    <Text style={styles.location}>📍{userData.location}</Text>
                  )
                )}
              </View>
              <View style={styles.imageContainer}>
                <Image 
                  source={selectedIcon} 
                  style={styles.userIcon}
                  resizeMode="contain"
                />
                {isEditMode && (
                  <TouchableOpacity 
                    style={styles.changeIconButton}
                    onPress={() => setShowIconSelector(true)}
                  >
                    <MaterialIcons name="add-circle" size={30} color="#2196F3" />
                  </TouchableOpacity>
                )}
              </View>
              
              {isEditMode ? (
                <TextInput
                  style={[styles.modalTitle, styles.editableTitle]}
                  value={editedUsername}
                  onChangeText={setEditedUsername}
                  placeholder="Enter username"
                />
              ) : (
                <Text style={styles.modalTitle}>{userData?.username || 'No Username'}</Text>
              )}
              
              {userData?.bio_text && !isEditMode && (
                <Text style={styles.bioText}>{userData.bio_text}</Text>
              )}
              
              {isEditMode && (
                <View style={styles.bioEditContainer}>
                  <TextInput
                    style={styles.bioInput}
                    multiline
                    numberOfLines={4}
                    value={editedBio}
                    onChangeText={setEditedBio}
                    placeholder="Write your bio..."
                  />
                </View>
              )}

              <Text style={styles.onlineStatus}>
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, { backgroundColor: userData?.online_status ? '#34C759' : '#8E8E93' }]} />
                  <Text style={styles.statusText}>{userData?.online_status ? 'Online' : 'Offline'}</Text>
                </View>
              </Text>
              
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Icon Selector Modal */}
      <Modal
        visible={showIconSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowIconSelector(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.iconSelectorModal}>
            <Text style={styles.modalTitle}>Select Icon</Text>
            <FlatList
              data={userIcons}
              renderItem={renderIconItem}
              keyExtractor={(_, index) => index.toString()}
              numColumns={3}
              contentContainerStyle={styles.iconGrid}
            />
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowIconSelector(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Level Selector Modal */}
      <Modal
        visible={showLevelSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLevelSelector(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.levelSelectorModal}>
            <Text style={styles.modalTitle}>Select Level</Text>
            {Object.values(UserLevel).map((level) => (
              <TouchableOpacity
                key={level}
                style={styles.levelOption}
                onPress={() => handleLevelUpdate(level)}
              >
                <Text style={styles.levelOptionText}>{level}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowLevelSelector(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Location Selector Modal */}
      <Modal
        visible={showLocationSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLocationSelector(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.levelSelectorModal}>
            <Text style={styles.modalTitle}>Select Location</Text>
            {Object.values(Location).map((location) => (
              <TouchableOpacity
                key={location}
                style={styles.levelOption}
                onPress={() => handleLocationUpdate(location)}
              >
                <Text style={styles.levelOptionText}>{location}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowLocationSelector(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
  fullName: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  bioText: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  location: {
    fontSize: 14,
    color: '#666',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  level: {
    fontSize: 14,
    color: '#666',
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
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 15,
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
  changeIconButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 2,
  },
  iconSelectorModal: {
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
    width: '90%',
    maxHeight: '80%',
  },
  iconGrid: {
    paddingVertical: 20,
  },
  iconItem: {
    width: Dimensions.get('window').width / 4,
    height: Dimensions.get('window').width / 4,
    padding: 10,
  },
  iconOption: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  headerLocation: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  headerLevel: {
    position: 'absolute',
    top: 37,
    right: 18,
    zIndex: 1,
  },
  editButton: {
    position: 'absolute',
    color: '#ea2e3c',
    top: 10,
    left: 10,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
  },
  bioEditContainer: {
    width: '100%',
    marginBottom: 15,
  },
  bioInput: {
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  levelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#f2f2f2'
  },
  levelSelectorModal: {
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
  },
  levelOption: {
    width: '100%',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  levelOptionText: {
    fontSize: 18,
    color: '#333',
  },
  editableTitle: {
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    width: '100%',
    textAlign: 'center',
  },
});

export default UserProfileModal;