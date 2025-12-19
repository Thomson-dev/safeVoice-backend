# SafeVoice Case System - Quick Reference

## Case Management Workflow

### For Students
1. **Submit Report** → Case automatically created
   ```
   POST /api/reports
   {
     "incidentType": "harassment",
     "description": "...",
     "schoolName": "..."
   }
   ```
   Response includes: `caseId`, `trackingCode`, `reportId`

2. **Check Status** → See case progress
   ```
   GET /api/reports/:trackingCode
   Returns: status, anonymousId, lastUpdated
   ```

3. **Receive Messages** → Counselor can reach out
   ```
   GET /api/student/messages
   GET /api/student/messages/unread
   ```

### For Counselors
1. **View My Cases** → Dashboard of assigned cases
   ```
   GET /api/cases/my-cases
   Returns: [ { caseId, status, riskLevel, assignedAt } ]
   ```

2. **Open Case Details** → Full incident view
   ```
   GET /api/cases/:caseId
   Returns: report (anonymousId only), messages, timeline
   ```

3. **Update Risk Level** → Assess severity
   ```
   PATCH /api/cases/:caseId/risk-level
   {
     "riskLevel": "high",
     "notes": "Immediate intervention recommended"
   }
   ```

4. **Change Status** → Move case forward
   ```
   PATCH /api/cases/:caseId/status
   { "status": "escalated" }
   ```

5. **Send Message** → Communicate with student
   ```
   POST /api/student/reports/:reportId/messages
   { "content": "..." }
   ```

### For Admin
1. **View Unassigned Cases** → Assignment queue
   ```
   GET /api/cases/unassigned
   Returns: pending cases needing counselor assignment
   ```

2. **Assign Counselor** → Distribute workload
   ```
   POST /api/cases/:caseId/assign-counselor
   { "counselorId": "..." }
   ```

3. **Monitor All Cases** → System overview
   ```
   GET /api/cases
   Returns: all cases, status distribution, counselor load
   ```

4. **Verify Counselor** → Approve new professionals
   ```
   GET /api/admin/counselors/pending
   PATCH /api/admin/counselors/:counselorId/verify
   ```

## Case Statuses Explained

| Status | Meaning | Action |
|--------|---------|--------|
| **new** | Just submitted, waiting for counselor | Assign counselor |
| **active** | Counselor assigned, working on case | Monitor progress |
| **escalated** | High/critical risk, needs extra attention | Escalate to admin/authorities |
| **closed** | Resolved and complete | Archive case |

## Risk Levels Explained

| Level | Severity | Intervention |
|-------|----------|--------------|
| **low** | Monitor only | Regular check-ins |
| **medium** | Needs attention | Weekly follow-ups |
| **high** | Requires action | Twice-weekly, consider escalation |
| **critical** | Immediate danger | Daily contact, possible police report |

## Privacy Rules

✅ **Visible to Counselor:**
- anonymousId
- incidentType
- description
- status
- messages
- trackingCode

❌ **Hidden from Counselor:**
- Student's real name
- Student's email
- Student's userId
- Student's phone/address

✅ **Visible to Student:**
- Case status
- Counselor's messages
- Report details
- Tracking code

❌ **Hidden from Student:**
- Counselor's name
- Counselor's contact info
- Counselor's ID
- Internal admin notes

## Common Endpoints

### Student
```
POST   /api/reports                          Create report (auto-creates case)
GET    /api/reports/:trackingCode            Check status by code
GET    /api/my-reports                       View all my reports
GET    /api/student/messages                 Check messages
POST   /api/student/messages                 Send message to counselor
```

### Counselor
```
GET    /api/cases/my-cases                   Dashboard
GET    /api/cases/:caseId                    Case details
PATCH  /api/cases/:caseId/risk-level         Set risk level
PATCH  /api/cases/:caseId/status             Update status
POST   /api/student/messages                 Reply to student
```

### Admin
```
GET    /api/cases                            All cases
GET    /api/cases/unassigned                 Queue of unassigned
POST   /api/cases/:caseId/assign-counselor   Assign counselor
GET    /api/admin/counselors/pending         Unverified counselors
PATCH  /api/admin/counselors/:id/verify      Approve counselor
```

## Database Quick Look

### Collections
- **Cases** - Case management (status, risk, counselor assignment)
- **Reports** - Original incident reports (linked to case)
- **Students** - Student accounts (anonymousId, encrypted)
- **Counselors** - Counselor accounts (verified flag)
- **Messages** - Communication thread (reportId linked)

### Key Indexes
- `Case.counselorId + status` - Fast dashboard queries
- `Report.caseId` - Quick case lookup from report
- `Message.reportId + createdAt` - Efficient timeline

## Testing: Step-by-Step Flow

```
1. Student registers
   POST /api/auth/register/student
   → Get anonymousId + token

2. Student submits report
   POST /api/reports
   Body: { incidentType, description }
   → Get caseId + trackingCode

3. Admin checks queue
   GET /api/cases/unassigned
   → See new case

4. Admin assigns counselor
   POST /api/cases/:caseId/assign-counselor
   Body: { counselorId }
   → Case status: new → active

5. Counselor sees case
   GET /api/cases/my-cases
   → Case appears in dashboard

6. Counselor reviews case
   GET /api/cases/:caseId
   → Sees report, messages, history

7. Counselor updates risk
   PATCH /api/cases/:caseId/risk-level
   Body: { riskLevel: "high", notes: "..." }
   → Case updated with assessment

8. Counselor responds
   POST /api/student/messages
   Body: { content: "..." }
   → Message sent to student

9. Student checks messages
   GET /api/student/messages
   → Sees counselor's response

10. Close case
    PATCH /api/cases/:caseId/status
    Body: { status: "closed" }
    → Case resolved
```

## Error Codes

| Code | Meaning |
|------|---------|
| 401 | Not authenticated - need to login |
| 403 | Not authorized - don't own this case |
| 404 | Case/Report not found |
| 400 | Invalid status/riskLevel provided |

## Key Design Decisions

1. **Auto-case creation** - Every report = every case (no manual creation)
2. **Counselor assignment** - Admin controls who works which case
3. **Status-driven** - Cases progress through clear states
4. **Risk assessment** - Counselor evaluates severity continuously
5. **Private IDs** - Students and counselors never see each other's real IDs
