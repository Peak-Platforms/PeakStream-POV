import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface WifiResult {
  ssid: string;
  requiresPassword: boolean;
  signalStrength: number;
  frequency?: number;
}

interface Props {
  currentSsid: string | null;
  results: WifiResult[];
  busy: boolean;
  streaming: boolean;
  onScan: () => void;
  onConnect: (ssid: string, password: string) => void;
  onForget: (ssid: string) => void;
}

function band(freq?: number): string {
  if (!freq) return '';
  return freq >= 4900 ? '5 GHz' : '2.4 GHz';
}

export function NetworkPanel({
  currentSsid,
  results,
  busy,
  streaming,
  onScan,
  onConnect,
  onForget,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [password, setPassword] = useState('');

  const unique = Array.from(
    new Map(
      [...results]
        .filter((r) => r.ssid)
        .sort((a, b) => b.signalStrength - a.signalStrength)
        .map((r) => [r.ssid, r])
    ).values()
  );

  const askStreamingGuard = (action: () => void) => {
    if (!streaming) return action();
    Alert.alert(
      'Stream is live',
      'Changing the glasses network will interrupt the stream. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', style: 'destructive', onPress: action },
      ]
    );
  };

  const pick = (r: WifiResult) => {
    if (r.requiresPassword) {
      setSelected(r.ssid);
      setPassword('');
    } else {
      askStreamingGuard(() => onConnect(r.ssid, ''));
    }
  };

  const send = () => {
    if (!selected) return;
    const ssid = selected;
    askStreamingGuard(() => {
      onConnect(ssid, password);
      setSelected(null);
      setPassword('');
    });
  };

  const forgetCurrent = () => {
    if (!currentSsid) return;
    Alert.alert(
      'Forget this network?',
      `The glasses will stop using "${currentSsid}" automatically.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Forget',
          style: 'destructive',
          onPress: () => askStreamingGuard(() => onForget(currentSsid)),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>GLASSES NETWORK</Text>

      <View style={styles.currentRow}>
        <Text style={styles.current}>
          {currentSsid ? `Connected: ${currentSsid}` : 'Not connected to WiFi'}
        </Text>
        {currentSsid && (
          <TouchableOpacity onPress={forgetCurrent}>
            <Text style={styles.forget}>FORGET</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.scanBtn} onPress={onScan} disabled={busy}>
        <Text style={styles.scanText}>{busy ? 'SCANNING…' : '↻ SCAN FOR NETWORKS'}</Text>
      </TouchableOpacity>

      {unique.map((r) => (
        <TouchableOpacity
          key={r.ssid}
          style={[styles.item, r.ssid === currentSsid && styles.itemCurrent]}
          onPress={() => pick(r)}
        >
          <Text style={styles.ssid}>
            {r.ssid}
            {r.requiresPassword ? '  🔒' : ''}
          </Text>
          <Text style={styles.meta}>
            {band(r.frequency)} {band(r.frequency) ? '· ' : ''}signal {r.signalStrength}
          </Text>
        </TouchableOpacity>
      ))}

      {selected && (
        <View style={styles.pwBox}>
          <Text style={styles.pwLabel}>Password for {selected}</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="WiFi password"
            placeholderTextColor="#4b5563"
          />
          <View style={styles.pwRow}>
            <TouchableOpacity onPress={() => setSelected(null)}>
              <Text style={styles.cancel}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sendBtn} onPress={send}>
              <Text style={styles.sendText}>SEND TO GLASSES</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#12121e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a3a',
    padding: 16,
    gap: 8,
  },
  sectionLabel: {
    color: '#6b7280',
    fontFamily: 'monospace',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
  },
  currentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  current: { color: '#e5e7eb', fontSize: 13, fontWeight: '600' },
  forget: {
    color: '#ef4444',
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  scanBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    paddingVertical: 10,
    alignItems: 'center',
  },
  scanText: {
    color: '#3b82f6',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  item: {
    backgroundColor: '#0a0a14',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a3a',
    padding: 12,
  },
  itemCurrent: { borderColor: '#166534' },
  ssid: { color: '#e5e7eb', fontSize: 14, fontWeight: '600' },
  meta: { color: '#6b7280', fontSize: 11, marginTop: 2, fontFamily: 'monospace' },
  pwBox: { gap: 8, marginTop: 4 },
  pwLabel: { color: '#9ca3af', fontSize: 12 },
  input: {
    backgroundColor: '#0a0a14',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a3a',
    color: '#e5e7eb',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pwRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancel: {
    color: '#6b7280',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
  },
  sendBtn: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  sendText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
