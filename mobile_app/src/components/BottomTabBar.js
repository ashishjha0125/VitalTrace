import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Home, TrendingUp, Clock, FileText, Settings, User } from 'lucide-react-native';
import { Theme } from '../theme/theme';

const tabs = [
  { key: 'home', label: 'Home', Icon: Home },
  { key: 'trends', label: 'Trends', Icon: TrendingUp },
  { key: 'history', label: 'History', Icon: Clock },
  { key: 'reports', label: 'Reports', Icon: FileText },
  { key: 'profile', label: 'Profile', Icon: User },
  { key: 'settings', label: 'Settings', Icon: Settings },
];

const BottomTabBar = ({ activeTab, onTabChange }) => {
  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabButton}
              onPress={() => onTabChange(tab.key)}
              activeOpacity={0.7}
            >
              {isActive && <View style={styles.activeIndicator} />}
              <tab.Icon
                size={22}
                color={isActive ? Theme.colors.tabActive : Theme.colors.tabInactive}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <Text style={[
                styles.tabLabel,
                { color: isActive ? Theme.colors.tabActive : Theme.colors.tabInactive }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.outline,
    paddingBottom: 20, // Safe area
  },
  tabBar: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: -1,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: Theme.colors.primary,
    ...Theme.shadow.glow,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.3,
  },
});

export default BottomTabBar;
