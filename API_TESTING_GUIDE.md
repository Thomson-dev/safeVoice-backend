# SafeVoice API - Complete Endpoint Testing Guide

## 🚀 Quick Start

1. Make sure your server is running on `http://localhost:3002`
2. Follow the testing steps below in order

---

## 📝 Testing Checklist

### ✅ Phase 1: Health & Info
- [ ] Health Check
- [ ] API Info

### ✅ Phase 2: Authentication
- [ ] Register Student
- [ ] Login Student
- [ ] Register Counselor
- [ ] Login Counselor

### ✅ Phase 3: Reports (Student)
- [ ] Submit Report
- [ ] Check Report Status (Public)
- [ ] Get My Reports
- [ ] Get Report Details

### ✅ Phase 4: Trusted Contacts (Student)
- [ ] Add Contact
- [ ] Get All Contacts
- [ ] Update Contact
- [ ] Delete Contact

### ✅ Phase 5: Messages (Student)
- [ ] Send Message
- [ ] Get Message Thread
- [ ] Get Unread Messages
- [ ] Mark Message as Read

### ✅ Phase 6: Cases (Counselor)
- [ ] Get My Cases
- [ ] Get Available Cases
- [ ] Claim Case
- [ ] Get Case Details
- [ ] Update Case Status
- [ ] Update Risk Level

### ✅ Phase 7: Case Messages (Counselor)
- [ ] Send Message to Student
- [ ] Get Case Messages

### ✅ Phase 8: Emergency Alerts (Student)
- [ ] Trigger SOS Alert
- [ ] Get Alert Details

### ✅ Phase 9: Device Tokens
- [ ] Register Device Token
- [ ] Get My Devices
- [ ] Delete Device Token

### ✅ Phase 10: Resources
- [ ] Get All Resources

---

## 🧪 Detailed Test Cases

## **PHASE 1: HEALTH & INFO**

### 1. Health Check
```
GET http://localhost:3002/api/health
```
**Expected Response (200):**
```json
{
  "status": "OK",
  "timestamp": "2025-12-20T..."
}
```

### 2. API Info
```
GET http://localhost:3002/
```
**Expected Response (200):**
```json
{
  "message": "SafeVoice Backend API",
  "version": "1.0.0",
  "endpoints": { ... }
}
```

---

## **PHASE 2: AUTHENTICATION**

### 3. Register Student
```
POST http://localhost:3002/api/auth/student/register
Content-Type: application/json

{
  "email": "student1@school.edu",
  "password": "SecurePass123!",
  "role": "student"
}
```
**Expected Response (201):**
```json
{
  "success": true,
  "userId": "...",
  "anonymousId": "ANON-...",
  "role": "student",
  "token": "eyJhbGc..."
}
```
**📝 SAVE:** Copy `token` as `STUDENT_TOKEN`

---

### 4. Login Student
```
POST http://localhost:3002/api/auth/student/login
Content-Type: application/json

{
  "email": "student1@school.edu",
  "password": "SecurePass123!"
}
```
**Expected Response (200):**
```json
{
  "success": true,
  "userId": "...",
  "token": "..."
}
```

---

### 5. Register Counselor
```
POST http://localhost:3002/api/auth/counselor/register
Content-Type: application/json

{
  "email": "counselor1@school.edu",
  "password": "SecurePass123!",
  "fullName": "Dr. Sarah Johnson",
  "license": "LIC-12345",
  "schoolName": "Lincoln High School",
  "department": "Mental Health",
  "role": "counselor"
}
```
**Expected Response (201):**
```json
{
  "success": true,
  "userId": "...",
  "token": "..."
}
```
**📝 SAVE:** Copy `token` as `COUNSELOR_TOKEN`

---

### 6. Login Counselor
```
POST http://localhost:3002/api/auth/counselor/login
Content-Type: application/json

{
  "email": "counselor1@school.edu",
  "password": "SecurePass123!"
}
```
**Expected Response (200):**
```json
{
  "success": true,
  "userId": "...",
  "token": "..."
}
```

---

## **PHASE 3: REPORTS (STUDENT)**

### 7. Submit Report
```
POST http://localhost:3002/api/reports
Authorization: Bearer {STUDENT_TOKEN}
Content-Type: application/json

{
  "incidentType": "Bullying",
  "description": "Someone is bullying me in the school hallway",
  "evidenceUrl": "",
  "schoolName": "Lincoln High School"
}
```
**Expected Response (201):**
```json
{
  "success": true,
  "trackingCode": "TRK-...",
  "reportId": "...",
  "caseId": "CASE-0001"
}
```
**📝 SAVE:** 
- `trackingCode` as `TRACKING_CODE`
- `reportId` as `REPORT_ID`
- `caseId` as `CASE_ID`

---

### 8. Check Report Status (Public - No Auth)
```
GET http://localhost:3002/api/reports/{TRACKING_CODE}
```
**Expected Response (200):**
```json
{
  "success": true,
  "report": {
    "trackingCode": "TRK-...",
    "status": "new",
    "incidentType": "Bullying",
    "description": "..."
  }
}
```

---

### 9. Get My Reports
```
GET http://localhost:3002/api/my-reports
Authorization: Bearer {STUDENT_TOKEN}
```
**Expected Response (200):**
```json
{
  "success": true,
  "total": 1,
  "reports": [...]
}
```

---

### 10. Get Report Details
```
GET http://localhost:3002/api/reports/{REPORT_ID}/details
Authorization: Bearer {STUDENT_TOKEN}
```
**Expected Response (200):**
```json
{
  "success": true,
  "report": { ... }
}
```

---

## **PHASE 4: TRUSTED CONTACTS (STUDENT)**

### 11. Add Trusted Contact
```
POST http://localhost:3002/api/student/contacts
Authorization: Bearer {STUDENT_TOKEN}
Content-Type: application/json

{
  "name": "Mom",
  "phone": "+1 (555) 123-4567",
  "email": "mom@email.com",
  "relationship": "Parent"
}
```
**Expected Response (201):**
```json
{
  "success": true,
  "contact": {
    "id": "...",
    "name": "Mom"
  }
}
```
**📝 SAVE:** `contact.id` as `CONTACT_ID`

---

### 12. Get All Contacts
```
GET http://localhost:3002/api/student/contacts
Authorization: Bearer {STUDENT_TOKEN}
```
**Expected Response (200):**
```json
{
  "success": true,
  "total": 1,
  "contacts": [...]
}
```

---

### 13. Update Contact
```
PATCH http://localhost:3002/api/student/contacts/{CONTACT_ID}
Authorization: Bearer {STUDENT_TOKEN}
Content-Type: application/json

{
  "name": "Mom Updated",
  "phone": "+1 (555) 999-9999",
  "email": "mom.new@email.com",
  "relationship": "Parent"
}
```
**Expected Response (200):**
```json
{
  "success": true,
  "contact": { ... }
}
```

---

### 14. Delete Contact
```
DELETE http://localhost:3002/api/student/contacts/{CONTACT_ID}
Authorization: Bearer {STUDENT_TOKEN}
```
**Expected Response (200):**
```json
{
  "success": true,
  "message": "Contact deleted"
}
```

---

## **PHASE 5: MESSAGES (STUDENT)**

### 15. Send Message to Counselor
```
POST http://localhost:3002/api/student/messages
Authorization: Bearer {STUDENT_TOKEN}
Content-Type: application/json

{
  "reportId": "{REPORT_ID}",
  "content": "Can we meet tomorrow at 2pm?"
}
```
**Expected Response (201):**
```json
{
  "success": true,
  "message": {
    "id": "...",
    "content": "..."
  }
}
```
**📝 SAVE:** `message.id` as `MESSAGE_ID`

---

### 16. Get Message Thread
```
GET http://localhost:3002/api/student/reports/{REPORT_ID}/messages
Authorization: Bearer {STUDENT_TOKEN}
```
**Expected Response (200):**
```json
{
  "success": true,
  "total": 1,
  "messages": [...]
}
```

---

### 17. Get Unread Messages
```
GET http://localhost:3002/api/student/messages/unread
Authorization: Bearer {STUDENT_TOKEN}
```
**Expected Response (200):**
```json
{
  "success": true,
  "unreadCount": 0,
  "messages": []
}
```

---

### 18. Mark Message as Read
```
PATCH http://localhost:3002/api/student/messages/{MESSAGE_ID}/read
Authorization: Bearer {STUDENT_TOKEN}
Content-Type: application/json

{}
```
**Expected Response (200):**
```json
{
  "success": true,
  "message": { ... }
}
```

---

## **PHASE 6: CASES (COUNSELOR)**

### 19. Get My Cases
```
GET http://localhost:3002/api/cases/my-cases
Authorization: Bearer {COUNSELOR_TOKEN}
```
**Expected Response (200):**
```json
{
  "total": 1,
  "cases": [...]
}
```

---

### 20. Get Available Cases
```
GET http://localhost:3002/api/cases/available
Authorization: Bearer {COUNSELOR_TOKEN}
```
**Expected Response (200):**
```json
{
  "total": 0,
  "cases": []
}
```
*(All cases are auto-assigned)*

---

### 21. Claim Case (if unassigned exists)
```
POST http://localhost:3002/api/cases/{CASE_ID}/claim
Authorization: Bearer {COUNSELOR_TOKEN}
```
**Expected Response (200):**
```json
{
  "success": true,
  "message": "Case claimed successfully",
  "case": { ... }
}
```

---

### 22. Get Case Details
```
GET http://localhost:3002/api/cases/{CASE_ID}
Authorization: Bearer {COUNSELOR_TOKEN}
```
**Expected Response (200):**
```json
{
  "success": true,
  "case": {
    "caseId": "CASE-0001",
    "status": "active",
    "riskLevel": "low"
  },
  "report": { ... },
  "messages": [...]
}
```

---

### 23. Update Case Status
```
PATCH http://localhost:3002/api/cases/{CASE_ID}/status
Authorization: Bearer {COUNSELOR_TOKEN}
Content-Type: application/json

{
  "status": "active"
}
```
**Expected Response (200):**
```json
{
  "success": true,
  "case": {
    "status": "active"
  }
}
```
**Status Options:** `"new"`, `"active"`, `"escalated"`, `"closed"`

---

### 24. Update Case Risk Level
```
PATCH http://localhost:3002/api/cases/{CASE_ID}/risk-level
Authorization: Bearer {COUNSELOR_TOKEN}
Content-Type: application/json

{
  "riskLevel": "high"
}
```
**Expected Response (200):**
```json
{
  "success": true,
  "case": {
    "riskLevel": "high"
  }
}
```
**Risk Options:** `"low"`, `"medium"`, `"high"`, `"critical"`

---

## **PHASE 7: CASE MESSAGES (COUNSELOR)**

### 25. Send Message to Student
```
POST http://localhost:3002/api/cases/{CASE_ID}/messages
Authorization: Bearer {COUNSELOR_TOKEN}
Content-Type: application/json

{
  "content": "Hello, I've reviewed your case. Let's discuss this."
}
```
**Expected Response (201):**
```json
{
  "success": true,
  "message": { ... }
}
```

---

### 26. Get Case Messages
```
GET http://localhost:3002/api/cases/{CASE_ID}/messages
Authorization: Bearer {COUNSELOR_TOKEN}
```
**Expected Response (200):**
```json
{
  "success": true,
  "total": 2,
  "messages": [...]
}
```

---

## **PHASE 8: EMERGENCY ALERTS (STUDENT)**

### 27. Trigger SOS Alert
```
POST http://localhost:3002/api/alerts/sos
Authorization: Bearer {STUDENT_TOKEN}
Content-Type: application/json

{
  "reportId": "{REPORT_ID}",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```
**Expected Response (201):**
```json
{
  "success": true,
  "alert": {
    "id": "...",
    "severity": "critical",
    "status": "pending"
  }
}
```
**📝 SAVE:** `alert.id` as `ALERT_ID`

---

### 28. Get Alert Details
```
GET http://localhost:3002/api/alerts/{ALERT_ID}
Authorization: Bearer {STUDENT_TOKEN}
```
**Expected Response (200):**
```json
{
  "success": true,
  "alert": { ... }
}
```

---

## **PHASE 9: DEVICE TOKENS**

### 29. Register Device Token
```
POST http://localhost:3002/api/devices/register
Authorization: Bearer {STUDENT_TOKEN}
Content-Type: application/json

{
  "deviceToken": "firebase_fcm_token_12345",
  "deviceType": "android"
}
```
**Expected Response (201):**
```json
{
  "success": true,
  "deviceToken": { ... }
}
```
**📝 SAVE:** `deviceToken.id` as `TOKEN_ID`

---

### 30. Get My Devices
```
GET http://localhost:3002/api/devices/my-devices
Authorization: Bearer {STUDENT_TOKEN}
```
**Expected Response (200):**
```json
{
  "success": true,
  "total": 1,
  "devices": [...]
}
```

---

### 31. Delete Device Token
```
DELETE http://localhost:3002/api/devices/{TOKEN_ID}
Authorization: Bearer {STUDENT_TOKEN}
```
**Expected Response (200):**
```json
{
  "success": true,
  "message": "Device token deleted"
}
```

---

## **PHASE 10: RESOURCES**

### 32. Get All Resources
```
GET http://localhost:3002/api/resources
```
*(No authentication required)*

**Expected Response (200):**
```json
{
  "success": true,
  "total": 5,
  "resources": [...]
}
```

---

## 📊 Testing Summary

Total Endpoints: **32**

- ✅ Health & Info: 2
- ✅ Authentication: 4
- ✅ Reports: 4
- ✅ Contacts: 4
- ✅ Messages: 4
- ✅ Cases: 6
- ✅ Case Messages: 2
- ✅ Alerts: 2
- ✅ Device Tokens: 3
- ✅ Resources: 1

---

## 🎯 Quick Test Flow

1. Register student → Get token
2. Submit report → Get tracking code
3. Register counselor → Get token
4. Get available cases → Claim case
5. Send messages back and forth
6. Update case status
7. Close case

---

**Happy Testing! 🚀**
