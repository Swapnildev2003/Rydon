// app/(auth)/signup.js
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import axios from 'axios';

export default function SignupScreen() {
  const { role } = useLocalSearchParams();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [license, setLicense] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    const payload = {
      name,
      email,
      password,
      contact_number: contact,
      joining_date: new Date().toISOString().split('T')[0],
    };

    if (role === 'driver') {
      payload.license_number = license;
    }

    try {
      const res = await axios.post(getApiUrl(API_CONFIG.ENDPOINTS.SIGNUP(role)), payload);
      Alert.alert('Signup Successful');
      router.replace(`/(auth)/login`);
    } catch (error) {
      if (error.response) {
        Alert.alert('Signup Failed', error.response.data.error || 'Invalid or duplicate data');
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create {role} Account</Text>
        <Text style={styles.subtitle}>Fill in your details to get started</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.inputLabel}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="John Doe"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.inputLabel}>Contact Number</Text>
        <TextInput
          style={styles.input}
          placeholder="+1 (123) 456-7890"
          value={contact}
          onChangeText={setContact}
          keyboardType="phone-pad"
        />

        {role === 'driver' && (
          <>
            <Text style={styles.inputLabel}>License Number</Text>
            <TextInput
              style={styles.input}
              placeholder="DL1234567890"
              value={license}
              onChangeText={setLicense}
            />
          </>
        )}

        <Text style={styles.inputLabel}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="your@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.inputLabel}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Create a password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={styles.signupButton}
          onPress={handleSignup}
        >
          <Text style={styles.signupButtonText}>Create Account</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <Link href="/login" asChild>
          <TouchableOpacity>
            <Text style={styles.loginLink}>Sign in instead</Text>
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
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e09deff',
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
  signupButton: {
    height: 50,
    borderRadius: 8,
    backgroundColor: '#1e09deff',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  signupButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  footerText: {
    color: '#636e72',
  },
  loginLink: {
    color: '#3498db',
    fontWeight: '600',
    marginTop: 4,
  },
};