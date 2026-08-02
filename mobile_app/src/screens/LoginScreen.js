import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Theme } from '../theme/theme';
import { cloudService } from '../services/cloudService';
import { HeartPulse, CheckCircle, Github } from 'lucide-react-native';

export default function LoginScreen({ onLogin }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCompletingProfile, setIsCompletingProfile] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  
  // Profile Completion State
  const [age, setAge] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    const result = await cloudService.signInWithGitHub();
    setIsLoading(false);

    if (result?.error) {
      Alert.alert('Login Failed', result.message);
      return;
    }

    if (result && !result.profileComplete) {
      setTempUser(result);
      setIsCompletingProfile(true);
    } else if (result) {
      onLogin(result);
    }
  };

  const handleCompleteProfile = async () => {
    if (!age.trim()) {
      Alert.alert('Required', 'Please enter your age.');
      return;
    }

    setIsLoading(true);
    const updatedProfile = {
      ...tempUser,
      age: age.trim(),
      medicalHistory: medicalHistory.trim(),
      profileComplete: true
    };

    const success = await cloudService.saveUserProfile(tempUser.uid, updatedProfile);
    setIsLoading(false);

    if (success) {
      onLogin(updatedProfile);
    } else {
      Alert.alert('Error', 'Failed to save profile data.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <HeartPulse color={Theme.colors.primary} size={64} />
          <Text style={styles.title}>VitalTrace</Text>
          <Text style={styles.subtitle}>Intelligent ECG Monitor</Text>
        </View>

        <View style={styles.card}>
          {isCompletingProfile ? (
            <>
              <Text style={styles.cardTitle}>Complete Your Profile</Text>
              <Text style={styles.welcomeText}>Hi {tempUser?.name?.split(' ')[0]}! Just a few more details needed.</Text>
              
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                placeholder="45"
                placeholderTextColor="#666"
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
              />

              <Text style={styles.label}>Past Medical History (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="E.g. Hypertension, previous heart attack in 2018..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={3}
                value={medicalHistory}
                onChangeText={setMedicalHistory}
              />

              <TouchableOpacity style={styles.button} onPress={handleCompleteProfile} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Complete Setup</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>Welcome Back</Text>
              <Text style={styles.subtitleText}>Sign in to securely sync your ECG reports across devices.</Text>

              <TouchableOpacity style={styles.githubButton} onPress={handleGitHubLogin} disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Github size={24} color="#FFF" style={{marginRight: 12}} />
                    <Text style={styles.githubButtonText}>Continue with GitHub</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <View style={styles.secureNote}>
                <CheckCircle size={14} color={Theme.colors.success} style={{marginRight: 6}} />
                <Text style={styles.secureNoteText}>Data is securely stored in Supabase</Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: Theme.colors.textMuted,
    marginTop: 5,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: Theme.colors.primary,
    marginBottom: 20,
    fontWeight: '600',
  },
  subtitleText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginBottom: 30,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    color: Theme.colors.textMuted,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 8,
    color: Theme.colors.text,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: Theme.colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  githubButton: {
    backgroundColor: '#24292e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    marginBottom: 20,
  },
  githubButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  secureNoteText: {
    color: Theme.colors.textMuted,
    fontSize: 12,
  }
});
