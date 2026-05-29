import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  level: number | null;
}

export function BatteryIndicator({ level }: Props) {
  if (level == null) return null;

  const color =
    level > 50 ? '#22c55e' :
    level > 20 ? '#f59e0b' :
                 '#ef4444';

  const bars = Math.ceil((level / 100) * 4);

  return (
    <View style={styles.container}>
      <View style={styles.body}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.bar,
              { backgroundColor: i < bars ? color : '#2a2a3a' },
            ]}
          />
        ))}
      </View>
      <View style={[styles.cap, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{level}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  body: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#4a4a5a',
    borderRadius: 2,
    padding: 2,
    gap: 2,
  },
  bar: {
    width: 5,
    height: 10,
    borderRadius: 1,
  },
  cap: {
    width: 3,
    height: 6,
    borderRadius: 1,
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '600',
  },
});
