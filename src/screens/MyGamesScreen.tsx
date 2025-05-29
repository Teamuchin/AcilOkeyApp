// src/screens/MyGamesScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase'
import { Button} from '@rneui/themed'


export default function MyGamesScreen() {
  return (
    <View style={styles.container}>
      <Text>My Games Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticallySpaced: {
    paddingTop: 10,
    paddingBottom: 10,
  }
});