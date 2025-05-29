import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from '@rneui/themed';
import { Menu, MenuItem, MenuDivider } from 'react-native-material-menu';
import { supabase } from '../lib/supabase'


export default function CustomDropdownExample() {
  const [visible, setVisible] = useState(false);

  const showMenu = () => setVisible(true);
  const hideMenu = () => setVisible(false);

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
        <MenuItem onPress={() => supabase.auth.signOut()}>
          <Text style={styles.menuItemText}>Log Out</Text>
        </MenuItem>
        <MenuItem onPress={() => handleOptionPress('Option B')}>
          <Text style={styles.menuItemText}>Option B</Text>
        </MenuItem>
        <MenuDivider />
        <MenuItem onPress={() => handleOptionPress('Option C')}>
          <Text style={styles.menuItemText}>Option C</Text>
        </MenuItem>
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // These styles are for the container holding the menu button.
    // If this component is placed in the header, these styles will define
    // its position within the header.
    // For a header icon, you often want minimal styling here,
    // let the header control its position.
    // example: If you place it on the right side of header, use:
    // flex: 1,
    // flexDirection: 'row',
    // justifyContent: 'flex-end',
    // alignItems: 'center',
    // paddingRight: 10, // Adjust padding as needed
  },
  iconButton: {
    padding: 8,
    borderRadius: 20, // Makes it a circular hit area
    backgroundColor: 'transparent',
    // You might want to add margin/padding here if it's part of a row of icons
  },
  menuContainer: {
    // Optional: Style the menu's background and appearance
    backgroundColor: 'white',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
});