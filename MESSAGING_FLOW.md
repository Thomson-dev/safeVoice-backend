# SafeVoice Messaging System

## Overview

The messaging system enables real-time communication between students and counselors within the case management framework. Every message is tied to a case, ensuring focused conversations and proper tracking.

## Message Flow Architecture

### 1. Student Sends Message to Counselor

```
Student → POST /api/student/messages
├─ Verify student authentication
├─ Link message to case (via reportId)
├─ Save message to database
├─ Generate notification for assigned counselor
└─ Return success response
```

**Request:**
```json
POST /api/student/messages
Authorization: Bearer <student-token>
Content-Type: application/json

{
  "reportId": "report-mongodb-id",
  "content": "I would like to follow up on my report..."
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "msg-123",
    "reportId": "report-123",
    "content": "I would like to follow up...",
    "fromCounselor": false,
    "createdAt": "2025-12-18T10:30:00Z"
  }
}
```

### 2. Notification Sent to Counselor

```
Backend Notification System:
├─ Find assigned counselor for case
├─ Add notification to counselor's queue
├─ Log: "📨 Notification sent to counselor X: New message in case CASE-XXXXXX"
└─ Counselor can poll for notifications or WebSocket in future
```

**Notification Object:**
```json
{
  "id": "notif-123",
  "message": "New message in case CASE-XXXXXX",
  "timestamp": "2025-12-18T10:30:00Z"
}
```

### 3. Counselor Receives Notification & Views Messages

```
Counselor → GET /api/cases/:caseId/messages
├─ Verify counselor is assigned to case
├─ Retrieve all messages for case
├─ Auto-mark unread student messages as read
└─ Return messages with full details
```

**Request:**
```bash
GET /api/cases/case-123/messages
Authorization: Bearer <counselor-token>
```

**Response:**
```json
{
  "caseId": "CASE-123456",
  "reportId": "report-123",
  "totalMessages": 2,
  "messages": [
    {
      "id": "msg-1",
      "content": "I would like to follow up...",
      "fromCounselor": false,
      "readAt": "2025-12-18T10:32:00Z",
      "createdAt": "2025-12-18T10:30:00Z"
    },
    {
      "id": "msg-2",
      "content": "Let's discuss this further. When are you available?",
      "fromCounselor": true,
      "readAt": null,
      "createdAt": "2025-12-18T10:35:00Z"
    }
  ]
}
```

### 4. Counselor Sends Reply to Student

```
Counselor → POST /api/cases/:caseId/messages
├─ Verify counselor is assigned to case
├─ Verify case and linked report exist
├─ Create message tied to case
├─ Generate notification for student
└─ Return success response
```

**Request:**
```json
POST /api/cases/case-123/messages
Authorization: Bearer <counselor-token>
Content-Type: application/json

{
  "caseId": "case-123",
  "content": "Thank you for following up. I'm here to help..."
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "msg-456",
    "caseId": "CASE-123456",
    "content": "Thank you for following up...",
    "fromCounselor": true,
    "createdAt": "2025-12-18T10:35:00Z"
  }
}
```

### 5. Notification Sent to Student

```
Backend Notification System:
├─ Find student who owns the case
├─ Add notification to student's queue
├─ Log: "📨 Notification sent to student X: Reply from counselor in case CASE-XXXXXX"
└─ Student can poll for notifications or WebSocket in future
```

## API Endpoints Summary

### Student Messaging Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/student/messages` | Send message to counselor | Student |
| GET | `/api/student/reports/:reportId/messages` | View all messages for a report | Student |
| GET | `/api/student/messages/unread` | Check unread message count & notifications | Student |
| DELETE | `/api/student/messages/notifications` | Clear all notifications | Student |

### Counselor Messaging Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/cases/:caseId/messages` | Send message to student | Counselor |
| GET | `/api/cases/:caseId/messages` | View all messages in a case | Counselor |
| GET | `/api/counselor/messages/unread` | Check unread count & notifications | Counselor |
| DELETE | `/api/counselor/messages/notifications` | Clear all notifications | Counselor |

## Message Database Schema

```typescript
Message {
  _id: ObjectId;                    // MongoDB auto-generated
  reportId: ObjectId;               // Reference to Report (indexed)
  userId: ObjectId;                 // Student ID (indexed)
  counselorId?: ObjectId;           // Counselor ID (if from counselor)
  fromCounselor: Boolean;           // Flag indicating sender type (indexed)
  content: String;                  // Message text
  readAt?: Date;                    // Timestamp when read (null = unread)
  createdAt: Date;                  // Auto-generated timestamp
  updatedAt: Date;                  // Auto-generated timestamp
}
```

### Indexes for Performance
- `{ reportId: 1, createdAt: -1 }` - Fast message retrieval per case
- `{ userId: 1, readAt: 1 }` - Find unread messages per user
- `{ counselorId: 1, createdAt: -1 }` - Messages from specific counselor

## Notification System

### In-Memory Notification Store (Current)

```typescript
notifications: Map<userId, Array<{
  id: string;
  message: string;
  timestamp: Date;
}>>
```

**Limitations:**
- Lost on server restart
- No persistence
- Single-server only

### Production Recommendation: Redis

Replace in-memory store with Redis:
```typescript
// Store notification
await redis.lpush(`notifications:${userId}`, JSON.stringify(notification));

// Retrieve notifications
const notifs = await redis.lrange(`notifications:${userId}`, 0, -1);

// Clear notifications
await redis.del(`notifications:${userId}`);
```

## Message Status Flow

### Student Perspective

```
Send Message
    ↓
Message saved to DB
    ↓
Counselor receives notification
    ↓
Counselor views messages (auto-marks as read)
    ↓
Student checks unread messages (sees 0)
```

### Counselor Perspective

```
Receives notification
    ↓
View case messages
    ↓
Send reply
    ↓
Message saved to DB
    ↓
Student receives notification
    ↓
Student views report messages (auto-marks as read)
```

## Read Status Management

### Auto-Read on View
- **Student:** Unread messages from counselor are marked as read when student views report messages
- **Counselor:** Unread messages from student are marked as read when counselor views case messages

### Why Auto-Read?
1. **Reduces unnecessary API calls** - No separate "mark as read" endpoint needed
2. **Accurate tracking** - Read status reflects actual viewing
3. **Simpler client logic** - Automatic instead of manual marking

## Notification Polling vs WebSocket

### Current: Polling (HTTP)
```javascript
// Student polls every 10 seconds
GET /api/student/messages/unread
// Returns: { unreadCount: 2, notifications: [...] }
```

**Pros:** Simple, works with stateless servers
**Cons:** Latency, bandwidth, server load

### Future: WebSocket
```javascript
// Real-time connection
const socket = io('https://api.safevoice.com');
socket.on('new_message', (data) => {
  console.log('New message:', data);
  updateUI();
});
```

**Pros:** Real-time, low latency, bidirectional
**Cons:** Stateful, more complex, requires Socket.io

## Error Handling

### Common Error Scenarios

| Scenario | Status | Response |
|----------|--------|----------|
| Missing authentication | 401 | `{ error: "Authentication required" }` |
| User not authorized | 403 | `{ error: "You do not own this report" / "Not assigned to case" }` |
| Report/Case not found | 404 | `{ error: "Report/Case not found" }` |
| Missing required fields | 400 | `{ error: "reportId and content are required" }` |
| Database error | 500 | `{ error: "Failed to send message" }` |

## Security & Privacy

### Message Privacy
- ✅ Messages only visible to student and assigned counselor
- ✅ StudentId hidden from counselor responses
- ✅ CounselorId hidden from student (except in case details)
- ✅ All endpoints require JWT authentication

### Audit Trail
- ✅ All messages timestamped (createdAt, readAt)
- ✅ User attribution (userId, counselorId)
- ✅ Message history preserved (soft-delete not implemented)

## Performance Considerations

### Database Optimization
1. **Indexes:** All high-query fields indexed
2. **Sorting:** Messages sorted by createdAt (descending on fetch)
3. **Pagination:** (Future) Add limit/offset for large conversations

### API Optimization
1. **Response Filtering:** Only essential fields returned
2. **Auto-Read:** Batch update instead of individual reads
3. **Notification Cleanup:** (Future) Archive old notifications to Redis

## Testing the Messaging System

### 1. Student Sends Message
```bash
curl -X POST http://localhost:3000/api/student/messages \
  -H "Authorization: Bearer <student-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reportId": "report-123",
    "content": "Hello, I need help..."
  }'
```

### 2. Counselor Views Messages
```bash
curl -X GET http://localhost:3000/api/cases/case-123/messages \
  -H "Authorization: Bearer <counselor-token>"
```

### 3. Counselor Sends Reply
```bash
curl -X POST http://localhost:3000/api/cases/case-123/messages \
  -H "Authorization: Bearer <counselor-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "case-123",
    "content": "I'm here to help..."
  }'
```

### 4. Student Checks Unread
```bash
curl -X GET http://localhost:3000/api/student/messages/unread \
  -H "Authorization: Bearer <student-token>"
```

## Future Enhancements

1. **WebSocket Integration** - Real-time messaging without polling
2. **Message Encryption** - End-to-end encryption for sensitive content
3. **Message Search** - Full-text search across conversations
4. **Attachment Support** - Allow images/documents in messages
5. **Message Retention** - Policy-based automatic deletion
6. **Typing Indicators** - Show when other party is typing
7. **Read Receipts** - Explicit read confirmation UI
8. **Message Reactions** - Emoji reactions to messages
9. **Message Threading** - Reply to specific messages
10. **Notification Preferences** - User-controlled notification settings
