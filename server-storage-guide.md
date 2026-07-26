# Server Storage Setup Guide

## The Problem
Your data is currently stored in **localStorage** (browser storage), which gets lost when:
- Browser cache is cleared
- Different browser is used
- Different device is used

## The Solution
Your server already has file-based storage! You just need to connect the frontend.

## Quick Fix Steps:

### 1. Start Your Server
```bash
cd f:\seeds_palestine
node server.js
```

### 2. Access via Server URL
Go to: `http://localhost:8000` (NOT file://)

### 3. Enable Server Storage
Add this to your browser console:
```javascript
// Enable server storage
window.useServerStorage = true;

// Load data from server
async function loadFromServer() {
    try {
        const response = await fetch('/api/data');
        const data = await response.json();
        
        // Update your school system
        if (window.sms) {
            window.sms.students = data.students || [];
            window.sms.attendance = data.attendance || [];
            window.sms.busSubscriptions = data.busSubscriptions || [];
            window.sms.feePayments = data.feePayments || [];
            
            // Refresh UI
            window.sms.renderStudents();
            window.sms.renderAttendance();
            window.sms.renderBusSubscriptions();
            window.sms.renderFeePayments();
            window.sms.updateDashboard();
        }
        
        console.log('✅ Data loaded from server!');
    } catch (error) {
        console.error('❌ Failed to load from server:', error);
    }
}

// Save data to server
async function saveToServer() {
    if (!window.sms) return;
    
    try {
        // Save each data type
        await fetch('/api/data/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(window.sms.students)
        });
        
        await fetch('/api/data/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(window.sms.attendance)
        });
        
        await fetch('/api/data/bus', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(window.sms.busSubscriptions)
        });
        
        await fetch('/api/data/fees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(window.sms.feePayments)
        });
        
        console.log('✅ Data saved to server!');
    } catch (error) {
        console.error('❌ Failed to save to server:', error);
    }
}

// Load on page load
loadFromServer();

// Auto-save every 30 seconds
setInterval(saveToServer, 30000);

// Manual save button
console.log('🔧 Server storage enabled! Use saveToServer() to save manually');
```

### 4. Test It
1. Open `http://localhost:8000`
2. Paste the code above in browser console
3. Add some students/data
4. Check the JSON files in your folder
5. Restart server - data should persist!

## Files Where Data is Stored:
- `students.json` - Student data
- `attendance.json` - Attendance records  
- `bus.json` - Bus subscriptions
- `fees.json` - Fee payments

## Benefits:
✅ Data persists across server restarts
✅ Data persists across browser sessions
✅ Multiple users can access same data
✅ Automatic backups in JSON files
