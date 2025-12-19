# SafeVoice Case Management System

## Overview
Every report submitted by a student automatically creates a **Case** that counselors can manage and focus on. This system enables counselors to:
- Pick one case at a time and focus entirely on it
- Avoid missing messages or updates
- Track risk levels and escalation status
- Update case status as they work through incidents

## Case Lifecycle

### Case Statuses
1. **new** - Report just submitted, awaiting counselor assignment
2. **active** - Counselor assigned and actively working on case
3. **escalated** - Case requires additional intervention (high/critical risk)
4. **closed** - Case resolved and no further action needed

### Risk Levels
- **low** - Monitor situation
- **medium** - Regular check-ins needed
- **high** - Needs close attention and frequent follow-ups
- **critical** - Immediate intervention required, possible escalation to authorities

## Case Structure

```typescript
Case {
  id: string;                    // MongoDB _id
  caseId: string;               // CASE-XXXXXXXX (unique identifier)
  reportId: string;             // Links to Report
  studentId: string;            // Links to Student (hidden from counselor responses)
  counselorId?: string;         // Links to Counselor (hidden from student responses)
  status: 'new' | 'active' | 'escalated' | 'closed';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  notes: string;                // Counselor notes/observations
  assignedAt?: Date;            // When counselor was assigned
  closedAt?: Date;              // When case was closed
  createdAt: Date;              // Report submission time
  updatedAt: Date;              // Last update time
}
```

## API Endpoints

### Counselor Case Management
```
GET /api/cases/my-cases
  - Returns all cases assigned to logged-in counselor
  - Filters: only active cases (excludes closed)
  - Response: [ { caseId, reportId, status, riskLevel, ... } ]

GET /api/cases/:caseId
  - Get full case details with report and message preview
  - Verifies counselor owns the case
  - Returns: case, report (anonymousId only), message count, last message

PATCH /api/cases/:caseId/status
  - Update case status: new → active → escalated → closed
  - Body: { status: 'escalated' | 'active' | 'closed' }
  - Admin and assigned counselor can update

PATCH /api/cases/:caseId/risk-level
  - Update risk assessment and add notes
  - Body: { riskLevel: 'low' | 'medium' | 'high' | 'critical', notes?: string }
```

### Admin Case Management
```
GET /api/cases
  - Get all cases across system
  - Shows counselor assignments and status distribution

GET /api/cases/unassigned
  - Get list of cases waiting for counselor assignment
  - Used by admin to identify bottlenecks
  - Shows: caseId, status, riskLevel, createdAt

POST /api/cases/:caseId/assign-counselor
  - Assign counselor to unassigned case
  - Body: { counselorId: "mongoose-id" }
  - Sets status to 'active' and assignedAt timestamp
```

## Key Features

### Privacy Protection
- **Student Identity Hidden**: Counselors see anonymousId, never the real userId
- **Counselor Hidden from Student**: When viewing their own case, students don't see which counselor is assigned
- All responses filtered by role to ensure proper visibility

### Case Workflow Example

1. **Student Submits Report**
   ```
   POST /api/reports
   - Student provides incident details
   - System auto-creates Case with status='new'
   - Case awaits counselor assignment
   ```

2. **Admin Reviews Unassigned Cases**
   ```
   GET /api/cases/unassigned
   - Admin sees list of new cases
   - Can assess priority and workload
   ```

3. **Admin Assigns Counselor**
   ```
   POST /api/cases/:caseId/assign-counselor
   - Case status changes to 'active'
   - Counselor is now responsible for case
   ```

4. **Counselor Picks Up Case**
   ```
   GET /api/cases/my-cases
   - Counselor sees their assigned cases
   - Can pick which case to focus on
   ```

5. **Counselor Reviews Case Details**
   ```
   GET /api/cases/:caseId
   - Sees report with anonymous details
   - Views all messages/conversation history
   - Can assess severity and set risk level
   ```

6. **Counselor Responds & Updates**
   ```
   POST /api/cases/:caseId/messages
   - Send message to student (encrypted)
   - Student can respond without revealing identity
   
   PATCH /api/cases/:caseId/risk-level
   - Update severity assessment
   - Add notes about intervention
   ```

7. **Case Resolution**
   ```
   PATCH /api/cases/:caseId/status
   - Change status to 'closed' when resolved
   - System archives case and sends closure confirmation
   ```

## Database Schema

### CaseSchema (Mongoose)
```typescript
{
  caseId: { type: String, unique: true, index: true },
  reportId: { type: ObjectId, ref: 'Report', unique: true, index: true },
  studentId: { type: ObjectId, ref: 'Student', index: true },
  counselorId: { type: ObjectId, ref: 'Counselor', default: null, index: true },
  status: { enum: ['new', 'active', 'escalated', 'closed'], default: 'new', index: true },
  riskLevel: { enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
  notes: { type: String, default: '' },
  assignedAt: { type: Date, default: null },
  closedAt: { type: Date, default: null },
  timestamps: true
}

// Compound indexes for performance
index: { counselorId: 1, status: 1 }
index: { counselorId: 1, status: 1 }
```

### ReportSchema Updates
```typescript
caseId: { type: ObjectId, ref: 'Case', default: null, index: true }
// Links report to its case for easy access
```

## Implementation Details

### Model: caseDb.ts
Provides MongoDB operations:
- `create(reportId, studentId)` - Creates new case
- `getById(id)` - Fetch case by MongoDB ID
- `getByCaseId(caseId)` - Fetch by CASE-XXXXX identifier
- `getByReportId(reportId)` - Find case for a report
- `getUnassigned()` - Get cases without counselor
- `getByCounselorId(counselorId)` - Get counselor's cases
- `assignCounselor(caseId, counselorId)` - Assign and activate
- `updateStatus(caseId, status)` - Change case status
- `updateRiskLevel(caseId, riskLevel, notes)` - Set severity

### Controller: caseController.ts
Handles HTTP requests:
- `getMyCases()` - Counselor's dashboard
- `getCaseDetails()` - Full case view
- `getUnassignedCases()` - Admin queue
- `assignCounselor()` - Admin assignment
- `updateCaseStatus()` - Status transitions
- `updateRiskLevel()` - Risk assessment
- `getAllCases()` - System overview

### Routes: caseRoutes.ts
```
GET    /my-cases                      - Counselor sees their cases
GET    /:caseId                       - Case details view
PATCH  /:caseId/status                - Update status
PATCH  /:caseId/risk-level            - Set risk level
GET    /unassigned                    - Admin unassigned queue
POST   /:caseId/assign-counselor      - Admin assigns counselor
GET    /                              - Admin all cases view
```

## Integration with Existing Systems

### Report Submission Flow
When student submits report:
```
reportController.createReport()
  → reportModel.create()
  → caseModel.create()
  → reportModel.linkCase()
```

### Message System
Messages are linked to cases through reportId:
```
Message {
  reportId: ObjectId,     // Links to Report
  userId: ObjectId,       // Student ID
  counselorId: ObjectId,  // Counselor ID
  fromCounselor: boolean,
  content: string,
  readAt?: Date
}
```

Counselor sees all messages for their assigned cases through case's reportId.

### Authentication
All case endpoints require JWT authentication:
- Counselors can only see their assigned cases
- Admins can see all cases and make assignments
- Request middleware verifies role and ownership

## Security Measures

1. **ID Obfuscation**
   - StudentId never sent to frontend
   - CounselorId hidden from student responses
   - Only anonymousId shared with counselors

2. **Access Control**
   - Counselors locked to their assigned cases
   - Students see only their own report status (via trackingCode)
   - Admins have full visibility

3. **Data Linking**
   - Report always links back to its case
   - Case verifies report ownership before allowing access
   - Message history immutable and time-stamped

## Performance Optimizations

1. **Indexes**
   - `counselorId + status` for fast dashboard queries
   - `studentId` for case retrieval
   - `status` for filtering new/active cases

2. **Compound Queries**
   - Efficient filtering: `{ counselorId: X, status: ['active', 'escalated'] }`
   - Sorting by updatedAt for relevance

## Future Enhancements

1. **Automated Escalation**
   - Auto-escalate to admin if no response after X days
   - Auto-escalate high/critical risk to supervisors

2. **Notifications**
   - Send counselor notification when case assigned
   - Alert student when message received

3. **Reporting**
   - Cases resolved within X days
   - Risk distribution across counselors
   - Response time analytics

4. **Workload Management**
   - Limit cases per counselor
   - Load balancing for assignment
   - Performance metrics per counselor

## Testing the Case System

### Scenario 1: Complete Case Workflow
```
1. Student: POST /api/reports (submits incident)
   → Receives: trackingCode, reportId, caseId

2. Admin: GET /api/cases/unassigned
   → Sees new case in queue

3. Admin: POST /api/cases/:caseId/assign-counselor
   → Assigns counselor, status → 'active'

4. Counselor: GET /api/cases/my-cases
   → Sees assigned case in dashboard

5. Counselor: GET /api/cases/:caseId
   → Views full case with report details

6. Counselor: PATCH /api/cases/:caseId/risk-level
   → Sets risk level to 'high'

7. Counselor: PATCH /api/cases/:caseId/status
   → Changes to 'escalated' for higher review

8. Admin: PATCH /api/cases/:caseId/status
   → Closes case after resolution
```

### Scenario 2: Privacy Verification
```
1. Student views report: GET /api/reports/:id
   → Only sees anonymousId, never counselorId

2. Counselor views case: GET /api/cases/:caseId
   → Only sees anonymousId, never userId

3. Student checks public: GET /api/reports/:trackingCode
   → Only gets status, createdAt, no personal data
```
