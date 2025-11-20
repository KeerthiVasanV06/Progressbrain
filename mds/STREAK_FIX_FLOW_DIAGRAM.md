# Streak Data Flow Diagram

## Before Fixes (Broken)
```
User completes study session
         ↓
StudyPage calls endSession()
         ↓
Server: endSession controller
  ├─ Creates session with userId field ❌
  ├─ Tries to update streak with Streak.findOne({ user: session.userId })
  │  ✓ This works, but field inconsistency is confusing
  ├─ Streak updates in database ✓
  └─ Returns response with streak data
         ↓
HomePage loads on initial mount
  ├─ Fetches /api/streak
  ├─ Gets streak data from DB ✓
  └─ Displays streak ✓
         ↓
User navigates back to HomePage
  └─ NO REFRESH! ❌
  └─ Still shows OLD value (0) ❌
```

## After Fixes (Working)
```
User completes study session
         ↓
StudyPage calls endSession()
         ↓
Server: endSession controller
  ├─ Creates session with user field ✓ (consistent)
  ├─ Timezone-aware date logic ✓
  │  - Uses "+05:30" consistently
  │  - Correctly formats as YYYY-MM-DD strings
  ├─ Streak updates in database ✓
  └─ Returns response with streak data ✓
         ↓
HomePage component:
  ├─ Initial load: Fetches /api/streak ✓
  ├─ Gets streak from DB ✓
  ├─ Displays updated value ✓
  └─ Sets up location listener
         ↓
User navigates back to HomePage
  ├─ useLocation triggers ✓
  ├─ loadStreak() called again ✓
  ├─ Fetches fresh /api/streak data ✓
  └─ Displays UPDATED streak value ✓
```

## Database Schema - After Fix

```
StudySession (MongoDB)
├─ _id: ObjectId
├─ user: ObjectId (refs User) ✓ Consistent naming
├─ subject: String
├─ topic: String
├─ plannedDuration: Number
├─ actualDuration: Number
├─ startTime: Date
├─ endTime: Date
├─ status: String ("active", "completed", "paused")
├─ notes: String
└─ timestamps: {createdAt, updatedAt}

Streak (MongoDB)
├─ _id: ObjectId
├─ user: ObjectId (refs User) ✓ Consistent naming
├─ lastActiveDate: String (YYYY-MM-DD)
├─ currentStreak: Number
├─ highestStreak: Number
└─ timestamps: {createdAt, updatedAt}

Report (MongoDB)
├─ _id: ObjectId
├─ user: ObjectId (refs User) ✓ Consistent
├─ sessionId: ObjectId
├─ title: String
├─ content: String
└─ ...
```

## API Endpoints - Flow

### 1. Start Session
```
POST /api/study-sessions/start
├─ Request: { subject, topic, plannedDuration }
├─ Creates: StudySession with user: req.user.id ✓
└─ Response: { session }
```

### 2. End Session (Main Fix)
```
PATCH /api/study-sessions/end
├─ Request: { sessionId, elapsedTime }
├─ Updates: StudySession with endTime, actualDuration, status
├─ Finds: Streak by { user: session.user } ✓
│  ├─ If not exists: Create with currentStreak: 1
│  ├─ If lastActiveDate !== today:
│  │  ├─ If lastActiveDate === yesterday: currentStreak++
│  │  ├─ Else: currentStreak = 1 (reset)
│  │  └─ Update highestStreak if needed
│  └─ Save streak
├─ If notes exist: Create Report with user: session.user ✓
└─ Response: { session, streak: { currentStreak, highestStreak } }
```

### 3. Get Streak
```
GET /api/streak
├─ Request: (requires auth)
├─ Finds: Streak by { user: req.user._id }
├─ Returns: { currentStreak, highestStreak, lastActiveDate }
└─ If not exists: Returns { currentStreak: 0, highestStreak: 0 }
```

### 4. HomePage Fetch
```
Initial Load + Route Change:
├─ Call: GET /api/streak
├─ Parse: res.data.streak
├─ Update: setStreak(res.data.streak)
└─ Render: Display currentStreak and highestStreak
```

## Timezone Logic - After Fix

### Server (streakController.js)
```javascript
const zone = "+05:30"; // Asia/Kolkata
const today = moment().utcOffset(zone).format("YYYY-MM-DD");
const yesterday = moment().utcOffset(zone).subtract(1, "day").format("YYYY-MM-DD");

// Example outputs:
// today = "2025-11-20"
// yesterday = "2025-11-19"

// String comparison (CORRECT)
if (streak.lastActiveDate === today) { /* update today */ }
if (streak.lastActiveDate === yesterday) { /* continue streak */ }
```

### Server (endSession - studySessionController.js)
```javascript
const zone = "+05:30"; // Same timezone
const today = moment().utcOffset(zone).startOf("day").format("YYYY-MM-DD");
const yesterday = moment().utcOffset(zone).subtract(1, "day").startOf("day").format("YYYY-MM-DD");

// Dates are in the same format as streakController
// Comparisons will be consistent ✓
```

### Client (updateUserStreak.js - Utility)
```javascript
const zone = "+05:30"; // Matches server
const today = moment().utcOffset(zone).format("YYYY-MM-DD");
const yesterday = moment().utcOffset(zone).subtract(1, "day").format("YYYY-MM-DD");

// String comparison with same format
if (lastActive === today) { /* already updated */ }
if (lastActive === yesterday) { /* continue */ }
```

## Key Improvements

| Issue | Before | After |
|-------|--------|-------|
| Field Naming | `userId` vs `user` inconsistency | Unified `user` field ✓ |
| Timezone | System-dependent, using Date objects | Explicit "+05:30", using strings ✓ |
| Date Comparison | Complex moment comparisons | Simple string equality ✓ |
| UI Refresh | Never refreshes after session | Auto-refreshes on route change ✓ |
| Database Persistence | Updated but UI never shows it | Shows updated value immediately ✓ |
| Streak Display | Always 0 | Correctly shows actual value ✓ |
