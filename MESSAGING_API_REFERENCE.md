# SafeVoice Messaging API Reference

## Base URL
```
http://localhost:3000/api
```

## Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

## Student Messaging Endpoints

### 1. Send Message to Counselor

**Endpoint:** `POST /student/messages`

**Description:** Student sends a message to their assigned counselor for a specific report.

**Headers:**
```
Authorization: Bearer <student-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "reportId": "507f1f77bcf86cd799439011",
  "content": "I wanted to follow up on the incident I reported. Can we discuss the next steps?"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": {
    "id": "msg-507f1f77bcf86cd799439012",
    "reportId": "507f1f77bcf86cd799439011",
    "content": "I wanted to follow up on the incident I reported...",
    "fromCounselor": false,
    "createdAt": "2025-12-18T10:30:00Z"
  }
}
```

**Error Responses:**

| Status | Response |
|--------|----------|
| 400 | `{ "error": "reportId and content are required" }` |
| 401 | `{ "error": "Authentication required" }` |
| 403 | `{ "error": "Unauthorized - you do not own this report" }` |
| 404 | `{ "error": "No case found for this report" }` |
| 500 | `{ "error": "Failed to send message" }` |

**Flow:**
1. Message saved to database
2. Linked to case via reportId
3. Notification sent to assigned counselor (if exists)
4. Returns message details

---

### 2. Get All Messages for a Report

**Endpoint:** `GET /student/reports/:reportId/messages`

**Description:** Retrieve all messages (student and counselor) for a specific report. Auto-marks unread counselor messages as read.

**Headers:**
```
Authorization: Bearer <student-token>
```

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| reportId | string | Yes | MongoDB ID of the report |

**Success Response (200):**
```json
{
  "reportId": "507f1f77bcf86cd799439011",
  "totalMessages": 3,
  "messages": [
    {
      "id": "msg-1",
      "content": "I wanted to follow up...",
      "fromCounselor": false,
      "readAt": null,
      "createdAt": "2025-12-18T10:30:00Z"
    },
    {
      "id": "msg-2",
      "content": "Thank you for reaching out. I'm here to help...",
      "fromCounselor": true,
      "readAt": "2025-12-18T10:35:00Z",
      "createdAt": "2025-12-18T10:32:00Z"
    }
  ]
}
```

**Error Responses:**

| Status | Response |
|--------|----------|
| 401 | `{ "error": "Authentication required" }` |
| 403 | `{ "error": "Unauthorized" }` |
| 500 | `{ "error": "Failed to retrieve messages" }` |

---

### 3. Get Unread Message Count

**Endpoint:** `GET /student/messages/unread`

**Description:** Get count of unread messages from counselor and pending notifications.

**Headers:**
```
Authorization: Bearer <student-token>
```

**Success Response (200):**
```json
{
  "unreadCount": 2,
  "notifications": [
    {
      "id": "notif-1",
      "message": "Reply from counselor in case CASE-123456",
      "timestamp": "2025-12-18T10:32:00Z"
    }
  ]
}
```

---

### 4. Clear Notifications

**Endpoint:** `DELETE /student/messages/notifications`

**Description:** Clear all notifications for the student.

**Headers:**
```
Authorization: Bearer <student-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Notifications cleared"
}
```

---

## Counselor Messaging Endpoints

### 1. Send Message to Student

**Endpoint:** `POST /cases/:caseId/messages`

**Description:** Counselor sends a reply message to a student within a specific case.

**Headers:**
```
Authorization: Bearer <counselor-token>
Content-Type: application/json
```

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| caseId | string | Yes | MongoDB ID of the case |

**Request Body:**
```json
{
  "caseId": "507f1f77bcf86cd799439010",
  "content": "Thank you for reaching out. I'm here to help you through this. Let's discuss the next steps."
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": {
    "id": "msg-507f1f77bcf86cd799439013",
    "caseId": "CASE-123456",
    "content": "Thank you for reaching out...",
    "fromCounselor": true,
    "createdAt": "2025-12-18T10:35:00Z"
  }
}
```

**Error Responses:**

| Status | Response |
|--------|----------|
| 400 | `{ "error": "caseId and content are required" }` |
| 401 | `{ "error": "Authentication required" }` |
| 403 | `{ "error": "You are not assigned to this case" }` |
| 404 | `{ "error": "Case not found" }` or `{ "error": "Report not found" }` |
| 500 | `{ "error": "Failed to send message" }` |

---

### 2. Get All Messages in a Case

**Endpoint:** `GET /cases/:caseId/messages`

**Description:** Retrieve all messages in a case. Auto-marks unread student messages as read.

**Headers:**
```
Authorization: Bearer <counselor-token>
```

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| caseId | string | Yes | MongoDB ID of the case |

**Success Response (200):**
```json
{
  "caseId": "CASE-123456",
  "reportId": "507f1f77bcf86cd799439011",
  "totalMessages": 3,
  "messages": [
    {
      "id": "msg-1",
      "content": "I wanted to follow up...",
      "fromCounselor": false,
      "readAt": "2025-12-18T10:33:00Z",
      "createdAt": "2025-12-18T10:30:00Z"
    },
    {
      "id": "msg-2",
      "content": "Thank you for reaching out...",
      "fromCounselor": true,
      "readAt": null,
      "createdAt": "2025-12-18T10:35:00Z"
    }
  ]
}
```

**Error Responses:**

| Status | Response |
|--------|----------|
| 401 | `{ "error": "Authentication required" }` |
| 403 | `{ "error": "You are not assigned to this case" }` |
| 404 | `{ "error": "Case not found" }` |
| 500 | `{ "error": "Failed to retrieve messages" }` |

---

### 3. Get Unread Message Count

**Endpoint:** `GET /counselor/messages/unread`

**Description:** Get count of unread messages from students and pending notifications.

**Headers:**
```
Authorization: Bearer <counselor-token>
```

**Success Response (200):**
```json
{
  "unreadCount": 5,
  "notifications": [
    {
      "id": "notif-1",
      "message": "New message in case CASE-123456",
      "timestamp": "2025-12-18T10:30:00Z"
    }
  ],
  "assignedCases": 3
}
```

---

### 4. Clear Notifications

**Endpoint:** `DELETE /counselor/messages/notifications`

**Description:** Clear all notifications for the counselor.

**Headers:**
```
Authorization: Bearer <counselor-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Notifications cleared"
}
```

---

## Common Patterns

### Polling for New Messages (Client Side)

**Student Checking for Counselor Replies:**
```javascript
setInterval(async () => {
  const response = await fetch('/api/student/messages/unread', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await response.json();
  
  if (data.unreadCount > 0) {
    // Show notification to user
    showNotification(data.notifications[0]);
  }
}, 10000); // Check every 10 seconds
```

**Counselor Checking for New Student Messages:**
```javascript
setInterval(async () => {
  const response = await fetch('/api/counselor/messages/unread', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await response.json();
  
  if (data.unreadCount > 0) {
    // Show notification and badge
    updateBadge(data.unreadCount);
    playNotificationSound();
  }
}, 10000); // Check every 10 seconds
```

---

## Message Object Structure

```typescript
interface Message {
  id: string;                 // MongoDB _id
  reportId?: string;          // Reference to Report (for student messages)
  caseId?: string;            // Reference to Case (for counselor messages)
  content: string;            // Message text
  fromCounselor: boolean;     // true if sent by counselor, false if by student
  readAt: Date | null;        // When message was read (null = unread)
  createdAt: Date;            // When message was sent
}
```

---

## Notification Object Structure

```typescript
interface Notification {
  id: string;                 // Unique notification ID
  message: string;            // Human-readable notification text
  timestamp: Date;            // When notification was created
}
```

---

## Rate Limiting

Currently, no rate limiting is implemented. In production, consider:
- Max 100 messages per hour per user
- Max 10 notifications per minute per user
- Max message length: 5000 characters

---

## Webhook Integration (Future)

Webhooks for external notification services:
```
POST /webhooks/message-received
{
  "event": "message.sent",
  "userId": "user-id",
  "messageId": "msg-id",
  "caseId": "case-id",
  "timestamp": "2025-12-18T10:30:00Z"
}
```

---

## WebSocket Support (Future)

Real-time messaging without polling:
```javascript
const socket = io('http://localhost:3000', {
  query: { token: jwtToken }
});

socket.on('message:new', (data) => {
  console.log('New message:', data);
});

socket.emit('message:send', {
  caseId: 'case-id',
  content: 'Message text'
});
```

---

## Testing with cURL

### Student sends message:
```bash
curl -X POST http://localhost:3000/api/student/messages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reportId": "507f1f77bcf86cd799439011",
    "content": "Hello, I need help with my report"
  }'
```

### Get report messages:
```bash
curl http://localhost:3000/api/student/reports/507f1f77bcf86cd799439011/messages \
  -H "Authorization: Bearer <token>"
```

### Counselor sends reply:
```bash
curl -X POST http://localhost:3000/api/cases/case-id/messages \
  -H "Authorization: Bearer <counselor-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "case-id",
    "content": "Thank you for reaching out. How can I help?"
  }'
```

### Get case messages:
```bash
curl http://localhost:3000/api/cases/case-id/messages \
  -H "Authorization: Bearer <counselor-token>"
```

### Check unread messages:
```bash
curl http://localhost:3000/api/student/messages/unread \
  -H "Authorization: Bearer <token>"
```

---

## Error Handling Best Practices

1. **Always check HTTP status code**
   ```javascript
   if (response.status === 401) {
     // Token expired, redirect to login
   }
   ```

2. **Handle network errors gracefully**
   ```javascript
   try {
     const res = await fetch('/api/...');
   } catch (error) {
     // Network error, show offline message
   }
   ```

3. **Retry on 5xx errors**
   ```javascript
   async function fetchWithRetry(url, options, retries = 3) {
     for (let i = 0; i < retries; i++) {
       const res = await fetch(url, options);
       if (res.status < 500) return res;
       await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
     }
   }
   ```

---

## Performance Tips

1. **Cache messages locally** - Don't refetch messages already loaded
2. **Pagination** - For cases with 100+ messages, implement pagination
3. **Compress messages** - Long text? Implement message compression
4. **Lazy load images** - If attachments added in future
5. **Service Workers** - Offline message drafts with sync

---

## Security Considerations

- ✅ All endpoints require JWT authentication
- ✅ Students can only access their own messages
- ✅ Counselors can only access cases they're assigned to
- ✅ Messages are stored with user IDs for audit trail
- ⚠️ Implement message encryption for sensitive data
- ⚠️ Add rate limiting to prevent spam
- ⚠️ Sanitize message content to prevent XSS
