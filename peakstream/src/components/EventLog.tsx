import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useBluetoothEvent } from '@mentra/bluetooth-sdk';

interface LogEntry {
  id: number;
  ts: string;
  type: string;
  message: string;
  color: string;
}

let logIdCounter = 0;

function ts(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
}

export function EventLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const addLog = (type: string, message: string, color: string) => {
    setLogs((prev) => [
      ...prev.slice(-49), // keep last 50
      { id: logIdCounter++, ts: ts(), type, message, color },
    ]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  };

  useBluetoothEvent('stream_status', (e) => {
    addLog('STREAM', JSON.stringify(e), '#60a5fa');
  });

  useBluetoothEvent('keep_alive_ack', (e) => {
    addLog('KEEPALIVE', `ack: ${(e as any).ackId ?? '—'}`, '#4b5563');
  });

  useBluetoothEvent('button_press', (e) => {
    addLog('BUTTON', `${(e as any).buttonId} — ${(e as any).pressType}`, '#a855f7');
  });

  useBluetoothEvent('battery_status', (e) => {
    addLog('BATTERY', `${(e as any).level ?? '?'}%`, '#22c55e');
  });

  useBluetoothEvent('log', (e) => {
    addLog('SDK', (e as any).message ?? JSON.stringify(e), '#6b7280');
  });

  useEffect(() => {
    addLog('SYSTEM', 'StreamPal POV event log ready', '#22c55e');
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>EVENT LOG</Text>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {logs.map((entry) => (
          <View key={entry.id} style={styles.logRow}>
            <Text style={styles.logTs}>{entry.ts}</Text>
            <Text style={[styles.logType, { color: entry.color }]}>{entry.type}</Text>
            <Text style={styles.logMsg} numberOfLines={2}>{entry.message}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a0a14',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a1a2e',
    overflow: 'hidden',
  },
  title: {
    color: '#6b7280',
    fontFamily: 'monospace',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  scroll: {
    maxHeight: 180,
  },
  content: {
    padding: 8,
    gap: 4,
  },
  logRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  logTs: {
    color: '#374151',
    fontFamily: 'monospace',
    fontSize: 10,
    minWidth: 60,
  },
  logType: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    minWidth: 68,
    letterSpacing: 0.5,
  },
  logMsg: {
    flex: 1,
    color: '#9ca3af',
    fontFamily: 'monospace',
    fontSize: 10,
  },
});
