# 📱 John Karle Mobile App (Lineage.AI)

<div align="center">

[![React Native](https://img.shields.io/badge/React_Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK_54-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Expo Router](https://img.shields.io/badge/Expo_Router-v6-000000?style=for-the-badge&logo=expo&logoColor=white)](https://docs.expo.dev/router/introduction/)
[![Zustand](https://img.shields.io/badge/Zustand-v5-4338CA?style=for-the-badge)](https://github.com/pmndrs/zustand)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**Cross-platform iOS and Android client for preserving human memories, interacting with memory personas, and real-time voice streaming.**

</div>

---

## 🌟 Highlights

- **File-based Routing:** Built on `expo-router` v6 with type-safe tab layouts and modal sheets.
- **ChatGPT-Style Voice Orb:** Interactive, audio-reactive animated sphere for natural conversations with preserved memory personas.
- **Real-Time Voice Streaming:** WebSocket audio streaming integration with Speech-to-Text and AWS Polly neural voice playback.
- **Memory Vault & Timeline:** Rich visual timeline showcasing historical events, recorded voice stories, photos, and tagged memories.
- **Legacy Mode & Family Transfer:** Beneficiary assignment, access rules, emergency transfer triggers, and family member permissions.
- **Modern Design & Animations:** Smooth transitions powered by `react-native-reanimated` v4 and custom design tokens.

---

## 📂 Architecture & Directory Layout

```text
john karl-app/
├── app/
│   ├── (tabs)/                 # Main bottom-tab screens
│   │   ├── index.tsx           # Dashboard / Home
│   │   ├── stories.tsx         # Story feed
│   │   ├── timeline.tsx        # Milestone timeline
│   │   └── vault.tsx           # Memory vault
│   ├── add-memory/             # Multi-step memory creator (Story, Tags, Save)
│   ├── auth/                   # Authentication (Sign in, Forgot password, Verify)
│   ├── chat/
│   │   ├── index.tsx           # Text memory chat
│   │   └── voice-call.tsx      # Real-time WebSocket streaming voice call
│   ├── family-access/          # Family sharing and invites
│   ├── legacy-mode/            # Emergency triggers, rules, and beneficiary handover
│   ├── memory/                 # Memory detail view and editing
│   ├── onboarding/             # Intro slides and initial configuration
│   └── profile/                # User profile and security settings
├── components/                 # UI primitives, Voice Orb, modals, timeline entries
├── constants/                  # Theme colors, typography, onboarding copy
├── hooks/                      # Custom hooks (auth, theme, async state)
├── services/                   # REST API and speech WebSocket clients
├── store/                      # Global state via Zustand (auth, memory, notifications)
└── utils/                      # Storage helpers, image processing, formatting
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ (Node.js 22 LTS recommended)
- npm or pnpm
- Expo Go app on iOS/Android, or local Android Studio / Xcode simulators

### Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env-example .env
# Windows PowerShell:
Copy-Item .env-example .env
```

### Configure Environment (`.env`)

```ini
EXPO_PUBLIC_API_URL=http://localhost:5200/api/v1
EXPO_PUBLIC_WS_URL=ws://localhost:5200
```
> *Note:* If testing on a physical device, replace `localhost` with your machine's local network IP address (e.g. `http://192.168.1.50:5200/api/v1`).

### Running the App

```bash
# Start Metro bundler
npx expo start
```

Inside the terminal:
- Press `a` to open in **Android Emulator**
- Press `i` to open in **iOS Simulator**
- Press `w` to open in **Web Browser**
- Scan QR code with the **Expo Go** app for physical device testing

---

## 🛠️ Scripts

| Command | Purpose |
| :--- | :--- |
| `npm run start` | Launch the Expo development server |
| `npm run android` | Compile and run native Android build |
| `npm run ios` | Compile and run native iOS build |
| `npm run web` | Start web preview |
| `npm run lint` | Run ESLint |
