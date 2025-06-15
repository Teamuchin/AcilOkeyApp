import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Icon, Button } from '@rneui/themed'; // Assuming RNElements for styling
import Modal from 'react-native-modal'; // Your modal library

// Define a type for your notification structure
interface Notification {
  id: string;
  message: string;
  type: 'new_message' | 'game_invitation' | 'friend_request' | 'app_update';
  timestamp: string;
  read: boolean;
}

// Dummy data for demonstration
const dummyNotifications: Notification[] = [
  { id: '1', message: 'Test1', type: 'new_message', timestamp: '2 mins ago', read: false },
  { id: '2', message: 'Test2', type: 'game_invitation', timestamp: '1 hour ago', read: false },
  { id: '3', message: 'Test3', type: 'friend_request', timestamp: 'Yesterday', read: true },
  { id: '4', message: 'Test4', type: 'app_update', timestamp: '2 days ago', read: true },
  { id: '5', message: 'Test5', type: 'game_invitation', timestamp: '5 mins ago', read: false },
];

interface NotificationMenuProps {
  // You might pass a prop to update notification count, etc.
  // onMarkAllRead?: () => void;
  // initialNotifications?: Notification[]; // If you want to pass initial data
}

export default function NotificationMenu({ /* onMarkAllRead, initialNotifications */ }: NotificationMenuProps) {
  const [isModalVisible, setModalVisible] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(dummyNotifications); // Replace with actual data from Supabase

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif => (notif.id === id ? { ...notif, read: true } : notif))
    );
    // TODO: Send update to Supabase to mark as read
  };

  const handleNotificationPress = (notification: Notification) => {
    markAsRead(notification.id);
    Alert.alert("Notification Tapped", `Message: ${notification.message}\nType: ${notification.type}`);
    // TODO: Implement navigation or specific action based on notification.type
    // For example: if (notification.type === 'game_invitation') navigation.navigate('GameDetails', { id: notification.relatedId });
    toggleModal(); // Close modal after action
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    // TODO: Send update to Supabase to mark all as read for the user
    // if (onMarkAllRead) onMarkAllRead();
  };

  const unreadCount = notifications.filter(notif => !notif.read).length;

  return (
    <View style={styles.container}>
      {/* Notification Icon Button */}
      <TouchableOpacity onPress={toggleModal} style={styles.iconButton}>
        <Icon
          name="notifications"
          type="material"
          size={24}
          color="white"
          style={styles.icon}
        />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Notification Modal */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={toggleModal}
        onSwipeComplete={toggleModal}
        swipeDirection={['up', 'down']} // Allow closing by swiping
        // Position the modal slightly from the top, or center it
        style={styles.modal} // Use this for custom positioning
        animationIn="slideInDown" // Slide in from top
        animationOut="slideOutUp"   // Slide out to top
        backdropOpacity={0.4}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Notifications</Text>
            <TouchableOpacity onPress={toggleModal} style={styles.closeButton}>
              <Icon name="close" type="material" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <View style={styles.tabs}>
            <Text style={styles.tabText}>All</Text>
            <Text style={styles.tabText}>Unread</Text>
          </View>

          <ScrollView style={styles.notificationList}>
            {notifications.length === 0 ? (
              <Text style={styles.noNotificationsText}>No new notifications.</Text>
            ) : (
              notifications.map((notif) => (
                <TouchableOpacity
                  key={notif.id}
                  style={[styles.notificationItem, notif.read && styles.notificationItemRead]}
                  onPress={() => handleNotificationPress(notif)}
                >
                  <Icon
                    name={notif.type === 'game_invitation' ? 'gamepad' : notif.type === 'friend_request' ? 'person-add' : 'message'}
                    type="material"
                    size={20}
                    color={notif.read ? '#999' : '#333'}
                    style={styles.notificationIcon}
                  />
                  <View style={styles.notificationTextContent}>
                    <Text style={[styles.notificationMessage, notif.read && styles.notificationMessageRead]}>
                      {notif.message}
                    </Text>
                    <Text style={styles.notificationTimestamp}>{notif.timestamp}</Text>
                  </View>
                  {!notif.read && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title="Mark all as read"
              type="clear"
              titleStyle={styles.markAllReadText}
              onPress={markAllNotificationsAsRead}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // This container holds the notification icon.
    // When placed in headerRight/Left, keep this minimal.
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    opacity: 1,
  },
  badge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: 'transparent',
    borderRadius: 10,
    width: 25,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    outlineColor: 'white',
  },
  modal: {
    // Positioning the modal:
    justifyContent: 'flex-start', // Align content to the top
    alignItems: 'center', // Center horizontally
    margin: 0, // Remove default margin for full control
    paddingTop: 60, // Adjust this based on your status bar/header height to position it below
    // You could also use position: 'absolute' on modalContent itself within the modal
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    width: '90%', // Adjust width as needed
    maxHeight: '80%', // Limit height and make scrollable
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderWidth: 1,
    overflow: 'hidden', // Ensure content doesn't overflow rounded corners
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
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  tabText: {
    fontSize: 16,
    color: '#555',
    fontWeight: 'bold',
  },
  notificationList: {
    flexGrow: 1, // Allow scroll view to grow
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff', // Unread background
  },
  notificationItemRead: {
    backgroundColor: '#f8f8f8', // Read background
  },
  notificationIcon: {
    marginRight: 10,
  },
  notificationTextContent: {
    flex: 1, // Take up remaining space
  },
  notificationMessage: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  notificationMessageRead: {
    color: '#777',
    fontWeight: 'normal',
  },
  notificationTimestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
    marginLeft: 10,
  },
  noNotificationsText: {
    textAlign: 'center',
    paddingVertical: 20,
    color: '#999',
    fontSize: 16,
  },
  modalFooter: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  markAllReadText: {
    fontSize: 14,
    color: '#007bff', // Or your primary app color
  },
});