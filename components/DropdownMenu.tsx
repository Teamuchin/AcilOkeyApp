import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from '@rneui/themed';
import { Menu, MenuItem, MenuDivider } from 'react-native-material-menu';
import { supabase } from '../lib/supabase';

// Add UserProfileModal import
import UserProfileModal from './UserProfileModal';

export default function CustomDropdownExample() {
  const [visible, setVisible] = useState(false);
  // Add state for UserProfile modal
  const [isUserProfileVisible, setIsUserProfileVisible] = useState(false);

  const showMenu = () => setVisible(true);
  const hideMenu = () => setVisible(false);

  // NEW: Add the handleSignOut function here
  const handleSignOut = async () => {
    hideMenu();
    try {
      const { data: { user }, error: getUserError } = await supabase.auth.getUser();
      if (getUserError) {
        await supabase.auth.signOut();
        return;
      }
  
      if (user) {        
        const { error: updateError } = await supabase
          .from('users')
          .update({ online_status: false })
          .eq('id', user.id);
  
        if (updateError) {
          // This is the most important log. If there is an error here, it will be displayed.
        } else {
        }
      } else {
        // This would be strange, but it's good to log it.
      }
    } catch (e) {
        // This will catch any other unexpected errors in the process.
    }
  
    await supabase.auth.signOut();
  };


  const handleOptionPress = (option: string) => {
    hideMenu();
    console.log(`Selected: ${option}`);
  };

  return (
    <View style={styles.container}>
      <Menu
        visible={visible}
        onRequestClose={hideMenu}
        anchor={
          <TouchableOpacity onPress={showMenu} style={styles.iconButton}>
            <Icon
              name="menu"
              type="material"
              size={24}
              color="white"
            />
          </TouchableOpacity>
        }
        style={styles.menuContainer}
      >
        {/* UPDATED: The onPress prop now calls the new handleSignOut function */}
        <MenuItem onPress={handleSignOut}>
          <Text style={styles.menuItemText}>Log Out</Text>
        </MenuItem>
        <MenuItem onPress={() => {
          hideMenu();
          setIsUserProfileVisible(true);
        }}>
          <Text style={styles.menuItemText}>Profile</Text>
        </MenuItem>
        <MenuDivider />
        <MenuItem onPress={() => handleOptionPress('Option C')}>
          <Text style={styles.menuItemText}>Option C</Text>
        </MenuItem>
      </Menu>

      {/* Add UserProfileModal component */}
      <UserProfileModal
        visible={isUserProfileVisible}
        onClose={() => setIsUserProfileVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Styles remain the same
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 5,
    elevation: 5,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
});