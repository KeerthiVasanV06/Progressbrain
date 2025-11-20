# Streak Storage Fix - Complete Analysis & Solutions

## Problems Identified

### **Problem 1: Database Reference Field Inconsistency**
The application had inconsistent field naming for user references across models:
- **Streak Model**: Uses `user` field (references User)
- **Study Session Model**: Was using `userId` field (references User)

This caused confusion when trying to look up and update streaks after study sessions.

### **Problem 2: Timezone Inconsistency**
Date comparisons were failing due to different timezone handling:
- **Server (streakController, endSession)**: Used `"+05:30"` timezone (Asia/Kolkata) for consistent date formatting
- **Client (updateUserStreak.js)**: Used system timezone with `moment().startOf("day")` ❌ INCORRECT

This caused date comparisons to fail when server and client had different local times.

### **Problem 3: UI Not Refreshing After Study Session**
- HomePage only loaded the streak on initial mount
- After completing a study session and returning to homepage, the streak display wasn't refreshed
- Users would see the old (0) streak value

---

## Solutions Implemented

### **Fix 1: Unified Database Field References**
Changed StudySession model to use `user` field instead of `userId`:

**File**: `server/models/studySessionModel.js`
```javascript
// Before
userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true,
}

// After
user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true,
}
```

**Updated all references in controllers**:
- `server/controllers/studySessionController.js`:
  - `startSession()`: Changed `req.body` to use `user: req.user.id`
  - `endSession()`: Changed authorization check to use `session.user`
  - `getSessions()`: Changed query to use `{ user: req.user.id }`
  - `saveReport()`: Changed authorization to use `session.user`
  - `getSession()`: Changed authorization to use `session.user`
  - `deleteSession()`: Changed authorization to use `session.user`
  - Report creation: Changed `user: session.userId` to `user: session.user`

### **Fix 2: Timezone Consistency**
Updated `client/src/utils/updateUserStreak.js` to use consistent timezone:

**Before**: Used system timezone (could differ from server)
```javascript
const today = moment().startOf("day");
const yesterday = moment().subtract(1, "day").startOf("day");
```

**After**: Uses explicit "+05:30" timezone (Asia/Kolkata) matching server
```javascript
const zone = "+05:30";
const today = moment().utcOffset(zone).format("YYYY-MM-DD");
const yesterday = moment().utcOffset(zone).subtract(1, "day").format("YYYY-MM-DD");
```

This ensures dates are compared correctly as `YYYY-MM-DD` strings.

### **Fix 3: UI Refresh on Route Return**
Updated `client/src/pages/HomePage.jsx` to refresh streak data:

**Changes**:
1. Extracted `loadStreak()` function outside of useEffect
2. Added `useLocation` hook from react-router-dom
3. Added second useEffect to reload streak when location changes:
```javascript
useEffect(() => {
  loadStreak();
}, [location]);
```

This ensures that whenever the user navigates back to the home page (after completing a study session), the streak is automatically refreshed.

---

## Complete Workflow After Fixes

### **Study Session Flow**
1. User starts a study session on StudyPage
   - Creates document with `user: req.user.id`
2. User completes session and ends it
   - `endSession` controller executes:
     - Finds streak by `Streak.findOne({ user: session.user })`
     - Updates or creates streak with correct user reference
     - Saves streak to database
3. User navigates back to HomePage
   - HomePage triggers streak refresh via `useLocation`
   - Fetches `/api/streak` endpoint
   - Displays updated streak value (no longer 0)

### **Date Comparison Logic**
- All dates use consistent "+05:30" timezone
- Dates stored as `YYYY-MM-DD` strings
- Comparisons use simple string equality
- Yesterday's date logic works correctly to continue or reset streak

---

## Files Modified

1. ✅ `server/models/studySessionModel.js`
   - Changed `userId` to `user` field
   - Updated index from `userId: 1` to `user: 1`

2. ✅ `server/controllers/studySessionController.js`
   - Updated `startSession()`: `user: req.user.id`
   - Updated `endSession()`: All `session.user` references
   - Updated `getSessions()`: `{ user: req.user.id }`
   - Updated `saveReport()`: `session.user`
   - Updated `getSession()`: `session.user`
   - Updated `deleteSession()`: `session.user`
   - Updated report creation: `user: session.user`

3. ✅ `client/src/utils/updateUserStreak.js`
   - Implemented timezone-aware date formatting
   - Changed to string-based date comparison
   - Consistent with server timezone

4. ✅ `client/src/pages/HomePage.jsx`
   - Extracted `loadStreak()` function
   - Added `useLocation` hook
   - Added refresh on route change

---

## Testing Recommendations

1. **Test streak creation on first session**:
   - Complete a study session
   - Navigate to homepage
   - Verify streak shows 1 (not 0)

2. **Test streak continuation**:
   - Complete a study session on Day 1
   - Check streak is 1
   - Complete another session on Day 2
   - Check streak is 2 (continued, not reset)

3. **Test streak reset**:
   - Complete a study session on Day 1
   - Skip Day 2
   - Complete a study session on Day 3
   - Check streak is 1 (reset, not 3)

4. **Test database persistence**:
   - Complete a session
   - Restart the server
   - Check that streak is still saved in database
   - Verify it displays on homepage

5. **Test timezone edge cases**:
   - Verify dates are consistent regardless of user's local timezone
   - Test near midnight transitions

---

## Why This Fixes the Issue

**Root Cause**: The streak was being updated in the database (via `endSession`), but:
1. The `userId` field mismatch was creating confusion in some query paths
2. Timezone differences could cause date comparisons to fail
3. The UI wasn't refreshing to show the updated data

**Solution**: 
- Unified field naming ensures consistent database queries
- Standardized timezone handling ensures correct date logic
- Added UI refresh ensures users see the updated streak value immediately
