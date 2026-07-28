// Data Sync Manager - Connect frontend to server storage
class DataSyncManager {
    constructor() {
        this.baseURL = window.location.origin;
        this.cache = {};
        this.syncInterval = 30000; // Sync every 30 seconds
    }

    // Load data from server
    async loadData() {
        try {
            const response = await fetch(`${this.baseURL}/api/data`, { 
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
                }
            });
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }
            const data = await response.json();
            
            console.log('✅ Data loaded from server:', {
                students: data.students?.length || 0,
                teachers: data.teachers?.length || 0,
                attendance: data.attendance?.length || 0,
                teacherAttendance: data.teacherAttendance?.length || 0,
                busSubscriptions: data.busSubscriptions?.length || 0,
                feePayments: data.feePayments?.length || 0,
                teacherSalaries: data.teacherSalaries?.length || 0
            });
            
            return data;
        } catch (error) {
            console.error('❌ Failed to load from server:', error);
            return this.getDefaultData();
        }
    }

    // Save data to server
    async saveData(dataType, data) {
        try {
            const response = await fetch(`${this.baseURL}/api/data/${dataType}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                console.log(`✅ ${dataType} saved to server`);
                return true;
            } else {
                throw new Error('Server save failed');
            }
        } catch (error) {
            console.error(`❌ Failed to save ${dataType} to server:`, error);
            return false;
        }
    }

    // Get default data if nothing exists
    getDefaultData() {
        return {
            students: [],
            teachers: [],
            attendance: [],
            teacherAttendance: [],
            busSubscriptions: [],
            feePayments: [],
            teacherSalaries: []
        };
    }

    // Start auto-sync
    startAutoSync(schoolSystem) {
        setInterval(async () => {
            try {
                const serverData = await this.loadData();
                
                // Update school system with server data
                if (serverData.students) schoolSystem.students = serverData.students;
                if (serverData.teachers) schoolSystem.teachers = serverData.teachers;
                if (serverData.attendance) schoolSystem.attendance = serverData.attendance;
                if (serverData.teacherAttendance) schoolSystem.teacherAttendance = serverData.teacherAttendance;
                if (serverData.busSubscriptions) schoolSystem.busSubscriptions = serverData.busSubscriptions;
                if (serverData.feePayments) schoolSystem.feePayments = serverData.feePayments;
                if (serverData.teacherSalaries) schoolSystem.teacherSalaries = serverData.teacherSalaries;
                
                // Refresh UI
                schoolSystem.renderStudents();
                if (schoolSystem.renderTeachers) schoolSystem.renderTeachers();
                schoolSystem.renderAttendance();
                if (schoolSystem.renderTeacherAttendance) schoolSystem.renderTeacherAttendance();
                schoolSystem.renderBusSubscriptions();
                schoolSystem.renderFeePayments();
                if (schoolSystem.renderTeacherSalaries) schoolSystem.renderTeacherSalaries();
                schoolSystem.updateDashboard();
                
                console.log('🔄 Auto-sync completed');
            } catch (error) {
                console.error('❌ Auto-sync failed:', error);
            }
        }, this.syncInterval);
    }
}

// Global instance
window.dataSync = new DataSyncManager();
