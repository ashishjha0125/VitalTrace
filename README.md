# VitalTrace ECG

A real-time ECG (Electrocardiogram) monitoring system built with ESP32 hardware, React Native mobile app, and Node.js backend. Captures cardiac signals via the AD8232 sensor, streams them over Bluetooth Low Energy, applies digital signal processing filters, performs automated rhythm analysis, and generates AI-powered clinical insights.

## Features

**Hardware & Signal Acquisition**
- AD8232 ECG sensor with ESP32 microcontroller
- 200 Hz sampling rate with 12-bit ADC resolution
- BLE data streaming with batched notifications (~50 packets/sec)
- Real-time leads-off detection with visual indicators

**Signal Processing**
- 4-stage DSP filter chain (configurable in-app)
  - IIR Notch filter (50/60 Hz) — removes powerline interference
  - 2nd-order Butterworth High-Pass (0.5 Hz) — eliminates baseline wander
  - 2nd-order Butterworth Low-Pass (40 Hz) — attenuates EMG noise
  - Moving average smoothing (3-sample window)
- Raw vs. filtered waveform toggle

**Clinical Analysis**
- Pan-Tompkins R-peak detection algorithm
- Heart rate calculation with median-filtered R-R intervals
- Rhythm regularity assessment (SDNN, coefficient of variation)
- P-wave, QRS complex, and T-wave morphology detection
- PR interval, QRS duration, and QTc (Bazett) measurement
- Automated detection: Bradycardia, Tachycardia, AFib patterns, AV Block indicators, Long QT, ST-segment changes

**Mobile App**
- Real-time ECG waveform rendering (Skia canvas engine)
- Animated heart rate gauge with dynamic pulse
- BPM trend analysis with zone classification
- Session recording and history management
- PDF report generation and sharing
- User authentication (Email + GitHub OAuth)

**Backend API**
- RESTful API with JWT authentication
- PostgreSQL database for user profiles, sessions, and ECG recordings
- Groq LLaMA 3.3-70B integration for AI clinical insights
- Rate limiting, input validation, and security hardening

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Firmware | C++ / Arduino (ESP32 BLE stack) |
| Mobile | React Native 0.76 · Expo SDK 52 |
| UI Engine | @shopify/react-native-skia · Reanimated 3 |
| Backend | Node.js · Express 4 |
| Database | PostgreSQL |
| Auth | JWT · bcrypt · GitHub OAuth |
| AI | Groq Cloud API (LLaMA 3.3-70B) |
| BLE | react-native-ble-plx |

## Architecture

```
┌─────────────────┐     Analog      ┌─────────────────┐
│   AD8232 ECG    │ ──────────────► │     ESP32       │
│   Sensor Module │    GPIO 34      │  Microcontroller │
└─────────────────┘                 └────────┬────────┘
                                             │ BLE (200 Hz)
                                             │ Batched 4x
                                             ▼
┌─────────────────────────────────────────────────────────┐
│                  React Native App                        │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │   BLE    │→ │   DSP    │→ │   Peak   │→ │   UI    │ │
│  │ Manager  │  │ Filters  │  │ Detector │  │ Render  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │   Auth   │  │ Sessions │  │   PDF    │              │
│  │ Service  │  │ Manager  │  │ Reports  │              │
│  └────┬─────┘  └────┬─────┘  └──────────┘              │
└───────┼──────────────┼──────────────────────────────────┘
        │              │
        ▼              ▼
┌─────────────────────────────────────┐
│         Node.js Backend             │
│                                     │
│  ┌────────┐ ┌──────────┐ ┌───────┐ │
│  │  Auth  │ │ Sessions │ │  AI   │ │     ┌──────────┐
│  │  JWT   │ │   CRUD   │ │ Proxy │─┼────►│ Groq API │
│  └────┬───┘ └────┬─────┘ └───────┘ │     │ LLaMA 3.3│
│       │          │                  │     └──────────┘
│       ▼          ▼                  │
│  ┌─────────────────────┐           │
│  │    PostgreSQL DB     │           │
│  │  users · sessions   │           │
│  │  ecg_recordings     │           │
│  └─────────────────────┘           │
└─────────────────────────────────────┘
```

## Project Structure

```
VitalTrace-ECG/
│
├── esp32_firmware/
│   └── esp32_firmware.ino         # ESP32 BLE firmware (AD8232 interface)
│
├── backend/
│   ├── server.js                  # Express app entry point
│   ├── config/
│   │   └── db.js                  # PostgreSQL connection pool
│   ├── middleware/
│   │   ├── auth.js                # JWT verification
│   │   ├── errorHandler.js        # Centralized error handling
│   │   └── rateLimiter.js         # API rate limiting
│   ├── controllers/
│   │   ├── auth.controller.js     # Register, login, GitHub OAuth
│   │   ├── user.controller.js     # Profile management
│   │   ├── session.controller.js  # Recording session CRUD
│   │   ├── ecg.controller.js      # ECG data upload/retrieval
│   │   └── analysis.controller.js # AI insights proxy (Groq)
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── session.routes.js
│   │   ├── ecg.routes.js
│   │   └── analysis.routes.js
│   ├── models/
│   │   └── schema.sql             # PostgreSQL table definitions
│   └── utils/
│       ├── jwt.js                 # Token helpers
│       └── validators.js          # Joi validation schemas
│
├── mobile_app/
│   ├── App.js                     # Root component & state management
│   ├── app.json                   # Expo configuration
│   ├── index.js                   # App entry point
│   └── src/
│       ├── screens/
│       │   ├── HomeScreen.js      # Live monitoring dashboard
│       │   ├── TrendsScreen.js    # BPM trends & heart rate zones
│       │   ├── HistoryScreen.js   # Session history log
│       │   ├── ReportsScreen.js   # Diagnostics & AI insights
│       │   ├── SettingsScreen.js  # DSP filter configuration
│       │   ├── LoginScreen.js     # Authentication & onboarding
│       │   └── ProfileScreen.js   # User profile management
│       ├── components/
│       │   ├── ECGGraph.js        # Skia real-time waveform renderer
│       │   ├── HeartRateCircle.js # Animated BPM gauge
│       │   ├── BottomTabBar.js    # Tab navigation
│       │   ├── AnalysisCard.js    # Diagnostic result card
│       │   ├── StatCard.js        # Metric display tile
│       │   └── FilterCard.js      # Filter toggle card
│       ├── services/
│       │   ├── bleManager.js      # BLE communication & mock device
│       │   ├── signalProcessor.js # DSP filter chain
│       │   ├── ecgAnalyzer.js     # R-peak detection & diagnostics
│       │   ├── aiService.js       # AI insights (via backend proxy)
│       │   ├── apiClient.js       # HTTP client for backend API
│       │   ├── cloudService.js    # Cloud sync & OAuth
│       │   ├── storageService.js  # Local storage (AsyncStorage)
│       │   ├── supabaseClient.js  # Supabase client init
│       │   └── pdfService.js      # PDF report generation
│       └── theme/
│           └── theme.js           # Design system tokens
│
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [PostgreSQL](https://www.postgresql.org/) 14+
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)
- [Arduino IDE](https://www.arduino.cc/en/software) with ESP32 board support
- Android/iOS device with Bluetooth LE support

### Hardware Setup

Connect the AD8232 module to the ESP32:

| AD8232 Pin | ESP32 Pin |
|-----------|-----------|
| VCC | 3.3V |
| GND | GND |
| OUTPUT | GPIO 34 |
| LO+ | GPIO 25 |
| LO- | GPIO 33 |

Flash `esp32_firmware/esp32_firmware.ino` using the Arduino IDE.

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials, JWT secret, and Groq API key

# Initialize database
psql -U postgres -d vitaltrace -f models/schema.sql

# Start development server
npm run dev
```

The API server will start on `http://localhost:5000`.

### Mobile App Setup

```bash
# Navigate to mobile app
cd mobile_app

# Install dependencies
npm install

# Configure environment (optional)
cp .env.example .env

# Start Expo development server
npx expo start
```

Scan the QR code with Expo Go or run on a connected device. For BLE functionality, a physical device build is required:

```bash
npx expo run:android
# or
npx expo run:ios
```

## API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Email/password login |
| POST | `/api/auth/github` | GitHub OAuth login |
| GET | `/api/auth/me` | Get current user |

### User Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get user profile |
| PUT | `/api/users/profile` | Update profile (name, age, medical history) |

### Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions` | Save recording session |
| GET | `/api/sessions` | List all sessions |
| GET | `/api/sessions/:id` | Get session details |
| DELETE | `/api/sessions/:id` | Delete session |

### ECG Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ecg/upload` | Upload ECG recording data |
| GET | `/api/ecg/:id` | Get recording by ID |
| GET | `/api/ecg/session/:sessionId` | Get recordings for session |

### AI Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analysis/ai-insights` | Generate AI clinical insights |

All endpoints except `/api/auth/*` require a Bearer token in the Authorization header.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT signing (min 32 chars) |
| `JWT_EXPIRES_IN` | Token expiry duration (default: 7d) |
| `GROQ_API_KEY` | Groq Cloud API key for AI insights |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret |
| `CLIENT_URL` | Mobile app redirect URL |

### Mobile App (`mobile_app/.env`)

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Backend API base URL |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable key |

## Signal Processing Details

The DSP filter chain processes raw 12-bit ADC values (0–4095) from the AD8232 in real-time:

1. **Notch Filter** — IIR biquad filter centered at 50 Hz (configurable to 60 Hz for US/Canada) with Q-factor of 30. Removes AC powerline interference without distorting the ECG morphology.

2. **High-Pass Filter** — 2nd-order Butterworth at 0.5 Hz. Eliminates baseline wander caused by respiration and electrode impedance drift.

3. **Low-Pass Filter** — 2nd-order Butterworth at 40 Hz. Attenuates high-frequency noise from muscle tremor (EMG) and electromagnetic interference.

4. **Moving Average** — 3-sample sliding window for final smoothing. Minimal phase delay at 200 Hz sampling rate.

Each filter can be individually toggled and tuned from the Settings screen.

## Disclaimer

This project is built for educational and demonstration purposes. It is **not** a certified medical device and should not be used for clinical diagnosis. Always consult a qualified healthcare professional for medical advice.

## License

MIT
