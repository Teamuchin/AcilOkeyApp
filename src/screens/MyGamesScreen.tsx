// src/screens/MyGamesScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase'
import { Button} from '@rneui/themed'


export default function MyGamesScreen() {
  return (
    <View style={styles.container}>
      <Text>My Games Screen</Text>
      <View style={styles.verticallySpaced}>
        <Button title="Sign Out" onPress={() => supabase.auth.signOut()} />
      </View>
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