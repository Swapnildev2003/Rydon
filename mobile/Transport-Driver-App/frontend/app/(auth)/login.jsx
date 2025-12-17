// app/(auth)/login.js
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_CONFIG, { getApiUrl } from '../../constants/ApiConfig';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('driver');

  const handleLogin = async () => {
    try {
      const response = await axios.post(getApiUrl(API_CONFIG.ENDPOINTS.LOGIN(role)), {
        email,
        password,
      });
     
      // Store JWT tokens and user data
      await AsyncStorage.setItem('access_token', response.data.access);
      await AsyncStorage.setItem('refresh_token', response.data.refresh);
      await AsyncStorage.setItem('user_id', response.data[`${role}_id`].toString());
      await AsyncStorage.setItem('user_name', response.data.name);
      await AsyncStorage.setItem('user_role', role);
      const accessToken = await AsyncStorage.getItem('access_token');
      console.log('Access Token:', accessToken);
      Alert.alert('Login Successful');
      router.replace(`/(app)/(${role})/home`);
    } catch (error) {
      if (error.response) {
        Alert.alert('Login Failed', error.response.data.error || 'Invalid credentials');
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.inputLabel}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.inputLabel}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleButton, role === 'driver' && styles.activeRoleButton]}
            onPress={() => setRole('driver')}
          >
            <Text style={[styles.roleButtonText, role === 'driver' && styles.activeRoleButtonText]}>Driver</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleButton, role === 'conductor' && styles.activeRoleButton]}
            onPress={() => setRole('conductor')}
          >
            <Text style={[styles.roleButtonText, role === 'conductor' && styles.activeRoleButtonText]}>Conductor</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.loginButton}
          onPress={handleLogin}
        >
          <Text style={styles.loginButtonText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text style={styles.forgotPassword}>Forgot password?</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account?</Text>
        <Link href="/role" asChild>
          <TouchableOpacity>
            <Text style={styles.signupLink}>Create account</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e09deff',
    marginTop: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#636e72',
    marginTop: 8,
  },
  formContainer: {
    marginBottom: 24,
    flex: 1,
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2d3436',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 20,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfe6e9',
    alignItems: 'center',
  },
  activeRoleButton: {
    backgroundColor: '#1e09deff',
    borderColor: '#3498db',
  },
  roleButtonText: {
    fontWeight: '500',
    color: '#636e72',
  },
  activeRoleButtonText: {
    color: '#ffffff',
  },
  loginButton: {
    height: 50,
    borderRadius: 8,
    backgroundColor: '#1e09deff',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  forgotPassword: {
    color: '#3498db',
    textAlign: 'center',
    marginTop: 16,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  footerText: {
    color: '#636e72',
  },
  signupLink: {
    color: '#3498db',
    fontWeight: '600',
    marginTop: 4,
  },
};