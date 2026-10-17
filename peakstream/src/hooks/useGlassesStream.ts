/**
 * useGlassesStream
 * Central orchestration hook for PeakStream.
 *
 * Responsibilities:
 *  - BLE scan → device picker → connect → reconnect
 *  - startStream / keepStreamAlive / stopStream
 *  - stream_status event forwarding
 *  - Keep-alive interval management
 *  - Graceful cleanup on unmount
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import BluetoothSdk, { DeviceModels, Device } from '@mentra/bluetooth-sdk';
import {
  useMentraBluetooth,
  useBluetoothEvent,
} from '@mentra/bluetooth-sdk';
import { STREAM_CONFIG, StreamProtocol } from '../utils/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

export type StreamState =
  | 'idle'
  | 'connecting_ble'
  | 'ble_connected'
  | 'stream_starting'
  | 'streaming'
  | 'stream_error'
  | 'stopping';

export interface StreamStatus {
  state: StreamState;
  error: string | null;
  streamKey: string | null;
  hlsUrl: string | null;
  whipUrl: string | null;
  glassesConnected: boolean;
  wifiConnected: boolean;
  wifiSsid: string | null;
  glassesBattery: number | null;
  glassesModel: string | null;
  streamDurationSeconds: number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGlassesStream() {
  const mentra = useMentraBluetooth();
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamStartTimeRef = useRef<number | null>(null);
  const currentStreamIdRef = useRef<string | null>(null);

  const [streamState, setStreamState] = useState<StreamState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [streamKey, setStreamKey] = useState<string | null>(null);
  const [discoveredDevices, setDiscoveredDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [duration, setDuration] = useState(0);

  // Glasses WiFi state, reported by the glasses themselves (the glasses stream
  // over their own WiFi, so Go Live only works when this is connected).
  const wifi = mentra.glasses.connected ? (mentra.glasses as any).wifi : null;
  const wifiConnected = wifi?.state === 'connected';
  const wifiSsid: string | null = wifiConnected ? wifi.ssid ?? null : null;

  // Duration ticker
  useEffect(() => {
    let ticker: ReturnType<typeof setInterval> | null = null;
    if (streamState === 'streaming' && streamStartTimeRef.current) {
      ticker = setInterval(() => {
        setDuration(Math.floor((Date.now() - streamStartTimeRef.current!) / 1000));
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => {
      if (ticker) clearInterval(ticker);
    };
  }, [streamState]);

  // ─── Stream status events from glasses ──────────────────────────────────────
  useBluetoothEvent('stream_status', (event) => {
    console.log('[PeakStream] stream_status:', event);
    const status = (event as any).status ?? (event as any).state ?? '';

    if (status === 'streaming' || status === 'active' || status === 'connected') {
      streamStartTimeRef.current = streamStartTimeRef.current ?? Date.now();
      setStreamState('streaming');
      setError(null);
    } else if (
      status === 'error' ||
      status === 'failed' ||
      status === 'disconnected'
    ) {
      setStreamState('stream_error');
      setError(
        (event as any).errorMessage ??
          `Stream error from glasses: ${JSON.stringify(event)}`
      );
      stopKeepAlive();
    } else if (status === 'stopped' || status === 'idle') {
      setStreamState('ble_connected');
      stopKeepAlive();
    }
  });

  // ─── Keep-alive management ──────────────────────────────────────────────────
  const stopKeepAlive = useCallback(() => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
    streamStartTimeRef.current = null;
  }, []);

  const startKeepAlive = useCallback((streamId: string) => {
    stopKeepAlive();
    keepAliveRef.current = setInterval(async () => {
      try {
        await BluetoothSdk.keepStreamAlive({
          type: 'keep_stream_alive',
          streamId,
          ackId: `ack-${Date.now()}`,
        });
      } catch (e) {
        console.warn('[PeakStream] keepStreamAlive failed:', e);
      }
    }, STREAM_CONFIG.KEEP_ALIVE_INTERVAL_MS);
  }, [stopKeepAlive]);

  // ─── Scan ───────────────────────────────────────────────────────────────────
  const scanForGlasses = useCallback(async () => {
    setError(null);
    setIsScanning(true);
    setDiscoveredDevices([]);
    try {
      const devices = await BluetoothSdk.scan(DeviceModels.MentraLive, {
        timeoutMs: STREAM_CONFIG.SCAN_TIMEOUT_MS,
        onResults: (nextDevices: Device[]) => {
          setDiscoveredDevices([...nextDevices]);
        },
      });
      setDiscoveredDevices(devices);
    } catch (e: any) {
      setError(e?.message ?? 'Scan failed');
    } finally {
      setIsScanning(false);
    }
  }, []);

  // ─── Connect ────────────────────────────────────────────────────────────────
  const connectToDevice = useCallback(async (device: Device) => {
    setStreamState('connecting_ble');
    setError(null);
    try {
      await BluetoothSdk.connect(device);
      await BluetoothSdk.setDefaultDevice(device);
      // SDK fires glasses state update; we derive ble_connected from hook state
      setStreamState('ble_connected');
    } catch (e: any) {
      setStreamState('idle');
      setError(e?.message ?? 'Connection failed');
    }
  }, []);

  const reconnectDefault = useCallback(async () => {
    setStreamState('connecting_ble');
    setError(null);
    try {
      const saved = await BluetoothSdk.getDefaultDevice();
      if (saved) {
        await BluetoothSdk.setDefaultDevice(saved);
        await BluetoothSdk.connectDefault();
        setStreamState('ble_connected');
      } else {
        setStreamState('idle');
        setError('No saved device. Scan first.');
      }
    } catch (e: any) {
      setStreamState('idle');
      setError(e?.message ?? 'Reconnect failed');
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await stopStream();
      await BluetoothSdk.disconnect();
    } catch {}
    setStreamState('idle');
  }, []);

  // ─── Start Stream ───────────────────────────────────────────────────────────
  const startStream = useCallback(
    async (key: string, protocol: StreamProtocol = 'whip') => {
      if (!mentra.glasses.connected) {
        setError('Glasses not connected');
        return;
      }
      if (!wifiConnected) {
        setError(
          'Glasses are not connected to WiFi. Send WiFi to the glasses and wait until WiFi shows connected, then Go Live.'
        );
        return;
      }

      setStreamState('stream_starting');
      setError(null);
      setStreamKey(key);

      let streamUrl: string;
      if (protocol === 'whip') {
        streamUrl = STREAM_CONFIG.whipUrl(key);
      } else if (protocol === 'rtmp') {
        streamUrl = STREAM_CONFIG.rtmpUrl(key);
      } else {
        streamUrl = `srt://${STREAM_CONFIG.MEDIAMTX_HOST}?streamid=${key}`;
      }

      const streamId = `peakstream-${Date.now()}`;
      currentStreamIdRef.current = streamId;

      try {
        await BluetoothSdk.startStream({
          type: 'start_stream',
          streamUrl,
          streamId,
        });

        startKeepAlive(streamId);
        streamStartTimeRef.current = Date.now();
        // State will flip to 'streaming' when we receive stream_status event
        // If no event in 5s, optimistically set it anyway
        setTimeout(() => {
          setStreamState((prev) =>
            prev === 'stream_starting' ? 'streaming' : prev
          );
        }, 5000);
      } catch (e: any) {
        setStreamState('ble_connected');
        setError(e?.message ?? 'Failed to start stream');
        stopKeepAlive();
      }
    },
    [mentra.glasses.connected, wifiConnected, startKeepAlive, stopKeepAlive]
  );

  // ─── Stop Stream ────────────────────────────────────────────────────────────
  const stopStream = useCallback(async () => {
    setStreamState('stopping');
    stopKeepAlive();
    try {
      await BluetoothSdk.stopStream();
    } catch (e) {
      console.warn('[PeakStream] stopStream error:', e);
    }
    setStreamKey(null);
    currentStreamIdRef.current = null;
    setStreamState(
      mentra.glasses.connected ? 'ble_connected' : 'idle'
    );
  }, [mentra.glasses.connected, stopKeepAlive]);

  // ─── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopKeepAlive();
    };
  }, [stopKeepAlive]);

  // ─── Derived state ──────────────────────────────────────────────────────────
  const glassesConnected = mentra.glasses.connected;
  const battery =
    glassesConnected && mentra.glasses.battery?.level != null
      ? mentra.glasses.battery.level
      : null;
  const glassesModel =
    glassesConnected
      ? (mentra.glasses as any).device?.deviceModel?.deviceType ?? 'Mentra Live'
      : null;

  const status: StreamStatus = {
    state: streamState,
    error,
    streamKey,
    hlsUrl: streamKey ? STREAM_CONFIG.hlsUrl(streamKey) : null,
    whipUrl: streamKey ? STREAM_CONFIG.whipUrl(streamKey) : null,
    glassesConnected,
    wifiConnected,
    wifiSsid,
    glassesBattery: battery,
    glassesModel,
    streamDurationSeconds: duration,
  };

  return {
    status,
    discoveredDevices,
    isScanning,
    scanForGlasses,
    connectToDevice,
    reconnectDefault,
    disconnect,
    startStream,
    stopStream,
    bleConnectionState: mentra.glasses.connection.state,
  };
}
