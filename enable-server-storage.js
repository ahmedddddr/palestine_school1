// Copy this code and paste in browser console when at http://localhost:8000

async function loadFromServer() {
    try {
        const response = await fetch('/api/data');
        const data = await response.json();
        
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
        alert('Data loaded from server successfully!');
    } catch (error) {
        console.error('❌ Failed to load from server:', error);
        alert('Failed to load from server - using localStorage');
    }
}

async function saveToServer() {
    if (!window.sms) return;
    
    try {
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
        alert('Data saved to server successfully!');
    } catch (error) {
        console.error('❌ Failed to save to server:', error);
        alert('Failed to save to server');
    }
}

// Load data on page load
loadFromServer();

// Auto-save every 30 seconds
setInterval(saveToServer, 30000);

// Manual save
console.log('🔧 Server storage enabled! Use saveToServer() to save manually');
console.log('📁 Data will be saved in JSON files: students.json, attendance.json, bus.json, fees.json');
