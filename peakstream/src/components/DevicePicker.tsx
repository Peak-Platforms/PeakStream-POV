import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Device } from '@mentra/bluetooth-sdk';

interface Props {
  devices: Device[];
  isScanning: boolean;
  onSelect: (device: Device) => void;
  onScan: () => void;
}

function rssiToBars(rssi?: number | null): number {
  if (rssi == null) return 0;
  if (rssi > -60) return 4;
  if (rssi > -70) return 3;
  if (rssi > -80) return 2;
  return 1;
}

function RssiBars({ rssi }: { rssi?: number | null }) {
  const bars = rssiToBars(rssi);
  return (
    <View style={rssiStyles.container}>
      {[1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={[
            rssiStyles.bar,
            { height: 4 + i * 3, backgroundColor: i <= bars ? '#3b82f6' : '#2a2a3a' },
          ]}
        />
      ))}
    </View>
  );
}

const rssiStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  bar: { width: 4, borderRadius: 1 },
});

export function DevicePicker({ devices, isScanning, onSelect, onScan }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>NEARBY GLASSES</Text>
        <TouchableOpacity
          style={[styles.scanBtn, isScanning && styles.scanBtnActive]}
          onPress={onScan}
          disabled={isScanning}
        >
          {isScanning ? (
            <ActivityIndicator size="small" color="#3b82f6" />
          ) : (
            <Text style={styles.scanBtnText}>SCAN</Text>
          )}
        </TouchableOpacity>
      </View>

      {devices.length === 0 && !isScanning && (
        <Text style={styles.empty}>No glasses found. Tap SCAN to search.</Text>
      )}

      {isScanning && devices.length === 0 && (
        <Text style={styles.empty}>Scanning for Mentra Live glasses...</Text>
      )}

      <FlatList
        data={devices}
        keyExtractor={(d) => d.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.deviceRow}
            onPress={() => onSelect(item)}
          >
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>{item.name ?? 'Mentra Live'}</Text>
              <Text style={styles.deviceId} numberOfLines={1}>
                {item.address ?? item.id}
              </Text>
            </View>
            <RssiBars rssi={item.rssi} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#12121e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a3a',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3a',
  },
  title: {
    color: '#6b7280',
    fontFamily: 'monospace',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
  },
  scanBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3b82f6',
    minWidth: 60,
    alignItems: 'center',
  },
  scanBtnActive: {
    borderColor: '#2563eb',
  },
  scanBtnText: {
    color: '#3b82f6',
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  empty: {
    color: '#4b5563',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  deviceInfo: { flex: 1 },
  deviceName: {
    color: '#e5e7eb',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  deviceId: {
    color: '#6b7280',
    fontFamily: 'monospace',
    fontSize: 11,
  },
});
