# Firebase Push Notifications - Complete Integration Guide

## Overview

You now have a complete Firebase push notification system integrated with SafeVoice. This guide covers setup, testing, and integration with mobile apps.

## Architecture

```
Mobile App (iOS/Android)
    ↓
[Get Firebase Token]
    ↓
Backend API: POST /api/devices/register
    ↓
[Store Token in MongoDB]
    ↓
When event happens (message, alert):
    ↓
Backend → Firebase Admin SDK
    ↓
Firebase Cloud Messaging (FCM)
    ↓
Push to device(s)
    ↓
User sees notification → Taps → App opens to relevant screen
```

## Part 1: Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add Project"
3. Name it: `safevoice` (or your choice)
4. Enable Google Analytics (optional)
5. Click "Create Project"

### Step 2: Generate Service Account Key

1. In Firebase Console, go to **Settings** (gear icon)
2. Click **Service Accounts** tab
3. Click **Generate New Private Key**
4. Save the JSON file somewhere safe (e.g., `firebase-credentials.json`)

### Step 3: Set Environment Variable

Add to your `.env` file:

```bash
# Path to Firebase credentials JSON file
FIREBASE_CREDENTIALS=/path/to/firebase-credentials.json

# Or set system environment variable
# export GOOGLE_APPLICATION_CREDENTIALS=/path/to/firebase-credentials.json

# Your Firebase project ID (from the JSON file)
FIREBASE_PROJECT_ID=your-project-id
```

### Step 4: Install Firebase Admin SDK

Already done! But if needed:

```bash
npm install firebase-admin
```

## Part 2: Device Token Registration Flow

### Mobile App Side (What to implement)

#### 1. Initialize Firebase in Your Mobile App

**Flutter:**
```dart
import 'package:firebase_messaging/firebase_messaging.dart';

class FirebaseSetup {
  static Future<void> initialize() async {
    // Request notification permission
    final settings = await FirebaseMessaging.instance.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carryForward: true,
      critical: false,
      provisional: false,
      sound: true,
    );

    // Get token
    final token = await FirebaseMessaging.instance.getToken();
    
    // Send to backend
    if (token != null) {
      await registerDeviceToken(token);
    }

    // Listen for token refresh
    FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
      registerDeviceToken(newToken);
    });

    // Handle incoming messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      handleIncomingNotification(message);
    });
  }

  static Future<void> registerDeviceToken(String token) async {
    final response = await http.post(
      Uri.parse('https://safevoice-api.com/api/devices/register'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $authToken',
      },
      body: jsonEncode({
        'token': token,
        'deviceType': Platform.isIOS ? 'ios' : 'android',
        'deviceName': 'iPhone 14 Pro', // Optional
        'appVersion': '1.0.0',
        'osVersion': '16.0',
      }),
    );

    if (response.statusCode == 201) {
      print('Device token registered successfully');
    }
  }

  static void handleIncomingNotification(RemoteMessage message) {
    print('Got a message whilst in the foreground!');
    print('Message data: ${message.data}');

    if (message.notification != null) {
      print('Message title: ${message.notification!.title}');
      print('Message body: ${message.notification!.body}');
      
      // Route to relevant screen
      if (message.data['type'] == 'message') {
        navigateToCaseChat(message.data['caseId']);
      } else if (message.data['type'] == 'emergency_alert') {
        navigateToAlert(message.data['alertId']);
      }
    }
  }
}
```

**React Native:**
```javascript
import messaging from '@react-native-firebase/messaging';

async function initializeFirebase() {
  // Request permission
  const authorizationStatus = await messaging().requestPermission();
  
  if (authorizationStatus) {
    // Get token
    const token = await messaging().getToken();
    
    // Send to backend
    await fetch('https://safevoice-api.com/api/devices/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        token,
        deviceType: Platform.OS === 'ios' ? 'ios' : 'android',
        appVersion: '1.0.0',
        osVersion: Platform.Version.toString(),
      }),
    });
  }

  // Handle incoming messages
  messaging().onMessage(async (message) => {
    console.log('Foreground message:', message);
    handleNotification(message);
  });
}
```

**Web:**
```javascript
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "safevoice.firebaseapp.com",
  projectId: "safevoice",
  storageBucket: "safevoice.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

async function initializeFirebase() {
  try {
    const token = await getToken(messaging, {
      vapidKey: 'YOUR_VAPID_KEY' // Get from Firebase Console
    });

    // Send token to backend
    await fetch('https://safevoice-api.com/api/devices/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        token,
        deviceType: 'web',
        appVersion: '1.0.0',
        osVersion: navigator.userAgent,
      }),
    });
  } catch (error) {
    console.log('Unable to get messaging token', error);
  }

  onMessage(messaging, (payload) => {
    console.log('Message received:', payload);
    handleNotification(payload);
  });
}
```

## Part 3: Backend Device Token Endpoints

### Register Device Token

**Endpoint:** `POST /api/devices/register`

**Authentication:** Bearer token (student or counselor)

**Request Body:**
```json
{
  "token": "firebase-registration-token",
  "deviceType": "ios|android|web",
  "deviceName": "iPhone 14 Pro",
  "appVersion": "1.0.0",
  "osVersion": "16.0"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Device token registered successfully",
  "deviceTokenId": "token-id",
  "deviceCount": 2
}
```

### Unregister Device Token

**Endpoint:** `POST /api/devices/unregister`

**Request Body:**
```json
{
  "token": "firebase-registration-token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Device token unregistered"
}
```

### Get My Devices

**Endpoint:** `GET /api/devices/my-devices`

**Response:**
```json
{
  "success": true,
  "count": 2,
  "devices": [
    {
      "id": "device-id-1",
      "deviceName": "iPhone 14 Pro",
      "deviceType": "ios",
      "osVersion": "16.0",
      "appVersion": "1.0.0",
      "lastSeenAt": "2025-12-18T10:30:00Z"
    },
    {
      "id": "device-id-2",
      "deviceName": "iPad",
      "deviceType": "ios",
      "osVersion": "15.8",
      "appVersion": "1.0.0",
      "lastSeenAt": "2025-12-18T09:15:00Z"
    }
  ]
}
```

### Send Test Push

**Endpoint:** `POST /api/devices/test-push`

**Request Body (optional):**
```json
{
  "token": "firebase-token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test notification sent",
  "messageId": "firebase-message-id"
}
```

## Part 4: Automatic Push Notifications

### 1. New Message Notification

When a counselor replies to a student:

```
Backend sends:
  Title: 💬 New Message
  Body: Counselor: [first 50 chars of message]
  Data: {type: 'message', caseId: '...', sender: 'Counselor'}
  
Student receives → Taps → Opens chat for that case
```

**Automatic Flow:**
1. Student logs in → registers device token
2. Counselor sends message via `/api/cases/:caseId/messages`
3. Backend fetches student's device tokens
4. Backend sends push via Firebase
5. Student receives notification while app is open or closed

### 2. Emergency Alert Notification

When student triggers SOS:

```
Backend sends:
  Title: 🚨 EMERGENCY ALERT
  Body: StudentName - SOS Button Pressed
  Data: {type: 'emergency_alert', caseId: '...', alertType: 'sos_button'}
  Priority: HIGH
  TTL: 3600 seconds
  
Counselor receives → Taps → Opens alert details page
```

### 3. Case Update Notification

When case status changes:

```
Backend sends:
  Title: 📋 Case Update
  Body: [Update description]
  Data: {type: 'case_update', caseId: '...', updateType: 'assigned'}
  Priority: NORMAL
```

## Part 5: Testing

### Test 1: Manual Device Registration

```bash
curl -X POST http://localhost:3000/api/devices/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN" \
  -d '{
    "token": "fake-firebase-token-for-testing",
    "deviceType": "android",
    "deviceName": "Test Phone",
    "appVersion": "1.0.0",
    "osVersion": "12.0"
  }'
```

### Test 2: Send Test Notification

```bash
curl -X POST http://localhost:3000/api/devices/test-push \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN"
```

### Test 3: View Registered Devices

```bash
curl -X GET http://localhost:3000/api/devices/my-devices \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN"
```

### Test 4: End-to-End Message Notification

1. Register device token (from mobile app)
2. Have counselor send message: `POST /api/cases/:caseId/messages`
3. Check Firebase Console → Messaging to see message queued
4. On mobile app, you should see push notification appear

## Part 6: Firebase Console Features

### View Message Analytics

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Messaging** (or **Cloud Messaging** in some versions)
4. You'll see:
   - Messages sent count
   - Message delivery rate
   - Device statistics

### Send Test Messages from Console

1. Go to **Messaging** tab
2. Click **Send your first message**
3. Enter title and body
4. Select target (topic, device token, user segment)
5. Click **Review** and **Publish**

## Part 7: Production Checklist

- [ ] Firebase project created
- [ ] Service account key downloaded and secured
- [ ] FIREBASE_CREDENTIALS environment variable set
- [ ] firebase-admin SDK installed
- [ ] Mobile app requests notification permission
- [ ] Mobile app gets Firebase token on startup
- [ ] Mobile app calls `/api/devices/register` endpoint
- [ ] Token refresh handler implemented
- [ ] Background message handler implemented
- [ ] Foreground message handler implemented
- [ ] Deep links configured (tap notification → correct screen)
- [ ] Test push notifications working
- [ ] Monitor Firebase console for delivery metrics
- [ ] Set up error handling for invalid tokens
- [ ] Test with real devices (iOS and Android)

## Part 8: Troubleshooting

| Problem | Solution |
|---------|----------|
| Token register returns 401 | Check auth token is valid and not expired |
| Token register returns 500 | Check Firebase initialized (check logs for Firebase errors) |
| Push not received | Device token may be invalid, check Firebase console |
| Push goes to spam | Configure notification styling, test with test messages |
| "Firebase not initialized" | Set FIREBASE_CREDENTIALS and FIREBASE_PROJECT_ID env vars |
| Too many device tokens | Clean up old inactive tokens (older than 30 days) |
| High push failure rate | Invalid tokens accumulate - deactivate failed tokens automatically |

## Part 9: Production Deployment

### Environment Variables

Set in your production `.env`:

```bash
# Firebase
FIREBASE_CREDENTIALS=/app/firebase-credentials.json
FIREBASE_PROJECT_ID=safevoice-prod

# Or use managed secrets in deployment platform
# For Heroku: heroku config:set FIREBASE_CREDENTIALS=...
# For AWS: Use AWS Secrets Manager
# For GCP: Use Secret Manager
```

### Best Practices

1. **Store credentials securely**
   - Never commit `firebase-credentials.json`
   - Use environment variables or secret managers
   - Rotate credentials periodically

2. **Monitor push delivery**
   - Set up alerts for high failure rates
   - Track metrics in Firebase Console
   - Log all push sends and failures

3. **Rate limiting**
   - Implement rate limiting on token registration
   - Prevent spam from sending too many messages
   - Add cooldown between alert notifications

4. **Token cleanup**
   - Periodically deactivate old tokens
   - Use `/api/devices/unregister` when user logs out
   - Auto-deactivate tokens that fail delivery

5. **Deep linking**
   - Configure deep links so tapping notification opens correct screen
   - Example: `safevoice://case/case-id` → Opens chat for that case
   - Example: `safevoice://alert/alert-id` → Opens alert details

## Part 10: Advanced Features

### Topic-Based Notifications

Send message to all devices subscribed to a topic:

```typescript
// Subscribe device to topic
await firebaseService.subscribeToTopic('device-token', 'case-case-id');

// Send to all devices on this topic
await firebaseService.sendToTopic(
  'case-case-id',
  'New counselor assigned',
  'You have been assigned to case CASE-123'
);
```

Use cases:
- Send alert to all counselors: `topic: 'counselor-alerts'`
- Send to specific case: `topic: 'case-case-id'`
- Broadcast to all users: `topic: 'all-users'`

### Custom Data Payloads

Include custom data for deep linking and analytics:

```typescript
firebaseService.sendToDevice(
  token,
  'Case Updated',
  'Status changed to escalated',
  {
    type: 'case_update',
    caseId: 'case-123',
    status: 'escalated',
    customUrl: 'safevoice://case/case-123/alert'
  }
);
```

Mobile app can read this data:

```dart
// Flutter
if (message.data['type'] == 'case_update') {
  final caseId = message.data['caseId'];
  Navigator.pushNamed(context, '/case/$caseId');
}
```

### Priority and TTL Settings

- **Priority HIGH**: For time-sensitive messages (alerts, emergencies)
  - Wakes up device, shows notification immediately
  - Used for emergency alerts

- **Priority NORMAL**: For regular messages
  - Batched with other messages for efficiency
  - Used for regular chat messages

- **TTL (Time to Live)**: How long message stays in FCM queue
  - Emergency: 1 hour (3600 seconds)
  - Messages: 1 day (86400 seconds)
  - Non-critical: Can be shorter

## Resources

- **Firebase Admin SDK Docs**: https://firebase.google.com/docs/admin/setup
- **Firebase Cloud Messaging**: https://firebase.google.com/docs/cloud-messaging
- **Flutter Firebase Setup**: https://firebase.flutter.dev/docs/messaging/overview
- **React Native Firebase**: https://rnfirebase.io/messaging/usage
- **Web Firebase**: https://firebase.google.com/docs/cloud-messaging/js/client
- **Deep Linking Docs**: https://firebase.google.com/docs/dynamic-links

## Next Steps

1. **Create Firebase project** and get credentials
2. **Set environment variables** on backend
3. **Implement mobile app Firebase setup** (use code samples above)
4. **Test device token registration** (use curl commands)
5. **Test push notifications** (use test endpoint)
6. **Deploy to staging** and test with real devices
7. **Monitor Firebase Console** for metrics
8. **Deploy to production** with proper error handling

Your SafeVoice backend is now ready to send push notifications! 🚀

