import React, { useState } from 'react'
import { Alert, StyleSheet, View, AppState, Text, TouchableOpacity } from 'react-native'
import { supabase } from '../lib/supabase'
import { Button, Input } from '@rneui/themed'

// Tells Supabase Auth to continuously refresh the session automatically if
// the app is in the foreground. When this is added, you will continue to receive
// `onAuthStateChange` events with the `TOKEN_REFRESHED` or `SIGNED_OUT` event
// if the user's session is terminated. This should only be registered once.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(true)

  async function signInWithEmail() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) Alert.alert(error.message)
    setLoading(false)
  }

  async function signUpWithEmail() {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match!')
      return
    }
    
    setLoading(true)
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
    })

    if (error) Alert.alert(error.message)
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <View style={styles.title}>
        <Text style={styles.titleText}>Acil Okey</Text>
      </View>
      <View style={styles.slogan}>
        <Text style={styles.sloganText}>Find New Friends to Play With  </Text>
      </View>
      <View style={[styles.loginContainer, { flex: isLogin ? 0.54 : 0.68 }]}>
        <View style={styles.login_register_switch}>
          <TouchableOpacity style={[
            styles.switchButton,
            isLogin && styles.activeButton,
            { borderTopLeftRadius: 15, borderBottomLeftRadius: 15 }
          ]}
          onPress={() => setIsLogin(true)}
          >
            <Text style={[styles.switchText, isLogin && styles.activeText]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[
            styles.switchButton,
            !isLogin && styles.activeButton,
            { borderTopRightRadius: 15, borderBottomRightRadius: 15 }
          ]}
          onPress={() => setIsLogin(false)}
          >
            <Text style={[styles.switchText, !isLogin && styles.activeText]}>Register</Text>
          </TouchableOpacity>

            {/* Burada isLogin durumuna göre form veya butonları gösterebilirsin */}
          </View>
        <View style={styles.inputs}>
          <Input  
            label="Email"
            leftIcon={{ type: 'font-awesome', name: 'envelope' }}
            onChangeText={(text) => setEmail(text)}
            value={email}
            placeholder="email@address.com"
            autoCapitalize={'none'}
          />
        </View>
        <View style={styles.passwordContainer}>
          <Input
            label="Password"
            leftIcon={{ type: 'font-awesome', name: 'lock' }}
            onChangeText={(text) => setPassword(text)}
            value={password}
            secureTextEntry={true}
            placeholder="Password"
            autoCapitalize={'none'}
            containerStyle={styles.passwordInput}
            inputContainerStyle={styles.inputContainer}
          />
          {!isLogin && (
            <Input
              label="Confirm Password"
              leftIcon={{ type: 'font-awesome', name: 'lock' }}
              onChangeText={(text) => setConfirmPassword(text)}
              value={confirmPassword}
              secureTextEntry={true}
              placeholder="Password"
              autoCapitalize={'none'}
              containerStyle={styles.passwordInput}
              inputContainerStyle={styles.inputContainer}
            />
          )}
        </View>
        <View style={styles.login_button}>
          <Button
            color={'#ea2e3c'}
            title={isLogin ? "Login" : "Register"}
            disabled={loading}
            onPress={() => isLogin ? signInWithEmail() : signUpWithEmail()}
            containerStyle={{ width: '92%' }}
            buttonStyle={{ paddingVertical: 15,
              borderRadius: 20,
            }}
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 0,
  },
  title: {
    marginBottom: 10,
  },
  titleText: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#ea2e3c',
  },
  slogan: {
  },
  sloganText: {
    fontSize: 20,
    color: '#000',
  },
  loginContainer: {
    marginTop: 50,
    marginHorizontal: 20,
    borderWidth: 2,
    borderRadius: 20,
    borderColor: '#eee',
    flex: 0.54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  login_register_switch: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    paddingTop: 32,
    marginTop: 0,
    gap: 0,
  },
  inputs: {
    marginHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 20,
    paddingTop: 10
  },
  login_button: {
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  password_control:{

  },


  switchContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginVertical: 20,
  },
  switchButton: {
    paddingVertical: 12,
    paddingHorizontal: 57,
    backgroundColor: '#f2f2f2',
  },
  activeButton: {
    backgroundColor: '#ea2e3c',
  },
  switchText: {
    color: '#aaa',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  activeText: {
    color: '#fff',
  },
  passwordContainer: {
    marginHorizontal: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 20,
    paddingTop: 10,
    paddingBottom: 0,
    width: '92%',
  },
  passwordInput: {
    paddingHorizontal: 10,
    width: '100%',
  },
  inputContainer: {
    width: '100%',
  },
})