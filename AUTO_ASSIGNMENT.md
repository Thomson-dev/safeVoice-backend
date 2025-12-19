# SafeVoice Case Auto-Assignment System

## Overview

SafeVoice implements **automatic load-balanced case assignment** to ensure:
- ✅ Every case gets assigned immediately to a counselor
- ✅ Workload is evenly distributed
- ✅ No cases remain unassigned in queue
- ✅ High-risk cases are tracked separately
- ✅ Counselor availability is monitored

## How Auto-Assignment Works

### 1. Student Submits Report

```
Student submits report
    ↓
Report saved to database
    ↓
Case created (status: 'new')
    ↓
```

### 2. System Triggers Auto-Assignment

```
Get all active (verified) counselors
    ↓
Count active cases for each counselor
    ↓
Find counselor with least active cases
    ↓
Assign case to that counselor
    ↓
Case status remains 'new' (waiting for counselor to pick up)
    ↓
Case marked with assignedAt timestamp
```

**Example:**
```
Counselor A: 5 active cases
Counselor B: 3 active cases ← Will get the new case
Counselor C: 4 active cases
```

### 3. Counselor Starts Working

```
Counselor logs in
    ↓
Views assigned cases via GET /api/cases/my-cases
    ↓
Clicks on case
    ↓
Case status automatically changes to 'active'
    ↓
Counselor can now message student
```

## API Endpoints

### Auto-Assignment Flow (Internal)

No public endpoints for auto-assignment - it happens automatically:

1. **Create Report** (Student)
```bash
POST /api/reports
Authorization: Bearer <student-token>
{
  "incidentType": "physical",
  "description": "...",
  "schoolName": "..."
}
```

Response includes auto-assigned case:
```json
{
  "success": true,
  "caseId": "CASE-XXXXXXXX",
  "trackingCode": "TRACK-1234567890",
  "message": "Report submitted successfully"
}
```

2. **Get My Cases** (Counselor - sees auto-assigned cases)
```bash
GET /api/cases/my-cases
Authorization: Bearer <counselor-token>
```

Response:
```json
{
  "total": 2,
  "cases": [
    {
      "id": "case-mongodb-id",
      "caseId": "CASE-ABCD1234",
      "reportId": "...",
      "status": "new",
      "riskLevel": "medium",
      "assignedAt": "2025-12-18T10:00:00Z",
      "createdAt": "2025-12-18T10:00:00Z"
    }
  ]
}
```

3. **View Case Details**
```bash
GET /api/cases/:caseId
Authorization: Bearer <counselor-token>
```

4. **Update Case to Active**
```bash
PATCH /api/cases/:caseId/status
Authorization: Bearer <counselor-token>
{
  "status": "active"
}
```

## Assignment Algorithm

### Least-Loaded Strategy

**Goal:** Distribute work evenly across all counselors

**Logic:**
```typescript
1. Get all verified/active counselors
2. For each counselor:
   - Count non-closed cases assigned to them
3. Select counselor with minimum count
4. Assign new case to that counselor
```

**Example Distribution:**
```
Before assignment:
Counselor A: 5 cases
Counselor B: 3 cases ← Least loaded
Counselor C: 4 cases

After new case:
Counselor A: 5 cases
Counselor B: 4 cases ← Got new case
Counselor C: 4 cases
```

### Workload Monitoring

Track counselor workload:

```bash
GET /api/cases/workload/:counselorId
```

Response:
```json
{
  "counselorId": "counselor-123",
  "activeCases": 5,
  "highRiskCases": 2,
  "totalWorkload": 5,
  "isOverloaded": false
}
```

Overload threshold: **> 10 active cases**

## Database Schema

### Case Auto-Assignment Fields

```typescript
Case {
  ...
  counselorId?: string;           // Assigned counselor ID
  assignedAt?: Date;              // When counselor was assigned
  status: 'new' | 'active' | ...; // 'new' = assigned but not claimed yet
  riskLevel: string;              // Used for priority assessment
  ...
}
```

### Indexes for Performance

```typescript
// Fast lookup: get all unassigned cases
db.cases.createIndex({ counselorId: 1 })

// Fast lookup: get counselor's cases
db.cases.createIndex({ counselorId: 1, status: 1 })

// Analytics: workload by risk level
db.cases.createIndex({ counselorId: 1, riskLevel: 1, status: 1 })
```

## Code Implementation

### In caseModel.ts

```typescript
autoAssignToCounselor: async (
  caseId: string,
  counselors: Array<{ id: string; name: string }>
) => {
  // 1. Count cases for each counselor
  const counts = await Promise.all(
    counselors.map(c => countCases(c.id))
  );

  // 2. Find minimum
  const leastLoaded = counts.reduce((prev, curr) =>
    curr.count < prev.count ? curr : prev
  );

  // 3. Assign case
  await Case.updateOne(
    { _id: caseId },
    {
      counselorId: leastLoaded.counselor.id,
      assignedAt: new Date()
    }
  );
}
```

### In reportController.ts

```typescript
// After creating case:
const activeCounselors = await counselorModel.getActive();

if (activeCounselors.length > 0) {
  await caseModel.autoAssignToCounselor(
    caseDoc.id,
    activeCounselors
  );
  console.log(`✅ Case auto-assigned`);
}
```

## Scenarios

### Scenario 1: New Case Arrives

```
1. Student submits report
   └─ Report created, Case created
2. System checks for active counselors
   └─ Found: Counselor A (2), Counselor B (4), Counselor C (3)
3. Selects Counselor A (least loaded)
4. Assigns case to Counselor A
5. Counselor A sees new case in dashboard
6. Counselor A clicks case and marks as 'active'
```

### Scenario 2: All Counselors Overloaded

```
1. Student submits report
   └─ Report created, Case created
2. System checks for active counselors
   └─ All overloaded (>10 cases each)
3. Selects counselor with fewest cases
4. Logs warning: "⚠️ All counselors overloaded"
5. Case still assigned (no queue system)
6. Counselor will eventually have capacity
```

### Scenario 3: No Counselors Available

```
1. Student submits report
   └─ Report created, Case created
2. System checks for active counselors
   └─ None available (not verified or not online)
3. Case remains unassigned
4. Log warning: "⚠️ No active counselors"
5. Manual assignment can be done via API
```

## Performance Considerations

### Query Optimization

**Avoid N+1 queries:**
```javascript
// ✗ Bad: Loop and count
counselors.forEach(async c => {
  const count = await Case.count({ counselorId: c.id });
});

// ✓ Good: Parallel queries
const counts = await Promise.all(
  counselors.map(c => Case.count({ counselorId: c.id }))
);
```

### Caching Recommendation (Future)

```javascript
// Cache counselor workload for 5 minutes
const cache = new Map();

function getWorkload(counselorId) {
  const cached = cache.get(counselorId);
  if (cached && Date.now() - cached.time < 5 * 60 * 1000) {
    return cached.data;
  }
  // Fetch and cache...
}
```

## Monitoring & Analytics

### Track Assignment Success Rate

```bash
GET /api/admin/analytics/assignment
```

Response:
```json
{
  "totalCasesCreated": 100,
  "casesAssigned": 98,
  "casesUnassigned": 2,
  "assignmentSuccessRate": 98,
  "averageAssignmentTime": "0.15ms"
}
```

### Workload Distribution

```bash
GET /api/admin/analytics/workload
```

Response:
```json
{
  "counselors": [
    { "id": "...", "name": "...", "activeCases": 5, "highRiskCases": 1 },
    { "id": "...", "name": "...", "activeCases": 4, "highRiskCases": 2 }
  ],
  "average": 4.5,
  "stdDeviation": 0.5,
  "overloadedCount": 0
}
```

## Future Enhancements

### 1. Smart Assignment (ML-based)
- Assign based on counselor expertise
- Match case type to counselor specialty
- Consider counselor availability schedule

### 2. Dynamic Load Balancing
- Monitor real-time workload
- Re-balance cases if needed
- Reassign from overloaded counselors

### 3. Case Priority Queuing
- High-risk cases get priority assignment
- Critical cases assigned to senior counselors
- Queue system if all counselors overloaded

### 4. Geographic Distribution
- Assign cases by school/location
- Support multiple school networks
- Regional counselor routing

### 5. Availability Scheduling
- Counselors set working hours
- Auto-assignment respects schedules
- Handle on-call rotation

### 6. Case Handoff
- Transfer cases between counselors
- Track handoff history
- Ensure continuity of care

## Error Handling

### Assignment Failures

| Scenario | Handling |
|----------|----------|
| No counselors registered | Case stays unassigned, log warning |
| No verified counselors | Case stays unassigned, log warning |
| Database error | Report creation fails, return 500 |
| Timeout in assignment | Don't fail report, log error, try again later |

### Graceful Degradation

```typescript
try {
  await caseModel.autoAssignToCounselor(caseId, counselors);
} catch (error) {
  // Don't fail report creation
  console.error('Auto-assignment failed:', error);
  // Manual assignment can happen later
}
```

## Testing Auto-Assignment

### Unit Test

```typescript
test('should assign case to least-loaded counselor', async () => {
  const counselors = [
    { id: 'c1', name: 'A' },
    { id: 'c2', name: 'B' }
  ];
  
  // Create 5 cases for c1, 3 for c2
  await createCases('c1', 5);
  await createCases('c2', 3);
  
  // Assign new case
  const caseDoc = await caseModel.create('report-1', 'student-1');
  await caseModel.autoAssignToCounselor(caseDoc.id, counselors);
  
  // Should be assigned to c2 (least loaded)
  const assigned = await caseModel.getById(caseDoc.id);
  expect(assigned.counselorId).toBe('c2');
});
```

### Integration Test

```typescript
test('end-to-end: report → auto-assignment → counselor view', async () => {
  // 1. Register and verify counselor
  const counselor = await registerCounselor(...);
  await counselorModel.verify(counselor.id);
  
  // 2. Student submits report
  const response = await submitReport(studentToken, {
    incidentType: 'physical',
    description: 'Test'
  });
  
  // 3. Case should be auto-assigned
  expect(response.caseId).toBeDefined();
  
  // 4. Counselor should see it
  const myCases = await getCounselorCases(counselorToken);
  expect(myCases.cases.length).toBe(1);
  expect(myCases.cases[0].caseId).toBe(response.caseId);
});
```

## Configuration

### Environment Variables

```env
# Auto-assignment settings
CASE_AUTO_ASSIGN_ENABLED=true
COUNSELOR_OVERLOAD_THRESHOLD=10
ASSIGNMENT_TIMEOUT_MS=5000
```

### Example: Disable Auto-Assignment

```typescript
// In reportController.ts
if (process.env.CASE_AUTO_ASSIGN_ENABLED === 'true') {
  await autoAssignCase(...);
}
```

## Summary

- ✅ **Automatic:** Cases assigned immediately on report submission
- ✅ **Load-Balanced:** Counselors get equal workload
- ✅ **Scalable:** Works with multiple counselors
- ✅ **Resilient:** Fails gracefully if counselors unavailable
- ✅ **Transparent:** Counselors see assignments in dashboard
- ✅ **Monitored:** Track assignment success and workload

This eliminates the need for manual admin assignment while ensuring fair distribution of work.
