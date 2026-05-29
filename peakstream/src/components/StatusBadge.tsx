import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { StreamState } from '../hooks/useGlassesStream';

const STATE_CONFIG: Record<StreamState, { label: string; color: string; pulse: boolean }> = {
  idle:             { label: 'OFFLINE',        color: '#3a3a4a', pulse: false },
  connecting_ble:   { label: 'CONNECTING',     color: '#f59e0b', pulse: true  },
  ble_connected:    { label: 'GLASSES READY',  color: '#3b82f6', pulse: false },
  stream_starting:  { label: 'STARTING STREAM', color: '#a855f7', pulse: true  },
  streaming:        { label: '● LIVE',          color: '#ef4444', pulse: true  },
  stream_error:     { label: 'ERROR',          color: '#ef4444', pulse: false },
  stopping:         { label: 'STOPPING',       color: '#f59e0b', pulse: true  },
};

interface Props {
  state: StreamState;
}

export function StatusBadge({ state }: Props) {
  const config = STATE_CONFIG[state];
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (config.pulse) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,   duration: 600, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [config.pulse, pulseAnim]);

  return (
    <View style={[styles.container, { borderColor: config.color }]}>
      <Animated.View
        style={[styles.dot, { backgroundColor: config.color, opacity: pulseAnim }]}
      />
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});
