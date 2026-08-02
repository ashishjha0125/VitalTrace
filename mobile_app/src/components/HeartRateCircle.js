import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Theme } from '../theme/theme';

const HeartRateCircle = ({ bpm = '--', isConnected = false, isLeadsOff = false }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isConnected && !isLeadsOff) {
      // Pulse animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
        ])
      );

      // Glow animation
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 0.8,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      );

      // Rotate arc animation
      const rotate = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

      pulse.start();
      glow.start();
      rotate.start();

      return () => {
        pulse.stop();
        glow.stop();
        rotate.stop();
      };
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0.3);
    }
  }, [isConnected, isLeadsOff]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const bpmColor = typeof bpm === 'number' 
    ? bpm > 100 ? Theme.colors.error 
    : bpm < 50 ? Theme.colors.warning 
    : Theme.colors.primary
    : Theme.colors.textMuted;

  return (
    <View style={styles.container}>
      {/* Outer rotating ring */}
      <Animated.View style={[styles.outerRing, { transform: [{ rotate: spin }] }]}>
        <View style={styles.outerRingSegment} />
      </Animated.View>

      {/* Inner ring glow */}
      <Animated.View style={[styles.innerRing, { opacity: glowAnim }]} />

      {/* Circle background */}
      <View style={styles.circleBase}>
        {/* Heart icon */}
        <Animated.View style={[styles.heartContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.heartIcon}>♥</Text>
        </Animated.View>

        {/* BPM value */}
        <Text style={[styles.bpmValue, { color: bpmColor }]}>
          {isLeadsOff ? '!' : bpm}
        </Text>
        <Text style={styles.bpmUnit}>BPM</Text>

        {/* Small ECG wave decoration */}
        <View style={styles.waveContainer}>
          <Text style={styles.waveText}>∿∿∿</Text>
        </View>
      </View>
    </View>
  );
};

const CIRCLE_SIZE = 200;
const RING_SIZE = CIRCLE_SIZE + 30;

const styles = StyleSheet.create({
  container: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: Theme.spacing.lg,
  },
  outerRing: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: Theme.colors.primary,
    borderRightColor: Theme.colors.live,
  },
  outerRingSegment: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.primary,
    top: 0,
    left: RING_SIZE / 2 - 4,
    ...Theme.shadow.glow,
  },
  innerRing: {
    position: 'absolute',
    width: CIRCLE_SIZE + 16,
    height: CIRCLE_SIZE + 16,
    borderRadius: (CIRCLE_SIZE + 16) / 2,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
    ...Theme.shadow.glow,
  },
  circleBase: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: Theme.colors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.liveDim,
  },
  heartContainer: {
    marginBottom: -4,
  },
  heartIcon: {
    fontSize: 28,
    color: Theme.colors.primary,
    textShadowColor: Theme.colors.primaryGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  bpmValue: {
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: -2,
    lineHeight: 62,
    marginTop: -2,
  },
  bpmUnit: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    letterSpacing: 2,
    marginTop: -4,
  },
  waveContainer: {
    marginTop: 4,
  },
  waveText: {
    fontSize: 16,
    color: Theme.colors.primary,
    opacity: 0.5,
    letterSpacing: -2,
  },
});

export default HeartRateCircle;
