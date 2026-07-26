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
            const response = await fetch(`${this.baseURL}/api/data`);
            const data = await response.json();
            
            // Update localStorage as backup
            localStorage.setItem('school_data_server', JSON.stringify(data));
            
            console.log('✅ Data loaded from server:', {
                students: data.students?.length || 0,
                attendance: data.attendance?.length || 0,
                busSubscriptions: data.busSubscriptions?.length || 0,
                feePayments: data.feePayments?.length || 0
            });
            
            return data;
        } catch (error) {
            console.error('❌ Failed to load from server, using localStorage backup:', error);
            
            // Fallback to localStorage
            const backup = localStorage.getItem('school_data_server');
            return backup ? JSON.parse(backup) : this.getDefaultData();
        }
    }

    // Save data to server
    async saveData(dataType, data) {
        try {
            const response = await fetch(`${this.baseURL}/api/data/${dataType}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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
            
            // Fallback to localStorage
            localStorage.setItem(`school_${dataType}`, JSON.stringify(data));
            console.log(`⚠️ ${dataType} saved to localStorage as backup`);
            return false;
        }
    }

    // Get default data if nothing exists
    getDefaultData() {
        return {
            students: [],
            attendance: [],
            busSubscriptions: [],
            feePayments: []
        };
    }

    // Start auto-sync
    startAutoSync(schoolSystem) {
        setInterval(async () => {
            try {
                const serverData = await this.loadData();
                
                // Update school system with server data
                if (serverData.students) schoolSystem.students = serverData.students;
                if (serverData.attendance) schoolSystem.attendance = serverData.attendance;
                if (serverData.busSubscriptions) schoolSystem.busSubscriptions = serverData.busSubscriptions;
                if (serverData.feePayments) schoolSystem.feePayments = serverData.feePayments;
                
                // Refresh UI
                schoolSystem.renderStudents();
                schoolSystem.renderAttendance();
                schoolSystem.renderBusSubscriptions();
                schoolSystem.renderFeePayments();
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
