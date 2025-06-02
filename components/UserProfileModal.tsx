import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
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

  useEffect(() => {
    if (visible) {
      fetchUserData();
    }
  }, [visible]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user found!');

      const { data, error: profileError } = await supabase
        .from('Users')
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

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          {loading ? (
            <ActivityIndicator size="large" color="#2196F3" />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <>
              <View style={styles.imageContainer}>
                <Image 
                  source={selectedIcon} 
                  style={styles.userIcon}
                  resizeMode="contain"
                />
                <TouchableOpacity 
                  style={styles.changeIconButton}
                  onPress={() => setShowIconSelector(true)}
                >
                  <MaterialIcons name="add-circle" size={30} color="#2196F3" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.modalTitle}>{userData?.username || 'No Username'}</Text>
              {userData?.full_name && (
                <Text style={styles.fullName}>{userData.full_name}</Text>
              )}
              {userData?.bio_text && (
                <Text style={styles.bioText}>{userData.bio_text}</Text>
              )}
              {userData?.location && (
                <Text style={styles.location}>📍 {userData.location}</Text>
              )}
              <Text style={styles.onlineStatus}>
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, { backgroundColor: userData?.online_status ? '#34C759' : '#8E8E93' }]} />
                  <Text style={styles.statusText}>{userData?.online_status ? 'Online' : 'Offline'}</Text>
                </View>
              </Text>
              
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
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
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
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
});

export default UserProfileModal;