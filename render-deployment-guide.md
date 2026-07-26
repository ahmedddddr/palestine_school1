# Render Deployment - Persistent Data Solutions

## ❌ Current Problem
Your app uses file storage (`students.json`, etc.) - **Render deletes these files on every restart!**

## ✅ Solutions for Render

### Option 1: MongoDB Atlas (Recommended)
**Free tier available, perfect for production**

1. **Sign up**: https://www.mongodb.com/cloud/atlas
2. **Create free cluster**
3. **Get connection string**
4. **Add to Render environment variables**:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/school-db
   ```

5. **Update your server.js** to use MongoDB (see database-setup.js)

### Option 2: Render Disk Storage (Paid)
Render offers persistent disk storage:
- Add "Disk" in Render dashboard
- Mount to `/app/data` folder
- Update paths in your code

### Option 3: Firebase (Free)
1. Create Firebase project
2. Use Firestore database
3. Store data in cloud

### Option 4: Supabase (Free)
1. Create Supabase project  
2. Use PostgreSQL database
3. Auto-rest API included

## Quick Fix for Testing
If you just want to test on Render temporarily:

```javascript
// In your server.js, add this backup to external service
const fs = require('fs');
const https = require('https');

// Backup data to external service on save
function backupToExternal(data) {
    // Option A: GitHub Gist (free)
    // Option B: JSONBin.io (free)
    // Option C: Your own API
}

// Load from external service on startup
function loadFromExternal() {
    // Restore data if local files are empty
}
```

## Recommended Setup
```
1. Use MongoDB Atlas for production
2. Keep localStorage for offline backup
3. Auto-sync between both
4. Deploy to Render
```

This way your data persists forever, even when Render restarts your server!
