// PeakStream — Stream infrastructure constants
// Glasses push WebRTC (WHIP) to MediaMTX; viewers pull HLS from the same server.

export const STREAM_CONFIG = {
  // Your existing MediaMTX server
  MEDIAMTX_HOST: 'live.xsen.fun:8443',

  // WHIP ingest — glasses push to this HTTPS endpoint (MediaMTX via the
  // peak.streampal.fun:8444 proxy). MediaMTX WHIP path: /{streamKey}/whip
  whipUrl: (streamKey: string) =>
    `https://peak.streampal.fun:8444/${streamKey}/whip`,

  // HLS playback — viewers watch from this URL
  hlsUrl: (streamKey: string) =>
    `https://live.xsen.fun:8443/hls/${streamKey}/index.m3u8`,

  // RTMP fallback ingest
  rtmpUrl: (streamKey: string) =>
    `rtmp://157.245.208.49:1935/live/${streamKey}`,

  // Keep-alive interval (ms) — glasses require ping every ~15s
  KEEP_ALIVE_INTERVAL_MS: 12000,

  // Scan timeout
  SCAN_TIMEOUT_MS: 15000,
} as const;

export const APP_CONFIG = {
  name: 'StreamPal POV',
  tagline: 'Purpose-Built Streaming for Mission-Driven People',
  version: '1.0.0',
  supportedModels: ['Mentra Live'],
} as const;

// Stream quality presets
export const STREAM_PRESETS = [
  { label: 'WebRTC (Low Latency)', protocol: 'whip' as const, recommended: true },
  { label: 'RTMP (Stable)', protocol: 'rtmp' as const, recommended: false },
  { label: 'SRT (Reliable)', protocol: 'srt' as const, recommended: false },
] as const;

// Video quality presets (sent to the glasses when the stream starts).
// 'auto' leaves the glasses on their own defaults (currently 640x360, ~15 fps).
export const QUALITY_PRESETS = [
  { id: 'auto', label: 'Auto', video: undefined },
  { id: 'sd', label: '360p · 24', video: { width: 640, height: 360, fps: 24, bitrate: 1000000 } },
  { id: 'hd', label: '720p · 24', video: { width: 1280, height: 720, fps: 24, bitrate: 2000000 } },
] as const;

export type StreamQuality = (typeof QUALITY_PRESETS)[number]['id'];

export type StreamProtocol = 'whip' | 'rtmp' | 'srt';
