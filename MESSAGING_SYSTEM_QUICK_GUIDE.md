# SafeVoice Messaging System - Quick Integration Guide

## What Was Built

A complete bidirectional messaging system for SafeVoice where students and counselors can communicate within cases.

### Key Components

1. **Enhanced Message Controller** (`messageController.ts`)
   - 7 endpoints for sending/receiving messages
   - Automatic read status management
   - Notification system integration

2. **Updated Routes**
   - `/api/student/messages` - Student messaging endpoints
   - `/api/cases/:caseId/messages` - Case message endpoints
   - `/api/counselor/messages` - Counselor notification endpoints

3. **Message Model** (`messageDb.ts`)
   - Already existed with all CRUD operations
   - Methods: create, getById, getByReportId, getByCaseId, getUnread, markAsRead, markMultipleAsRead

4. **Auth Middleware Updates**
   - Added `counselorAuth` - Counselor-specific authentication
   - Maintained `studentAuth` for student routes

5. **Documentation**
   - `MESSAGING_FLOW.md` - Complete system architecture and flow
   - `MESSAGING_API_REFERENCE.md` - Full API documentation with examples

---

## How to Use

### For Students

#### 1. Send a Message to Counselor
```javascript
const response = await fetch('/api/student/messages', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${studentToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reportId: reportId,
    content: 'Hello, I would like to discuss my report...'
  })
});
```

#### 2. View Conversation History
```javascript
const response = await fetch(`/api/student/reports/${reportId}/messages`, {
  headers: {
    'Authorization': `Bearer ${studentToken}`
  }
});
const messages = await response.json();
```

#### 3. Check for New Messages
```javascript
const response = await fetch('/api/student/messages/unread', {
  headers: {
    'Authorization': `Bearer ${studentToken}`
  }
});
const { unreadCount, notifications } = await response.json();
```

### For Counselors

#### 1. View All Messages in a Case
```javascript
const response = await fetch(`/api/cases/${caseId}/messages`, {
  headers: {
    'Authorization': `Bearer ${counselorToken}`
  }
});
const { messages, totalMessages } = await response.json();
// Note: Unread messages auto-marked as read
```

#### 2. Reply to Student
```javascript
const response = await fetch(`/api/cases/${caseId}/messages`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${counselorToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    caseId: caseId,
    content: 'Thank you for reaching out. How can I help?'
  })
});
```

#### 3. Monitor Incoming Messages
```javascript
// Poll every 10 seconds
setInterval(async () => {
  const response = await fetch('/api/counselor/messages/unread', {
    headers: {
      'Authorization': `Bearer ${counselorToken}`
    }
  });
  const { unreadCount, notifications } = await response.json();
  if (unreadCount > 0) {
    console.log(`You have ${unreadCount} unread messages`);
  }
}, 10000);
```

---

## System Flow Visualization

```
┌─────────────────────────────────────────────────────────────┐
│                     SafeVoice Messaging Flow                 │
└─────────────────────────────────────────────────────────────┘

1. STUDENT SENDS MESSAGE
   ┌──────────────┐
   │   Student    │
   │   (App)      │
   └──────┬───────┘
          │ POST /api/student/messages
          ↓
   ┌──────────────────────────────┐
   │  Message Controller          │
   │  1. Verify auth              │
   │  2. Link to case (reportId)  │
   │  3. Save to DB               │
   │  4. Generate notification    │
   └──────┬───────────────────────┘
          ↓
   ┌──────────────────────────────┐
   │  Notification Queue          │
   │  notifications.set(          │
   │    counselorId,              │
   │    [notification]            │
   │  )                           │
   └──────────────────────────────┘


2. COUNSELOR RECEIVES NOTIFICATION
   ┌──────────────┐
   │  Counselor   │
   │   (App)      │
   └──────┬───────┘
          │ GET /api/counselor/messages/unread
          ↓
   ┌──────────────────────────────┐
   │  Returns:                    │
   │  {                           │
   │    unreadCount: 1,           │
   │    notifications: [...]      │
   │  }                           │
   └──────────────────────────────┘


3. COUNSELOR VIEWS CASE MESSAGES
   ┌──────────────┐
   │  Counselor   │
   │   (App)      │
   └──────┬───────┘
          │ GET /api/cases/:caseId/messages
          ↓
   ┌──────────────────────────────┐
   │  Message Controller          │
   │  1. Verify counselor owns    │
   │  2. Fetch all messages       │
   │  3. Auto-mark unread as read │
   │  4. Return conversation      │
   └──────┬───────────────────────┘
          ↓
   ┌──────────────────────────────┐
   │  Database Query              │
   │  Message.find({              │
   │    reportId: ...             │
   │  }).sort({createdAt: -1})    │
   └──────────────────────────────┘


4. COUNSELOR SENDS REPLY
   ┌──────────────┐
   │  Counselor   │
   │   (App)      │
   └──────┬───────┘
          │ POST /api/cases/:caseId/messages
          ↓
   ┌──────────────────────────────┐
   │  Message Controller          │
   │  1. Verify counselor owns    │
   │  2. Verify case exists       │
   │  3. Save message to DB       │
   │  4. Generate notification   │
   └──────┬───────────────────────┘
          ↓
   ┌──────────────────────────────┐
   │  Notification Queue          │
   │  notifications.set(          │
   │    studentId,                │
   │    [notification]            │
   │  )                           │
   └──────────────────────────────┘


5. STUDENT SEES REPLY NOTIFICATION
   ┌──────────────┐
   │   Student    │
   │   (App)      │
   └──────┬───────┘
          │ GET /api/student/messages/unread
          ↓
   ┌──────────────────────────────┐
   │  Returns:                    │
   │  {                           │
   │    unreadCount: 1,           │
   │    notifications: [...]      │
   │  }                           │
   └──────────────────────────────┘


6. STUDENT VIEWS FULL CONVERSATION
   ┌──────────────┐
   │   Student    │
   │   (App)      │
   └──────┬───────┘
          │ GET /api/student/reports/:reportId/messages
          ↓
   ┌──────────────────────────────┐
   │  Message Controller          │
   │  1. Verify student owns      │
   │  2. Fetch all messages       │
   │  3. Auto-mark unread as read │
   │  4. Return conversation      │
   └──────┬───────────────────────┘
          ↓
   ┌──────────────────────────────┐
   │  Database Query              │
   │  Message.find({              │
   │    reportId: ...             │
   │  }).sort({createdAt: -1})    │
   └──────────────────────────────┘
```

---

## Key Features

### ✅ Implemented
- **Bidirectional Messaging** - Students and counselors can communicate
- **Automatic Read Status** - Messages auto-marked as read when viewed
- **Notification System** - In-memory notification queue
- **Case-Linked Messages** - All messages tied to cases for context
- **Privacy Controls** - Each party can only see their own messages
- **Audit Trail** - All messages timestamped with user attribution

### 🎯 Usage Patterns
- **Student→Counselor:** POST /student/messages → Counselor gets notification
- **Counselor→Student:** POST /cases/:caseId/messages → Student gets notification
- **Polling:** GET /[role]/messages/unread → Check for new messages

### 🔒 Security
- **JWT Authentication** - All endpoints protected
- **Authorization Checks** - Verify user owns messages/cases
- **Message Filtering** - Hide sensitive info (studentId from counselor, etc.)

---

## Database Queries Used

### Create Message
```mongodb
db.messages.insert({
  reportId: ObjectId(...),
  userId: ObjectId(...),
  counselorId: ObjectId(...),
  fromCounselor: boolean,
  content: string,
  readAt: null,
  createdAt: Date,
  updatedAt: Date
})
```

### Get Messages for Case
```mongodb
db.messages.find({
  reportId: ObjectId(...)
}).sort({createdAt: -1})
```

### Get Unread Messages
```mongodb
db.messages.find({
  userId: ObjectId(...),
  readAt: null
}).sort({createdAt: -1})
```

### Mark as Read
```mongodb
db.messages.updateMany(
  {_id: {$in: [ObjectId(...), ...]}},
  {$set: {readAt: Date}}
)
```

---

## Testing Checklist

- [ ] Student can send message to counselor
- [ ] Message is saved to database
- [ ] Counselor receives notification
- [ ] Counselor can view all case messages
- [ ] Unread messages auto-marked as read
- [ ] Counselor can send reply to student
- [ ] Student receives notification
- [ ] Student can view full conversation
- [ ] Messages display in chronological order
- [ ] Privacy controls working (can't see others' messages)
- [ ] Notifications can be cleared
- [ ] Unread count accurate

---

## Deployment Considerations

### Single Server (Development)
- ✅ In-memory notification store works fine
- Messages stored in MongoDB
- No scaling issues for small teams

### Multiple Servers (Production)
- ⚠️ In-memory store doesn't sync between servers
- **Solution:** Replace with Redis for shared notification store
- All messages still in MongoDB (persisted)

### Production Upgrade Path
1. Add Redis to your infrastructure
2. Update notification system to use Redis:
   ```typescript
   // Instead of Map, use:
   await redis.lpush(`notifications:${userId}`, JSON.stringify(notification));
   ```
3. Upgrade database indexes if needed
4. Add rate limiting and message compression

---

## Monitoring & Logging

### Current Logging
Messages are logged when:
- Notification sent: `📨 Notification sent to [user]: ...`
- Errors: `Console.error` with endpoint name

### Future Enhancements
- Message delivery tracking
- Notification delivery confirmation
- Performance monitoring (message send time)
- User activity analytics

---

## Common Integration Points

### With Frontend
1. **Notification Badge** - Use unread count to show badge
2. **Message List** - Fetch and display with read status
3. **Real-time Scroll** - New messages appear without refresh
4. **Typing Indicators** - (Future) Show when other person is typing

### With External Services
1. **Email Notifications** - (Future) Email new messages
2. **SMS Alerts** - (Future) Critical messages via SMS
3. **Slack Integration** - (Future) Notify counselors on Slack
4. **Analytics** - Track message metrics

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Messages not appearing | Check reportId links correctly to case |
| Notifications not sent | Verify counselor is assigned to case |
| Can't send message | Ensure JWT token is valid and user is authenticated |
| Read status not updating | Check markMultipleAsRead is called when viewing |
| Database errors | Verify MongoDB connection and indexes exist |

---

## Next Steps

1. **Test the API** using provided cURL examples
2. **Integrate with frontend** following the usage patterns
3. **Monitor message flow** using console logs
4. **Plan production upgrade** (Redis for scale)
5. **Add WebSocket** for real-time messaging (optional)

For detailed API documentation, see `MESSAGING_API_REFERENCE.md`
For architecture details, see `MESSAGING_FLOW.md`
