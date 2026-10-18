import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlassesStream } from '../hooks/useGlassesStream';
import { StatusBadge } from '../components/StatusBadge';
import { DevicePicker } from '../components/DevicePicker';
import { StreamControls } from '../components/StreamControls';
import { LiveMetrics } from '../components/LiveMetrics';
import { NetworkPanel } from '../components/NetworkPanel';
import { StreamProtocol, StreamQuality } from '../utils/constants';

export function StreamScreen() {
  const {
    status,
    discoveredDevices,
    isScanning,
    scanForGlasses,
    connectToDevice,
    reconnectDefault,
    disconnect,
    startStream,
    stopStream,
    wifiScanResults,
    wifiBusy,
    scanWifi,
    connectWifi,
    forgetWifi,
    bleConnectionState,
  } = useGlassesStream();

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Glasses',
      'Stop streaming and disconnect?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: disconnect },
      ]
    );
  };

  const handleStart = (key: string, protocol: StreamProtocol, quality: StreamQuality) => {
    startStream(key, protocol, quality);
  };

  const showDevicePicker = !status.glassesConnected && bleConnectionState !== 'connecting';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.wordmark}>STREAM<Text style={styles.wordmarkAccent}>PAL</Text> POV</Text>
            <Text style={styles.tagline}>Mentra Live · WebRTC Broadcasting</Text>
          </View>
          <StatusBadge state={status.state} />
        </View>

        {/* Error banner */}
        {status.error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠ {status.error}</Text>
          </View>
        )}

        {/* Connected glasses header */}
        {status.glassesConnected && (
          <View style={styles.connectedBar}>
            <View style={styles.connectedLeft}>
              <View style={styles.connectedDot} />
              <Text style={styles.connectedLabel}>
                {status.glassesModel ?? 'Mentra Live'} connected
              </Text>
            </View>
            <TouchableOpacity onPress={handleDisconnect}>
              <Text style={styles.disconnectBtn}>DISCONNECT</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Glasses WiFi status */}
        {status.glassesConnected && (
          <View
            style={[
              styles.wifiBar,
              status.wifiConnected ? styles.wifiBarOk : styles.wifiBarBad,
            ]}
          >
            <Text style={status.wifiConnected ? styles.wifiTextOk : styles.wifiTextBad}>
              {status.wifiConnected
                ? `WiFi: connected to ${status.wifiSsid ?? 'network'}`
                : 'WiFi: NOT connected. Send WiFi to the glasses and wait for connected.'}
            </Text>
          </View>
        )}

        {/* Reconnect button when disconnected and a saved device exists */}
        {!status.glassesConnected && bleConnectionState === 'disconnected' && (
          <TouchableOpacity style={styles.reconnectBtn} onPress={reconnectDefault}>
            <Text style={styles.reconnectText}>↺ RECONNECT LAST GLASSES</Text>
          </TouchableOpacity>
        )}

        {/* Device picker when disconnected */}
        {showDevicePicker && (
          <DevicePicker
            devices={discoveredDevices}
            isScanning={isScanning}
            onSelect={connectToDevice}
            onScan={scanForGlasses}
          />
        )}

        {/* Connecting indicator */}
        {bleConnectionState === 'connecting' || bleConnectionState === 'bonding' ? (
          <View style={styles.connectingCard}>
            <Text style={styles.connectingText}>
              {bleConnectionState === 'bonding'
                ? '🔗 Bonding with glasses… accept system dialog if prompted'
                : '📡 Connecting to glasses…'}
            </Text>
          </View>
        ) : null}

        {/* Stream controls */}
        <StreamControls
          state={status.state}
          onStart={handleStart}
          onStop={stopStream}
          disabled={!status.glassesConnected || !status.wifiConnected}
        />

        {/* Live metrics */}
        <LiveMetrics status={status} />

        {/* Glasses network (replaces the old event log) */}
        {status.glassesConnected && (
          <NetworkPanel
            currentSsid={status.wifiSsid}
            results={wifiScanResults}
            busy={wifiBusy}
            streaming={status.state === 'streaming' || status.state === 'stream_starting'}
            onScan={scanWifi}
            onConnect={connectWifi}
            onForget={forgetWifi}
          />
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Peak Platforms · Purpose-Built for Mission-Driven People
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  wordmark: {
    color: '#e5e7eb',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 3,
    fontFamily: 'monospace',
  },
  wordmarkAccent: {
    color: '#ef4444',
  },
  tagline: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  errorBanner: {
    backgroundColor: '#2d1515',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
    padding: 12,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  connectedBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0d1f0d',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#166534',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  connectedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  connectedLabel: {
    color: '#86efac',
    fontSize: 13,
    fontWeight: '600',
  },
  disconnectBtn: {
    color: '#ef4444',
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  wifiBar: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  wifiBarOk: {
    backgroundColor: '#0d1f0d',
    borderColor: '#166534',
  },
  wifiBarBad: {
    backgroundColor: '#2d1515',
    borderColor: '#ef4444',
  },
  wifiTextOk: {
    color: '#86efac',
    fontSize: 13,
    fontWeight: '600',
  },
  wifiTextBad: {
    color: '#fca5a5',
    fontSize: 13,
    fontWeight: '600',
  },
  reconnectBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    paddingVertical: 12,
    alignItems: 'center',
  },
  reconnectText: {
    color: '#3b82f6',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  connectingCard: {
    backgroundColor: '#1e1a0a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#92400e',
    padding: 14,
  },
  connectingText: {
    color: '#fcd34d',
    fontSize: 13,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  footer: {
    color: '#374151',
    fontSize: 10,
    textAlign: 'center',
    fontFamily: 'monospace',
    letterSpacing: 1,
    marginTop: 8,
  },
});
