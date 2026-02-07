# Android App — QR Scanner

## Setup

1. Open this `android/` folder in **Android Studio**
2. Update server URL in `app/src/main/java/com/qrscanner/app/ApiService.kt`:
   ```kotlin
   private const val BASE_URL = "http://YOUR_SERVER_IP:5000/"
   ```
3. Sync Gradle → Run on device

## Tech Stack

| Library | Purpose |
|---------|---------|
| CameraX 1.3 | Camera preview & image capture |
| ML Kit Barcode | QR code detection |
| Retrofit 2.9 | HTTP client for server upload |
| Play Services Location | GPS coordinates |
| Material Components | UI theming |

## Minimum Requirements

- Android 8.0 (API 26)
- Camera
- GPS (optional — falls back to 0,0 if unavailable)
- Internet connection to reach the server

## Permissions

| Permission | Usage |
|------------|-------|
| `CAMERA` | QR code scanning |
| `ACCESS_FINE_LOCATION` | GPS coordinates at scan time |
| `INTERNET` | Uploading scan data to server |

## Build APK

```bash
./gradlew assembleRelease
```

Output: `app/build/outputs/apk/release/app-release.apk`
