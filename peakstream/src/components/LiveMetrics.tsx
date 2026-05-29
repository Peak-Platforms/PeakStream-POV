import React from 'react';
import { Clipboard, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StreamStatus } from '../hooks/useGlassesStream';
import { BatteryIndicator } from './BatteryIndicator';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface Props {
  status: StreamStatus;
}

export function LiveMetrics({ status }: Props) {
  const isLive = status.state === 'streaming';

  return (
    <View style={styles.container}>
      {/* Duration */}
      <View style={styles.row}>
        <Text style={styles.metricLabel}>DURATION</Text>
        <Text style={[styles.metricValue, isLive && styles.metricValueLive]}>
          {isLive ? formatDuration(status.streamDurationSeconds) : '--:--'}
        </Text>
      </View>

      {/* Glasses */}
      <View style={styles.divider} />
      <View style={styles.row}>
        <Text style={styles.metricLabel}>GLASSES</Text>
        <View style={styles.rowRight}>
          {status.glassesModel && (
            <Text style={styles.metricValue}>{status.glassesModel}</Text>
          )}
          <BatteryIndicator level={status.glassesBattery} />
        </View>
      </View>

      {/* HLS URL */}
      {status.hlsUrl && (
        <>
          <View style={styles.divider} />
          <View style={styles.urlSection}>
            <Text style={styles.metricLabel}>VIEWER HLS URL</Text>
            <TouchableOpacity
              onPress={() => Clipboard.setString(status.hlsUrl!)}
              style={styles.urlRow}
            >
              <Text style={styles.urlText} numberOfLines={2}>
                {status.hlsUrl}
              </Text>
              <Text style={styles.copyBtn}>COPY</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* WHIP URL */}
      {status.whipUrl && isLive && (
        <>
          <View style={styles.divider} />
          <View style={styles.urlSection}>
            <Text style={styles.metricLabel}>WHIP INGEST</Text>
            <Text style={styles.urlText} numberOfLines={2}>
              {status.whipUrl}
            </Text>
          </View>
        </>
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
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#1a1a2e',
    marginHorizontal: 16,
  },
  metricLabel: {
    color: '#6b7280',
    fontFamily: 'monospace',
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  metricValue: {
    color: '#e5e7eb',
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '600',
  },
  metricValueLive: {
    color: '#ef4444',
    fontSize: 20,
    fontWeight: '800',
  },
  urlSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  urlText: {
    flex: 1,
    color: '#60a5fa',
    fontFamily: 'monospace',
    fontSize: 11,
  },
  copyBtn: {
    color: '#3b82f6',
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
});
