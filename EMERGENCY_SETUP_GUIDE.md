# Emergency Alert System - Quick Setup Guide

## What Was Built

A complete emergency alert system with multiple notification channels for urgent situations where students need immediate help.

### Key Components

1. **Emergency Alert Model** - Database storage for all emergency events
2. **Alert Service** - Handles notifications via SMS, email, push
3. **Alert Controller** - API endpoints for triggering and managing alerts
4. **Routes** - `/api/alerts` endpoints for students and counselors

---

## Quick Start

### 1. Environment Variables (.env)

```bash
# Firebase Cloud Messaging (Push Notifications)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Africa's Talking (SMS)
AFRICAS_TALKING_API_KEY=your-api-key
AFRICAS_TALKING_USERNAME=your-username

# SendGrid (Email)
SENDGRID_API_KEY=your-api-key
SAFEVOICE_EMAIL=alerts@safevoice.org
```

### 2. Install Dependencies

```bash
# Push notifications
npm install firebase-admin

# SMS alerts
npm install africastalking

# Email alerts
npm install @sendgrid/mail

# Type definitions
npm install --save-dev @types/firebase-admin
```

### 3. Alert API Endpoints

#### Student - Trigger SOS

```bash
POST /api/alerts/sos
Authorization: Bearer <student-token>

{
  "reportId": "report-id",
  "location": {
    "latitude": -1.2865,
    "longitude": 36.8172,
    "accuracy": 25
  }
}
```

#### Counselor - Escalate Case

```bash
POST /api/alerts/escalate/:caseId
Authorization: Bearer <counselor-token>

{
  "caseId": "case-id",
  "reason": "Student exhibiting suicidal ideation",
  "guardianPhones": ["+254712345678"],
  "guardianEmails": ["parent@email.com"]
}
```

#### Get Alert Status

```bash
GET /api/alerts/:alertId
Authorization: Bearer <token>
```

#### Resolve Alert

```bash
PATCH /api/alerts/:alertId/resolve
Authorization: Bearer <counselor-token>

{
  "resolutionNotes": "Student transferred to hospital. Family notified."
}
```

---

## Alert Triggers

### 1. SOS Button (Immediate)

**When:** Student taps emergency panic button

**Flow:**
```
Student → SOS Button
        ↓
Case status → escalated (critical)
        ↓
Counselor receives push notification
        ↓
Email with location map link
        ↓
SMS to guardians (if location enabled)
```

**Response Time:** < 5 seconds to counselor

---

### 2. Risk Escalation (Automatic)

**When:** Counselor updates case risk level to "critical"

**Flow:**
```
PATCH /api/cases/:caseId/risk-level
{ "riskLevel": "critical" }
        ↓
Creates EmergencyAlert automatically
        ↓
Notifies assigned counselor
        ↓
Logs to system
```

---

### 3. Manual Escalation (Counselor)

**When:** Counselor determines case needs external intervention

**Flow:**
```
POST /api/alerts/escalate/:caseId
{
  "reason": "...",
  "guardianPhones": [...],
  "guardianEmails": [...]
}
        ↓
Creates alert with guardian contacts
        ↓
Sends SMS to guardians
        ↓
Sends email to guardians
        ↓
Case status → escalated
```

---

## Database Schema

### EmergencyAlert Document

```json
{
  "_id": "ObjectId",
  "caseId": "ObjectId",
  "reportId": "ObjectId",
  "studentId": "ObjectId",
  "counselorId": "ObjectId",
  "triggerType": "sos_button|risk_escalation|manual_escalation",
  "riskLevel": "high|critical",
  "description": "Alert reason",
  "studentLocation": {
    "latitude": -1.2865,
    "longitude": 36.8172,
    "accuracy": 25,
    "timestamp": "2025-12-18T10:30:00Z"
  },
  "guardianPhoneNumbers": ["+254712345678"],
  "guardianEmailAddresses": ["parent@email.com"],
  "alertsSent": {
    "push_notification": {
      "sent": true,
      "sentAt": "2025-12-18T10:30:05Z",
      "recipient": "counselor-id"
    },
    "sms": {
      "sent": true,
      "sentAt": "2025-12-18T10:30:08Z",
      "recipients": ["+254712345678"],
      "messageId": "msg-123"
    },
    "email": {
      "sent": true,
      "sentAt": "2025-12-18T10:30:15Z",
      "recipients": ["parent@email.com"]
    }
  },
  "counselorNotified": true,
  "status": "triggered|in_progress|resolved|cancelled",
  "resolutionNotes": "Student is safe...",
  "createdAt": "2025-12-18T10:30:00Z",
  "updatedAt": "2025-12-18T10:30:00Z"
}
```

---

## Notification Channels

### SMS (Africa's Talking)

**Message Format:**
```
🚨 SAFEVOICE ALERT 🚨

Student: John Doe
Case ID: CASE-123456
Risk: CRITICAL

Location: https://maps.google.com/?q=-1.2865,36.8172

Please respond immediately.
```

**Cost:** ~KES 1 per SMS

**Delivery:** 1-3 seconds

---

### Email

**Template Elements:**
- Urgent header (red background)
- Student name and case ID
- Alert reason
- Location map link
- Action items for recipient
- Clickable button to dashboard

**Delivery:** 5-30 seconds

**Cost:** Free (SendGrid free tier 100/day)

---

### Push Notification

**Payload:**
```json
{
  "title": "🚨 STUDENT SOS ALERT",
  "body": "John Doe triggered SOS in case CASE-123456",
  "data": {
    "caseId": "case-id",
    "alertId": "alert-id",
    "alertType": "sos_button"
  }
}
```

**Delivery:** < 1 second

**Platform:** Firebase Cloud Messaging

---

## Testing Checklist

- [ ] Can student trigger SOS button
- [ ] Case status changes to "escalated"
- [ ] Counselor receives push notification
- [ ] Counselor receives email alert
- [ ] Location map link works
- [ ] Counselor can escalate case
- [ ] Guardians receive SMS
- [ ] Guardians receive email
- [ ] Alert can be resolved
- [ ] Resolution notes are saved
- [ ] Active alerts can be viewed
- [ ] SMS with invalid number fails gracefully
- [ ] Email retries on failure

---

## Production Deployment

### Before Going Live

1. **Set real API keys** in environment variables
2. **Test with real phone numbers** (1-2 test cases)
3. **Configure email domain** (SPF/DKIM records)
4. **Set up Firebase console** with app certificates
5. **Enable SMS on Africa's Talking account**
6. **Configure rate limiting** to prevent spam
7. **Set up monitoring** and error alerts
8. **Test location sharing** with GPS coordinates
9. **Verify GDPR compliance** for location data
10. **Document escalation procedures** for team

### Scaling Considerations

- **SMS Volume:** Africa's Talking can handle 1000s of SMS/minute
- **Email Volume:** SendGrid can handle 10000s of emails/day
- **Push Notifications:** Firebase handles unlimited at scale
- **Database:** Index on `status` and `createdAt` for fast queries

---

## Common Scenarios

### Scenario 1: Student in Immediate Danger

```
1. Student taps SOS button
2. Provides location (if available)
3. Counselor receives instant notification
4. Counselor calls student or local emergency
5. Counselor marks alert as "in_progress"
6. Once safe, marks as "resolved"
```

**Timeline:**
- 0-1 sec: Push notification to counselor
- 1-30 sec: Email with details
- 1-3 sec: SMS to guardians (if enabled)
- 5-10 min: Counselor response

### Scenario 2: Counselor Suspects Self-Harm

```
1. During conversation, student mentions harm
2. Counselor escalates case to "critical" risk
3. System creates EmergencyAlert automatically
4. Counselor adds guardian contacts
5. SMS sent to guardians
6. Email with guidance sent
7. Case marked for follow-up
```

### Scenario 3: False Alarm

```
1. Student accidentally hits SOS
2. Quickly messages "I'm okay"
3. Counselor receives notification
4. Verifies student is safe via chat
5. Marks alert as "cancelled"
6. No additional notifications sent
7. Incident logged for review
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Push not received | Verify device token is current, check Firebase console |
| SMS failing | Verify phone number format (+country-code), check Africa's Talking balance |
| Email in spam | Configure SPF/DKIM records, test sending domain |
| Location not captured | Verify location permission on app, check GPS accuracy |
| Alert not created | Check case exists and is linked to report |
| Counselor not notified | Verify counselor has device token, check notification settings |

---

## Monitoring & Logging

### Metrics to Track

1. **Alert Response Time**
   - From trigger to counselor notification
   - Target: < 5 seconds

2. **Delivery Success Rate**
   - % of SMS/Email successfully delivered
   - Target: > 98%

3. **Alert Resolution Time**
   - From trigger to resolved status
   - Target: < 1 hour for critical

4. **False Alert Rate**
   - Alerts cancelled without escalation
   - Target: < 15%

### Log Entries

Every alert generates logs:
```
[ALERT TRIGGERED] SOS Button
  Student: student-123
  Case: CASE-456
  Location: -1.2865, 36.8172
  Time: 2025-12-18T10:30:00Z

[NOTIFICATION SENT] Push
  Recipient: counselor-789
  Delivery: 0.8s
  Status: Success

[NOTIFICATION SENT] SMS
  Recipients: +254712345678
  Delivery: 2.1s
  Status: Success
```

---

## Integration with Case System

### Auto-Escalation on Critical Risk

When a counselor updates case risk to "critical":

```typescript
PATCH /api/cases/:caseId/risk-level
{
  "riskLevel": "critical"
}
```

The system automatically:
1. Creates EmergencyAlert
2. Updates case status → "escalated"
3. Sends push notification to counselor
4. Logs to audit trail

### Case Status Transitions

```
new → active → escalated → closed
           ↑
           └─ Risk level critical detected
```

---

## API Reference Summary

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/alerts/sos` | Student panic button | Student |
| POST | `/api/alerts/escalate/:caseId` | Counselor escalate | Counselor |
| GET | `/api/alerts/:alertId` | Get alert details | Student/Counselor |
| PATCH | `/api/alerts/:alertId/resolve` | Resolve alert | Counselor |
| GET | `/api/alerts` | Get all active alerts | Admin |

---

## Next Steps

1. **Set up external services** (Firebase, Africa's Talking, SendGrid)
2. **Configure environment variables**
3. **Test each notification channel** individually
4. **Test full flow** end-to-end with test data
5. **Train team** on escalation procedures
6. **Deploy to staging** and test with real devices
7. **Deploy to production** with monitoring enabled
8. **Document** escalation procedures for support

---

## Support Resources

- **Firebase Cloud Messaging:** https://firebase.google.com/docs/cloud-messaging
- **Africa's Talking API:** https://africastalking.com/sms/api
- **SendGrid Email API:** https://sendgrid.com/docs/api-reference/
- **SafeVoice Docs:** See EMERGENCY_ALERT_SYSTEM.md

