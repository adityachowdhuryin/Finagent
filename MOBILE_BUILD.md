# FinAgent Mobile Build Guide

This guide provides complete instructions for building, running, and deploying FinAgent as a native mobile application on iOS and Android using Capacitor.

---

## Quick Reference

Common commands for day-to-day development:

```bash
# Full build and sync
npm run build && npx cap sync

# Open in Xcode (iOS)
npx cap open ios

# Open in Android Studio
npx cap open android

# Run on connected Android device
npx cap run android

# Run on iOS simulator
npx cap run ios
```

---

## 1. Prerequisites

Before starting native builds, ensure the following dependencies are installed on your workstation:

- **Node.js**: Version 18+ (with `npm` installed)
- **Xcode**: Version 14+ (macOS required, for iOS development)
  - Install Command Line Tools: `xcode-select --install`
  - CocoaPods: `sudo gem install cocoapods` or via Homebrew `brew install cocoapods`
- **Android Studio**: Version 4+ / Android Studio Hedgehog or newer
  - Android SDK Platform 33+
  - Android SDK Build-Tools
  - Android Virtual Device (AVD) for emulation or a physical device with USB debugging enabled
- **Java**: Java Development Kit (JDK) 17
  - Verify with: `java -version`

---

## 2. Initial Setup (One-Time)

Run these setup steps once in the project root (`/Users/adityachowdhury/Downloads/Fin/`):

1. **Build the Vite web application**:
   ```bash
   npm run build
   ```
   This generates the compiled web assets into the `dist/` directory specified in `capacitor.config.ts`.

2. **Add iOS native project**:
   ```bash
   npx cap add ios
   ```
   This creates the `ios/` directory containing the Xcode workspace.

3. **Add Android native project**:
   ```bash
   npx cap add android
   ```
   This creates the `android/` directory containing the Gradle project.

4. **Sync web assets and plugins to native platforms**:
   ```bash
   npx cap sync
   ```

---

## 3. Build After Code Changes

Whenever you update React components, styles, or logic, recompile and sync:

```bash
npm run build && npx cap sync
```

This ensures the `dist/` bundle in both `ios/` and `android/` directories matches your latest web build.

---

## 4. iOS Build

> **Note**: Building for iOS requires macOS and an active Apple Developer account for TestFlight or App Store distribution.

1. **Open Xcode**:
   ```bash
   npx cap open ios
   ```

2. **Configure Code Signing**:
   - In Xcode, select the `App` project in the left sidebar.
   - Navigate to **Signing & Capabilities**.
   - Under **Team**, select your Apple Developer Team.
   - Ensure the Bundle Identifier is set to `app.finagent.wealth`.

3. **Test on Simulator or Device**:
   - Select a target simulator (e.g., iPhone 15) or connected device from the top toolbar.
   - Click **Run** (or `Cmd + R`).

4. **Distribute via TestFlight / App Store**:
   - In Xcode, select **Product → Archive**.
   - Once archived, the Organizer window will appear.
   - Click **Distribute App** → **App Store Connect** → **Upload**.
   - Follow prompts to submit for TestFlight internal/external testing.
   - Apple Developer Enrollment: [https://developer.apple.com/programs/](https://developer.apple.com/programs/) ($99/year).

---

## 5. Android Build

1. **Open Android Studio**:
   ```bash
   npx cap open android
   ```

2. **Gradle Sync**:
   - Allow Android Studio to sync the Gradle files and download required SDK components.

3. **Run on Device / Emulator**:
   - Connect an Android device with **USB Debugging** enabled, or start an Android Virtual Device (AVD).
   - Run from terminal:
     ```bash
     npx cap run android
     ```
   - Or click the **Run** button (green play icon) inside Android Studio.

4. **Generate Signed Bundle / APK for Release**:
   - In Android Studio, go to **Build → Generate Signed Bundle / APK...**
   - Select **Android App Bundle** (preferred for Google Play) or **APK**.
   - Create or choose your release keystore, enter passwords, and select `release` build variant.
   - Google Play Console account: [https://play.google.com/console](https://play.google.com/console) ($25 one-time fee).

---

## 6. Environment Variables for Native

- **Firebase Configuration**:
  Firebase client configuration is stored in `.env.local`. Vite inlines variables prefixed with `VITE_` during `npm run build`, so they are automatically included in the native app web bundle.

- **Backend API URL**:
  When deploying or testing native builds against a cloud backend, configure `VITE_API_BASE_URL`:
  - Set `VITE_API_BASE_URL=https://your-backend.onrender.com` in `.env.local` before building.
  - Or update `server.url` in `capacitor.config.ts` if pointing Capacitor directly to a remote host.

---

## 7. App Icons and Splash Screen

To generate all required Android and iOS icons and splash screens:

1. Create a `resources/` folder in the project root:
   - Place a `1024×1024` PNG named `icon.png` in `resources/`
   - Place a `2732×2732` PNG named `splash.png` in `resources/`

2. Generate assets across all densities:
   ```bash
   npx @capacitor/assets generate
   ```

3. Sync changes:
   ```bash
   npx cap sync
   ```

---

## 8. Push Notifications (Future Activation)

Push notification plugins and handlers are configured in `capacitor.config.ts`. To fully activate push notifications via Firebase Cloud Messaging (FCM):

1. **Android**:
   - In the Firebase Console, navigate to Project Settings.
   - Download `google-services.json`.
   - Place it into `/Users/adityachowdhury/Downloads/Fin/android/app/google-services.json`.

2. **iOS**:
   - In the Firebase Console, download `GoogleService-Info.plist`.
   - In Xcode, add `GoogleService-Info.plist` to the `App/App` directory (ensure "Copy items if needed" is checked).
   - Enable **Push Notifications** and **Background Modes (Remote notifications)** in Xcode under **Signing & Capabilities**.

---

## 9. Deep Links for Firebase Auth

For authentication redirects, OAuth callbacks, and email link sign-in:

- **iOS (Associated Domains)**:
  - In Xcode, go to **Signing & Capabilities** → **+ Capability** → **Associated Domains**.
  - Add domain entry: `applinks:finagent-4a4d6.firebaseapp.com`.

- **Android (Intent Filter)**:
  - Add an intent filter inside `<activity>` in `android/app/src/main/AndroidManifest.xml`:
    ```xml
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="https" android:host="finagent-4a4d6.firebaseapp.com" />
    </intent-filter>
    ```

---

## 10. Troubleshooting

- **`cap sync` fails or dependency resolution errors**:
  - Run with legacy peer dependencies:
    ```bash
    npm install --legacy-peer-deps
    npx cap sync
    ```

- **iOS build / Pod issues**:
  - Ensure CocoaPods is installed:
    ```bash
    sudo gem install cocoapods
    ```
  - Reinstall pods inside the iOS directory:
    ```bash
    cd ios/App && pod install && cd ../..
    ```

- **Android build fails / Java version mismatch**:
  - Verify that `JAVA_HOME` points to Java 17:
    ```bash
    export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
    # On macOS with Homebrew OpenJDK 17:
    # export JAVA_HOME=$(/usr/libexec/java_home -v 17)
    ```

- **Clear Capacitor Cache**:
  ```bash
  npx cap copy
  npx cap sync
  ```
