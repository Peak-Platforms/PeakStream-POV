import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StreamState } from '../hooks/useGlassesStream';
import {
  STREAM_CONFIG,
  STREAM_PRESETS,
  QUALITY_PRESETS,
  StreamProtocol,
  StreamQuality,
} from '../utils/constants';

interface Props {
  state: StreamState;
  onStart: (key: string, protocol: StreamProtocol, quality: StreamQuality) => void;
  onStop: () => void;
  disabled: boolean;
}

export function StreamControls({ state, onStart, onStop, disabled }: Props) {
  const [streamKey, setStreamKey] = useState('glasses_test');
  const [protocol, setProtocol] = useState<StreamProtocol>('whip');
  const [quality, setQuality] = useState<StreamQuality>('auto');

  const isStreaming = state === 'streaming' || state === 'stream_starting' || state === 'stopping';
  const canStart = !disabled && (state === 'ble_connected' || state === 'stream_error');
  const canStop = state === 'streaming' || state === 'stream_starting';

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>STREAM KEY</Text>
      <TextInput
        style={[styles.input, isStreaming && styles.inputDisabled]}
        value={streamKey}
        onChangeText={setStreamKey}
        placeholder="glasses_test"
        placeholderTextColor="#4b5563"
        editable={!isStreaming}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={[styles.sectionLabel, { marginTop: 16 }]}>PROTOCOL</Text>
      <View style={styles.protocolRow}>
        {STREAM_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset.protocol}
            style={[
              styles.protocolBtn,
              protocol === preset.protocol && styles.protocolBtnActive,
              isStreaming && styles.protocolBtnDisabled,
            ]}
            onPress={() => !isStreaming && setProtocol(preset.protocol)}
            disabled={isStreaming}
          >
            <Text
              style={[
                styles.protocolLabel,
                protocol === preset.protocol && styles.protocolLabelActive,
              ]}
            >
              {preset.label.split(' ')[0]}
            </Text>
            {preset.recommended && (
              <Text style={styles.recommendedTag}>RECOMMENDED</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionLabel, { marginTop: 16 }]}>VIDEO QUALITY</Text>
      <View style={styles.protocolRow}>
        {QUALITY_PRESETS.map((q) => (
          <TouchableOpacity
            key={q.id}
            style={[
              styles.protocolBtn,
              quality === q.id && styles.protocolBtnActive,
              isStreaming && styles.protocolBtnDisabled,
            ]}
            onPress={() => !isStreaming && setQuality(q.id)}
            disabled={isStreaming}
          >
            <Text
              style={[
                styles.protocolLabel,
                quality === q.id && styles.protocolLabelActive,
              ]}
            >
              {q.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {protocol === 'whip' && (
        <Text style={styles.urlPreview}>
          → {STREAM_CONFIG.whipUrl(streamKey || '…')}
        </Text>
      )}
      {protocol === 'rtmp' && (
        <Text style={styles.urlPreview}>
          → {STREAM_CONFIG.rtmpUrl(streamKey || '…')}
        </Text>
      )}

      <View style={styles.btnRow}>
        {canStop ? (
          <TouchableOpacity style={styles.stopBtn} onPress={onStop}>
            <Text style={styles.stopBtnText}>■ STOP STREAM</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
            onPress={() => canStart && onStart(streamKey.trim() || 'glasses_test', protocol, quality)}
            disabled={!canStart}
          >
            <Text style={[styles.startBtnText, !canStart && styles.startBtnTextDisabled]}>
              {state === 'stream_starting' ? 'STARTING…' : '▶ GO LIVE'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
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
  },
  sectionLabel: {
    color: '#6b7280',
    fontFamily: 'monospace',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0a0a14',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a3a',
    color: '#e5e7eb',
    fontFamily: 'monospace',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  protocolRow: {
    flexDirection: 'row',
    gap: 8,
  },
  protocolBtn: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a3a',
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#0a0a14',
  },
  protocolBtnActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#1e3a5f',
  },
  protocolBtnDisabled: {
    opacity: 0.5,
  },
  protocolLabel: {
    color: '#6b7280',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
  },
  protocolLabelActive: {
    color: '#60a5fa',
  },
  recommendedTag: {
    color: '#22c55e',
    fontFamily: 'monospace',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
  urlPreview: {
    color: '#4b5563',
    fontFamily: 'monospace',
    fontSize: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  btnRow: {
    marginTop: 16,
  },
  startBtn: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startBtnDisabled: {
    backgroundColor: '#2a2a3a',
  },
  startBtnText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 2,
  },
  startBtnTextDisabled: {
    color: '#4b5563',
  },
  stopBtn: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ef4444',
    paddingVertical: 16,
    alignItems: 'center',
  },
  stopBtnText: {
    color: '#ef4444',
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
