import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
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
          <Text style={styles.modalTitle}>John Doe</Text>
          
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
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
  closeButton: {
    backgroundColor: '#2196F3',
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
  },
});

export default UserProfileModal;