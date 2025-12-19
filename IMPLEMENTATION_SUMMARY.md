# SafeVoice Backend - Implementation Summary

## ✅ COMPLETED: Full Case Management System

### What Was Built
A complete case management system that automatically creates and manages cases for every student report, enabling counselors to focus on individual cases while maintaining complete privacy.

---

## System Architecture

```
Student Submits Report
    ↓
Case Auto-Created (status: 'new')
    ↓
Admin Reviews Queue
    ↓
Admin Assigns Counselor
    ↓
Case Status: 'new' → 'active'
    ↓
Counselor Picks Up Case
    ↓
Counselor Assesses Risk Level
    ↓
Counselor Communicates with Student
    ↓
Case Status: 'active' → 'escalated' (if needed) → 'closed'
```

---

## Files Created/Modified

### New Model Files
- ✅ `src/models/caseDb.ts` - Full CRUD operations for cases
- ✅ `src/models/reportDb.ts` - Report storage with case linking
- ✅ `src/models/studentDb.ts` - Student account management
- ✅ `src/models/messageDb.ts` - Message system for communication
- ✅ `src/models/contactDb.ts` - Trusted contacts management
- ✅ `src/models/resourceDb.ts` - Help resources database

### New Schema Files
- ✅ `src/models/schemas/CaseSchema.ts` - MongoDB case schema
- ✅ `src/models/schemas/ReportSchema.ts` - Report schema with case linking
- ✅ `src/models/schemas/MessageSchema.ts` - Message schema
- ✅ `src/models/schemas/StudentSchema.ts` - Student schema (updated)
- ✅ `src/models/schemas/CounselorSchema.ts` - Counselor schema (updated)
- ✅ `src/models/schemas/TrustedContactSchema.ts` - Contact schema
- ✅ `src/models/schemas/ResourceSchema.ts` - Resource schema

### New Controller Files
- ✅ `src/controllers/caseController.ts` - Case management endpoints
- ✅ Updated `src/controllers/reportController.ts` - Auto-case creation

### New Route Files
- ✅ `src/routes/caseRoutes.ts` - All case endpoints

### Configuration & Types
- ✅ `src/types/index.ts` - Added CaseStatus, RiskLevel enums
- ✅ `src/index.ts` - Mounted case routes

### Documentation
- ✅ `CASE_SYSTEM.md` - Complete technical documentation
- ✅ `CASE_QUICK_REFERENCE.md` - Quick API reference

---

## Key Features Implemented

### 1. Automatic Case Creation
When a student submits a report:
```typescript
reportModel.create() 
  → caseModel.create() 
  → reportModel.linkCase()
```
- Case immediately created with status: 'new'
- caseId generated (CASE-XXXXXXXX)
- Awaits admin counselor assignment

### 2. Counselor Assignment
Admin assigns counselor to case:
```
POST /api/cases/:caseId/assign-counselor
{ "counselorId": "..." }
```
- Case status automatically becomes 'active'
- Counselor can now see case in dashboard
- Timestamps recorded

### 3. Counselor Dashboard
Counselors view their workload:
```
GET /api/cases/my-cases
```
- Shows all assigned active cases
- Excludes closed cases
- Sorted by most recently updated
- Allows counselor to pick one case to focus on

### 4. Case Details & Isolation
Counselor opens a specific case:
```
GET /api/cases/:caseId
```
- Full report details (incidentType, description, evidence)
- Message history (complete conversation)
- Risk level and status
- **Privacy**: Only anonymousId shown, never real identity

### 5. Risk Assessment
Counselor evaluates severity:
```
PATCH /api/cases/:caseId/risk-level
{
  "riskLevel": "high",
  "notes": "Shows signs of escalating threat"
}
```
- Helps prioritize interventions
- Tracked for audit trail
- Can trigger automated escalations (future feature)

### 6. Status Management
Cases progress through workflow:
```
PATCH /api/cases/:caseId/status
{ "status": "escalated" }
```
- new → active (auto on assignment)
- active → escalated (manual, when severity increases)
- escalated → closed (when resolved)
- Timestamps automatically recorded

### 7. Admin Oversight
Admin can:
- View all cases across system: `GET /api/cases`
- See unassigned queue: `GET /api/cases/unassigned`
- Monitor workload distribution
- Make counselor assignments
- Verify new counselors

### 8. Complete Privacy
- Students never see counselor identity
- Counselors never see student real name/email
- All communication through anonymousId
- Message content encrypted (ready for implementation)

---

## Database Design

### Case Collection
```
{
  _id: ObjectId,
  caseId: "CASE-A1B2C3D4",
  reportId: ObjectId,
  studentId: ObjectId,
  counselorId: ObjectId,
  status: "active",
  riskLevel: "high",
  notes: "Escalation recommended",
  assignedAt: Date,
  closedAt: null,
  createdAt: Date,
  updatedAt: Date
}
```

### Key Indexes
```typescript
// Fast dashboard queries
{ counselorId: 1, status: 1 }

// Quick case lookup from report
{ reportId: 1 }

// Case discovery by status
{ status: 1 }
```

---

## API Endpoints

### Student Endpoints
```
POST   /api/reports                        Submit report (auto-creates case)
GET    /api/reports/:trackingCode          Check case status anonymously
GET    /api/my-reports                     View all my reports
GET    /api/student/messages               Receive counselor messages
POST   /api/student/messages               Send message to counselor
```

### Counselor Endpoints
```
GET    /api/cases/my-cases                 View assigned cases (dashboard)
GET    /api/cases/:caseId                  Open specific case for detailed view
PATCH  /api/cases/:caseId/risk-level       Update severity assessment
PATCH  /api/cases/:caseId/status           Progress case through workflow
POST   /api/student/messages               Send message to student
```

### Admin Endpoints
```
GET    /api/cases                          View all cases in system
GET    /api/cases/unassigned               View cases needing assignment
POST   /api/cases/:caseId/assign-counselor Assign counselor to case
GET    /api/admin/counselors/pending       View unverified counselors
PATCH  /api/admin/counselors/:id/verify    Approve new counselor
PATCH  /api/admin/reports/:id              Update report status
```

---

## Privacy Controls

### What Each Role Sees

**Student Views:**
- ✅ Their own report details
- ✅ Messages from counselor
- ✅ Case status updates
- ❌ Counselor identity
- ❌ Case notes
- ❌ Risk assessment

**Counselor Views:**
- ✅ Assigned case details
- ✅ Student's incident report
- ✅ Full message history
- ✅ Can update risk and status
- ❌ Student's real name/email
- ❌ Student's contact info
- ❌ Student's userId

**Admin Views:**
- ✅ All cases
- ✅ All reports
- ✅ All assignments
- ✅ Counselor workload
- ✅ Can assign and verify
- ✅ Complete audit trail

---

## Security Features

1. **ID Obfuscation**
   - Real studentId never exposed
   - Only anonymousId shared with counselors
   - counselorId hidden from students

2. **Access Control**
   - Counselors locked to their assigned cases (ownership check)
   - Students can only view their own reports
   - Admin has full visibility

3. **Audit Trail**
   - createdAt/updatedAt timestamps on all cases
   - assignedAt timestamp for case assignment
   - closedAt timestamp for resolution
   - Who did what tracked via JWT userId

4. **Data Validation**
   - Status must be one of: new, active, escalated, closed
   - RiskLevel must be: low, medium, high, critical
   - Ownership verified before allowing updates

---

## Integration Points

### Report System
When student submits report via `reportController.createReport()`:
1. Report created in database
2. Case automatically created via `caseModel.create()`
3. Case linked to report via `reportModel.linkCase()`
4. Response includes caseId for student reference

### Message System
- Messages linked via reportId
- Counselors access via case → report → messages
- Students access via trackingCode → report → messages
- Complete conversation history preserved

### Authentication
- JWT token includes userId and role
- Role determines which endpoints accessible
- Ownership checks prevent unauthorized access

---

## Testing Workflow

### Scenario 1: Happy Path (Full Case Lifecycle)
```
1. Student registers: POST /api/auth/register/student
2. Student submits report: POST /api/reports
   Response: { caseId: "CASE-A1B2C3D4", trackingCode: "TRACK-1234" }
3. Admin checks queue: GET /api/cases/unassigned
   Response: [ { caseId: "CASE-A1B2C3D4", status: "new", riskLevel: "low" } ]
4. Admin assigns: POST /api/cases/CASE-A1B2C3D4/assign-counselor
   Body: { counselorId: "..." }
5. Counselor sees case: GET /api/cases/my-cases
   Response: [ { caseId: "CASE-A1B2C3D4", status: "active" } ]
6. Counselor opens case: GET /api/cases/CASE-A1B2C3D4
   Response: { case: {...}, report: {anonymousId: "ANON-00001"}, messages: [...] }
7. Counselor assesses: PATCH /api/cases/CASE-A1B2C3D4/risk-level
   Body: { riskLevel: "high", notes: "Needs escalation" }
8. Counselor messages: POST /api/student/messages
   Body: { content: "We're here to help..." }
9. Student receives: GET /api/student/messages
10. Close case: PATCH /api/cases/CASE-A1B2C3D4/status
    Body: { status: "closed" }
```

### Scenario 2: Privacy Verification
```
1. Student sees report: GET /api/my-reports
   → Only anonymousId and trackingCode shown
   
2. Counselor sees case: GET /api/cases/:caseId
   → Report shows anonymousId, NO userId or email
   
3. Public status check: GET /api/reports/:trackingCode
   → Only status and anonymousId, nothing else
```

---

## Deployment Checklist

- ✅ All schemas created and indexed
- ✅ All models with CRUD operations
- ✅ All controllers with endpoints
- ✅ All routes mounted in index.ts
- ✅ Type definitions added
- ✅ Privacy controls implemented
- ✅ Access checks in place
- ⏳ Environment variables configured
- ⏳ MongoDB connection tested
- ⏳ API endpoints tested
- ⏳ JWT authentication verified
- ⏳ Role-based access control tested

---

## Next Steps (Optional Enhancements)

1. **Notification System**
   - Email when counselor assigned
   - SMS/push when message received
   - Daily digest of case updates

2. **Escalation Rules**
   - Auto-escalate after X days without response
   - Auto-escalate critical risk cases to admin

3. **Analytics Dashboard**
   - Cases resolved per counselor
   - Average response time
   - Risk level distribution
   - Workload balancing

4. **Advanced Features**
   - Case templates for common scenarios
   - Automated responses for specific keywords
   - Integration with emergency services
   - Bulk case assignment

5. **Performance**
   - Add caching for frequently accessed cases
   - Implement pagination for large datasets
   - Add search/filter capabilities

---

## Summary

**SafeVoice Case Management System is now fully implemented** with:
- ✅ Automatic case creation on report submission
- ✅ Admin-controlled counselor assignment
- ✅ Counselor dashboard for workload management
- ✅ Complete privacy protection (student ↔ counselor)
- ✅ Risk assessment and status tracking
- ✅ Integrated messaging system
- ✅ Comprehensive audit trail
- ✅ Scalable database design with proper indexing

The system is ready for:
1. Database initialization (MongoDB)
2. Environment configuration (.env setup)
3. Local testing with test client
4. Deployment to production environment
