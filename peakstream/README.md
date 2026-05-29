# PeakStream — Mentra Live WebRTC Broadcasting App

**Purpose-built for Mentra Live smart glasses. Glasses push WebRTC (WHIP) to your MediaMTX server; viewers watch HLS.**

---

## Architecture

```
Mentra Live Glasses
       │
       │ Bluetooth (BLE)
       ▼
PeakStream App (Expo / React Native)
       │
       │ tells glasses: startStream → WHIP URL
       │
       ▼
Glasses Camera → WebRTC (WHIP POST) → https://live.xsen.fun:8443/whip/{key}
                                                │
                                                ▼
                                          MediaMTX
                                                │
                              ┌─────────────────┼──────────────────┐
                              ▼                 ▼                  ▼
                         HLS viewers      WebRTC viewers     RTMP relay
                  /hls/{key}/index.m3u8   /{key}            rtmp://...
```

---

## Requirements

- Node.js 20+
- Bun (`npm i -g bun`)
- Xcode 15+ (iOS) or Android Studio + Java 17 (Android)
- **Physical phone** — Bluetooth doesn't work on simulators
- Mentra Live glasses with BLE enabled
- MediaMTX running at `live.xsen.fun` (your existing server)

---

## Quick Start

### 1. Install

```bash
cd peakstream
bun install
```

### 2. Configure stream endpoints

Edit `src/utils/constants.ts` if your MediaMTX host differs from `live.xsen.fun:8443`.

### 3. Configure MediaMTX (server side)

Merge `server/mediamtx.yml` into your existing MediaMTX config on your DigitalOcean server:

```bash
# On your DO droplet
nano /etc/mediamtx/mediamtx.yml
# Add the webrtc, whip, and paths sections from server/mediamtx.yml
systemctl restart mediamtx
```

Add the nginx proxy block from `server/nginx-whip-proxy.conf` to your `live.xsen.fun` nginx config:

```bash
nano /etc/nginx/sites-available/live.xsen.fun
# Add the /whip/ and /hls/ location blocks
nginx -t && systemctl reload nginx
```

### 4. Build and run

**iOS:**
```bash
bun run ios:setup     # downloads GStreamer (only needed once)
bunx expo prebuild
bunx expo run:ios
```

**Android:**
```bash
bunx expo prebuild
bun run android:dev
```

> Expo Go will NOT work — the Mentra SDK contains native code. You need a development build.

---

## Using the App

1. **Scan** — tap SCAN to find nearby Mentra Live glasses
2. **Connect** — tap your glasses in the list; accept the system Bluetooth pairing dialog
3. **Stream key** — enter a stream key (e.g. `fancast-1`, `nmhu-football-1`)
4. **Protocol** — WebRTC (WHIP) is recommended for lowest latency
5. **GO LIVE** — the app tells the glasses to push WebRTC to your server
6. **Viewers** watch at `https://live.xsen.fun:8443/hls/{key}/index.m3u8`

### Reconnecting

After the first connection, tap **↺ RECONNECT LAST GLASSES** — no scanning needed.

---

## Stream Protocols

| Protocol | URL format | Latency | Best for |
|---|---|---|---|
| **WebRTC (WHIP)** | `https://...` | ~0.5s | FanCast POV live |
| RTMP | `rtmp://...` | ~3-5s | Stable/reliable |
| SRT | `srt://...` | ~1-2s | Unreliable networks |

---

## Server Setup (MediaMTX WHIP)

MediaMTX supports WHIP natively — it's WebRTC over HTTP POST at `/whip/{path}`.

The glasses send:
```
POST https://live.xsen.fun:8443/whip/fancast-1
Content-Type: application/sdp
[SDP offer body]
```

MediaMTX responds with an SDP answer and the WebRTC connection is established. No extra plugins needed.

**Test WHIP is working:**
```bash
curl -X POST https://live.xsen.fun:8443/whip/test \
  -H "Content-Type: application/sdp" \
  -d "v=0..."
# Should return 201 Created with SDP answer
```

---

## Project Structure

```
peakstream/
├── app/
│   ├── _layout.tsx          # Expo Router root
│   └── index.tsx            # Entry → StreamScreen
├── src/
│   ├── hooks/
│   │   └── useGlassesStream.ts  # BLE + stream lifecycle
│   ├── screens/
│   │   └── StreamScreen.tsx     # Main UI
│   ├── components/
│   │   ├── StatusBadge.tsx      # Animated state indicator
│   │   ├── DevicePicker.tsx     # BLE scan results
│   │   ├── StreamControls.tsx   # Start/stop + key + protocol
│   │   ├── LiveMetrics.tsx      # Duration + HLS URL + battery
│   │   ├── BatteryIndicator.tsx # Visual battery display
│   │   └── EventLog.tsx         # Scrolling event console
│   └── utils/
│       └── constants.ts         # URLs, stream config
├── server/
│   ├── mediamtx.yml            # MediaMTX WHIP config
│   └── nginx-whip-proxy.conf   # Nginx proxy for WHIP + HLS
├── app.json                    # Expo config + permissions
├── package.json
└── metro.config.js
```

---

## iOS Background Streaming

The app is configured for background BLE + audio operation (`UIBackgroundModes: bluetooth-central, audio`). The glasses stream independently once started — the phone is just the BLE controller. You can lock the phone and the stream continues.

---

## Android Bluetooth Bonding

On first connection, Android shows a system pairing dialog. Accept it. This pairs the glasses for media audio routing. Required once per device.

---

## Roadmap

- [ ] Multi-camera director switching (StreamPal Pro tier)
- [ ] Overlay text on glasses display (NMHU score bug)
- [ ] iOS Swift native app (HaishinKit fallback)
- [ ] Auto-reconnect on BLE drop
- [ ] Supabase stream session logging
- [ ] PeakOS/Mentra rebrand variant

---

## Peak Platforms

Part of the Peak Platforms ecosystem. A portion of profits supports Patriot Rider Ministries and Freedom Ranch (Montezuma, NM).

*Purpose-Built Platforms for Mission-Driven People*
