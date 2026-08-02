import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Theme } from '../theme/theme';
import { cloudService } from '../services/cloudService';
import { User, LogOut, Save } from 'lucide-react-native';

export default function ProfileScreen({ user, onLogout, onUpdate }) {
  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState(user?.age || '');
  const [medicalHistory, setMedicalHistory] = useState(user?.medicalHistory || '');

  const handleSave = async () => {
    if (!name.trim() || !age.trim()) {
      Alert.alert('Error', 'Name and Age are required.');
      return;
    }
    
    const updatedUser = {
      ...user,
      name: name.trim(),
      age: age.trim(),
      medicalHistory: medicalHistory.trim()
    };

    const success = await cloudService.saveUserProfile(user.uid, updatedUser);
    
    if (success) {
      onUpdate(updatedUser);
      Alert.alert('Success', 'Profile updated in Supabase successfully.');
    } else {
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  const handleLogout = async () => {
    await cloudService.signOut();
    onLogout();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <User color={Theme.colors.primary} size={48} />
        </View>
        <Text style={styles.title}>Your Profile</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholderTextColor="#666"
        />

        <Text style={styles.label}>Age</Text>
        <TextInput
          style={styles.input}
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
          placeholderTextColor="#666"
        />

        <Text style={styles.label}>Past Medical History</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={medicalHistory}
          onChangeText={setMedicalHistory}
          multiline
          numberOfLines={4}
          placeholder="List any past heart conditions, surgeries, or chronic illnesses..."
          placeholderTextColor="#666"
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Save color="#FFF" size={20} style={{ marginRight: 8 }} />
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut color={Theme.colors.primary} size={20} style={{ marginRight: 8 }} />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: Theme.colors.textMuted,
    marginBottom: 8,
    fontWeight: '600',
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
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    padding: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  logoutButtonText: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  }
});
