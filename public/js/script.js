// Palestinian School Management System JavaScript

// INDEPENDENT ROUTE SYSTEM - Separate from main data
class RouteManager {
    constructor() {
        this.routes = [];
        this.loadRoutes();
    }
    
    loadRoutes() {
        try {
            // Try multiple storage methods
            const localStorageRoutes = localStorage.getItem('INDEPENDENT_ROUTES');
            const sessionStorageRoutes = sessionStorage.getItem('INDEPENDENT_ROUTES');
            
            if (localStorageRoutes) {
                this.routes = JSON.parse(localStorageRoutes);
                console.log('Loaded routes from localStorage:', this.routes.length);
            } else if (sessionStorageRoutes) {
                this.routes = JSON.parse(sessionStorageRoutes);
                console.log('Loaded routes from sessionStorage:', this.routes.length);
            } else {
                // Default routes
                this.routes = [
                    { id: 1, name: 'Route 1: North Area', area: 'North Area' },
                    { id: 2, name: 'Route 2: South Area', area: 'South Area' },
                    { id: 3, name: 'Route 3: East Area', area: 'East Area' },
                    { id: 4, name: 'Route 4: West Area', area: 'West Area' },
                    { id: 5, name: 'Route 5: City Center', area: 'City Center' },
                    { id: 6, name: 'Route 6: Industrial Zone', area: 'Industrial Zone' },
                    { id: 7, name: 'Route 7: Residential Area', area: 'Residential Area' },
                    { id: 8, name: 'Route 8: School District', area: 'School District' }
                ];
                console.log('Using default routes:', this.routes.length);
                this.saveRoutes(); // Save defaults immediately
            }
        } catch (error) {
            console.error('Error loading routes:', error);
            this.routes = [];
        }
    }
    
    saveRoutes() {
        try {
            const routesJson = JSON.stringify(this.routes);
            localStorage.setItem('INDEPENDENT_ROUTES', routesJson);
            sessionStorage.setItem('INDEPENDENT_ROUTES', routesJson);
            console.log('Routes saved to both localStorage and sessionStorage');
        } catch (error) {
            console.error('Error saving routes:', error);
        }
    }
    
    addRoute(routeName, routeArea) {
        const newRoute = {
            id: this.getNextId(),
            name: routeName,
            area: routeArea
        };
        this.routes.push(newRoute);
        this.saveRoutes();
        console.log('Route added:', newRoute);
        return newRoute;
    }
    
    updateRoute(routeId, routeName, routeArea) {
        const routeIndex = this.routes.findIndex(r => r.id === routeId);
        if (routeIndex !== -1) {
            this.routes[routeIndex] = {
                id: routeId,
                name: routeName,
                area: routeArea
            };
            this.saveRoutes();
            console.log('Route updated:', this.routes[routeIndex]);
            return true;
        }
        return false;
    }
    
    deleteRoute(routeId) {
        console.log('RouteManager.deleteRoute called with ID:', routeId);
        console.log('Current routes in RouteManager:', this.routes);
        
        const routeIndex = this.routes.findIndex(r => r.id === routeId);
        console.log('Found route index:', routeIndex);
        
        if (routeIndex !== -1) {
            const deletedRoute = this.routes.splice(routeIndex, 1)[0];
            console.log('Route spliced from array:', deletedRoute);
            
            this.saveRoutes();
            console.log('Routes saved after deletion:', this.routes);
            
            return deletedRoute;
        }
        
        console.log('Route not found with ID:', routeId);
        return null;
    }
    
    getNextId() {
        if (this.routes.length === 0) {
            return 1;
        }
        return Math.max(...this.routes.map(r => r.id)) + 1;
    }
    
    getRoutes() {
        return [...this.routes]; // Return copy
    }
}

// Global route manager instance
let routeManager = null;

class SchoolManagementSystem {
    constructor() {
        console.log('=== CONSTRUCTOR START ===');
        this.students = [];
        this.teachers = [];
        this.teacherAttendance = [];
        this.teacherSalaries = [];
        this.attendance = [];
        this.busSubscriptions = [];
        this.feePayments = [];
        this.feeValidityDays = 30;
        this.currentEditingStudent = null;
        this.currentPage = 1;
        
        // Initialize independent route manager
        if (!routeManager) {
            routeManager = new RouteManager();
            console.log('Route manager initialized');
        }
        
        // Connect to route manager
        this.busRoutes = routeManager.getRoutes();
        console.log('Connected to route manager, routes:', this.busRoutes.length);
        
        this.itemsPerPage = 10;
        this.selectedStudents = new Set();
        this.attendanceView = 'grid'; // 'grid' or 'table'
        
        // Mark imported students to protect them
        this.importedStudentIds = new Set();
        
        console.log('About to call init()...');
        this.init();
        console.log('=== CONSTRUCTOR END ===');
    }

    // Auto-save functionality
    setupAutoSave() {
        // Save data every 30 seconds
        setInterval(() => {
            this.saveDataToStorage();
            console.log('Auto-saved data at', new Date().toLocaleTimeString());
        }, 30000);
        
        // Save data before page unload
        window.addEventListener('beforeunload', (e) => {
            this.saveDataToStorage();
            console.log('Data saved before page unload');
        });
        
        // Save data when page becomes hidden (user switches tabs)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveDataToStorage();
                console.log('Data saved when page became hidden');
            }
        });
    }

    init() {
        console.log('=== INIT START ===');
        console.log('Before loadDataFromStorage, busRoutes:', this.busRoutes);
        console.log('Before loadDataFromStorage, busRoutes length:', this.busRoutes.length);
        
        this.loadDataFromStorage();
        
        console.log('After loadDataFromStorage, busRoutes:', this.busRoutes);
        console.log('After loadDataFromStorage, busRoutes length:', this.busRoutes.length);
        
        this.validateAndCleanData(); // Add data validation
        this.setupEventListeners();
        this.setupFeeSystem();
        if (typeof this.setupRouteSystem === 'function') {
            this.setupRouteSystem();
        }
        this.setupAutoSave(); // Add auto-save functionality
        this.updateDashboard();
        this.renderStudents();
        this.renderBusSubscriptions();
        if (typeof this.renderFeePayments === 'function') {
            this.renderFeePayments();
        }
        this.setTodayDate();
        
        console.log('=== INIT END ===');
        console.log('Final busRoutes in init:', this.busRoutes);
        console.log('Final busRoutes length in init:', this.busRoutes.length);
    }

    getNextStudentId() {
        if (this.students.length === 0) {
            return 1;
        }
        // Find the highest existing ID and add 1
        const maxId = Math.max(...this.students.map(student => student.id));
        return maxId + 1;
    }

    getNextAttendanceId() {
        if (this.attendance.length === 0) {
            return 1;
        }
        // Find the highest existing ID and add 1 (convert to numbers for comparison)
        const maxId = Math.max(...this.attendance.map(record => Number(record.id) || 0));
        return maxId + 1;
    }

    getNextBusId() {
        if (this.busSubscriptions.length === 0) {
            return 1;
        }
        // Find the highest existing ID and add 1
        const maxId = Math.max(...this.busSubscriptions.map(sub => sub.id));
        return maxId + 1;
    }

    getNextFeeId() {
        if (this.feePayments.length === 0) {
            return 1;
        }
        // Find the highest existing ID and add 1
        const maxId = Math.max(...this.feePayments.map(payment => payment.id));
        return maxId + 1;
    }

    getStudentFeeStatus(studentId) {
        const now = new Date();
        const payments = Array.isArray(this.feePayments) ? this.feePayments : [];
        const validityDays = Number(this.feeValidityDays) || 30;
        
        const studentPayments = payments
            .filter(p => String(p.studentId) === String(studentId) && p.status === 'paid' && p.paymentDate)
            .map(p => ({
                ...p,
                _paymentTime: new Date(p.paymentDate).getTime()
            }))
            .filter(p => !Number.isNaN(p._paymentTime))
            .sort((a, b) => b._paymentTime - a._paymentTime);

        const latest = studentPayments[0];
        if (!latest) {
            return {
                status: 'unpaid',
                amount: 0,
                date: null
            };
        }

        const daysSincePayment = (now.getTime() - latest._paymentTime) / (1000 * 60 * 60 * 24);
        if (daysSincePayment <= validityDays) {
            return {
                status: 'paid',
                amount: latest.total,
                date: latest.paymentDate
            };
        }

        return {
            status: 'unpaid',
            amount: 0,
            date: latest.paymentDate
        };
    }

    // Enhanced Data Persistence with Better Organization
    saveDataToStorage() {
        console.log('=== SAVE DATA TO STORAGE START ===');
        console.log('Saving data to localStorage...', {
            students: this.students.length,
            attendance: this.attendance.length,
            bus: this.busSubscriptions.length,
            fees: this.feePayments.length
        });
        
        try {
            // Test localStorage first
            console.log('Testing localStorage...');
            localStorage.setItem('test', 'working');
            const testResult = localStorage.getItem('test');
            console.log('localStorage test result:', testResult);
            localStorage.removeItem('test');
            
            if (testResult !== 'working') {
                console.error('localStorage is not working!');
                return;
            }
            
            // Create comprehensive data object with metadata
            const dataToSave = {
                version: '1.0',
                lastSaved: new Date().toISOString(),
                data: {
                    students: this.students,
                    attendance: this.attendance,
                    busSubscriptions: this.busSubscriptions,
                    busRoutes: this.busRoutes,
                    feePayments: this.feePayments
                },
                metadata: {
                    totalStudents: this.students.length,
                    totalAttendance: this.attendance.length,
                    totalBusSubscriptions: this.busSubscriptions.length,
                    totalBusRoutes: this.busRoutes.length,
                    totalFeePayments: this.feePayments.length
                }
            };
            
            // Save individual arrays for backward compatibility
            console.log('Saving individual arrays...');
            console.log('About to save routes:', this.busRoutes);
            console.log('Routes type:', typeof this.busRoutes);
            console.log('Routes length:', this.busRoutes.length);
            
            localStorage.setItem('school_students', JSON.stringify(this.students));
            localStorage.setItem('school_attendance', JSON.stringify(this.attendance));
            localStorage.setItem('school_bus', JSON.stringify(this.busSubscriptions));
            localStorage.setItem('school_bus_routes', JSON.stringify(this.busRoutes));
            
            // Immediately verify routes save
            const savedRoutes = localStorage.getItem('school_bus_routes');
            console.log('Routes immediately after save:', savedRoutes);
            
            localStorage.setItem('school_fees', JSON.stringify(this.feePayments));
            
            // Temporarily disable backup to test route saving
            console.log('Backup system temporarily disabled for testing');
            
            // Save main data with timestamp
            console.log('Saving main data object...');
            localStorage.setItem('school_data_main', JSON.stringify(dataToSave));
            
            // Verify save worked
            console.log('Verifying save...');
            const savedData = localStorage.getItem('school_data_main');
            const parsedData = JSON.parse(savedData);
            console.log('Verification - saved data counts:', {
                students: parsedData.data.students.length,
                attendance: parsedData.data.attendance.length,
                bus: parsedData.data.busSubscriptions.length,
                fees: parsedData.data.feePayments.length
            });
            
            console.log('Data saved successfully to localStorage');
            console.log('=== SAVE DATA TO STORAGE COMPLETE ===');
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            this.restoreFromBackup();
        }
    }

    // Data Validation and Cleanup
    validateAndCleanData() {
        console.log('=== DATA VALIDATION AND CLEANUP START ===');
        
        let cleaned = false;
        
        // Validate and clean students data
        this.students = this.students.filter(student => {
            if (!student || !student.id || !student.name) {
                console.log('Removing invalid student:', student);
                cleaned = true;
                return false;
            }
            
            // Ensure all required fields exist
            if (!student.class) student.class = 'Not Assigned';
            if (!student.phone) student.phone = 'Not Provided';
            if (typeof student.busSubscriber !== 'boolean') student.busSubscriber = false;
            
            return true;
        });
        
        // Remove duplicate students (same name and class)
        const uniqueStudents = [];
        const seenStudents = new Set();
        
        for (const student of this.students) {
            const key = `${student.name.toLowerCase()}-${student.class}`;
            if (!seenStudents.has(key)) {
                seenStudents.add(key);
                uniqueStudents.push(student);
            } else {
                console.log('Removing duplicate student:', student.name, student.class);
                cleaned = true;
            }
        }
        
        if (cleaned) {
            this.students = uniqueStudents;
        }
        
        // Validate and clean attendance data
        this.attendance = this.attendance.filter(record => {
            if (!record || !record.id || !record.studentId || !record.date) {
                console.log('Removing invalid attendance record:', record);
                cleaned = true;
                return false;
            }
            
            // Ensure student exists
            const studentExists = this.students.some(s => String(s.id) === String(record.studentId));
            if (!studentExists) {
                console.log('Removing attendance for non-existent student:', record.studentId);
                cleaned = true;
                return false;
            }
            
            // Ensure valid status
            if (!['present', 'absent', 'late'].includes(record.status)) {
                record.status = 'present';
                cleaned = true;
            }
            
            return true;
        });
        
        // Validate and clean bus subscriptions
        this.busSubscriptions = this.busSubscriptions.filter(sub => {
            if (!sub || !sub.id || !sub.studentId) {
                console.log('Removing invalid bus subscription:', sub);
                cleaned = true;
                return false;
            }
            
            // Ensure student exists
            const studentExists = this.students.some(s => String(s.id) === String(sub.studentId));
            if (!studentExists) {
                console.log('Removing bus subscription for non-existent student:', sub.studentId);
                cleaned = true;
                return false;
            }
            
            return true;
        });
        
        // Validate and clean fee payments
        this.feePayments = this.feePayments.filter(payment => {
            if (!payment || !payment.id || !payment.studentId) {
                console.log('Removing invalid fee payment:', payment);
                cleaned = true;
                return false;
            }
            
            // Ensure student exists
            const studentExists = this.students.some(s => String(s.id) === String(payment.studentId));
            if (!studentExists) {
                console.log('Removing fee payment for non-existent student:', payment.studentId);
                cleaned = true;
                return false;
            }
            
            return true;
        });
        
        // Update student bus status based on subscriptions
        this.students.forEach(student => {
            student.busSubscriber = this.busSubscriptions.some(sub => sub.studentId === student.id);
        });
        
        // Validate and clean bus routes
        this.busRoutes = this.busRoutes.filter(route => {
            if (!route || !route.id || !route.name || !route.area) {
                console.log('Removing invalid route:', route);
                cleaned = true;
                return false;
            }
            
            // Ensure valid route structure
            if (typeof route !== 'object' || Array.isArray(route)) {
                console.log('Removing invalid route structure:', route);
                cleaned = true;
                return false;
            }
            
            return true;
        });
        
        console.log('Data validation complete. Final counts:', {
            students: this.students.length,
            attendance: this.attendance.length,
            busSubscriptions: this.busSubscriptions.length,
            busRoutes: this.busRoutes.length,
            feePayments: this.feePayments.length,
            cleaned: cleaned
        });
        
        console.log('=== DATA VALIDATION AND CLEANUP COMPLETE ===');
        
        if (cleaned) {
            this.saveDataToStorage();
        }
        
        return cleaned;
    }

    createDataBackup() {
        console.log('Creating data backup...');
        console.log('Routes in backup creation:', this.busRoutes);
        const backup = {
            timestamp: new Date().toISOString(),
            students: [...this.students],
            attendance: [...this.attendance],
            busSubscriptions: [...this.busSubscriptions],
            busRoutes: [...this.busRoutes],
            feePayments: [...this.feePayments]
        };
        
        console.log('Backup object routes:', backup.busRoutes);
        
        // Save backup with timestamp
        localStorage.setItem('school_data_backup', JSON.stringify(backup));
        
        // Also save multiple backup versions
        const backupKey = `school_data_backup_${Date.now()}`;
        localStorage.setItem(backupKey, JSON.stringify(backup));
        
        // Keep only last 5 backups to save space
        const allKeys = Object.keys(localStorage).filter(k => k.startsWith('school_data_backup_'));
        if (allKeys.length > 5) {
            allKeys.sort().slice(0, -5).forEach(key => localStorage.removeItem(key));
        }
        
        console.log('Backup created successfully');
    }

    restoreFromBackup() {
        console.log('Attempting to restore from backup...');
        try {
            const backup = localStorage.getItem('school_data_backup');
            if (backup) {
                const parsedBackup = JSON.parse(backup);
                this.students = parsedBackup.students || [];
                this.attendance = parsedBackup.attendance || [];
                this.busSubscriptions = parsedBackup.busSubscriptions || [];
                this.busRoutes = parsedBackup.busRoutes || [];
                this.feePayments = parsedBackup.feePayments || [];
                
                console.log('Data restored from backup successfully');
                return true;
            }
        } catch (error) {
            console.error('Failed to restore from backup:', error);
        }
        return false;
    }

    // Enhanced Data Loading with Imported Student Protection
    loadDataFromStorage() {
        console.log('=== LOAD DATA FROM STORAGE START ===');
        console.log('Loading data from localStorage...');
        
        // Try to load main data object first (new format)
        const mainData = localStorage.getItem('school_data_main');
        
        if (mainData) {
            try {
                console.log('Found main data object, parsing...');
                const parsedData = JSON.parse(mainData);
                console.log('Main data version:', parsedData.version);
                console.log('Last saved:', parsedData.lastSaved);
                
                // Load data from structured format
                this.students = parsedData.data.students || [];
                this.attendance = parsedData.data.attendance || [];
                this.busSubscriptions = parsedData.data.busSubscriptions || [];
                this.feePayments = parsedData.data.feePayments || [];
                
                // Restore imported student protection
                this.restoreImportedStudentProtection();
                
                console.log('Successfully loaded from main data:', {
                    students: this.students.length,
                    attendance: this.attendance.length,
                    bus: this.busSubscriptions.length,
                    fees: this.feePayments.length
                });
                
                // Apply Arabic student names only to non-imported students
                const arabicNamesApplied = this.applyArabicStudentNames();
                if (arabicNamesApplied) {
                    this.saveDataToStorage();
                }
                
                console.log('=== LOAD DATA FROM STORAGE COMPLETE ===');
                return;
            } catch (error) {
                console.error('Error parsing main data, falling back to individual arrays...', error);
            }
        }
        
        // Fallback to individual arrays (old format)
        console.log('Loading from individual arrays (fallback)...');
        const savedStudents = localStorage.getItem('school_students');
        const savedAttendance = localStorage.getItem('school_attendance');
        const savedBus = localStorage.getItem('school_bus');
        const savedFees = localStorage.getItem('school_fees');

        console.log('Saved data found:', {
            students: !!savedStudents,
            attendance: !!savedAttendance,
            bus: !!savedBus,
            fees: !!savedFees
        });

        let dataLoaded = false;

        // Load saved data - NEVER clear it!
        if (savedStudents) {
            try {
                this.students = JSON.parse(savedStudents);
                console.log('Loaded', this.students.length, 'students from localStorage');
                dataLoaded = true;
            } catch (error) {
                console.error('Error loading students, trying backup...', error);
                if (this.restoreFromBackup()) {
                    dataLoaded = true;
                }
            }
        
        // Load attendance from localStorage - NEVER clear it!
        if (savedAttendance) {
            try {
                this.attendance = JSON.parse(savedAttendance);
                console.log('Loaded', this.attendance.length, 'attendance records from localStorage');
            } catch (error) {
                console.error('Error loading attendance, using backup...', error);
                const backup = localStorage.getItem('school_data_backup');
                if (backup) {
                    const parsedBackup = JSON.parse(backup);
                    this.attendance = parsedBackup.attendance || [];
                }
            }
        }
        
        if (savedBus) {
            try {
                this.busSubscriptions = JSON.parse(savedBus);
                console.log('Loaded', this.busSubscriptions.length, 'bus subscriptions from localStorage');
            } catch (error) {
                console.error('Error loading bus data, using backup...', error);
                const backup = localStorage.getItem('school_data_backup');
                if (backup) {
                    const parsedBackup = JSON.parse(backup);
                    this.busSubscriptions = parsedBackup.busSubscriptions || [];
                }
            }
        }
        
        if (savedFees) {
            try {
                this.feePayments = JSON.parse(savedFees);
                console.log('Loaded', this.feePayments.length, 'fee payments from localStorage');
            } catch (error) {
                console.error('Error loading fees, using backup...', error);
                const backup = localStorage.getItem('school_data_backup');
                if (backup) {
                    const parsedBackup = JSON.parse(backup);
                    this.feePayments = parsedBackup.feePayments || [];
                }
            }
        }

        // Restore imported student protection
        this.restoreImportedStudentProtection();

        // Apply Arabic student names only to non-imported students
        const arabicNamesApplied = this.applyArabicStudentNames();
        if (arabicNamesApplied) {
            this.saveDataToStorage();
        }

        // Load bus routes from localStorage
        const savedRoutes = localStorage.getItem('school_bus_routes');
        const directRoutes = localStorage.getItem('ROUTES_DIRECT_SAVE');
        
        console.log('Raw routes from localStorage:', savedRoutes);
        console.log('Direct routes from localStorage:', directRoutes);
        
        // PRIORITY: Use direct save first, then normal save
        if (directRoutes) {
            try {
                this.busRoutes = JSON.parse(directRoutes);
                console.log('Loaded', this.busRoutes.length, 'bus routes from DIRECT save:', this.busRoutes);
            } catch (error) {
                console.error('Error loading direct routes, trying normal...', error);
                // Fall back to normal save
                if (savedRoutes) {
                    try {
                        this.busRoutes = JSON.parse(savedRoutes);
                        console.log('Loaded', this.busRoutes.length, 'bus routes from normal save:', this.busRoutes);
                    } catch (error) {
                        console.error('Error loading bus routes, using defaults...', error);
                        // Keep default routes
                    }
                } else {
                    console.log('No saved routes found, using defaults');
                    // Initialize with default routes
                    this.busRoutes = [
                        { id: 1, name: 'Route 1: North Area', area: 'North Area' },
                        { id: 2, name: 'Route 2: South Area', area: 'South Area' },
                        { id: 3, name: 'Route 3: East Area', area: 'East Area' },
                        { id: 4, name: 'Route 4: West Area', area: 'West Area' },
                        { id: 5, name: 'Route 5: City Center', area: 'City Center' },
                        { id: 6, name: 'Route 6: Industrial Zone', area: 'Industrial Zone' },
                        { id: 7, name: 'Route 7: Residential Area', area: 'Residential Area' },
                        { id: 8, name: 'Route 8: School District', area: 'School District' }
                    ];
                }
            }
        } else if (savedRoutes) {
            try {
                this.busRoutes = JSON.parse(savedRoutes);
                console.log('Loaded', this.busRoutes.length, 'bus routes from normal save:', this.busRoutes);
            } catch (error) {
                console.error('Error loading bus routes, using defaults...', error);
                // Keep default routes
            }
        } else {
            console.log('No saved routes found, using defaults');
            // Initialize with default routes
            this.busRoutes = [
                { id: 1, name: 'Route 1: North Area', area: 'North Area' },
                { id: 2, name: 'Route 2: South Area', area: 'South Area' },
                { id: 3, name: 'Route 3: East Area', area: 'East Area' },
                { id: 4, name: 'Route 4: West Area', area: 'West Area' },
                { id: 5, name: 'Route 5: City Center', area: 'City Center' },
                { id: 6, name: 'Route 6: Industrial Zone', area: 'Industrial Zone' },
                { id: 7, name: 'Route 7: Residential Area', area: 'Residential Area' },
                { id: 8, name: 'Route 8: School District', area: 'School District' }
            ];
        }
        
        console.log('Final routes array after loading:', this.busRoutes);

        // Final data verification and backup creation
        console.log('Data loading complete. Final counts:', {
            students: this.students.length,
            attendance: this.attendance.length,
            bus: this.busSubscriptions.length,
            fees: this.feePayments.length
        });

        // Create backup after successful load
        if (dataLoaded) {
            this.createDataBackup();
        }

        // Add sample students if none exist
        if (this.students.length === 0) {
            console.log('No students found, adding sample data...');
            this.students = [
                { id: 1, name: "أحمد محمد", class: "KG1", phone: "0501234567", busSubscriber: true },
                { id: 2, name: "فاطمة علي", class: "KG1", phone: "0507654321", busSubscriber: false },
                { id: 3, name: "محمد أحمد", class: "KG2", phone: "0501111111", busSubscriber: true },
                { id: 4, name: "مريم حسن", class: "KG2", phone: "0502222222", busSubscriber: false },
                { id: 5, name: "عبدالله خالد", class: "1", phone: "0503333333", busSubscriber: true },
                { id: 6, name: "نورا سالم", class: "1", phone: "0504444444", busSubscriber: false },
                { id: 7, name: "عمر يوسف", class: "2", phone: "0505555555", busSubscriber: true },
                { id: 8, name: "ليلى إبراهيم", class: "2", phone: "0506666666", busSubscriber: false },
                { id: 9, name: "حمزة ناصر", class: "3", phone: "0507777777", busSubscriber: true },
                { id: 10, name: "سارة محمد", class: "3", phone: "0508888888", busSubscriber: false },
                { id: 11, name: "خالد أحمد", class: "4", phone: "0509999999", busSubscriber: true },
                { id: 12, name: "آمنة علي", class: "4", phone: "0500000000", busSubscriber: false },
                { id: 13, name: "ياسر محمود", class: "5", phone: "0501212121", busSubscriber: true },
                { id: 14, name: "رنا خالد", class: "5", phone: "0502323232", busSubscriber: false },
                { id: 15, name: "سالم عمر", class: "6", phone: "0503434343", busSubscriber: true },
                { id: 16, name: "هناء أحمد", class: "6", phone: "0504545454", busSubscriber: false },
                { id: 17, name: "فارس محمد", class: "7", phone: "0505656565", busSubscriber: true },
                { id: 18, name: "داليا حسن", class: "7", phone: "0506767676", busSubscriber: false },
                { id: 19, name: "براء علي", class: "8", phone: "0507878787", busSubscriber: true },
                { id: 20, name: "ميساء خالد", class: "8", phone: "0508989898", busSubscriber: false }
            ];
            this.saveDataToStorage();
            console.log('Added sample students:', this.students.length);
        }

        // Load fee validity days setting
        const savedValidityDays = localStorage.getItem('school_fee_validity_days');
        if (savedValidityDays) {
            const n = Number(savedValidityDays);
            if (!Number.isNaN(n) && n > 0) {
                this.feeValidityDays = n;
            }
        }

        console.log('=== LOAD DATA FROM STORAGE COMPLETE ===');
    }
}
    
    getArabicStudentNamesById() {
        return {
            1: 'محمود أنور عايش',
            2: 'مريم ياسر أحمد العموري',
            3: 'مجد أنور بسام أبو نصر',
            4: 'سارة صابر عدنان ناجي',
            5: 'زيد محمد سكيك',
            6: 'محمد مؤمن عصام الديراوي',
            7: 'لينا سعيد محمد بشارات',
            8: 'وتين شادي طلعت بلاونة',
            9: 'آية عبد الرؤوف محمود إنجاص',
            10: 'وفاء أحمد عيد جواد',
            11: 'لايا عبد العزيز يوسف صالح',
            12: 'خطاب خالد طه',
            13: 'أمير مراد عوض الرجوب',
            14: 'بركة خالد راجح طه',
            15: 'كنان محمود إبراهيم حاجي',
            16: 'جوان شكيب باهر العواوي',
            17: 'نرجس حمدان قشطة',
            18: 'مصطفى حسام سفيان زهران',
            19: 'ميسون حسن هاني النيرب',
            20: 'كرم محمد جودة',
            21: 'سارة أحمد عيد جواد',
            22: 'سيلا شادي طلعت بلاونة',
            23: 'ناي حاتم محمد حمود',
            24: 'ياسمين إيهاب خليل شتات',
            25: 'آدم محمد سالم عوض',
            26: 'ليان إيهاب أحمد الشرفا',
            27: 'ماريا إيهاب أحمد الشرفا',
            28: 'غزل نائل محمود الهليس',
            29: 'تاليا محمود عبد الله أبو سرية',
            30: 'تيم ساهر نبيل اشتية',
            31: 'إيلين محمد ميسرة الحنفي',
            32: 'كندا إبراهيم خليل الصوص',
            33: 'غالية إياد هاشم الشوا',
            34: 'تالا إياد هاشم الشوا',
            35: 'ورد إياد هاشم الشوا',
            36: 'ألما إياد هاشم الشوا',
            37: 'إبراهيم كفاح أحمد نواهضة',
            38: 'جود محمد زكي النبيه',
            39: 'لين محمد عبد القادر العمصي',
            40: 'كرم محمد منير مناع',
            41: 'مريم إياد هاشم الشوا',
            42: 'يوسف إياد هاشم الشوا',
            43: 'ميرا إيهاب أحمد الشرفا',
            44: 'رزان إيهاب أحمد الشرفا',
            45: 'سارة محمد سالم عوض',
            46: 'تالا حسن يوسف زيد',
            47: 'ريما نائل سعدي السخل',
            48: 'براء محمد زكي النبيه',
            49: 'ماريا فادي محمد الجعبة',
            50: 'حلا مؤيد سليمان قواسمه',
            51: 'ريان بركه راجح طه',
            52: 'بانا إبراهيم خليل الصوص',
            53: 'حلا رياض زكريا عسيله',
            54: 'سارة أحمد عبد الفتاح الشوا',
            55: 'ليان نائل محمود الهليس',
            56: 'عمرو كفاح أحمد نواهضة',
            57: 'تاليه رجائي سعدي الكركي',
            58: 'محمد نمر رائق حميدة',
            59: 'البراء عبد العزيز يوسف صالحة',
            60: 'رزان علي محمد عصافرة',
            61: 'عائشه ظاهر ربحي قيبها',
            62: 'نايا حمودة سعيد صلاح',
            63: 'الحسن وائل كامل الجعبري',
            64: 'تميم باسل هاشم الهيموني',
            65: 'أمير حسن يوسف زيد',
            66: 'هيثم عبد الرؤوف محمود إنجاص',
            67: 'عدنان ناجي جمال الخضري',
            68: 'ميرا علي عصام المدهون',
            69: 'زينة بكر زكريا التركماني',
            70: 'زين الدين حسام سفيان زهران',
            71: 'ناي عبد الله جابر شقليه',
            72: 'يوسف محمد عبد القادر العمصي',
            73: 'كريم محمد جودة',
            74: 'محمد زيد عرسان الكيلاني',
            75: 'مسك محمد سالم عوض',
            76: 'ايلين شادي طلعت بلاونه',
            77: 'هشام باسل هاشم الهيموني',
            78: 'جوان فادي محمد الجعبة',
            79: 'اميرة امجد احمد ابو عرقوب',
            80: 'تالا نائل سعدي السخل',
            81: 'لانا وائل كامل الجعبري',
            82: 'عمر احمد عيد جواد',
            83: 'عبدالرحمن مراد عوض الرجوب',
            84: 'موسى ساهر نبيل اشتية',
            85: 'المى حاتم محمد حمود',
            86: 'تايا محمود ابراهيم حاجي',
            87: 'حمزه رياض زكريا عسيله',
            88: 'شام عبدالعزيز يوسف صالحة',
            89: 'ابراهيم محمود عبدالله ابوسرية',
            90: 'هبة نضال عبد الرزاق زلوم',
            91: 'سائدة محمود غصوب سعد',
            92: 'محمود مؤمن عصام الديراوي',
            93: 'أحمد مؤمن عصام الديراوي',
            94: 'منير محمد منير مناع',
            95: 'يوسف ناجي جمال الخضري',
            96: 'مريم عمر يوسف مكي',
            97: 'سراج أحمد عبد الله أبو عساكر',
            98: 'عزات مازن عزات الدحدوح',
            99: 'أحمد أبو الندى',
            100: 'دانية رجائي سعدي الكركي',
            101: 'ليان علي محمد عصافرة',
            102: 'مجد حاتم محمد حمود',
            103: 'أسيل سعيد محمد بشارات',
            104: 'صهيب ظاهر ربحي قيبها',
            105: 'ابراهيم بركه راجح طه',
            106: 'تولين حمودة سعيد صلاح',
            107: 'ميار خالد طه',
            108: 'تالا وائل كامل الجعبري',
            109: 'آدم منصور البايض',
            110: 'محمد ميسرة الحنفي',
            111: 'الحسن علي عصام المدهون',
            112: 'عبد الفتاح حمدان قشطة',
            113: 'أمل عطا حسن النيرب',
            114: 'سلمى وائل أحمد أبو شمالة',
            115: 'عزام محمد عزام عرفات',
            116: 'نهلة محمد ماجد النونو',
            117: 'محمد ساجي عبيد',
            118: 'عمرو محمد عبد القادر العمصي',
            119: 'جنى الطويل',
            120: 'سارة دواس',
            121: 'لين الغلاييني',
            122: 'عمر عماد سيد عابد',
            123: 'كريم نائل محمود الهليس',
            124: 'محمد ماضي',
            125: 'زين ماضي',
            126: 'محمد وائل محمد الشيخ خليل',
            127: 'عز الدين مؤيد سليمان قواسمه',
            128: 'نصر نمر رائق حميدة',
            129: 'براء راتب عبدالله زيدان',
            130: 'نور الدين مراد عوض الرجوب',
            131: 'تالين شادي طلعت بلاونه',
            132: 'عبيده احمد عيد جواد',
            133: 'لمار خالد طه',
            134: 'إيلياء ساهر نبيل اشتية',
            135: 'تالا حمودة سعيد صلاح',
            136: 'ابرار طه عادل شخشير',
            137: 'رغد رياض زكريا عسيله',
            138: 'نجود محمود إبراهيم دحبور',
            139: 'ليان محمود عبدالله أبوسرية',
            140: 'زينة كفاح احمد نواهضة',
            141: 'جنى نضال عبد الرزاق زلوم',
            142: 'أميمه ايمن يوسف ابو داود',
            143: 'آية حسن يوسف زيد',
            144: 'آية عطا حسن النيرب',
            145: 'نايا محمد عزام عرفات',
            146: 'مسك طارق فروانة',
            147: 'عبد الرحمن علاء محمد قفيشه',
            148: 'راشد رجائي سعدي الكركي',
            149: 'عبدالله محمود عبدالله أبوسرية',
            150: 'محمد علي محمد عصافرة',
            151: 'عبد الرحمن ناصر عبدالفتاح نزال',
            152: 'عزالدين حاتم محمد حمود',
            153: 'محمد سعيد محمد بشارات',
            154: 'هاشم باسل هاشم الهيموني',
            155: 'سليمان خضر سليمان راضي',
            156: 'أسامة مازن سليمان السيد',
            157: 'جمال ناجي جمال الخضري',
            158: 'محمد حسام سفيان زهران',
            159: 'عبد الله أحمد عبد الله أبو عساكر',
            160: 'ألما حاتم سعيد أبو القرايا',
            161: 'رغد محمد سكيك',
            162: 'جود عبد القادر إسماعيل النخالة',
            163: 'ليان عبد الرؤوف محمود انجاص',
            164: 'جنى حسن يوسف زيد',
            165: 'منة الله محمد سالم عوض',
            166: 'ديما نائل سعدي السخل',
            167: 'لمار خالد طه',
            168: 'ابرار طه عادل شخشير',
            169: 'حلا عبد العزيز يوسف صالحة',
            170: 'اسماء ناجي محمد العبيات',
            171: 'مارية محمود غصوب سعد',
            172: 'جهاد كفاح احمد نواهضة',
            173: 'مصعب محمد سالم عوض',
            174: 'يحيى مراد عوض الرجوب',
            175: 'نبيل ساهر نبيل اشتية',
            176: 'عبدالرحمن نمر رائق حميدة',
            177: 'عمر ناجي محمد العبيات',
            178: 'محمود عبد الرؤوف محمود انجاص',
            179: 'إسماعيل عبد القادر إسماعيل النخالة',
            180: 'محمد خالد محمد عيسى',
            181: 'قتيبه ايمن يوسف ابو داود',
            182: 'سارة أحمد عبد الله أبو عساكر',
            183: 'هيام عطا حسن النيرب',
            184: 'فرح مازن سليمان السيد',
            185: 'ليان ماضي',
            186: 'لمى هاني سليمان الغرابلي',
            187: 'فدوى نضال عبد الرزاق زلوم',
            188: 'الما مؤيد سليمان قواسمه',
            189: 'لمار محمود ابراهيم دحبور',
            190: 'عليا علي محمد عصافرة',
            191: 'رهف رياض زكريا عسيله',
            192: 'جود محمود إبراهيم حاجي',
            193: 'ملكه ظاهر ربحي قيبها',
            194: 'نور الهدى احمد عيد جواد',
            195: 'سارة وائل كامل الجعبري',
            196: 'لانا فادي محمد الجعبة',
            197: 'ليان شادي طلعت بلاونه',
            198: 'ميرال عماد سعيد عابد',
            199: 'سفيان حسام سفيان زهران',
            200: 'علياء هشام بدر الدين الخزندار',
            201: 'مهند أحمد عبد الفتاح الشوا',
            202: 'عمر محمد خميس جودة',
            203: 'عبد الله ساجي عبيد',
            204: 'ابراهيم طارق فروانة',
            205: 'محمد حرب',
            206: 'زين أبو الندى',
            207: 'عبد الرحمن حاتم محمد حمود',
            208: 'يوسف ناجي محمد العبيات',
            209: 'زينة حسين محمد ذكي النبيه',
            210: 'فائدة هشام بدر الدين الخزندار',
            211: 'علي جميل سرحان',
            212: 'محمد حمدان قشطة',
            213: 'شهد أيمن ماضي',
            214: 'يزن مهند إبراهيم خيال',
            215: 'وسيم ماضي',
            216: 'ملك هاني سليمان الغرابلي',
            217: 'سليمان هاني الغرابلي',
            218: 'دانا حاتم سعيد أبو القرايا',
            219: 'بانا وسيم نمر شحيبر',
            220: 'محمد الطويل',
            221: 'كريم دواس',
            222: 'علي أبو الندى',
            223: 'يزن ميسرة الحنفي'
        };
    }

    // Imported Student Protection Functions
    restoreImportedStudentProtection() {
        console.log('Restoring imported student protection...');
        this.importedStudentIds.clear();
        
        this.students.forEach(student => {
            if (student.isImported) {
                this.importedStudentIds.add(student.id);
                console.log(`Protected imported student: ${student.name} (ID: ${student.id})`);
            }
        });
        
        console.log(`Protected ${this.importedStudentIds.size} imported students`);
    }

    isImportedStudent(studentId) {
        return this.importedStudentIds.has(studentId);
    }

    protectImportedStudents() {
        console.log('Ensuring imported students are protected...');
        let protectedCount = 0;
        
        this.students = this.students.filter(student => {
            // Always keep imported students
            if (this.isImportedStudent(student.id)) {
                protectedCount++;
                return true;
            }
            return true; // Keep all other students too
        });
        
        console.log(`Protected ${protectedCount} imported students from removal`);
    }

    applyArabicStudentNames() {
        const namesById = this.getArabicStudentNamesById();
        let updated = 0;

        // Only apply Arabic names to non-imported students with IDs 1-30 (sample data)
        // Never override imported students
        this.students = this.students.map(student => {
            const id = Number(student.id);
            
            // Skip if student is imported (protected)
            if (this.isImportedStudent(id)) {
                console.log(`Skipping Arabic name for imported student: ${student.name} (ID: ${id})`);
                return student;
            }
            
            // Skip if ID is beyond sample data range (likely imported)
            if (id > 30) return student;
            
            const arabicName = namesById[id];
            if (!arabicName) return student;
            if (student.name === arabicName) return student;
            updated += 1;
            return {
                ...student,
                name: arabicName
            };
        });

        if (updated > 0) {
            console.log(`Arabic names applied: ${updated} students updated`);
            return true;
        }

        return false;
    }

    // Emergency Data Recovery Functions
    emergencyDataRestore() {
        console.log('Emergency data restore initiated...');
        const success = this.restoreFromBackup();
        if (success) {
            this.saveDataToStorage();
            this.renderStudents();
            this.renderAttendance();
            this.renderBusSubscriptions();
            this.renderFeePayments();
            this.updateDashboard();
            alert('Emergency data restore completed successfully!');
        } else {
            alert('No backup data found for emergency restore.');
        }
    }

    exportAllData() {
        console.log('Exporting all data...');
        const allData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: {
                students: this.students,
                attendance: this.attendance,
                busSubscriptions: this.busSubscriptions,
                busRoutes: this.busRoutes,
                feePayments: this.feePayments
            },
            metadata: {
                totalStudents: Array.isArray(this.students) ? this.students.length : 0,
                totalAttendance: Array.isArray(this.attendance) ? this.attendance.length : 0,
                totalBusSubscriptions: Array.isArray(this.busSubscriptions) ? this.busSubscriptions.length : 0,
                totalBusRoutes: Array.isArray(this.busRoutes) ? this.busRoutes.length : 0,
                totalFeePayments: Array.isArray(this.feePayments) ? this.feePayments.length : 0
            }
        };
        
        const dataStr = JSON.stringify(allData, null, 2);
        // Fix: Ensure proper UTF-8 encoding for Arabic characters
        const dataBlob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `school_data_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        console.log('Data exported successfully');
    }

    importAllData(jsonData) {
        console.log('Importing data...');
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            
            // Create backup before import
            this.createDataBackup();
            
            // Import data with validation
            if (data.students && Array.isArray(data.students)) {
                this.students = data.students;
                console.log(`Imported ${this.students.length} students`);
            }
            
            if (data.attendance && Array.isArray(data.attendance)) {
                this.attendance = data.attendance;
                console.log(`Imported ${this.attendance.length} attendance records`);
            }
            
            if (data.busSubscriptions && Array.isArray(data.busSubscriptions)) {
                this.busSubscriptions = data.busSubscriptions;
                console.log(`Imported ${this.busSubscriptions.length} bus subscriptions`);
            }
            
            if (data.feePayments && Array.isArray(data.feePayments)) {
                this.feePayments = data.feePayments;
                console.log(`Imported ${this.feePayments.length} fee payments`);
            }
            
            // Save imported data
            this.saveDataToStorage();
            
            // Refresh all displays
            this.renderStudents();
            this.renderAttendance();
            this.renderBusSubscriptions();
            this.renderFeePayments();
            this.updateDashboard();
            
            console.log('Data import completed successfully');
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    // Password-Protected Delete Functions
    deleteAllStudents(password) {
        // Set your admin password here
        const ADMIN_PASSWORD = 'admin123';
        
        if (password !== ADMIN_PASSWORD) {
            alert('Incorrect password! Access denied.');
            return false;
        }
        
        if (!confirm('⚠️ WARNING: This will permanently delete ALL students and their associated data (attendance, bus subscriptions, fee payments). This action cannot be undone!\n\nAre you absolutely sure you want to continue?')) {
            return false;
        }
        
        console.log('=== DELETING ALL STUDENTS ===');
        
        try {
            // Create final backup before deletion
            console.log('Creating final backup before deletion...');
            this.createDataBackup();
            
            // Get counts before deletion
            const studentCount = this.students.length;
            const attendanceCount = this.attendance.length;
            const busCount = this.busSubscriptions.length;
            const feesCount = this.feePayments.length;
            
            // Delete all student-related data
            this.students = [];
            this.attendance = [];
            this.busSubscriptions = [];
            this.feePayments = [];
            
            // Save empty data
            this.saveDataToStorage();
            
            // Refresh all displays
            this.renderStudents();
            this.renderAttendance();
            this.renderBusSubscriptions();
            this.renderFeePayments();
            this.updateDashboard();
            
            console.log('All data deleted successfully');
            alert(`✅ All student data has been deleted:\n\n• ${studentCount} students\n• ${attendanceCount} attendance records\n• ${busCount} bus subscriptions\n• ${feesCount} fee payments\n\nA backup was created before deletion.`);
            
            return true;
        } catch (error) {
            console.error('Error deleting all students:', error);
            alert('❌ Error occurred while deleting students. Please try again.');
            return false;
        }
    }

    clearAllData(password) {
        // Set your admin password here
        const ADMIN_PASSWORD = 'admin123';
        
        if (password !== ADMIN_PASSWORD) {
            alert('Incorrect password! Access denied.');
            return false;
        }
        
        if (!confirm('⚠️ CRITICAL WARNING: This will completely reset the entire system to factory defaults. ALL data will be permanently deleted!\n\nThis includes:\n• All students\n• All attendance records\n• All bus subscriptions\n• All fee payments\n• All backups\n\nThis action CANNOT be undone!\n\nType "DELETE" to confirm:')) {
            return false;
        }
        
        const confirmation = prompt('Type "DELETE" to confirm complete system reset:');
        if (confirmation !== 'DELETE') {
            alert('Reset cancelled. Confirmation text did not match.');
            return false;
        }
        
        console.log('=== COMPLETE SYSTEM RESET ===');
        
        try {
            // Clear ALL localStorage data
            localStorage.clear();
            
            // Reset all data arrays
            this.students = [];
            this.attendance = [];
            this.busSubscriptions = [];
            this.feePayments = [];
            
            // Re-initialize with sample data
            this.initializeSampleData();
            
            // Save fresh data
            this.saveDataToStorage();
            
            // Refresh all displays
            this.renderStudents();
            this.renderAttendance();
            this.renderBusSubscriptions();
            this.renderFeePayments();
            this.updateDashboard();
            
            console.log('System reset completed');
            alert('✅ System has been completely reset to factory defaults.\n\nAll previous data has been permanently deleted.\nThe system will now reload with sample data.');
            
            // Reload page after 2 seconds
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
            return true;
        } catch (error) {
            console.error('Error resetting system:', error);
            alert('❌ Error occurred while resetting system. Please try again.');
            return false;
        }
    }

    initializeSampleData() {
        // Add provided students for KG1 class
        this.students = [
            {
                id: 1,
                name: "محمود أنور عايش",
                class: "KG1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 2,
                name: "مريم ياسر أحمد العموري",
                class: "KG1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 3,
                name: "مجد أنور بسام أبو ناصر",
                class: "KG1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 4,
                name: "صابر عدنان ناجي",
                class: "KG1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 5,
                name: "زايد محمد سكيك",
                class: "KG1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 6,
                name: "محمد مؤمن عزام الدراوي",
                class: "KG1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 7,
                name: "لينا سعيد محمد بشارات",
                class: "KG1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 11,
                name: "ليا عبد العزيز يوسف صالح",
                class: "KG1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 12,
                name: "خطاب خالد طه",
                class: "KG1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 13,
                name: "أمير مراد عوض الرجوب",
                class: "KG1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 14,
                name: "بركة خالد رجه طه",
                class: "KG1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 15,
                name: "Kanan Mahmoud Ibrahim Hajji",
                class: "KG1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 16,
                name: "Jawan Shakib Baher Al-Awawi",
                class: "KG1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 17,
                name: "Narges Hamdan Qashata",
                class: "KG2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 18,
                name: "Mustafa Hossam Sufyan Zahran",
                class: "KG2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 19,
                name: "Maysoon Hassan Hani Al-Nirab",
                class: "KG2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 20,
                name: "Yaman Ahmad Eiad Jawad",
                class: "KG2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 21,
                name: "Omar Alaa Mohammed Qafisha",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 22,
                name: "Salma Muyed Suleiman Al-Wasema",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 23,
                name: "Julia Rajaei Saadi Al-Karki",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 24,
                name: "Dania Nammar Raqi Hamida",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 25,
                name: "Yassin Taha Adel Shakhshir",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 26,
                name: "Yousef Taha Adel Shakhshir",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 27,
                name: "Mohammed Barakah Rajeh Taha",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 28,
                name: "Sila Hamouda Saeed Salah",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 29,
                name: "Mohammed Saher Nabil Eshtiya",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 30,
                name: "Sawar Khaled Taha",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 31,
                name: "Abi Abu Al-Nada",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 32,
                name: "Yusra Ahmad Abdul Nasser Abu Shahla",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 33,
                name: "Majed Wael Al-Khalili",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 34,
                name: "Zakaria Bakr Zakaria Al-Turkmani",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 35,
                name: "Omar Alaa Mohammed Qafisha",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 36,
                name: "Farah Abu Hasnin",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 37,
                name: "Joud Makki",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 38,
                name: "Adam Abdul Qader Al-Nakhala",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 39,
                name: "Yousef Mazen Al-Dahdouh",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 40,
                name: "Hisham Awad",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 41,
                name: "Sema Hani Suleiman Al-Gharabli",
                class: "2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 42,
                name: "Kanan Shakib Al-Awawi",
                class: "2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 43,
                name: "Nour Mazen Suleiman Al-Sayed",
                class: "2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 44,
                name: "Suad Hamada Al-Ashi",
                class: "2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 45,
                name: "Hani Atta Hassan Al-Nirab",
                class: "2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 46,
                name: "Ahmad Wael Abu Shamaleh",
                class: "2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 47,
                name: "Yousef Abdullah Jaber Shaqlih",
                class: "2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 48,
                name: "Osama Zayed Arsan Al-Kilani",
                class: "2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 49,
                name: "Nashat Fadi Mohammed Al-Jaabah",
                class: "2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 50,
                name: "Rital Amjad Ahmad Abu Areqoub",
                class: "2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 51,
                name: "Nada Ayman Yousef Abu Dawoud",
                class: "2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 52,
                name: "Omar Hatem Mohammed Hamoud",
                class: "2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 53,
                name: "Lana Mahmoud Ibrahim Dahbour",
                class: "2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 54,
                name: "Yousef Riyadh Zakaria Aseelah",
                class: "2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 55,
                name: "Salma Mahmoud Abdullah Abu Sariya",
                class: "2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 56,
                name: "Amro Kifah Ahmad Nawahda",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 57,
                name: "Taliya Rajaei Saadi Al-Karki",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 58,
                name: "Mohammed Nammar Raqi Hamida",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 59,
                name: "Al-Baraa Abdul Aziz Yousef Saleh",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 60,
                name: "Razan Ali Mohammed Asafra",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 61,
                name: "Ayesha Zahir Rabeh Qibha",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 62,
                name: "Naya Hamouda Saeed Salah",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 63,
                name: "Al-Hassan Wael Kamil Al-Jabari",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 64,
                name: "Tameem Basel Hesham Al-Haimoni",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 65,
                name: "Amir Hassan Yousef Zayed",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 66,
                name: "Haitham Abdul Raouf Mahmoud Injas",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 67,
                name: "Adnan Naji Jamal Al-Khudari",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 68,
                name: "Mira Ali Eissam Al-Madhoun",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 69,
                name: "Zayna Bakr Zakaria Al-Turkmani",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 70,
                name: "Zain Al-Deen Hossam Sufyan Zahran",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 71,
                name: "Nay Abdullah Jaber Shaqlih",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 72,
                name: "Yousef Mohammed Abdul Qader Al-Amsi",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 73,
                name: "Kareem Mohammed Joudah",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 74,
                name: "Mohammed Zayed Arsan Al-Kilani",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 75,
                name: "Mesk Mohammed Salem Awad",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 76,
                name: "Elain Shady Talat Balawneh",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 77,
                name: "Hisham Basel Hesham Al-Haimoni",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 78,
                name: "Jawan Fadi Mohammed Al-Jaabah",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 79,
                name: "Amira Amjad Ahmad Abu Areqoub",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 80,
                name: "Tala Nael Saadi Al-Sakhl",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 81,
                name: "Lana Wael Kamil Al-Jabari",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 82,
                name: "Omar Ahmad Eiad Jawad",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 83,
                name: "Abdulrahman Murad Awad Al-Rajoub",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 84,
                name: "Musa Saher Nabil Eshtiya",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 85,
                name: "Alma Hatem Mohammed Hamoud",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 86,
                name: "Taya Mahmoud Ibrahim Hajji",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 87,
                name: "Hamza Riyadh Zakaria Aseelah",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 88,
                name: "Sham Abdul Aziz Yousef Saleh",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 89,
                name: "Ibrahim Mahmoud Abdullah Abu Sariya",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 90,
                name: "Hiba Nedal Abdul Razzaq Zalloum",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 91,
                name: "Saeda Mahmoud Ghassoub Saad",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 92,
                name: "Mahmoud Mo'men Ezzam Al-Derawi",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 93,
                name: "Ahmad Mo'men Ezzam Al-Derawi",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 94,
                name: "Munir Mohammed Munir Minaa",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 95,
                name: "Yousef Naji Jamal Al-Khudari",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 96,
                name: "Mariam Omar Yousef Makki",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 97,
                name: "Siraj Ahmad Abdullah Abu Asaker",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 98,
                name: "Ezzat Mazen Ezzat Al-Dahdouh",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 99,
                name: "Ahmad Abu Al-Nada",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 100,
                name: "Dania Rajaei Saadi Al-Karki",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 101,
                name: "Layan Ali Mohammed Asafra",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 102,
                name: "Majed Hatem Mohammed Hamoud",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 103,
                name: "Aseel Saeed Mohammed Besharat",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 104,
                name: "Suhaib Zahir Rabeh Qibha",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 105,
                name: "Ibrahim Barakah Rajeh Taha",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 106,
                name: "Tolin Hamouda Saeed Salah",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 107,
                name: "Mayar Khaled Taha",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 108,
                name: "Tala Wael Kamil Al-Jabari",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 109,
                name: "Adam Mansour Al-Baydh",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 110,
                name: "Mohammed Maysara Al-Hanafi",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 111,
                name: "Al-Hassan Ali Eissam Al-Madhoun",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 112,
                name: "Abdul Fattah Hamdan Qashata",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 113,
                name: "Amal Atta Hassan Al-Nirab",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 114,
                name: "Salma Wael Ahmad Abu Shamaleh",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 115,
                name: "Azzam Mohammed Azzam Arafat",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 116,
                name: "Nahla Mohammed Majed Al-Nounou",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 117,
                name: "Mohammed Saji Obaid",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 118,
                name: "Amro Mohammed Abdul Qader Al-Amsi",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 119,
                name: "Jana Al-Taweel",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 120,
                name: "Sara Dawas",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 121,
                name: "Lynn Al-Ghalayini",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 122,
                name: "Omar Emad Sayed Abed",
                class: "6 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 123,
                name: "Kareem Nael Mahmoud Al-Halis",
                class: "6 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 124,
                name: "Mohammed Madhi",
                class: "6 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 125,
                name: "Zain Madhi",
                class: "6 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 126,
                name: "Mohammed Wael Mohammed Sheikh Khalil",
                class: "6 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 127,
                name: "Ezz Al-Deen Muyed Suleiman Qawasmi",
                class: "6 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 128,
                name: "Nasr Nammar Raqi Hamida",
                class: "6 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 129,
                name: "Al-Baraa Rateb Abdullah Zidan",
                class: "6 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 130,
                name: "Nour Al-Deen Murad Awad Al-Rajoub",
                class: "6 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 131,
                name: "Talin Shady Talat Balawneh",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 132,
                name: "Obaida Ahmad Eiad Jawad",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 133,
                name: "Lamar Khaled Taha",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 134,
                name: "Iliya Saher Nabil Eshtiya",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 135,
                name: "Tala Hamouda Saeed Salah",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 136,
                name: "Ibrar Taha Adel Shakhshir",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 137,
                name: "Raghad Riyadh Zakaria Aseelah",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 138,
                name: "Najoud Mahmoud Ibrahim Dahbour",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 139,
                name: "Layan Mahmoud Abdullah Abu Sariya",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 140,
                name: "Zayna Kifah Ahmad Nawahda",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 141,
                name: "Jana Nedal Abdul Razzaq Zalloum",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 142,
                name: "Aimah Ayman Yousef Abu Dawoud",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 143,
                name: "Aya Hassan Yousef Zayed",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 144,
                name: "Aya Atta Hassan Al-Nirab",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 145,
                name: "Naya Mohammed Azzam Arafat",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 146,
                name: "Mesk Tariq Farwaneh",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 147,
                name: "Abdulrahman Alaa Mohammed Qafisha",
                class: "7 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 148,
                name: "Rashed Rajaei Saadi Al-Karki",
                class: "7 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 149,
                name: "Abdullah Mahmoud Abdullah Abu Sariya",
                class: "7 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 150,
                name: "Mohammed Ali Mohammed Asafra",
                class: "7 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 151,
                name: "Abdulrahman Nasser Abdul Fattah Nazzal",
                class: "7 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 152,
                name: "Ezz Al-Deen Hatem Mohammed Hamoud",
                class: "7 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 153,
                name: "Mohammed Saeed Mohammed Besharat",
                class: "7 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 154,
                name: "Hashem Basel Hesham Al-Haimoni",
                class: "7 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 155,
                name: "Suleiman Khodor Suleiman Radi",
                class: "7 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 156,
                name: "Osama Mazen Suleiman Al-Sayed",
                class: "7 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 157,
                name: "Jamal Naji Jamal Al-Khudari",
                class: "7 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 158,
                name: "Mohammed Hossam Sufyan Zahran",
                class: "7 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 159,
                name: "Abdullah Ahmad Abdullah Abu Asaker",
                class: "7 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 160,
                name: "Alma Hatem Saeed Abu Al-Quraya",
                class: "7 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 161,
                name: "Raghad Mohammed Skaik",
                class: "7 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 162,
                name: "Joud Abdul Qader Ismail Al-Nakhala",
                class: "7 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 163,
                name: "Layan Abdul Raouf Mahmoud Injas",
                class: "7 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 164,
                name: "Jana Hassan Yousef Zayed",
                class: "7 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 165,
                name: "Mona Allah Mohammed Salem Awad",
                class: "7 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 166,
                name: "Dima Nael Saadi Al-Sakhl",
                class: "7 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 167,
                name: "Lamar Khaled Taha",
                class: "7 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 168,
                name: "Ibrar Taha Adel Shakhshir",
                class: "7 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 169,
                name: "Hala Abdul Aziz Yousef Saleh",
                class: "7 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 170,
                name: "Asmaa Naji Mohammed Al-Obayyat",
                class: "7 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 171,
                name: "Mariyah Mahmoud Ghassoub Saad",
                class: "7 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 172,
                name: "Jihad Kifah Ahmad Nawahda",
                class: "7 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 173,
                name: "Moath Mohammed Salem Awad",
                class: "8 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 174,
                name: "Yahya Murad Awad Al-Rajoub",
                class: "8 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 175,
                name: "Nabil Saher Nabil Eshtiya",
                class: "8 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 176,
                name: "Abdulrahman Nammar Raqi Hamida",
                class: "8 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 177,
                name: "Omar Naji Mohammed Al-Obayyat",
                class: "8 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 178,
                name: "Mahmoud Abdul Raouf Mahmoud Injas",
                class: "8 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 179,
                name: "Ismail Abdul Qader Ismail Al-Nakhala",
                class: "8 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 180,
                name: "Mohammed Khaled Mohammed Issa",
                class: "8 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 181,
                name: "Qutaybah Ayman Yousef Abu Dawoud",
                class: "8 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 182,
                name: "Sarah Ahmad Abdullah Abu Asaker",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 183,
                name: "Hayam Atta Hassan Al-Nirab",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 184,
                name: "Farah Mazen Suleiman Al-Sayed",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 185,
                name: "Layan Madhi",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 186,
                name: "Luma Hani Suleiman Al-Gharabli",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 187,
                name: "Fadwa Nedal Abdul Razzaq Zalloum",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 188,
                name: "Alma Muyed Suleiman Qawasmi",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 189,
                name: "Lamar Mahmoud Ibrahim Dahbour",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 190,
                name: "Aliya Ali Mohammed Asafra",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 191,
                name: "Rahaf Riyadh Zakaria Aseelah",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 192,
                name: "Joud Mahmoud Ibrahim Hajji",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 193,
                name: "Malakah Zahir Rabeh Qibha",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 194,
                name: "Nour Al-Huda Ahmad Eiad Jawad",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 195,
                name: "Sarah Wael Kamil Al-Jabari",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 196,
                name: "Lana Fadi Mohammed Al-Jaabah",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 197,
                name: "Layan Shady Talat Balawneh",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 198,
                name: "Miral Emad Saeed Abed",
                class: "9",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 199,
                name: "Sufyan Hossam Sufyan Zahran",
                class: "9",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 200,
                name: "Aliya Hisham Badr Al-Deen Al-Khazandar",
                class: "9",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 201,
                name: "Muhannad Ahmad Abdul Fattah Al-Shawa",
                class: "9",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 202,
                name: "Omar Mohammed Khamees Joudah",
                class: "9",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 203,
                name: "Abdullah Saji Obaid",
                class: "9",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 204,
                name: "Ibrahim Tariq Farwaneh",
                class: "9",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 205,
                name: "Mohammed Harb",
                class: "9",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 206,
                name: "Zain Abu Al-Nada",
                class: "9",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 207,
                name: "Abdulrahman Hatem Mohammed Hamoud",
                class: "10",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 208,
                name: "Yousef Naji Mohammed Al-Obayyat",
                class: "10",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 209,
                name: "Zayna Hussein Mohammed Zaki Al-Nabih",
                class: "10",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 210,
                name: "Faeda Hisham Badr Al-Deen Al-Khazandar",
                class: "10",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 211,
                name: "Ali Jameel Sarhan",
                class: "10",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 212,
                name: "Shahd Ayman Madhi",
                class: "10",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 213,
                name: "Yazin Muhannad Ibrahim Khayal",
                class: "10",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 214,
                name: "Wasim Madhi",
                class: "10",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 215,
                name: "Malak Hani Suleiman Al-Gharabli",
                class: "10",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 216,
                name: "Mohammed Hamdan Qashata",
                class: "10",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 217,
                name: "Suleiman Hani Al-Gharabli",
                class: "11",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 218,
                name: "Dana Hatem Saeed Abu Al-Quraya",
                class: "11",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 219,
                name: "Bana Wasim Nammar Shihabir",
                class: "11",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 220,
                name: "Mohammed Al-Taweel",
                class: "11",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 221,
                name: "Kareem Dawas",
                class: "11",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 222,
                name: "Ali Abu Al-Nada",
                class: "11",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 223,
                name: "Yazin Maysara Al-Hanafi",
                class: "11",
                phone: "Not provided",
                busSubscriber: false
            }
        ];
        
        // Initialize empty arrays for other data (only if they don't exist)
        if (!this.busSubscriptions) this.busSubscriptions = [];
        if (!this.attendance) this.attendance = [];  // Only clear if empty
        if (!this.feePayments) this.feePayments = [];
        
        if (this.feePayments.length === 0) {
            const today = new Date();
            const currentMonth = today.getMonth() + 1;
            const currentYear = today.getFullYear();
            const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
            const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
            const todayDate = today.toISOString().split('T')[0];
            const previousDate = new Date(currentYear, currentMonth - 2, 15).toISOString().split('T')[0];

            this.feePayments = [
                {
                    id: 1,
                    studentId: this.students[0]?.id,
                    month: currentMonth,
                    year: currentYear,
                    tuitionFee: 50,
                    busFee: this.students[0]?.busSubscriber ? 15 : 0,
                    total: 50 + (this.students[0]?.busSubscriber ? 15 : 0),
                    paymentDate: todayDate,
                    status: 'paid'
                },
                {
                    id: 2,
                    studentId: this.students[1]?.id,
                    month: currentMonth,
                    year: currentYear,
                    tuitionFee: 50,
                    busFee: this.students[1]?.busSubscriber ? 15 : 0,
                    total: 50 + (this.students[1]?.busSubscriber ? 15 : 0),
                    paymentDate: todayDate,
                    status: 'paid'
                },
                {
                    id: 3,
                    studentId: this.students[2]?.id,
                    month: previousMonth,
                    year: previousYear,
                    tuitionFee: 50,
                    busFee: this.students[2]?.busSubscriber ? 15 : 0,
                    total: 50 + (this.students[2]?.busSubscriber ? 15 : 0),
                    paymentDate: previousDate,
                    status: 'paid'
                }
            ].filter(payment => payment.studentId != null);
        }
        
        // Save to storage
        this.saveDataToStorage();
    }

    // Event Listeners
    setupEventListeners() {
        const safeOn = (id, eventName, handler) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener(eventName, handler);
            }
        };

        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.switchSection(section);
            });
        });

        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 's':
                        e.preventDefault();
                        this.switchSection('students');
                        break;
                    case 'a':
                        e.preventDefault();
                        this.switchSection('attendance');
                        break;
                    case 'b':
                        e.preventDefault();
                        this.switchSection('bus');
                        break;
                    case 'f':
                        e.preventDefault();
                        this.switchSection('fees');
                        break;
                    case 'd':
                        e.preventDefault();
                        this.switchSection('dashboard');
                        break;
                    case 'n':
                        e.preventDefault();
                        this.openStudentModal();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.exportStudents();
                        break;
                }
            }
        });

        // Student Form
        safeOn('student-form', 'submit', (e) => {
            e.preventDefault();
            this.saveStudent();
        });

        // Bus Form
        safeOn('bus-form', 'submit', (e) => {
            e.preventDefault();
            this.saveBusSubscription();
        });

        // Route Form
        safeOn('route-form', 'submit', (e) => {
            e.preventDefault();
            this.saveRoute();
        });

        // Fee Form
        safeOn('fee-form', 'submit', (e) => {
            e.preventDefault();
            if (window.sms && typeof window.sms.saveFeePayment === 'function') {
                window.sms.saveFeePayment();
            } else {
                alert('Fee payment saving is not available. Please refresh the page.');
            }
        });

        // Search and Filters
        safeOn('student-search', 'input', () => {
            this.currentPage = 1;
            this.renderStudents();
        });
        safeOn('class-filter', 'change', () => {
            this.currentPage = 1;
            this.renderStudents();
        });
        safeOn('attendance-class-filter', 'change', () => this.renderAttendance());
        safeOn('attendance-search', 'input', () => this.renderAttendance());
        safeOn('attendance-date', 'change', () => this.renderAttendance());
        safeOn('bus-route-filter', 'change', () => this.renderBusSubscriptions());
        safeOn('bus-class-filter', 'change', () => this.renderBusSubscriptions());
        safeOn('fees-class-filter', 'change', () => this.renderFeePayments());
        safeOn('fees-month', 'change', () => this.renderFeePayments());
        safeOn('fee-status-filter', 'change', () => this.renderStudents());

        // Close modals on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });
    }

    setupFeeSystem() {
        const feeForm = document.getElementById('fee-form');
        if (!feeForm || !feeForm.parentNode) return;

        const cleanForm = feeForm.cloneNode(true);
        feeForm.parentNode.replaceChild(cleanForm, feeForm);

        cleanForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (window.sms && typeof window.sms.saveFeePayment === 'function') {
                window.sms.saveFeePayment();
            } else {
                alert('Fee payment saving is not available. Please refresh the page.');
            }
        });
    }

    setupRouteSystem() {
        const routeForm = document.getElementById('route-form');
        if (!routeForm || !routeForm.parentNode) return;

        const cleanForm = routeForm.cloneNode(true);
        routeForm.parentNode.replaceChild(cleanForm, routeForm);

        cleanForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (window.sms && typeof window.sms.saveRoute === 'function') {
                window.sms.saveRoute();
            } else {
                alert('Route saving is not available. Please refresh the page.');
            }
        });
    }

    // Navigation
    switchSection(sectionName) {
        console.log('switchSection called with:', sectionName);
        
        // Safety check - wait for DOM to be ready
        if (!document.getElementById(sectionName)) {
            console.error('Section not found:', sectionName);
            console.log('Available sections:', Array.from(document.querySelectorAll('.section')).map(s => s.id));
            return;
        }
        
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        console.log('Activating section:', sectionName);
        document.getElementById(sectionName).classList.add('active');
        
        const navBtn = document.querySelector(`[data-section="${sectionName}"]`);
        if (navBtn) {
            navBtn.classList.add('active');
        } else {
            console.warn('Navigation button not found for section:', sectionName);
        }

        // Refresh data when switching sections
        if (sectionName === 'attendance') {
            console.log('Rendering attendance in switchSection...');
            this.renderAttendance();
        }
    }

    quickFeePayment(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        // Open fee modal with student pre-selected
        const modal = document.getElementById('fee-modal');
        const studentSelect = document.getElementById('fee-student');
        
        // Populate student dropdown and select current student
        studentSelect.innerHTML = '';
        this.students.forEach(s => {
            studentSelect.innerHTML += `<option value="${s.id}" ${s.id === studentId ? 'selected' : ''}>${s.name} - ${(s.class === 'KG1' || s.class === 'KG2') ? s.class : `Grade ${s.class}`}</option>`;
        });
        
        // Set current month
        const currentMonth = new Date().getMonth() + 1;
        document.getElementById('fee-month').value = currentMonth;
        
        // Set today's date
        document.getElementById('fee-date').value = new Date().toISOString().split('T')[0];
        
        // Pre-fill bus fee if student is bus subscriber
        if (student.busSubscriber) {
            const busSubscription = this.busSubscriptions.find(b => b.studentId === studentId);
            if (busSubscription) {
                document.getElementById('fee-bus').value = busSubscription.monthlyFee;
            }
        }
        
        modal.classList.add('show');
    }

    openStudentDetailsModal(studentId) {
        const modal = document.getElementById('student-details-modal');
        const content = document.getElementById('student-details-content');
        if (!modal || !content) return;

        const student = this.students.find(s => String(s.id) === String(studentId));
        if (!student) {
            content.innerHTML = '<div class="empty-state">Student not found</div>';
            modal.classList.add('show');
            return;
        }

        const className = (typeof this.getDisplayClassName === 'function')
            ? this.getDisplayClassName(student.class)
            : (student.class || '');

        const busSub = Array.isArray(this.busSubscriptions)
            ? this.busSubscriptions.find(b => String(b.studentId) === String(studentId))
            : null;

        const payments = Array.isArray(this.feePayments)
            ? this.feePayments.filter(p => String(p.studentId) === String(studentId))
            : [];

        const attendance = Array.isArray(this.attendance)
            ? this.attendance
                .filter(a => String(a.studentId) === String(studentId))
                .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
                .slice(0, 10)
            : [];

        const totalPaid = payments.reduce((sum, p) => sum + Number(p.total || 0), 0);
        const lastPayment = payments
            .slice()
            .sort((a, b) => String(b.paymentDate || '').localeCompare(String(a.paymentDate || '')))[0];
        const feeStatus = (typeof this.getStudentFeeStatus === 'function') ? this.getStudentFeeStatus(student.id) : { status: '' };

        const escapeHtml = (s) => String(s ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');

        content.innerHTML = `
            <div style="display: grid; gap: 12px;">
                <div style="display: grid; gap: 6px; padding: 12px; border: 1px solid rgba(15,23,42,0.10); border-radius: 12px; background: rgba(248,250,252,0.8);">
                    <div style="font-weight: 800; font-size: 16px;">${escapeHtml(student.name)}</div>
                    <div style="color: #64748b; font-size: 13px;">ID: ${escapeHtml(student.id)} • Class: ${escapeHtml(className)}</div>
                    <div style="color: #64748b; font-size: 13px;">Phone: ${escapeHtml(student.phone || 'Not provided')}</div>
                </div>

                <div style="display: grid; gap: 6px; padding: 12px; border: 1px solid rgba(15,23,42,0.10); border-radius: 12px; background: rgba(255,255,255,0.7);">
                    <div style="font-weight: 800;">Bus</div>
                    <div style="color: #334155; font-size: 14px;">
                        ${busSub ? `Route: <strong>${escapeHtml(busSub.route || '')}</strong> • Fee: <strong>$${Number(busSub.monthlyFee || 0).toFixed(2)}</strong> • Status: <strong>${escapeHtml(busSub.status || '')}</strong>` : 'No bus subscription'}
                    </div>
                </div>

                <div style="display: grid; gap: 6px; padding: 12px; border: 1px solid rgba(15,23,42,0.10); border-radius: 12px; background: rgba(255,255,255,0.7);">
                    <div style="font-weight: 800;">Fees</div>
                    <div style="color: #334155; font-size: 14px;">Payments: <strong>${payments.length}</strong> • Total paid: <strong>$${Number(totalPaid || 0).toFixed(2)}</strong></div>
                    <div style="color: #334155; font-size: 14px;">Current status: <strong>${escapeHtml(feeStatus?.status || '')}</strong>${lastPayment?.paymentDate ? ` • Last payment: <strong>${escapeHtml(lastPayment.paymentDate)}</strong>` : ''}</div>
                </div>

                <div style="display: grid; gap: 8px; padding: 12px; border: 1px solid rgba(15,23,42,0.10); border-radius: 12px; background: rgba(255,255,255,0.7);">
                    <div style="font-weight: 800;">Recent Attendance</div>
                    ${attendance.length === 0 ? '<div style="color:#64748b; font-size: 14px;">No attendance records</div>' : `
                        <div style="display:grid; gap: 6px;">
                            ${attendance.map(a => `
                                <div style="display:flex; justify-content: space-between; gap: 10px; padding: 8px 10px; border: 1px solid rgba(15,23,42,0.08); border-radius: 10px; background: rgba(248,250,252,0.9);">
                                    <div style="font-weight: 700;">${escapeHtml(a.date || '')}</div>
                                    <div>${escapeHtml(a.status || '')}</div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;

        modal.classList.add('show');
    }

    quickBusSubscription(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        // Check if student already has bus subscription
        const existingSubscription = this.busSubscriptions.find(b => b.studentId === studentId);
        if (existingSubscription) {
            alert(`${student.name} already has a bus subscription: ${existingSubscription.route}`);
            return;
        }

        // Open bus modal with student pre-selected
        const modal = document.getElementById('bus-modal');
        const studentSelect = document.getElementById('bus-student');
        const routeSelect = document.getElementById('bus-route');
        
        // Clear and populate route dropdown using route manager for live data
        routeSelect.innerHTML = '<option value="">Select Route</option>';
        const routes = routeManager.getRoutes();
        console.log('DEBUG: quickBusSubscription - Routes from routeManager:', routes);
        routes.forEach(route => {
            console.log('DEBUG: quickBusSubscription - Adding route to dropdown:', route.name);
            routeSelect.innerHTML += `<option value="${route.name}">${route.name}</option>`;
        });
        
        // Populate student dropdown and select current student
        studentSelect.innerHTML = '';
        this.students.forEach(s => {
            const existingSub = this.busSubscriptions.find(b => b.studentId === s.id);
            if (!existingSub) {
                studentSelect.innerHTML += `<option value="${s.id}" ${s.id === studentId ? 'selected' : ''}>${s.name} - ${(s.class === 'KG1' || s.class === 'KG2') ? s.class : `Grade ${s.class}`}</option>`;
            }
        });
        
        modal.classList.add('show');
    }

    // Student Management
    openStudentModal(studentId = null) {
        this.currentEditingStudent = studentId;
        const modal = document.getElementById('student-modal');
        
        // Populate the student route dropdown
        const studentRouteSelect = document.getElementById('student-route');
        console.log('DEBUG: Student route dropdown element found:', !!studentRouteSelect);
        if (studentRouteSelect) {
            console.log('DEBUG: About to populate student route dropdown');
            console.log('DEBUG: routeManager exists:', !!routeManager);
            const routes = routeManager.getRoutes();
            console.log('DEBUG: Routes from routeManager:', routes);
            studentRouteSelect.innerHTML = '<option value="">No Bus</option>';
            routes.forEach(route => {
                console.log('DEBUG: Adding route to student dropdown:', route.name);
                studentRouteSelect.innerHTML += `<option value="${route.name}">${route.name}</option>`;
            });
            console.log('DEBUG: Student route dropdown populated with', routes.length, 'routes');
        } else {
            console.log('DEBUG: Student route dropdown element NOT found!');
        }
        
        if (studentId) {
            const student = this.students.find(s => s.id === studentId);
            document.getElementById('student-name').value = student.name;
            document.getElementById('student-class').value = student.class;
            document.getElementById('student-phone').value = student.phone;
            
            // Set the route if student has one
            if (studentRouteSelect && student.route) {
                studentRouteSelect.value = student.route;
            }
        } else {
            document.getElementById('student-form').reset();
        }
        
        modal.classList.add('show');
    }

    saveStudent() {
        const name = document.getElementById('student-name').value.trim();
        const studentClass = document.getElementById('student-class').value;
        const phone = document.getElementById('student-phone').value.trim();

        if (!name || !studentClass) {
            alert('Please fill in student name and class');
            return;
        }

        if (this.currentEditingStudent) {
            // Edit existing student
            console.log('Editing existing student:', this.currentEditingStudent);
            const studentIndex = this.students.findIndex(s => s.id === this.currentEditingStudent);
            this.students[studentIndex] = {
                ...this.students[studentIndex],
                name,
                class: studentClass,
                phone: phone || 'Not provided'
            };
            console.log('Student updated:', this.students[studentIndex]);
        } else {
            // Add new student
            console.log('Adding new student with data:', { name, studentClass, phone });
            const newStudent = {
                id: this.getNextStudentId(),
                name,
                class: studentClass,
                phone: phone || 'Not provided',
                busSubscriber: false // Default to false, managed through bus section
            };
            this.students.push(newStudent);
            console.log('New student added:', newStudent);
            console.log('Total students after adding:', this.students.length);
        }

        console.log('Saving students to storage...');
        this.saveDataToStorage();
        console.log('Rendering students...');
        this.renderStudents();
        console.log('Updating dashboard...');
        this.updateDashboard();
        console.log('Closing modal...');
        this.closeModal('student-modal');
        console.log('Student add operation complete!');
    }

    deleteStudent(studentId) {
        // Check if this is an imported student
        if (this.isImportedStudent(studentId)) {
            const student = this.students.find(s => s.id === studentId);
            if (!confirm(`⚠️ WARNING: This is an imported student: "${student.name}".\n\nImported students are protected and should NOT be deleted.\n\nAre you absolutely sure you want to delete this protected imported student?`)) {
                return; // Don't delete if user cancels
            }
        } else {
            if (!confirm('Are you sure you want to delete this student?')) {
                return;
            }
        }

        // Remove the student
        this.students = this.students.filter(s => s.id !== studentId);
        
        // Remove from protection if it was imported
        if (this.isImportedStudent(studentId)) {
            this.importedStudentIds.delete(studentId);
            console.log(`Removed imported student from protection: ${studentId}`);
        }
        
        // Clean up related data
        this.attendance = this.attendance.filter(a => a.studentId !== studentId);
        this.busSubscriptions = this.busSubscriptions.filter(b => b.studentId !== studentId);
        this.feePayments = this.feePayments.filter(f => f.studentId !== studentId);
        
        // Save and refresh
        this.saveDataToStorage();
        this.renderStudents();
        this.updateDashboard();
        
        console.log(`Deleted student with ID: ${studentId}`);
    }

    deleteSelectedStudents() {
        const ids = Array.from(this.selectedStudents);

        if (ids.length === 0) {
            alert('No students selected');
            return;
        }

        if (!confirm(`Are you sure you want to delete ${ids.length} selected student(s)?`)) {
            return;
        }

        const idSet = new Set(ids.map(id => Number(id)));

        this.students = this.students.filter(s => !idSet.has(Number(s.id)));
        this.attendance = this.attendance.filter(a => !idSet.has(Number(a.studentId)));
        this.busSubscriptions = this.busSubscriptions.filter(b => !idSet.has(Number(b.studentId)));
        this.feePayments = this.feePayments.filter(f => !idSet.has(Number(f.studentId)));

        this.selectedStudents.clear();
        const selectAll = document.getElementById('select-all');
        if (selectAll) selectAll.checked = false;

        this.saveDataToStorage();
        this.renderStudents();
        this.updateDashboard();
    }

    renderStudents() {
        const searchTerm = document.getElementById('student-search').value.toLowerCase();
        const classFilter = document.getElementById('class-filter').value;
        const feeStatusFilter = document.getElementById('fee-status-filter').value;
        
        let filteredStudents = this.students.filter(student => {
            const matchesSearch = student.name.toLowerCase().includes(searchTerm);
            const matchesClass = !classFilter || student.class === classFilter;
            
            let matchesFeeStatus = true;
            if (feeStatusFilter) {
                const feeStatus = this.getStudentFeeStatus(student.id);
                matchesFeeStatus = feeStatus.status === feeStatusFilter;
            }
            
            return matchesSearch && matchesClass && matchesFeeStatus;
        });

        // Update count
        document.getElementById('student-count').textContent = `${filteredStudents.length} students`;

        // Pagination
        const totalPages = Math.ceil(filteredStudents.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

        // Update page info
        document.getElementById('page-info').textContent = `Page ${this.currentPage} of ${totalPages || 1}`;

        const tbody = document.getElementById('students-table');
        tbody.innerHTML = '';

        if (paginatedStudents.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No students found</td></tr>';
            this.renderPagination(0);
            return;
        }

        paginatedStudents.forEach(student => {
            const row = document.createElement('tr');
            const isSelected = this.selectedStudents.has(student.id);
            const feeStatus = this.getStudentFeeStatus(student.id);
            
            let feeStatusHtml = '';
            if (feeStatus.status === 'paid') {
                feeStatusHtml = `<span class="status-badge status-paid">✅ Paid $${feeStatus.amount}</span>`;
            } else {
                feeStatusHtml = `<span class="status-badge status-unpaid">❌ Unpaid</span>`;
            }
            
            row.innerHTML = `
                <td><input type="checkbox" ${isSelected ? 'checked' : ''} onchange="sms.toggleStudentSelection(${student.id})"></td>
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td>${(student.class === 'KG1' || student.class === 'KG2') ? student.class : (student.class === '6 Boys' ? 'Grade 6 Boys' : (student.class === '6 Girls' ? 'Grade 6 Girls' : (student.class === '7 Boys' ? 'Grade 7 Boys' : (student.class === '7 Girls' ? 'Grade 7 Girls' : (student.class === '8 Boys' ? 'Grade 8 Boys' : (student.class === '8 Girls' ? 'Grade 8 Girls' : `Grade ${student.class}`))))))}</td>
                <td>${student.phone}</td>
                <td>${student.busSubscriber ? '✅ Yes' : '❌ No'}</td>
                <td>${feeStatusHtml}</td>
                <td>
                    <button class="btn btn-sm btn-success" onclick="sms.quickFeePayment(${student.id})" title="Record Fee Payment">💰</button>
                    <button class="btn btn-sm btn-primary" onclick="sms.quickBusSubscription(${student.id})" title="Add Bus Subscription">🚌</button>
                    <button class="btn btn-sm btn-secondary" onclick="sms.openStudentDetailsModal(${student.id})" title="View Details">Details</button>
                    <button class="btn btn-sm btn-primary" onclick="sms.openStudentModal(${student.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="sms.deleteStudent(${student.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        this.renderPagination(totalPages);
    }

    renderPagination(totalPages) {
        const paginationDiv = document.getElementById('students-pagination');
        paginationDiv.innerHTML = '';

        if (totalPages <= 1) return;

        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '← Previous';
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.onclick = () => this.changePage(this.currentPage - 1);
        paginationDiv.appendChild(prevBtn);

        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = i === this.currentPage ? 'active' : '';
            pageBtn.onclick = () => this.changePage(i);
            paginationDiv.appendChild(pageBtn);
        }

        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Next →';
        nextBtn.disabled = this.currentPage === totalPages;
        nextBtn.onclick = () => this.changePage(this.currentPage + 1);
        paginationDiv.appendChild(nextBtn);

        // Page info
        const pageInfo = document.createElement('span');
        pageInfo.className = 'pagination-info';
        pageInfo.textContent = `${this.currentPage} / ${totalPages}`;
        paginationDiv.appendChild(pageInfo);
    }

    changePage(page) {
        this.currentPage = page;
        this.renderStudents();
    }

    toggleStudentSelection(studentId) {
        if (this.selectedStudents.has(studentId)) {
            this.selectedStudents.delete(studentId);
        } else {
            this.selectedStudents.add(studentId);
        }
    }

    toggleSelectAll() {
        const selectAllCheckbox = document.getElementById('select-all');
        const checkboxes = document.querySelectorAll('#students-table input[type="checkbox"]');
        
        if (selectAllCheckbox.checked) {
            // Select all visible students
            checkboxes.forEach(checkbox => {
                if (checkbox.id !== 'select-all') {
                    checkbox.checked = true;
                    const studentId = parseInt(checkbox.getAttribute('onchange').match(/\d+/)[0]);
                    this.selectedStudents.add(studentId);
                }
            });
        } else {
            // Deselect all
            checkboxes.forEach(checkbox => {
                if (checkbox.id !== 'select-all') {
                    checkbox.checked = false;
                }
            });
            this.selectedStudents.clear();
        }
    }

    // Attendance Management
    markTodayAttendance() {
        const today = new Date().toISOString().split('T')[0];
        const existingAttendance = this.attendance.filter(a => a.date === today);
        
        if (existingAttendance.length > 0) {
            if (!confirm('Attendance for today already exists. Do you want to overwrite it?')) {
                return;
            }
            this.attendance = this.attendance.filter(a => a.date !== today);
        }

        this.students.forEach(student => {
            this.attendance.push({
                id: this.getNextAttendanceId(),
                studentId: student.id,
                date: today,
                status: 'present',
                markedBy: 'System',
                markedAt: new Date().toISOString()
            });
        });

        this.saveDataToStorage();
        
        console.log('Switching to attendance section...');
        // Switch to attendance section and render with delay to ensure DOM is ready
        setTimeout(() => {
            this.switchSection('attendance');
            
            console.log('Setting date field to:', today);
            // Set the date field to today
            document.getElementById('attendance-date').value = today;
            
            console.log('Attendance marking complete!');
        }, 100);
    }

    renderAttendance() {
        console.log('=== NEW ATTENDANCE SYSTEM START ===');
        
        const grid = document.getElementById('attendance-grid');
        const dateInput = document.getElementById('attendance-date');
        const date = dateInput.value || new Date().toISOString().split('T')[0];
        
        // Ensure date is set to today if not already set
        if (!dateInput.value) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
            console.log('Set date to today:', today);
        }
        
        const classFilter = document.getElementById('attendance-class-filter').value;
        const searchTerm = document.getElementById('attendance-search').value.toLowerCase();
        
        console.log('Debug info:');
        console.log('- Total students:', this.students.length);
        console.log('- Date:', date);
        console.log('- Date input value:', dateInput.value);
        console.log('- Class filter:', classFilter);
        console.log('- Search term:', searchTerm);
        console.log('- Total attendance records:', this.attendance.length);
        
        // Filter students
        let filteredStudents = this.students;
        if (classFilter) {
            // Handle grade-level filters (e.g., "4", "6", "7", "8")
            if (classFilter === '4' || classFilter === '6' || classFilter === '7' || classFilter === '8') {
                filteredStudents = filteredStudents.filter(s => 
                    s.class === classFilter || 
                    s.class === `${classFilter} Boys` || 
                    s.class === `${classFilter} Girls`
                );
            } else {
                filteredStudents = filteredStudents.filter(s => s.class === classFilter);
            }
        }
        if (searchTerm) {
            filteredStudents = filteredStudents.filter(s => 
                s.name.toLowerCase().includes(searchTerm)
            );
        }
        
        console.log('- Filtered students:', filteredStudents.length);
        
        // If no students exist, show message
        if (this.students.length === 0) {
            grid.innerHTML = '<div class="empty-state">No students found in the system. Please add students first.</div>';
            document.getElementById('attendance-summary-text').textContent = '0 students';
            document.getElementById('present-count').textContent = '0';
            document.getElementById('absent-count').textContent = '0';
            document.getElementById('unmarked-count').textContent = '0';
            return;
        }
        
        // Calculate statistics
        let presentCount = 0;
        let absentCount = 0;
        let unmarkedCount = 0;
        
        const studentHTML = filteredStudents.map(student => {
            const attendance = this.attendance.find(a => 
                String(a.studentId) === String(student.id) && a.date === date
            );
            
            console.log(`Student ${student.id} (${student.name}): attendance =`, attendance);
            
            if (attendance) {
                if (attendance.status === 'present') presentCount++;
                else if (attendance.status === 'absent') absentCount++;
            } else {
                unmarkedCount++;
            }
            
            const status = attendance ? attendance.status : 'not-marked';
            const statusClass = status === 'present' ? 'present' : status === 'absent' ? 'absent' : '';
            
            return `
                <div class="attendance-card">
                    <div class="student-info">
                        <strong>${student.name}</strong>
                        <small>${this.getDisplayClassName(student.class)} • ID: ${student.id}</small>
                    </div>
                    <div class="attendance-status">
                        <span class="status-badge status-${status}">
                            ${status === 'not-marked' ? 'Not Marked' : status}
                        </span>
                    </div>
                    <div class="attendance-actions">
                        <button class="btn-attendance ${statusClass}" 
                                onclick="console.log('Present button clicked for student ${student.id}'); window.markAttendance('${student.id}', 'present')"
                                data-status="present">
                            ✓ Present
                        </button>
                        <button class="btn-attendance ${status === 'absent' ? 'absent' : ''}" 
                                onclick="console.log('Absent button clicked for student ${student.id}'); window.markAttendance('${student.id}', 'absent')"
                                data-status="absent">
                            ✗ Absent
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Update statistics
        document.getElementById('attendance-summary-text').textContent = 
            `${filteredStudents.length} students`;
        document.getElementById('present-count').textContent = presentCount;
        document.getElementById('absent-count').textContent = absentCount;
        document.getElementById('unmarked-count').textContent = unmarkedCount;
        
        // Render students
        if (filteredStudents.length === 0) {
            grid.innerHTML = '<div class="empty-state">No students found</div>';
        } else {
            grid.innerHTML = studentHTML;
        }
        
        console.log('=== NEW ATTENDANCE SYSTEM COMPLETE ===');
    }
    
    // Global attendance function
    markAttendance(studentId, status) {
        console.log('=== MARK ATTENDANCE CALLED ===');
        console.log('Student ID:', studentId);
        console.log('Status:', status);
        
        // Show immediate feedback
        const button = event.target;
        console.log('Button clicked:', button);
        
        // Add visual feedback immediately
        button.style.transform = 'scale(0.9)';
        button.style.opacity = '0.7';
        
        setTimeout(() => {
            button.style.transform = 'scale(1)';
            button.style.opacity = '1';
        }, 200);
        
        const date = document.getElementById('attendance-date').value || new Date().toISOString().split('T')[0];
        console.log('Date being used:', date);
        console.log('Current attendance records:', this.attendance.length);
        
        // Find existing attendance
        const existingIndex = this.attendance.findIndex(a => 
            String(a.studentId) === String(studentId) && a.date === date
        );
        
        console.log('Existing attendance index:', existingIndex);
        
        if (existingIndex !== -1) {
            // Update existing
            console.log('Updating existing attendance');
            this.attendance[existingIndex].status = status;
            this.attendance[existingIndex].markedAt = new Date().toISOString();
            console.log('Updated attendance:', this.attendance[existingIndex]);
        } else {
            // Create new
            console.log('Creating new attendance record');
            const newRecord = {
                id: Date.now().toString(),
                studentId: String(studentId),
                date: date,
                status: status,
                markedAt: new Date().toISOString()
            };
            this.attendance.push(newRecord);
            console.log('New attendance record:', newRecord);
        }
        
        console.log('Total attendance records after:', this.attendance.length);
        console.log('All attendance records:', this.attendance);
        
        // Force save to storage
        try {
            this.saveDataToStorage();
            console.log('Data saved to storage successfully');
        } catch (error) {
            console.error('Error saving to storage:', error);
        }
        
        // Force re-render with delay
        setTimeout(() => {
            console.log('Re-rendering attendance...');
            this.renderAttendance();
            this.updateDashboard();
            console.log('Re-render complete');
        }, 100);
        
        console.log('=== MARK ATTENDANCE COMPLETE ===');
    }
    
    // Bulk attendance functions
    markAllPresent() {
        const date = document.getElementById('attendance-date').value || new Date().toISOString().split('T')[0];
        const classFilter = document.getElementById('attendance-class-filter').value;
        
        let studentsToMark = this.students;
        if (classFilter) {
            // Handle grade-level filters (e.g., "4", "6", "7", "8")
            if (classFilter === '4' || classFilter === '6' || classFilter === '7' || classFilter === '8') {
                studentsToMark = studentsToMark.filter(s => 
                    s.class === classFilter || 
                    s.class === `${classFilter} Boys` || 
                    s.class === `${classFilter} Girls`
                );
            } else {
                studentsToMark = studentsToMark.filter(s => s.class === classFilter);
            }
        }
        
        if (!confirm(`Mark all ${studentsToMark.length} students as Present?`)) return;
        
        studentsToMark.forEach(student => {
            const existingIndex = this.attendance.findIndex(a => 
                a.studentId === student.id && a.date === date
            );
            
            if (existingIndex !== -1) {
                this.attendance[existingIndex].status = 'present';
                this.attendance[existingIndex].markedAt = new Date().toISOString();
            } else {
                this.attendance.push({
                    id: Date.now().toString(),
                    studentId: student.id,
                    date: date,
                    status: 'present',
                    markedAt: new Date().toISOString()
                });
            }
        });
        
        this.saveDataToStorage();
        this.renderAttendance();
        this.updateDashboard();
        alert(`Marked ${studentsToMark.length} students as Present`);
    }
    
    markAllAbsent() {
        const date = document.getElementById('attendance-date').value || new Date().toISOString().split('T')[0];
        const classFilter = document.getElementById('attendance-class-filter').value;
        
        let studentsToMark = this.students;
        if (classFilter) {
            // Handle grade-level filters (e.g., "4", "6", "7", "8")
            if (classFilter === '4' || classFilter === '6' || classFilter === '7' || classFilter === '8') {
                studentsToMark = studentsToMark.filter(s => 
                    s.class === classFilter || 
                    s.class === `${classFilter} Boys` || 
                    s.class === `${classFilter} Girls`
                );
            } else {
                studentsToMark = studentsToMark.filter(s => s.class === classFilter);
            }
        }
        
        if (!confirm(`Mark all ${studentsToMark.length} students as Absent?`)) return;
        
        studentsToMark.forEach(student => {
            const existingIndex = this.attendance.findIndex(a => 
                a.studentId === student.id && a.date === date
            );
            
            if (existingIndex !== -1) {
                this.attendance[existingIndex].status = 'absent';
                this.attendance[existingIndex].markedAt = new Date().toISOString();
            } else {
                this.attendance.push({
                    id: Date.now().toString(),
                    studentId: student.id,
                    date: date,
                    status: 'absent',
                    markedAt: new Date().toISOString()
                });
            }
        });
        
        this.saveDataToStorage();
        this.renderAttendance();
        this.updateDashboard();
        alert(`Marked ${studentsToMark.length} students as Absent`);
    }

    // Export/Import Functions
    // Export attendance by week days - separate files for each class
    exportAttendance() {
        try {
            console.log('=== EXPORT ATTENDANCE START ===');
            
            const date = document.getElementById('attendance-date').value || new Date().toISOString().split('T')[0];
            const classFilter = document.getElementById('attendance-class-filter').value;
            
            console.log('Export parameters:');
            console.log('- Date:', date);
            console.log('- Class filter:', classFilter);
            console.log('- Total students:', this.students.length);
            console.log('- Total attendance records:', this.attendance.length);
            
            // Check if students data exists
            if (!this.students || this.students.length === 0) {
                console.error('No students data available');
                alert('No students data available. Please add students first.');
                return;
            }
            
            // Check if class filter is selected
            if (!classFilter) {
                alert('Please select a class to export.\nChoose a class from dropdown and then click Export.');
                return;
            }
        
        // Get week dates (Sunday to Thursday)
        const selectedDate = new Date(date);
        let dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        
        console.log('=== WEEK CALCULATION DEBUG ===');
        console.log('Selected date:', selectedDate.toISOString().split('T')[0]);
        console.log('Day of week:', dayOfWeek, '(0=Sunday, 1=Monday, ..., 6=Saturday)');
        
        // Always calculate from Sunday of the current week
        // Find the most recent Sunday (including today if it's Sunday)
        const sunday = new Date(selectedDate);
        const daysToGoBack = dayOfWeek; // If today is Sunday (0), go back 0 days; if Monday (1), go back 1 day, etc.
        sunday.setDate(selectedDate.getDate() - daysToGoBack);
        
        console.log('Days to go back to Sunday:', daysToGoBack);
        console.log('Calculated Sunday:', sunday.toISOString().split('T')[0]);
        
        // Generate week dates (Sunday to Thursday only)
        const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
        const weekDates = [];
        
        for (let i = 0; i < 5; i++) { // Only 5 days: Sunday (0) to Thursday (4)
            const currentDate = new Date(sunday);
            currentDate.setDate(sunday.getDate() + i);
            const dateStr = currentDate.toISOString().split('T')[0];
            weekDates.push({
                dayName: weekDays[i],
                date: dateStr
            });
            console.log(`Day ${i}: ${weekDays[i]} = ${dateStr}`);
        }
        
        console.log('Final weekDates:', weekDates);
        console.log('=== END WEEK CALCULATION DEBUG ===');
        
        console.log('Week dates:', weekDates);
        
        // Filter attendance for the selected class only
        const studentsInClass = this.students.filter(s => s.class === classFilter);
        const classAttendance = this.attendance.filter(a => {
            const student = this.students.find(s => String(s.id) === String(a.studentId));
            return student && student.class === classFilter;
        });
        
        console.log(`Selected class: ${classFilter}`);
        console.log(`Students in class: ${studentsInClass.length}`);
        console.log(`Attendance records for class: ${classAttendance.length}`);
        
        if (classAttendance.length === 0) {
            console.log('No attendance found for class:', classFilter);
            alert(`No attendance records found for class "${classFilter}" this week.\nPlease mark some attendance for this class first.`);
            return;
        }
        
        console.log('Proceeding with export for class:', classFilter, 'with', classAttendance.length, 'records');

        // Group by days for selected class
        const classWeekGroups = {};
        weekDays.forEach(day => {
            classWeekGroups[day] = [];
        });
        
        classAttendance.forEach(attendance => {
            const student = this.students.find(s => String(s.id) === String(attendance.studentId));
            if (student && student.class === classFilter) {
                // Find which day this attendance belongs to
                const dayInfo = weekDates.find(wd => wd.date === attendance.date);
                if (dayInfo) {
                    classWeekGroups[dayInfo.dayName].push({
                        studentId: attendance.studentId,
                        studentName: student.name,
                        date: attendance.date,
                        status: attendance.status,
                        markedBy: attendance.markedBy || 'System',
                        markedAt: attendance.markedAt || new Date().toISOString()
                    });
                }
            }
        });

        // Create CSV for selected class - days in correct order
        let csvContent = [['Student ID', 'Student Name', 'Date', 'Status', 'Marked By', 'Marked At']];
        
        // Add students grouped by days in chronological order (Sunday to Thursday)
        for (let i = 0; i < weekDays.length; i++) {
            const day = weekDays[i]; // Sunday, Monday, Tuesday, Wednesday, Thursday
            if (classWeekGroups[day].length > 0) {
                csvContent.push([`=== ${day.toUpperCase()} ===`, '', '', '', '', '']); // Day header
                classWeekGroups[day].forEach(record => {
                    // Convert date to day name
                    const recordDate = new Date(record.date);
                    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
                    const dayIndex = recordDate.getDay(); // 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
                    const dayName = dayNames[dayIndex] || 'Unknown';
                    
                    console.log(`Record date: ${record.date}, Day index: ${dayIndex}, Day name: ${dayName}`);
                    
                    csvContent.push([
                        record.studentId,
                        record.studentName,
                        `${dayName} (${record.date})`, // Day name with actual date
                        record.status,
                        record.markedBy,
                        record.markedAt
                    ]);
                });
                csvContent.push(['', '', '', '', '', '']); // Empty line between days
            }
        }
        
        const csvRows = csvContent.map(row => {
            if (Array.isArray(row)) {
                return row.map(cell => `"${cell}"`).join(',');
            } else {
                return `"${row}"`;
            }
        });
        const csvString = csvRows.join('\n');

        // Add BOM for Arabic support
        const BOM = '\uFEFF';
        const csvWithBOM = BOM + csvString;
        
        // Create and download CSV file for the selected class
        console.log(`Creating CSV file for class ${classFilter}...`);
        const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
        console.log(`Blob created for ${classFilter}, size:`, blob.size, 'bytes');
        
        const url = window.URL.createObjectURL(blob);
        console.log(`Blob URL created for ${classFilter}:`, url);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_${classFilter}_week_${weekDates[0].date}_to_${weekDates[4].date}.csv`;
        a.style.display = 'none';
        
        // Add to document, trigger click, then remove
        document.body.appendChild(a);
        console.log(`Added link to document for ${classFilter}`);
        
        // Try multiple click methods
        try {
            a.click();
            console.log(`Method 1: click() called for ${classFilter}`);
        } catch (e) {
            console.log(`Method 1 failed for ${classFilter}:`, e);
        }
        
        try {
            const event = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
            });
            a.dispatchEvent(event);
            console.log(`Method 2: dispatchEvent called for ${classFilter}`);
        } catch (e) {
            console.log(`Method 2 failed for ${classFilter}:`, e);
        }
        
        // Fallback: show download link
        setTimeout(() => {
            try {
                document.body.removeChild(a);
                console.log(`Link removed from document for ${classFilter}`);
            } catch (e) {
                console.log(`Remove failed for ${classFilter}:`, e);
            }
            
            // If download didn't work, show link
            if (confirm(`Download for ${classFilter} may not have started automatically. Click OK to open download link.`)) {
                window.open(url, '_blank');
            }
        }, 1000);
        
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
            console.log(`URL revoked for ${classFilter}`);
        }, 5000);
        
        console.log('=== EXPORT ATTENDANCE COMPLETE ===');
        } catch (error) {
            console.error('Export error:', error);
            alert('Export failed: ' + error.message + '\nPlease check console for details.');
        }
    }

    exportStudents() {
        const csvContent = [
            ['ID', 'Name', 'Class', 'Phone', 'Bus Subscriber'],
            ...this.students.map(student => [
                student.id,
                student.name,
                student.class,
                student.phone,
                student.busSubscriber ? 'Yes' : 'No'
            ])
        ].map(row => row.join(',')).join('\n');

        // Fix: Add BOM for proper UTF-8 encoding to support Arabic characters
        const BOM = '\uFEFF';
        const csvWithBOM = BOM + csvContent;
        
        const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    importStudents(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csv = e.target.result;
                const lines = csv.split('\n');
                const headers = lines[0].split(',');
                
                const newStudents = [];
                // Get the next available ID to avoid conflicts
                let nextId = this.getNextStudentId();
                
                for (let i = 1; i < lines.length; i++) {
                    if (lines[i].trim() === '') continue;
                    
                    const values = lines[i].split(',');
                    if (values.length >= 4) {
                        const studentId = nextId++;
                        const student = {
                            id: studentId,
                            name: values[1].trim().replace(/"/g, ''),
                            class: values[2].trim(),
                            phone: values[3].trim(),
                            busSubscriber: values[4]?.trim().toLowerCase() === 'yes',
                            isImported: true, // Mark as imported
                            importDate: new Date().toISOString() // Track when imported
                        };
                        
                        // Mark this ID as protected
                        this.importedStudentIds.add(studentId);
                        newStudents.push(student);
                    }
                }

                if (newStudents.length > 0) {
                    this.students.push(...newStudents);
                    this.saveDataToStorage();
                    this.renderStudents();
                    this.updateDashboard();
                    alert(`Successfully imported ${newStudents.length} students! These students are now protected and will never be removed.`);
                } else {
                    alert('No valid student data found in CSV file.');
                }
            } catch (error) {
                alert('Error importing CSV file. Please check the format.');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }

    // Bus Management
    openBusModal() {
        const modal = document.getElementById('bus-modal');
        const studentSelect = document.getElementById('bus-student');
        const routeSelect = document.getElementById('bus-route');
        
        // Clear form
        studentSelect.value = '';
        routeSelect.innerHTML = '<option value="">Select Route</option>';
        
        // Populate route dropdown using route manager for live data
        const routes = routeManager.getRoutes();
        console.log('DEBUG: Routes from routeManager:', routes);
        console.log('DEBUG: Routes count:', routes.length);
        routes.forEach(route => {
            console.log('DEBUG: Adding route to dropdown:', route.name);
            routeSelect.innerHTML += `<option value="${route.name}">${route.name}</option>`;
        });
        
        // Populate student dropdown
        studentSelect.innerHTML = '<option value="">Select Student</option>';
        this.students.forEach(student => {
            const existingSubscription = this.busSubscriptions.find(b => b.studentId === student.id);
            if (!existingSubscription) {
                studentSelect.innerHTML += `<option value="${student.id}">${student.name} - Grade ${student.class}</option>`;
            }
        });
        
        modal.classList.add('show');
    }

    saveBusSubscription() {
        const studentId = parseInt(document.getElementById('bus-student').value);
        const route = document.getElementById('bus-route').value.trim();
        const monthlyFee = parseFloat(document.getElementById('bus-fee').value);

        if (!studentId || !route || !monthlyFee) {
            alert('Please fill in all required fields');
            return;
        }

        const newSubscription = {
            id: this.getNextBusId(),
            studentId,
            route,
            monthlyFee,
            status: 'active'
        };

        this.busSubscriptions.push(newSubscription);
        
        // Update student's bus subscriber status
        const student = this.students.find(s => s.id === studentId);
        if (student) {
            student.busSubscriber = true;
        }

        this.saveDataToStorage();
        this.renderBusSubscriptions();
        this.renderStudents(); // Refresh student table to update bus status
        this.updateDashboard();
        this.closeModal('bus-modal');
    }

    deleteBusSubscription(subscriptionId) {
        if (confirm('Are you sure you want to remove this bus subscription?')) {
            const subscription = this.busSubscriptions.find(b => b.id === subscriptionId);
            if (subscription) {
                // Update student's bus subscriber status
                const student = this.students.find(s => s.id === subscription.studentId);
                if (student) {
                    student.busSubscriber = false;
                }
            }
            
            this.busSubscriptions = this.busSubscriptions.filter(b => b.id !== subscriptionId);
            this.saveDataToStorage();
            this.renderBusSubscriptions();
            this.renderStudents();
            this.updateDashboard();
        }
    }

    renderBusSubscriptions() {
        const tableBody = document.getElementById('bus-table');
        const grid = document.getElementById('bus-routes-grid');
        const routesTables = document.getElementById('bus-routes-tables');
        if (!tableBody && !grid) return;

        const monthFilterEl = document.getElementById('bus-month-filter');
        const routeFilterEl = document.getElementById('bus-route-filter');
        const classFilterEl = document.getElementById('bus-class-filter');
        const monthFilter = monthFilterEl ? monthFilterEl.value : '';
        const routeFilter = routeFilterEl ? routeFilterEl.value : '';
        const classFilter = classFilterEl ? classFilterEl.value : '';
        
        // Get routes from route manager
        const routes = routeManager.getRoutes();

        // Grouped-by-route tables (index.html)
        if (routesTables) {
            routesTables.innerHTML = '';

            const makeEmpty = (msg) => {
                routesTables.innerHTML = `<div class="empty-state">${msg}</div>`;
            };

            const filteredSubsAll = (Array.isArray(this.busSubscriptions) ? this.busSubscriptions : []).filter(sub => {
                const student = this.students.find(s => String(s.id) === String(sub.studentId));
                if (!student) return false;
                const matchesClass = !classFilter || String(student.class) === String(classFilter);
                const matchesMonth = !monthFilter || String(sub.month) === String(monthFilter);
                return matchesClass && matchesMonth;
            });

            if (filteredSubsAll.length === 0) {
                makeEmpty('No bus subscriptions found');
            } else {
                const subsByRoute = new Map();
                filteredSubsAll.forEach(sub => {
                    const routeName = sub.route || 'No Route';
                    if (!subsByRoute.has(routeName)) subsByRoute.set(routeName, []);
                    subsByRoute.get(routeName).push(sub);
                });

                // Keep consistent route order
                const orderedRouteNames = routes.map(r => r.name);
                if (subsByRoute.has('No Route')) orderedRouteNames.push('No Route');
                Array.from(subsByRoute.keys()).forEach(name => {
                    if (!orderedRouteNames.includes(name)) orderedRouteNames.push(name);
                });

                orderedRouteNames.forEach(routeName => {
                    const subs = subsByRoute.get(routeName);
                    if (!subs || subs.length === 0) return;

                    const section = document.createElement('div');
                    section.className = 'table-container';
                    section.style.marginBottom = '16px';

                    const header = document.createElement('div');
                    header.className = 'section-header';
                    header.style.marginBottom = '8px';
                    header.innerHTML = `<h3 style="margin:0">${routeName}</h3>`;
                    section.appendChild(header);

                    const table = document.createElement('table');
                    table.className = 'data-table';
                    table.innerHTML = `
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Name</th>
                                <th>Class</th>
                                <th>Monthly Fee</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    `;

                    const tbody = table.querySelector('tbody');
                    subs.forEach(sub => {
                        const student = this.students.find(s => String(s.id) === String(sub.studentId));
                        if (!student) return;
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${student.id}</td>
                            <td>${student.name}</td>
                            <td>${this.getDisplayClassName(student.class)}</td>
                            <td>$${Number(sub.monthlyFee || 0).toFixed(2)}</td>
                            <td><span class="status-badge status-${sub.status}">${sub.status}</span></td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="sms.editBusSubscription(${sub.id})">Edit</button>
                                <button class="btn btn-sm btn-danger" onclick="sms.deleteBusSubscription(${sub.id})">Delete</button>
                            </td>
                        `;
                        tbody.appendChild(tr);
                    });

                    section.appendChild(table);
                    routesTables.appendChild(section);
                });
            }

            // Hide flat table when grouped view exists
            const flatContainer = tableBody ? tableBody.closest('.table-container') : null;
            if (flatContainer) flatContainer.style.display = 'none';
            return;
        } else {
            const flatContainer = tableBody ? tableBody.closest('.table-container') : null;
            if (flatContainer) flatContainer.style.display = '';
        }
        
        // Populate route filter dropdown (if it exists in the current page)
        const routeFilterSelect = document.getElementById('bus-route-filter');
        if (routeFilterSelect) {
            const currentValue = routeFilterSelect.value;
            routeFilterSelect.innerHTML = '<option value="">All Routes</option>';
            routes.forEach(route => {
                routeFilterSelect.innerHTML += `<option value="${route.name}">${route.name}</option>`;
            });
            routeFilterSelect.value = currentValue;
        }

        // Table-based rendering (index.html)
        if (tableBody) {
            tableBody.innerHTML = '';

            const filteredSubs = this.busSubscriptions.filter(sub => {
                const student = this.students.find(s => String(s.id) === String(sub.studentId));
                if (!student) return false;

                const matchesClass = !classFilter || String(student.class) === String(classFilter);
                const matchesRoute = !routeFilter || String(sub.route) === String(routeFilter);
                const matchesMonth = !monthFilter || String(sub.month) === String(monthFilter);

                return matchesClass && matchesRoute && matchesMonth;
            });

            if (filteredSubs.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7" class="empty-state">No bus subscriptions found</td></tr>';
                return;
            }

            filteredSubs.forEach(sub => {
                const student = this.students.find(s => String(s.id) === String(sub.studentId));
                if (!student) return;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${student.id}</td>
                    <td>${student.name}</td>
                    <td>${this.getDisplayClassName(student.class)}</td>
                    <td>${sub.route || ''}</td>
                    <td>$${Number(sub.monthlyFee || 0).toFixed(2)}</td>
                    <td><span class="status-badge status-${sub.status}">${sub.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="sms.editBusSubscription(${sub.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="sms.deleteBusSubscription(${sub.id})">Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            return;
        }
        
        // Group subscriptions by route
        const subscriptionsByRoute = {};
        routes.forEach(route => {
            subscriptionsByRoute[route.name] = [];
        });
        
        // Add "No Route" category for subscriptions without routes
        subscriptionsByRoute['No Route'] = [];
        
        // Group subscriptions
        this.busSubscriptions.forEach(sub => {
            const routeName = sub.route || 'No Route';
            if (!subscriptionsByRoute[routeName]) {
                subscriptionsByRoute[routeName] = [];
            }
            subscriptionsByRoute[routeName].push(sub);
        });
        
        // Clear grid
        grid.innerHTML = '';
        
        // Create route sections
        let hasContent = false;
        
        Object.entries(subscriptionsByRoute).forEach(([routeName, subscriptions]) => {
            // Apply filters
            let filteredSubscriptions = subscriptions.filter(sub => {
                const student = this.students.find(s => String(s.id) === String(sub.studentId));
                if (!student) return false;
                
                const matchesRoute = !routeFilter || routeName === routeFilter;
                const matchesClass = !classFilter || student.class === classFilter;
                
                return matchesRoute && matchesClass;
            });
            
            // Skip if no subscriptions after filtering
            if (filteredSubscriptions.length === 0) {
                return;
            }
            
            hasContent = true;
            
            // Create route section
            const routeSection = document.createElement('div');
            routeSection.className = 'route-section';
            
            // Route header
            const routeHeader = document.createElement('div');
            routeHeader.className = 'route-header';
            routeHeader.innerHTML = `
                <h3 class="route-title">${routeName}</h3>
                <span class="route-count">${filteredSubscriptions.length} students</span>
            `;
            
            // Students grid
            const studentsGrid = document.createElement('div');
            studentsGrid.className = 'route-students-grid';
            
            filteredSubscriptions.forEach(sub => {
                const student = this.students.find(s => String(s.id) === String(sub.studentId));
                if (!student) return;
                
                const studentCard = document.createElement('div');
                studentCard.className = 'bus-student-card';
                studentCard.innerHTML = `
                    <div class="bus-student-info">
                        <div class="bus-student-name">${student.name}</div>
                        <div class="bus-student-class">Grade ${student.class}</div>
                    </div>
                    <div class="bus-student-details">
                        <span class="bus-student-fee">$${sub.monthlyFee}/month</span>
                        <span class="bus-student-status ${sub.status}">${sub.status}</span>
                    </div>
                    <div class="bus-student-actions">
                        <button class="btn btn-sm btn-primary" onclick="sms.editBusSubscription(${sub.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="sms.deleteBusSubscription(${sub.id})">Delete</button>
                    </div>
                `;
                studentsGrid.appendChild(studentCard);
            });
            
            routeSection.appendChild(routeHeader);
            routeSection.appendChild(studentsGrid);
            grid.appendChild(routeSection);
        });
        
        // Show empty state if no content
        if (!hasContent) {
            grid.innerHTML = '<div class="empty-state">No bus subscriptions found matching the selected filters.</div>';
        }
    }

    // Route Management
    openRouteModal() {
        const modal = document.getElementById('route-modal');
        const routeNameInput = document.getElementById('route-name');
        const routeAreaInput = document.getElementById('route-area');
        const routesList = document.getElementById('current-routes-list');
        
        // Clear form
        routeNameInput.value = '';
        routeAreaInput.value = '';
        
        // Populate routes list
        const routes = routeManager.getRoutes();
        routesList.innerHTML = '';
        
        if (routes.length === 0) {
            routesList.innerHTML = '<div class="empty-state">No routes found. Add your first route below!</div>';
        } else {
            routes.forEach(route => {
                const routeItem = document.createElement('div');
                routeItem.className = 'route-item';
                routeItem.innerHTML = `
                    <div class="route-info">
                        <div class="route-name">${route.name}</div>
                        <div class="route-area">${route.area}</div>
                    </div>
                    <div class="route-actions">
                        <button class="btn btn-sm btn-primary" onclick="sms.editRoute(${route.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="sms.deleteRoute(${route.id})">Delete</button>
                    </div>
                `;
                routesList.appendChild(routeItem);
            });
        }
        
        modal.classList.add('show');
    }

    saveRoute() {
        console.log('=== SAVE ROUTE START (INDEPENDENT SYSTEM) ===');
        const routeName = document.getElementById('route-name').value.trim();
        const routeArea = document.getElementById('route-area').value.trim();

        console.log('Saving route:', { routeName, routeArea });

        if (!routeName || !routeArea) {
            alert('Please fill in all required fields');
            return;
        }

        // Use independent route manager
        const newRoute = routeManager.addRoute(routeName, routeArea);
        
        console.log('Route added via route manager:', newRoute);
        
        // Update local reference
        this.busRoutes = routeManager.getRoutes();
        console.log('Updated local routes:', this.busRoutes.length);
        
        this.closeModal('route-modal');
        
        // Update bus dropdown
        this.renderBusSubscriptions();
        
        console.log('=== SAVE ROUTE END (INDEPENDENT SYSTEM) ===');
    }

    getNextRouteId() {
        if (this.busRoutes.length === 0) {
            return 1;
        }
        // Find the highest existing ID and add 1
        const maxId = Math.max(...this.busRoutes.map(route => route.id));
        return maxId + 1;
    }

    deleteRoute(routeId) {
        console.log('=== DELETE ROUTE START ===');
        console.log('Route ID to delete:', routeId);
        console.log('Current routes before delete:', routeManager.getRoutes());
        
        if (!confirm('Are you sure you want to delete this route? This will affect all bus subscriptions using this route.')) {
            console.log('User cancelled deletion');
            return;
        }

        // Use independent route manager
        const deletedRoute = routeManager.deleteRoute(routeId);
        
        console.log('Route manager delete result:', deletedRoute);
        
        if (deletedRoute) {
            console.log('Route deleted via route manager:', deletedRoute);
            
            // Update local reference
            this.busRoutes = routeManager.getRoutes();
            console.log('Updated local routes after delete:', this.busRoutes.length);
            
            // Update bus subscriptions that use this route
            this.busSubscriptions.forEach(sub => {
                if (sub.route && sub.route.includes(deletedRoute.name)) {
                    sub.route = 'Route Removed - Please Update';
                }
            });

            this.saveDataToStorage();
            this.renderBusSubscriptions();
            this.renderStudents();
            this.updateDashboard();
        }
    }
 // Dashboard
    updateDashboard() {
        this.updateStatistics();
        this.updateClassDistribution();
        this.updateAlerts();
        this.updateRecentActivity();
        this.updateFeeProgress();
        this.updateAttendanceChart();
    }

    updateStatistics() {
        // Total Students
        document.getElementById('total-students').textContent = this.students.length;

        // Today's Attendance
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = this.attendance.filter(a => a.date === today);
        const presentCount = todayAttendance.filter(a => a.status === 'present').length;
        const absentCount = todayAttendance.filter(a => a.status === 'absent').length;

        document.getElementById('attendance-today').textContent = presentCount;
        document.getElementById('absent-today').textContent = absentCount;

        // Attendance Rate
        const attendanceRate = todayAttendance.length > 0 ? 
            Math.round((presentCount / todayAttendance.length) * 100) : 0;
        document.getElementById('attendance-rate').textContent = `${attendanceRate}%`;

        // Monthly Fee Collection
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const monthlyFees = (Array.isArray(this.feePayments) ? this.feePayments : []).filter(f => {
            if (!f || f.status !== 'paid') return false;
            const fallbackDate = f.paymentDate ? new Date(f.paymentDate) : null;
            const m = Number(f.month ?? (fallbackDate ? (fallbackDate.getMonth() + 1) : NaN));
            const y = Number(f.year ?? (fallbackDate ? fallbackDate.getFullYear() : NaN));
            return m === currentMonth && y === currentYear;
        });
        const totalCollected = monthlyFees.reduce((sum, fee) => sum + Number(fee.total || 0), 0);
        const feeCollectionEl = document.getElementById('fee-collection');
        if (feeCollectionEl) feeCollectionEl.textContent = `$${totalCollected.toFixed(2)}`;

        // Bus Subscriptions
        const activeBusSubscriptions = this.busSubscriptions.filter(b => b.status === 'active').length;
        document.getElementById('bus-subscriptions').textContent = activeBusSubscriptions;
    }

    updateClassDistribution() {
        const classDistribution = {};
        
        // Count students by class
        this.students.forEach(student => {
            const className = this.getDisplayClassName(student.class);
            classDistribution[className] = (classDistribution[className] || 0) + 1;
        });

        const classGrid = document.getElementById('class-distribution');
        classGrid.innerHTML = '';

        Object.entries(classDistribution).forEach(([className, count]) => {
            const classItem = document.createElement('div');
            classItem.className = 'class-item';
            classItem.innerHTML = `
                <div class="class-name">${className}</div>
                <div class="class-count">${count}</div>
            `;
            classGrid.appendChild(classItem);
        });
    }

    updateAlerts() {
        const alerts = [];
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        // Unpaid fees alert
        const unpaidStudents = this.students.filter(student => {
            const feeStatus = this.getStudentFeeStatus(student.id);
            return feeStatus.status === 'unpaid';
        });

        if (unpaidStudents.length > 0) {
            alerts.push({
                type: 'warning',
                icon: '💰',
                title: 'Unpaid Fees',
                message: `${unpaidStudents.length} students have unpaid fees for this month`
            });
        }

        // Missing attendance alert
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = this.attendance.filter(a => a.date === today);
        const expectedAttendance = this.students.length;
        
        if (todayAttendance.length < expectedAttendance) {
            const missingCount = expectedAttendance - todayAttendance.length;
            alerts.push({
                type: 'danger',
                icon: '📝',
                title: 'Missing Attendance',
                message: `${missingCount} students' attendance not marked today`
            });
        }

        // Render alerts
        const alertsContainer = document.getElementById('alerts-container');
        alertsContainer.innerHTML = '';

        if (alerts.length === 0) {
            alertsContainer.innerHTML = `
                <div class="alert-item success">
                    <span class="alert-icon">✅</span>
                    <div class="alert-content">
                        <div class="alert-title">All Systems Good</div>
                        <div class="alert-message">No alerts at this time</div>
                    </div>
                </div>
            `;
        } else {
            alerts.forEach(alert => {
                const alertItem = document.createElement('div');
                alertItem.className = `alert-item ${alert.type}`;
                alertItem.innerHTML = `
                    <span class="alert-icon">${alert.icon}</span>
                    <div class="alert-content">
                        <div class="alert-title">${alert.title}</div>
                        <div class="alert-message">${alert.message}</div>
                    </div>
                `;
                alertsContainer.appendChild(alertItem);
            });
        }
    }

    updateRecentActivity() {
        const activities = [];
        const now = new Date();

        // Recent fee payments
        const recentPayments = this.feePayments
            .filter(p => {
                const paymentDate = new Date(p.paymentDate);
                return (now - paymentDate) < (7 * 24 * 60 * 60 * 1000); // Last 7 days
            })
            .slice(-5)
            .reverse();

        recentPayments.forEach(payment => {
            const student = this.students.find(s => s.id === payment.studentId);
            if (student) {
                activities.push({
                    icon: '💰',
                    title: `Fee payment recorded for ${student.name}`,
                    time: this.formatTimeAgo(payment.paymentDate)
                });
            }
        });

        // Render activities
        const activityList = document.getElementById('recent-activity');
        activityList.innerHTML = '';

        if (activities.length === 0) {
            activityList.innerHTML = '<div class="activity-item"><div class="activity-content"><div class="activity-title">No recent activity</div></div></div>';
        } else {
            activities.slice(0, 10).forEach(activity => {
                const activityItem = document.createElement('div');
                activityItem.className = 'activity-item';
                activityItem.innerHTML = `
                    <div class="activity-icon">${activity.icon}</div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-time">${activity.time}</div>
                    </div>
                `;
                activityList.appendChild(activityItem);
            });
        }
    }

    updateFeeProgress() {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        // Calculate expected fees
        const expectedFees = this.students.length * 50; // Assuming $50 per student
        
        // Calculate collected fees
        const collectedFees = (Array.isArray(this.feePayments) ? this.feePayments : [])
            .filter(f => {
                if (!f || f.status !== 'paid') return false;
                const fallbackDate = f.paymentDate ? new Date(f.paymentDate) : null;
                const m = Number(f.month ?? (fallbackDate ? (fallbackDate.getMonth() + 1) : NaN));
                const y = Number(f.year ?? (fallbackDate ? fallbackDate.getFullYear() : NaN));
                return m === currentMonth && y === currentYear;
            })
            .reduce((sum, fee) => sum + Number(fee.total || 0), 0);

        // Calculate percentage
        const percentage = expectedFees > 0 ? Math.round((collectedFees / expectedFees) * 100) : 0;

        // Update UI
        document.getElementById('fees-collected-text').textContent = `$${Number(collectedFees || 0).toFixed(2)} collected`;
        document.getElementById('fees-total-text').textContent = `$${Number(expectedFees || 0).toFixed(2)} total`;
        document.getElementById('fees-progress').style.width = `${percentage}%`;
        document.getElementById('fees-percentage').textContent = `${percentage}%`;
    }

    updateAttendanceChart() {
        const chart = document.getElementById('attendance-chart');
        const last7Days = [];
        const attendanceData = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            last7Days.push(dayName);
            
            const dayAttendance = this.attendance.filter(a => a.date === dateStr);
            const presentCount = dayAttendance.filter(a => a.status === 'present').length;
            attendanceData.push(presentCount);
        }

        // Simple text representation of chart
        const maxAttendance = Math.max(...attendanceData, 1);
        
        let chartHTML = '<div style="display: flex; align-items: flex-end; height: 100%; gap: 8px; padding: 10px;">';
        
        attendanceData.forEach((count, index) => {
            const height = (count / maxAttendance) * 150;
            const color = count > 0 ? '#4CAF50' : '#e0e0e0';
            
            chartHTML += `
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;">
                    <div style="width: 100%; height: ${height}px; background: ${color}; border-radius: 4px 4px 0 0;"></div>
                    <div style="font-size: 10px; color: #666;">${last7Days[index]}</div>
                    <div style="font-size: 9px; font-weight: bold;">${count}</div>
                </div>
            `;
        });
        
        chartHTML += '</div>';
        chart.innerHTML = chartHTML;
    }

    // Quick Action Methods
    markTodayAttendance() {
        this.switchSection('attendance');
        setTimeout(() => {
            document.getElementById('attendance-date').focus();
        }, 100);
    }

    generateMonthlyReport() {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
        
        let report = `Monthly Report - ${monthNames[currentMonth]} ${currentYear}\n\n`;
        report += `Total Students: ${this.students.length}\n\n`;
        
        // Create and download report
        const blob = new Blob([report], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `monthly-report-${currentMonth}-${currentYear}.txt`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    sendFeeReminders() {
        const unpaidStudents = this.students.filter(student => {
            const feeStatus = this.getStudentFeeStatus(student.id);
            return feeStatus.status === 'unpaid';
        });

        if (unpaidStudents.length === 0) {
            alert('All students have paid their fees!');
            return;
        }

        alert(`Generated fee reminders for ${unpaidStudents.length} students!`);
    }

    exportAllData() {
        console.log('Exporting all data...');
        const allData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: {
                students: this.students,
                attendance: this.attendance,
                busSubscriptions: this.busSubscriptions,
                busRoutes: this.busRoutes,
                feePayments: this.feePayments
            },
            metadata: {
                totalStudents: Array.isArray(this.students) ? this.students.length : 0,
                totalAttendance: Array.isArray(this.attendance) ? this.attendance.length : 0,
                totalBusSubscriptions: Array.isArray(this.busSubscriptions) ? this.busSubscriptions.length : 0,
                totalBusRoutes: Array.isArray(this.busRoutes) ? this.busRoutes.length : 0,
                totalFeePayments: Array.isArray(this.feePayments) ? this.feePayments.length : 0
            }
        };

        const dataStr = JSON.stringify(allData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
        const url = window.URL.createObjectURL(dataBlob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `school_data_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
        console.log('Data exported successfully');
    }

    // Helper Methods
    getDisplayClassName(className) {
        // Handle special class names with gender
        if (className === 'KG1' || className === 'KG2') {
            return className;
        } else if (className === '4 Boys' || className === '6 Boys' || className === '7 Boys' || className === '8 Boys') {
            return `Grade ${className}`;
        } else if (className === '4 Girls' || className === '6 Girls' || className === '7 Girls' || className === '8 Girls') {
            return `Grade ${className}`;
        } else {
            return `Grade ${className}`;
        }
    }

    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    }

    // Utility Functions
    setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('attendance-date').value = today;
        document.getElementById('fee-date').value = today;
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
        if (modalId === 'student-modal') {
            this.currentEditingStudent = null;
        }
    }
}

SchoolManagementSystem.prototype.openFeeModal = function() {
    const modal = document.getElementById('fee-modal');
    const studentSelect = document.getElementById('fee-student');
    const monthSelect = document.getElementById('fee-month');
    const dateInput = document.getElementById('fee-date');
    const validityInput = document.getElementById('fee-validity-days');
    if (!modal || !studentSelect) return;

    let students = Array.isArray(this.students) ? this.students : [];
    if (students.length === 0) {
        try {
            const saved = localStorage.getItem('school_students');
            if (saved) {
                students = JSON.parse(saved) || [];
                this.students = students;
            }
        } catch (_) {
            // ignore
        }
    }

    const renderStudents = () => {
        if (!studentSelect) return;
        const optionsHtml = ['<option value="">Select Student</option>']
            .concat(students.map(student => `<option value="${student.id}">${student.name} - Grade ${student.class}</option>`))
            .join('');
        studentSelect.innerHTML = optionsHtml;
    };

    renderStudents();

    if (students.length > 0 && studentSelect.options.length <= 1) {
        setTimeout(() => {
            renderStudents();
        }, 50);
    }

    if (monthSelect && monthSelect.options.length <= 1) {
        monthSelect.innerHTML = '<option value="">Select Month</option>';
        const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        monthNames.forEach((name, idx) => {
            const opt = document.createElement('option');
            opt.value = String(idx + 1);
            opt.textContent = name;
            monthSelect.appendChild(opt);
        });
    }

    if (monthSelect) {
        monthSelect.value = String(new Date().getMonth() + 1);
    }
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    if (validityInput) {
        validityInput.value = String(Number(this.feeValidityDays) || 30);
    }

    modal.classList.add('show');
};

SchoolManagementSystem.prototype.saveFeePayment = function() {
    const validityInput = document.getElementById('fee-validity-days');
    if (validityInput) {
        const n = Number(validityInput.value);
        if (!Number.isNaN(n) && n > 0) {
            this.feeValidityDays = n;
            localStorage.setItem('school_fee_validity_days', String(n));
        }
    }

    const studentId = parseInt(document.getElementById('fee-student').value);
    const month = document.getElementById('fee-month').value;
    const tuitionFee = parseFloat(document.getElementById('fee-tuition').value);
    const busFee = parseFloat(document.getElementById('fee-bus').value) || 0;
    const paymentDate = document.getElementById('fee-date').value;

    if (!studentId || !month || !tuitionFee || !paymentDate) {
        alert('Please fill in all required fields');
        return;
    }

    const existingPayment = this.feePayments.find(f =>
        String(f.studentId) === String(studentId) && String(f.month) === String(month)
    );

    if (existingPayment) {
        if (!confirm('Payment for this student and month already exists. Do you want to overwrite it?')) {
            return;
        }
        this.feePayments = this.feePayments.filter(f =>
            !(String(f.studentId) === String(studentId) && String(f.month) === String(month))
        );
    }

    const newPayment = {
        id: this.getNextFeeId(),
        studentId,
        month,
        year: new Date(paymentDate).getFullYear(),
        tuitionFee,
        busFee,
        total: tuitionFee + busFee,
        paymentDate,
        status: 'paid'
    };

    this.feePayments.push(newPayment);
    this.saveDataToStorage();
    if (typeof this.renderFeePayments === 'function') {
        this.renderFeePayments();
    }
    if (typeof this.renderStudents === 'function') {
        this.renderStudents();
    }
    if (typeof this.updateDashboard === 'function') {
        this.updateDashboard();
    }
    this.closeModal('fee-modal');
};

SchoolManagementSystem.prototype.deleteFeePayment = function(paymentId) {
    if (confirm('Are you sure you want to delete this payment record?')) {
        this.feePayments = this.feePayments.filter(f => f.id !== paymentId);
        this.saveDataToStorage();
        if (typeof this.renderFeePayments === 'function') {
            this.renderFeePayments();
        }
        if (typeof this.renderStudents === 'function') {
            this.renderStudents();
        }
        if (typeof this.updateDashboard === 'function') {
            this.updateDashboard();
        }
    }
};

SchoolManagementSystem.prototype.refreshRoutesUI = function() {
    this.busRoutes = routeManager.getRoutes();
    if (typeof this.renderBusSubscriptions === 'function') {
        this.renderBusSubscriptions();
    }
};

SchoolManagementSystem.prototype.openRouteModal = function() {
    const modal = document.getElementById('route-modal');
    const routeNameInput = document.getElementById('route-name');
    const routeAreaInput = document.getElementById('route-area');
    const routesList = document.getElementById('current-routes-list');
    if (!modal || !routeNameInput || !routeAreaInput || !routesList) return;

    routeNameInput.value = '';
    routeAreaInput.value = '';

    const routes = routeManager.getRoutes();
    routesList.innerHTML = '';
    if (routes.length === 0) {
        routesList.innerHTML = '<div class="empty-state">No routes found. Add your first route below!</div>';
    } else {
        routes.forEach(route => {
            const routeItem = document.createElement('div');
            routeItem.className = 'route-item';
            routeItem.innerHTML = `
                <div class="route-info">
                    <div class="route-name">${route.name}</div>
                    <div class="route-area">${route.area}</div>
                </div>
                <div class="route-actions">
                    <button class="btn btn-sm btn-primary" onclick="sms.editRoute(${route.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="sms.deleteRoute(${route.id})">Delete</button>
                </div>
            `;
            routesList.appendChild(routeItem);
        });
    }

    const saveBtn = modal.querySelector('button[type="submit"]');
    if (saveBtn) {
        saveBtn.textContent = 'Save Route';
        saveBtn.type = 'submit';
        saveBtn.onclick = null;
    }

    modal.classList.add('show');
};

SchoolManagementSystem.prototype.saveRoute = function() {
    const routeName = document.getElementById('route-name')?.value?.trim();
    const routeArea = document.getElementById('route-area')?.value?.trim();

    if (!routeName || !routeArea) {
        alert('Please fill in all required fields');
        return;
    }

    routeManager.addRoute(routeName, routeArea);
    this.refreshRoutesUI();
    this.closeModal('route-modal');
};

SchoolManagementSystem.prototype.renderFeePayments = function() {
    const monthFilterEl = document.getElementById('fees-month');
    const classFilterEl = document.getElementById('fees-class-filter');
    const tbody = document.getElementById('fees-table');
    if (!tbody) return;

    const monthFilter = monthFilterEl ? monthFilterEl.value : '';
    const classFilter = classFilterEl ? classFilterEl.value : '';

    let filteredPayments = Array.isArray(this.feePayments) ? this.feePayments : [];

    if (monthFilter) {
        filteredPayments = filteredPayments.filter(f => String(f.month) === String(monthFilter));
    }

    if (classFilter) {
        const studentsInClass = this.students
            .filter(s => String(s.class) === String(classFilter))
            .map(s => String(s.id));
        filteredPayments = filteredPayments.filter(f => studentsInClass.includes(String(f.studentId)));
    }

    tbody.innerHTML = '';

    if (filteredPayments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="empty-state">No fee payments found</td></tr>';
        return;
    }

    const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    filteredPayments.forEach(payment => {
        const student = this.students.find(s => String(s.id) === String(payment.studentId));
        if (!student) return;

        const paymentTime = payment.paymentDate ? new Date(payment.paymentDate).getTime() : NaN;
        const validityDays = Number(this.feeValidityDays) || 30;
        const diffDays = !Number.isNaN(paymentTime) ? ((Date.now() - paymentTime) / (1000 * 60 * 60 * 24)) : Infinity;
        const isPaidRecently = !Number.isNaN(paymentTime) && diffDays <= validityDays;
        const effectiveStatus = (payment.status === 'paid' && isPaidRecently) ? 'paid' : 'unpaid';
        const daysLeft = Math.ceil(validityDays - diffDays);
        const validityText = effectiveStatus === 'paid'
            ? `${Math.max(0, daysLeft)} days left`
            : `Overdue ${Math.abs(daysLeft)} days`;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.name}</td>
            <td>${this.getDisplayClassName(student.class)}</td>
            <td>${monthNames[Number(payment.month)] || payment.month}</td>
            <td>$${Number(payment.tuitionFee || 0).toFixed(2)}</td>
            <td>$${Number(payment.busFee || 0).toFixed(2)}</td>
            <td><strong>$${Number(payment.total || 0).toFixed(2)}</strong></td>
            <td>${payment.paymentDate || ''}</td>
            <td>${validityText}</td>
            <td><span class="status-badge status-${effectiveStatus}">${effectiveStatus}</span></td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="sms.deleteFeePayment(${payment.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
};

SchoolManagementSystem.prototype.editRoute = function(routeId) {
    const routes = routeManager.getRoutes();
    const route = routes.find(r => String(r.id) === String(routeId));
    if (!route) return;

    const modal = document.getElementById('route-modal');
    const routeNameInput = document.getElementById('route-name');
    const routeAreaInput = document.getElementById('route-area');
    if (!modal || !routeNameInput || !routeAreaInput) return;

    routeNameInput.value = route.name;
    routeAreaInput.value = route.area;

    const saveBtn = modal.querySelector('button[type="submit"]');
    if (saveBtn) {
        saveBtn.textContent = 'Update Route';
        saveBtn.type = 'button';
        saveBtn.onclick = () => this.updateRoute(routeId);
    }

    const formContainer = modal.querySelector('.route-form-container');
    if (formContainer) {
        formContainer.scrollIntoView({ behavior: 'smooth' });
    }

    modal.classList.add('show');
};

SchoolManagementSystem.prototype.updateRoute = function(routeId) {
    const modal = document.getElementById('route-modal');
    const routeName = document.getElementById('route-name')?.value?.trim();
    const routeArea = document.getElementById('route-area')?.value?.trim();

    if (!routeName || !routeArea) {
        alert('Please fill in all required fields');
        return;
    }

    const updated = routeManager.updateRoute(routeId, routeName, routeArea);
    if (!updated) return;

    this.busRoutes = routeManager.getRoutes();

    if (typeof this.refreshRoutesUI === 'function') {
        this.refreshRoutesUI();
    }

    if (typeof this.saveDataToStorage === 'function') {
        this.saveDataToStorage();
    }
    if (typeof this.renderBusSubscriptions === 'function') {
        this.renderBusSubscriptions();
    }

    const saveBtn = modal?.querySelector('button');
    if (saveBtn) {
        saveBtn.textContent = 'Save Route';
        saveBtn.type = 'submit';
        saveBtn.onclick = null;
    }

    if (typeof this.openRouteModal === 'function') {
        this.openRouteModal();
    } else {
        this.closeModal('route-modal');
    }
};

SchoolManagementSystem.prototype.deleteRoute = function(routeId) {
    if (!confirm('Are you sure you want to delete this route? This will affect all bus subscriptions using this route.')) {
        return;
    }

    const deletedRoute = routeManager.deleteRoute(routeId);
    if (!deletedRoute) return;

    this.busRoutes = routeManager.getRoutes();

    // Update bus subscriptions that use this route
    (Array.isArray(this.busSubscriptions) ? this.busSubscriptions : []).forEach(sub => {
        if (sub.route && String(sub.route) === String(deletedRoute.name)) {
            sub.route = 'Route Removed - Please Update';
        }
    });

    if (typeof this.saveDataToStorage === 'function') {
        this.saveDataToStorage();
    }

    if (typeof this.openRouteModal === 'function') {
        this.openRouteModal();
    }
    if (typeof this.refreshRoutesUI === 'function') {
        this.refreshRoutesUI();
    }
    if (typeof this.renderStudents === 'function') {
        this.renderStudents();
    }
    if (typeof this.updateDashboard === 'function') {
        this.updateDashboard();
    }
};

SchoolManagementSystem.prototype.editBusSubscription = function(subscriptionId) {
    const subscription = (Array.isArray(this.busSubscriptions) ? this.busSubscriptions : [])
        .find(s => String(s.id) === String(subscriptionId));
    if (!subscription) return;

    const modal = document.getElementById('bus-modal');
    const studentSelect = document.getElementById('bus-student');
    const routeSelect = document.getElementById('bus-route');
    const feeInput = document.getElementById('bus-fee');
    if (!modal || !studentSelect || !routeSelect || !feeInput) return;

    // Populate routes
    const routes = routeManager.getRoutes();
    routeSelect.innerHTML = '<option value="">Select Route</option>';
    routes.forEach(r => {
        routeSelect.innerHTML += `<option value="${r.name}">${r.name}</option>`;
    });

    // Populate students (include the current one)
    studentSelect.innerHTML = '<option value="">Select Student</option>';
    (Array.isArray(this.students) ? this.students : []).forEach(student => {
        const isCurrent = String(student.id) === String(subscription.studentId);
        const hasOtherSubscription = this.busSubscriptions.some(b => String(b.studentId) === String(student.id) && String(b.id) !== String(subscription.id));
        if (isCurrent || !hasOtherSubscription) {
            studentSelect.innerHTML += `<option value="${student.id}">${student.name} - Grade ${student.class}</option>`;
        }
    });

    studentSelect.value = String(subscription.studentId);
    routeSelect.value = subscription.route || '';
    feeInput.value = String(subscription.monthlyFee ?? '');

    const saveBtn = modal.querySelector('button[type="submit"]');
    if (saveBtn) {
        saveBtn.textContent = 'Update Subscription';
        saveBtn.type = 'button';
        saveBtn.onclick = () => this.updateBusSubscription(subscriptionId);
    }

    modal.classList.add('show');
};

SchoolManagementSystem.prototype.updateBusSubscription = function(subscriptionId) {
    const studentId = parseInt(document.getElementById('bus-student')?.value);
    const route = document.getElementById('bus-route')?.value?.trim();
    const monthlyFee = parseFloat(document.getElementById('bus-fee')?.value);

    if (!studentId || !route || !monthlyFee) {
        alert('Please fill in all required fields');
        return;
    }

    const idx = this.busSubscriptions.findIndex(s => String(s.id) === String(subscriptionId));
    if (idx === -1) return;

    this.busSubscriptions[idx] = {
        ...this.busSubscriptions[idx],
        studentId,
        route,
        monthlyFee,
        status: this.busSubscriptions[idx].status || 'active'
    };

    const student = (Array.isArray(this.students) ? this.students : []).find(s => String(s.id) === String(studentId));
    if (student) student.busSubscriber = true;

    if (typeof this.saveDataToStorage === 'function') this.saveDataToStorage();
    if (typeof this.renderBusSubscriptions === 'function') this.renderBusSubscriptions();
    if (typeof this.renderStudents === 'function') this.renderStudents();
    if (typeof this.updateDashboard === 'function') this.updateDashboard();

    const modal = document.getElementById('bus-modal');
    const saveBtn = modal?.querySelector('button');
    if (saveBtn) {
        saveBtn.textContent = 'Save Subscription';
        saveBtn.type = 'submit';
        saveBtn.onclick = null;
    }

    if (typeof this.openBusModal === 'function') {
        this.openBusModal();
    } else {
        this.closeModal('bus-modal');
    }
};

SchoolManagementSystem.prototype.deleteBusSubscription = function(subscriptionId) {
    if (!confirm('Are you sure you want to remove this bus subscription?')) return;

    const subscription = this.busSubscriptions.find(b => String(b.id) === String(subscriptionId));
    if (subscription) {
        const student = (Array.isArray(this.students) ? this.students : []).find(s => String(s.id) === String(subscription.studentId));
        if (student) {
            student.busSubscriber = false;
        }
    }

    this.busSubscriptions = this.busSubscriptions.filter(b => String(b.id) !== String(subscriptionId));
    if (typeof this.saveDataToStorage === 'function') this.saveDataToStorage();
    if (typeof this.renderBusSubscriptions === 'function') this.renderBusSubscriptions();
    if (typeof this.renderStudents === 'function') this.renderStudents();
    if (typeof this.updateDashboard === 'function') this.updateDashboard();
};

/*

// Global Functions for onclick handlers
function openStudentModal(studentId = null) {
    sms.openStudentModal(studentId);
}

function openBusModal() {
    sms.openBusModal();
}

function openRouteModal() {
    sms.openRouteModal();
}

function openFeeModal() {
    if (window.sms && typeof window.sms.openFeeModal === 'function') {
        window.sms.openFeeModal();
        return;
    }

    const modal = document.getElementById('fee-modal');
    const studentSelect = document.getElementById('fee-student');
    if (!modal || !studentSelect) return;

    studentSelect.innerHTML = '<option value="">Select Student</option>';
    if (window.sms && Array.isArray(window.sms.students)) {
        window.sms.students.forEach(student => {
            studentSelect.innerHTML += `<option value="${student.id}">${student.name} - Grade ${student.class}</option>`;
        });
    }

    modal.classList.add('show');
}

function markTodayAttendance() {
    sms.markTodayAttendance();
}

function closeModal(modalId) {
    sms.closeModal(modalId);
}

// Test function for debugging
function testAttendanceFunction() {
    console.log('Test function called');
    if (window.sms && window.sms.markStudentAttendance) {
        console.log('sms.markStudentAttendance is available');
        alert('Attendance functions are working!');
    } else {
        console.error('sms.markStudentAttendance is NOT available');
        alert('Error: Attendance functions not available');
    }
}

// Test function for export
function testExport() {
    console.log('=== TESTING EXPORT FUNCTION ===');
    console.log('window.sms available:', !!window.sms);
    console.log('exportAttendance available:', !!(window.sms && window.sms.exportAttendance));
    
    if (window.sms && window.sms.exportAttendance) {
        console.log('Students count:', window.sms.students.length);
        console.log('Attendance count:', window.sms.attendance.length);
        console.log('Date field value:', document.getElementById('attendance-date').value);
        console.log('Class filter value:', document.getElementById('attendance-class-filter').value);
        
        // Check if there are any attendance records for today
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = window.sms.attendance.filter(a => a.date === today);
        console.log('Today attendance records:', todayAttendance.length);
        
        if (todayAttendance.length === 0) {
            alert('No attendance records for today!\nPlease mark some attendance first, then try export.');
        } else {
            alert('Export function is working!\nFound ' + todayAttendance.length + ' attendance records for today.');
        }
    } else {
        alert('Export function not available - check console');
    }
}

// Add missing toggleAttendanceView function
function toggleAttendanceView() {
    console.log('Toggle attendance view called');
    // Simple toggle between grid and list view
    const grid = document.getElementById('attendance-grid');
    if (grid) {
        if (grid.style.display === 'none') {
            grid.style.display = 'grid';
            console.log('Showing grid view');
        } else {
            grid.style.display = 'none';
            console.log('Hiding grid view');
        }
    }
}

// Simple export test function
function testExportButton() {
    console.log('=== EXPORT BUTTON TEST ===');
    console.log('window.sms available:', !!window.sms);
    console.log('exportAttendance function available:', !!(window.sms && window.sms.exportAttendance));
    
    if (window.sms && window.sms.exportAttendance) {
        console.log('Students count:', window.sms.students.length);
        console.log('Attendance count:', window.sms.attendance.length);
        
        // Check today's attendance
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = window.sms.attendance.filter(a => a.date === today);
        console.log('Today attendance records:', todayAttendance.length);
        
        if (todayAttendance.length === 0) {
            alert('No attendance for today!\nPlease mark some attendance first:\n1. Click "✅ All Present" OR\n2. Click individual Present/Absent buttons\n3. Then try export again.');
        } else {
            alert('Found ' + todayAttendance.length + ' attendance records for today. Export should work!');
        }
    } else {
        alert('Export function not available');
    }
}
window.testExportButton = testExportButton;

// Test function for individual buttons
function testIndividualButton() {
    console.log('=== TESTING INDIVIDUAL BUTTONS ===');
    console.log('window.sms available:', !!window.sms);
    console.log('window.markAttendance available:', !!window.markAttendance);
    
    if (window.sms && window.markAttendance) {
        // Get first student ID if available
        if (window.sms.students && window.sms.students.length > 0) {
            const firstStudent = window.sms.students[0];
            console.log('Testing with student:', firstStudent.id, firstStudent.name);
            
            // Test the function directly
            window.markAttendance(firstStudent.id, 'present');
            alert('Test completed! Check console for details.');
        } else {
            alert('No students available for testing');
        }
    } else {
        alert('Functions not available - check console');
    }
}

// Remove duplicate students (same name and class)
const uniqueStudents = [];
const seenStudents = new Set();
        
        for (const student of this.students) {
            const key = `${student.name.toLowerCase()}-${student.class}`;
            if (!seenStudents.has(key)) {
                seenStudents.add(key);
                uniqueStudents.push(student);
            } else {
                console.log('Removing duplicate student:', student.name, student.class);
                cleaned = true;
            }
        }
        
        if (cleaned) {
            this.students = uniqueStudents;
        }
        
        // Validate and clean attendance data
        this.attendance = this.attendance.filter(record => {
            if (!record || !record.id || !record.studentId || !record.date) {
                console.log('Removing invalid attendance record:', record);
                cleaned = true;
                return false;
            }
            
            // Ensure student exists
            const studentExists = this.students.some(s => String(s.id) === String(record.studentId));
            if (!studentExists) {
                console.log('Removing attendance for non-existent student:', record.studentId);
                cleaned = true;
                return false;
            }
            
            // Ensure valid status
            if (!['present', 'absent', 'late'].includes(record.status)) {
                record.status = 'present';
                cleaned = true;
            }
            
            return true;
        });
        
        // Validate and clean bus subscriptions
        this.busSubscriptions = this.busSubscriptions.filter(sub => {
            if (!sub || !sub.id || !sub.studentId) {
                console.log('Removing invalid bus subscription:', sub);
                cleaned = true;
                return false;
            }
            
            // Ensure student exists
            const studentExists = this.students.some(s => String(s.id) === String(sub.studentId));
            if (!studentExists) {
                console.log('Removing bus subscription for non-existent student:', sub.studentId);
                cleaned = true;
                return false;
            }
            
            return true;
        });
        
        // Validate and clean fee payments
        this.feePayments = this.feePayments.filter(payment => {
            if (!payment || !payment.id || !payment.studentId) {
                console.log('Removing invalid fee payment:', payment);
                cleaned = true;
                return false;
            }
            
            // Ensure student exists
            const studentExists = this.students.some(s => String(s.id) === String(payment.studentId));
            if (!studentExists) {
                console.log('Removing fee payment for non-existent student:', payment.studentId);
                cleaned = true;
                return false;
            }
            
            return true;
        });
        
        // Update student bus status based on subscriptions
        this.students.forEach(student => {
            student.busSubscriber = this.busSubscriptions.some(sub => sub.studentId === student.id);
        });
        
        // Validate and clean bus routes
        this.busRoutes = this.busRoutes.filter(route => {
            if (!route || !route.id || !route.name || !route.area) {
                console.log('Removing invalid route:', route);
                cleaned = true;
                return false;
            }
            
            // Ensure valid route structure
            if (typeof route !== 'object' || Array.isArray(route)) {
                console.log('Removing invalid route structure:', route);
                cleaned = true;
                return false;
            }
            
            return true;
        });
        
        console.log('Data validation complete. Final counts:', {
            students: this.students.length,
            attendance: this.attendance.length,
            busSubscriptions: this.busSubscriptions.length,
            busRoutes: this.busRoutes.length,
            feePayments: this.feePayments.length,
            cleaned: cleaned
        });
        
        console.log('=== DATA VALIDATION AND CLEANUP COMPLETE ===');
        
        if (cleaned) {
            this.saveDataToStorage();
        }
        
        return cleaned;
    }

    createDataBackup() {
        console.log('Creating data backup...');
        console.log('Routes in backup creation:', this.busRoutes);
        const backup = {
            timestamp: new Date().toISOString(),
            students: [...this.students],
            attendance: [...this.attendance],
            busSubscriptions: [...this.busSubscriptions],
            busRoutes: [...this.busRoutes],
            feePayments: [...this.feePayments]
        };
        
        console.log('Backup object routes:', backup.busRoutes);
        
        // Save backup with timestamp
        localStorage.setItem('school_data_backup', JSON.stringify(backup));
        
        // Also save multiple backup versions
        const backupKey = `school_data_backup_${Date.now()}`;
        localStorage.setItem(backupKey, JSON.stringify(backup));
        
        // Keep only last 5 backups to save space
        const allKeys = Object.keys(localStorage).filter(k => k.startsWith('school_data_backup_'));
        if (allKeys.length > 5) {
            allKeys.sort().slice(0, -5).forEach(key => localStorage.removeItem(key));
        }
        
        console.log('Backup created successfully');
    }

    restoreFromBackup() {
        console.log('Attempting to restore from backup...');
        try {
            const backup = localStorage.getItem('school_data_backup');
            if (backup) {
                const parsedBackup = JSON.parse(backup);
                this.students = parsedBackup.students || [];
                this.attendance = parsedBackup.attendance || [];
                this.busSubscriptions = parsedBackup.busSubscriptions || [];
                this.busRoutes = parsedBackup.busRoutes || [];
                this.feePayments = parsedBackup.feePayments || [];
                
                console.log('Data restored from backup successfully');
                return true;
            }
        } catch (error) {
            console.error('Failed to restore from backup:', error);
        }
        return false;
    }

    // Enhanced Data Loading with Imported Student Protection
    loadDataFromStorage() {
        console.log('=== LOAD DATA FROM STORAGE START ===');
        console.log('Loading data from localStorage...');
        
        // Try to load main data object first (new format)
        const mainData = localStorage.getItem('school_data_main');
        
        if (mainData) {
            try {
                console.log('Found main data object, parsing...');
                const parsedData = JSON.parse(mainData);
                console.log('Main data version:', parsedData.version);
                console.log('Last saved:', parsedData.lastSaved);
                
                // Load data from structured format
                this.students = parsedData.data.students || [];
                this.attendance = parsedData.data.attendance || [];
                this.busSubscriptions = parsedData.data.busSubscriptions || [];
                this.feePayments = parsedData.data.feePayments || [];
                
                // Restore imported student protection
                this.restoreImportedStudentProtection();
                
                console.log('Successfully loaded from main data:', {
                    students: this.students.length,
                    attendance: this.attendance.length,
                    bus: this.busSubscriptions.length,
                    fees: this.feePayments.length
                });
                
                // Apply Arabic student names only to non-imported students
                const arabicNamesApplied = this.applyArabicStudentNames();
                if (arabicNamesApplied) {
                    this.saveDataToStorage();
                }
                
                console.log('=== LOAD DATA FROM STORAGE COMPLETE ===');
                return;
            } catch (error) {
                console.error('Error parsing main data, falling back to individual arrays...', error);
            }
        }
        
        // Fallback to individual arrays (old format)
        console.log('Loading from individual arrays (fallback)...');
        const savedStudents = localStorage.getItem('school_students');
        const savedAttendance = localStorage.getItem('school_attendance');
        const savedBus = localStorage.getItem('school_bus');
        const savedFees = localStorage.getItem('school_fees');

        console.log('Saved data found:', {
            students: !!savedStudents,
            attendance: !!savedAttendance,
            bus: !!savedBus,
            fees: !!savedFees
        });

        let dataLoaded = false;

        // Load saved data - NEVER clear it!
        if (savedStudents) {
            try {
                this.students = JSON.parse(savedStudents);
                console.log('Loaded', this.students.length, 'students from localStorage');
                dataLoaded = true;
            } catch (error) {
                console.error('Error loading students, trying backup...', error);
                if (this.restoreFromBackup()) {
                    dataLoaded = true;
                }
            }
        
        // Load attendance from localStorage - NEVER clear it!
        if (savedAttendance) {
            try {
                this.attendance = JSON.parse(savedAttendance);
                console.log('Loaded', this.attendance.length, 'attendance records from localStorage');
            } catch (error) {
                console.error('Error loading attendance, using backup...', error);
                const backup = localStorage.getItem('school_data_backup');
                if (backup) {
                    const parsedBackup = JSON.parse(backup);
                    this.attendance = parsedBackup.attendance || [];
                }
            }
        }
        
        if (savedBus) {
            try {
                this.busSubscriptions = JSON.parse(savedBus);
                console.log('Loaded', this.busSubscriptions.length, 'bus subscriptions from localStorage');
            } catch (error) {
                console.error('Error loading bus data, using backup...', error);
                const backup = localStorage.getItem('school_data_backup');
                if (backup) {
                    const parsedBackup = JSON.parse(backup);
                    this.busSubscriptions = parsedBackup.busSubscriptions || [];
                }
            }
        }
        
        if (savedFees) {
            try {
                this.feePayments = JSON.parse(savedFees);
                console.log('Loaded', this.feePayments.length, 'fee payments from localStorage');
            } catch (error) {
                console.error('Error loading fees, using backup...', error);
                const backup = localStorage.getItem('school_data_backup');
                if (backup) {
                    const parsedBackup = JSON.parse(backup);
                    this.feePayments = parsedBackup.feePayments || [];
                }
            }
        }

        // Restore imported student protection
        this.restoreImportedStudentProtection();

        // Apply Arabic student names only to non-imported students
        const arabicNamesApplied = this.applyArabicStudentNames();
        if (arabicNamesApplied) {
            this.saveDataToStorage();
        }

        // Load bus routes from localStorage
        const savedRoutes = localStorage.getItem('school_bus_routes');
        const directRoutes = localStorage.getItem('ROUTES_DIRECT_SAVE');
        
        console.log('Raw routes from localStorage:', savedRoutes);
        console.log('Direct routes from localStorage:', directRoutes);
        
        // PRIORITY: Use direct save first, then normal save
        if (directRoutes) {
            try {
                this.busRoutes = JSON.parse(directRoutes);
                console.log('Loaded', this.busRoutes.length, 'bus routes from DIRECT save:', this.busRoutes);
            } catch (error) {
                console.error('Error loading direct routes, trying normal...', error);
                // Fall back to normal save
                if (savedRoutes) {
                    try {
                        this.busRoutes = JSON.parse(savedRoutes);
                        console.log('Loaded', this.busRoutes.length, 'bus routes from normal save:', this.busRoutes);
                    } catch (error) {
                        console.error('Error loading bus routes, using defaults...', error);
                        // Keep default routes
                    }
                } else {
                    console.log('No saved routes found, using defaults');
                    // Initialize with default routes
                    this.busRoutes = [
                        { id: 1, name: 'Route 1: North Area', area: 'North Area' },
                        { id: 2, name: 'Route 2: South Area', area: 'South Area' },
                        { id: 3, name: 'Route 3: East Area', area: 'East Area' },
                        { id: 4, name: 'Route 4: West Area', area: 'West Area' },
                        { id: 5, name: 'Route 5: City Center', area: 'City Center' },
                        { id: 6, name: 'Route 6: Industrial Zone', area: 'Industrial Zone' },
                        { id: 7, name: 'Route 7: Residential Area', area: 'Residential Area' },
                        { id: 8, name: 'Route 8: School District', area: 'School District' }
                    ];
                }
            }
        } else if (savedRoutes) {
            try {
                this.busRoutes = JSON.parse(savedRoutes);
                console.log('Loaded', this.busRoutes.length, 'bus routes from normal save:', this.busRoutes);
            } catch (error) {
                console.error('Error loading bus routes, using defaults...', error);
                // Keep default routes
            }
        } else {
            console.log('No saved routes found, using defaults');
            // Initialize with default routes
            this.busRoutes = [
                { id: 1, name: 'Route 1: North Area', area: 'North Area' },
                { id: 2, name: 'Route 2: South Area', area: 'South Area' },
                { id: 3, name: 'Route 3: East Area', area: 'East Area' },
                { id: 4, name: 'Route 4: West Area', area: 'West Area' },
                { id: 5, name: 'Route 5: City Center', area: 'City Center' },
                { id: 6, name: 'Route 6: Industrial Zone', area: 'Industrial Zone' },
                { id: 7, name: 'Route 7: Residential Area', area: 'Residential Area' },
                { id: 8, name: 'Route 8: School District', area: 'School District' }
            ];
        }
        
        console.log('Final routes array after loading:', this.busRoutes);

        // Final data verification and backup creation
        console.log('Data loading complete. Final counts:', {
            students: this.students.length,
            attendance: this.attendance.length,
            bus: this.busSubscriptions.length,
            fees: this.feePayments.length
        });

        // Create backup after successful load
        if (dataLoaded) {
            this.createDataBackup();
        }

        // Add sample students if none exist
        if (this.students.length === 0) {
            console.log('No students found, adding sample data...');
            this.students = [
                { id: 1, name: "أحمد محمد", class: "KG1", phone: "0501234567", busSubscriber: true },
                { id: 2, name: "فاطمة علي", class: "KG1", phone: "0507654321", busSubscriber: false },
                { id: 3, name: "محمد أحمد", class: "KG2", phone: "0501111111", busSubscriber: true },
                { id: 4, name: "مريم حسن", class: "KG2", phone: "0502222222", busSubscriber: false },
                { id: 5, name: "عبدالله خالد", class: "1", phone: "0503333333", busSubscriber: true },
                { id: 6, name: "نورا سالم", class: "1", phone: "0504444444", busSubscriber: false },
                { id: 7, name: "عمر يوسف", class: "2", phone: "0505555555", busSubscriber: true },
                { id: 8, name: "ليلى إبراهيم", class: "2", phone: "0506666666", busSubscriber: false },
                { id: 9, name: "حمزة ناصر", class: "3", phone: "0507777777", busSubscriber: true },
                { id: 10, name: "سارة محمد", class: "3", phone: "0508888888", busSubscriber: false },
                { id: 11, name: "خالد أحمد", class: "4", phone: "0509999999", busSubscriber: true },
                { id: 12, name: "آمنة علي", class: "4", phone: "0500000000", busSubscriber: false },
                { id: 13, name: "ياسر محمود", class: "5", phone: "0501212121", busSubscriber: true },
                { id: 14, name: "رنا خالد", class: "5", phone: "0502323232", busSubscriber: false },
                { id: 15, name: "سالم عمر", class: "6", phone: "0503434343", busSubscriber: true },
                { id: 16, name: "هناء أحمد", class: "6", phone: "0504545454", busSubscriber: false },
                { id: 17, name: "فارس محمد", class: "7", phone: "0505656565", busSubscriber: true },
                { id: 18, name: "داليا حسن", class: "7", phone: "0506767676", busSubscriber: false },
                { id: 19, name: "براء علي", class: "8", phone: "0507878787", busSubscriber: true },
                { id: 20, name: "ميساء خالد", class: "8", phone: "0508989898", busSubscriber: false }
            ];
            this.saveDataToStorage();
            console.log('Added sample students:', this.students.length);
        }

        console.log('=== LOAD DATA FROM STORAGE COMPLETE ===');
    }
}
    
    getArabicStudentNamesById() {
        return {
            1: 'محمود أنور عايش',
            2: 'مريم ياسر أحمد العموري',
            3: 'مجد أنور بسام أبو نصر',
            4: 'سارة صابر عدنان ناجي',
            5: 'زيد محمد سكيك',
            6: 'محمد مؤمن عصام الديراوي',
            7: 'لينا سعيد محمد بشارات',
            8: 'وتين شادي طلعت بلاونة',
            9: 'آية عبد الرؤوف محمود إنجاص',
            10: 'وفاء أحمد عيد جواد',
            11: 'لايا عبد العزيز يوسف صالح',
            12: 'خطاب خالد طه',
            13: 'أمير مراد عوض الرجوب',
            14: 'بركة خالد راجح طه',
            15: 'كنان محمود إبراهيم حاجي',
            16: 'جوان شكيب باهر العواوي',
            17: 'نرجس حمدان قشطة',
            18: 'مصطفى حسام سفيان زهران',
            19: 'ميسون حسن هاني النيرب',
            20: 'كرم محمد جودة',
            21: 'سارة أحمد عيد جواد',
            22: 'سيلا شادي طلعت بلاونة',
            23: 'ناي حاتم محمد حمود',
            24: 'ياسمين إيهاب خليل شتات',
            25: 'آدم محمد سالم عوض',
            26: 'ليان إيهاب أحمد الشرفا',
            27: 'ماريا إيهاب أحمد الشرفا',
            28: 'غزل نائل محمود الهليس',
            29: 'تاليا محمود عبد الله أبو سرية',
            30: 'تيم ساهر نبيل اشتية',
            31: 'إيلين محمد ميسرة الحنفي',
            32: 'كندا إبراهيم خليل الصوص',
            33: 'غالية إياد هاشم الشوا',
            34: 'تالا إياد هاشم الشوا',
            35: 'ورد إياد هاشم الشوا',
            36: 'ألما إياد هاشم الشوا',
            37: 'إبراهيم كفاح أحمد نواهضة',
            38: 'جود محمد زكي النبيه',
            39: 'لين محمد عبد القادر العمصي',
            40: 'كرم محمد منير مناع',
            41: 'مريم إياد هاشم الشوا',
            42: 'يوسف إياد هاشم الشوا',
            43: 'ميرا إيهاب أحمد الشرفا',
            44: 'رزان إيهاب أحمد الشرفا',
            45: 'سارة محمد سالم عوض',
            46: 'تالا حسن يوسف زيد',
            47: 'ريما نائل سعدي السخل',
            48: 'براء محمد زكي النبيه',
            49: 'ماريا فادي محمد الجعبة',
            50: 'حلا مؤيد سليمان قواسمه',
            51: 'ريان بركه راجح طه',
            52: 'بانا إبراهيم خليل الصوص',
            53: 'حلا رياض زكريا عسيله',
            54: 'سارة أحمد عبد الفتاح الشوا',
            55: 'ليان نائل محمود الهليس',
            56: 'عمرو كفاح أحمد نواهضة',
            57: 'تاليه رجائي سعدي الكركي',
            58: 'محمد نمر رائق حميدة',
            59: 'البراء عبد العزيز يوسف صالحة',
            60: 'رزان علي محمد عصافرة',
            61: 'عائشه ظاهر ربحي قيبها',
            62: 'نايا حمودة سعيد صلاح',
            63: 'الحسن وائل كامل الجعبري',
            64: 'تميم باسل هاشم الهيموني',
            65: 'أمير حسن يوسف زيد',
            66: 'هيثم عبد الرؤوف محمود إنجاص',
            67: 'عدنان ناجي جمال الخضري',
            68: 'ميرا علي عصام المدهون',
            69: 'زينة بكر زكريا التركماني',
            70: 'زين الدين حسام سفيان زهران',
            71: 'ناي عبد الله جابر شقليه',
            72: 'يوسف محمد عبد القادر العمصي',
            73: 'كريم محمد جودة',
            74: 'محمد زيد عرسان الكيلاني',
            75: 'مسك محمد سالم عوض',
            76: 'ايلين شادي طلعت بلاونه',
            77: 'هشام باسل هاشم الهيموني',
            78: 'جوان فادي محمد الجعبة',
            79: 'اميرة امجد احمد ابو عرقوب',
            80: 'تالا نائل سعدي السخل',
            81: 'لانا وائل كامل الجعبري',
            82: 'عمر احمد عيد جواد',
            83: 'عبدالرحمن مراد عوض الرجوب',
            84: 'موسى ساهر نبيل اشتية',
            85: 'المى حاتم محمد حمود',
            86: 'تايا محمود ابراهيم حاجي',
            87: 'حمزه رياض زكريا عسيله',
            88: 'شام عبدالعزيز يوسف صالحة',
            89: 'ابراهيم محمود عبدالله ابوسرية',
            90: 'هبة نضال عبد الرزاق زلوم',
            91: 'سائدة محمود غصوب سعد',
            92: 'محمود مؤمن عصام الديراوي',
            93: 'أحمد مؤمن عصام الديراوي',
            94: 'منير محمد منير مناع',
            95: 'يوسف ناجي جمال الخضري',
            96: 'مريم عمر يوسف مكي',
            97: 'سراج أحمد عبد الله أبو عساكر',
            98: 'عزات مازن عزات الدحدوح',
            99: 'أحمد أبو الندى',
            100: 'دانية رجائي سعدي الكركي',
            101: 'ليان علي محمد عصافرة',
            102: 'مجد حاتم محمد حمود',
            103: 'أسيل سعيد محمد بشارات',
            104: 'صهيب ظاهر ربحي قيبها',
            105: 'ابراهيم بركه راجح طه',
            106: 'تولين حمودة سعيد صلاح',
            107: 'ميار خالد طه',
            108: 'تالا وائل كامل الجعبري',
            109: 'آدم منصور البايض',
            110: 'محمد ميسرة الحنفي',
            111: 'الحسن علي عصام المدهون',
            112: 'عبد الفتاح حمدان قشطة',
            113: 'أمل عطا حسن النيرب',
            114: 'سلمى وائل أحمد أبو شمالة',
            115: 'عزام محمد عزام عرفات',
            116: 'نهلة محمد ماجد النونو',
            117: 'محمد ساجي عبيد',
            118: 'عمرو محمد عبد القادر العمصي',
            119: 'جنى الطويل',
            120: 'سارة دواس',
            121: 'لين الغلاييني',
            122: 'عمر عماد سيد عابد',
            123: 'كريم نائل محمود الهليس',
            124: 'محمد ماضي',
            125: 'زين ماضي',
            126: 'محمد وائل محمد الشيخ خليل',
            127: 'عز الدين مؤيد سليمان قواسمه',
            128: 'نصر نمر رائق حميدة',
            129: 'براء راتب عبدالله زيدان',
            130: 'نور الدين مراد عوض الرجوب',
            131: 'تالين شادي طلعت بلاونه',
            132: 'عبيده احمد عيد جواد',
            133: 'لمار خالد طه',
            134: 'إيلياء ساهر نبيل اشتية',
            135: 'تالا حمودة سعيد صلاح',
            136: 'ابرار طه عادل شخشير',
            137: 'رغد رياض زكريا عسيله',
            138: 'نجود محمود إبراهيم دحبور',
            139: 'ليان محمود عبدالله أبوسرية',
            140: 'زينة كفاح احمد نواهضة',
            141: 'جنى نضال عبد الرزاق زلوم',
            142: 'أميمه ايمن يوسف ابو داود',
            143: 'آية حسن يوسف زيد',
            144: 'آية عطا حسن النيرب',
            145: 'نايا محمد عزام عرفات',
            146: 'مسك طارق فروانة',
            147: 'عبد الرحمن علاء محمد قفيشه',
            148: 'راشد رجائي سعدي الكركي',
            149: 'عبدالله محمود عبدالله أبوسرية',
            150: 'محمد علي محمد عصافرة',
            151: 'عبد الرحمن ناصر عبدالفتاح نزال',
            152: 'عزالدين حاتم محمد حمود',
            153: 'محمد سعيد محمد بشارات',
            154: 'هاشم باسل هاشم الهيموني',
            155: 'سليمان خضر سليمان راضي',
            156: 'أسامة مازن سليمان السيد',
            157: 'جمال ناجي جمال الخضري',
            158: 'محمد حسام سفيان زهران',
            159: 'عبد الله أحمد عبد الله أبو عساكر',
            160: 'ألما حاتم سعيد أبو القرايا',
            161: 'رغد محمد سكيك',
            162: 'جود عبد القادر إسماعيل النخالة',
            163: 'ليان عبد الرؤوف محمود انجاص',
            164: 'جنى حسن يوسف زيد',
            165: 'منة الله محمد سالم عوض',
            166: 'ديما نائل سعدي السخل',
            167: 'لمار خالد طه',
            168: 'ابرار طه عادل شخشير',
            169: 'حلا عبد العزيز يوسف صالحة',
            170: 'اسماء ناجي محمد العبيات',
            171: 'مارية محمود غصوب سعد',
            172: 'جهاد كفاح احمد نواهضة',
            173: 'مصعب محمد سالم عوض',
            174: 'يحيى مراد عوض الرجوب',
            175: 'نبيل ساهر نبيل اشتية',
            176: 'عبدالرحمن نمر رائق حميدة',
            177: 'عمر ناجي محمد العبيات',
            178: 'محمود عبد الرؤوف محمود انجاص',
            179: 'إسماعيل عبد القادر إسماعيل النخالة',
            180: 'محمد خالد محمد عيسى',
            181: 'قتيبه ايمن يوسف ابو داود',
            182: 'سارة أحمد عبد الله أبو عساكر',
            183: 'هيام عطا حسن النيرب',
            184: 'فرح مازن سليمان السيد',
            185: 'ليان ماضي',
            186: 'لمى هاني سليمان الغرابلي',
            187: 'فدوى نضال عبد الرزاق زلوم',
            188: 'الما مؤيد سليمان قواسمه',
            189: 'لمار محمود ابراهيم دحبور',
            190: 'عليا علي محمد عصافرة',
            191: 'رهف رياض زكريا عسيله',
            192: 'جود محمود إبراهيم حاجي',
            193: 'ملكه ظاهر ربحي قيبها',
            194: 'نور الهدى احمد عيد جواد',
            195: 'سارة وائل كامل الجعبري',
            196: 'لانا فادي محمد الجعبة',
            197: 'ليان شادي طلعت بلاونه',
            198: 'ميرال عماد سعيد عابد',
            199: 'سفيان حسام سفيان زهران',
            200: 'علياء هشام بدر الدين الخزندار',
            201: 'مهند أحمد عبد الفتاح الشوا',
            202: 'عمر محمد خميس جودة',
            203: 'عبد الله ساجي عبيد',
            204: 'ابراهيم طارق فروانة',
            205: 'محمد حرب',
            206: 'زين أبو الندى',
            207: 'عبد الرحمن حاتم محمد حمود',
            208: 'يوسف ناجي محمد العبيات',
            209: 'زينة حسين محمد ذكي النبيه',
            210: 'فائدة هشام بدر الدين الخزندار',
            211: 'علي جميل سرحان',
            212: 'محمد حمدان قشطة',
            213: 'شهد أيمن ماضي',
            214: 'يزن مهند إبراهيم خيال',
            215: 'وسيم ماضي',
            216: 'ملك هاني سليمان الغرابلي',
            217: 'سليمان هاني الغرابلي',
            218: 'دانا حاتم سعيد أبو القرايا',
            219: 'بانا وسيم نمر شحيبر',
            220: 'محمد الطويل',
            221: 'كريم دواس',
            222: 'علي أبو الندى',
            223: 'يزن ميسرة الحنفي'
        };
    }

    // Imported Student Protection Functions
    restoreImportedStudentProtection() {
        console.log('Restoring imported student protection...');
        this.importedStudentIds.clear();
        
        this.students.forEach(student => {
            if (student.isImported) {
                this.importedStudentIds.add(student.id);
                console.log(`Protected imported student: ${student.name} (ID: ${student.id})`);
            }
        });
        
        console.log(`Protected ${this.importedStudentIds.size} imported students`);
    }

    isImportedStudent(studentId) {
        return this.importedStudentIds.has(studentId);
    }

    protectImportedStudents() {
        console.log('Ensuring imported students are protected...');
        let protectedCount = 0;
        
        this.students = this.students.filter(student => {
            // Always keep imported students
            if (this.isImportedStudent(student.id)) {
                protectedCount++;
                return true;
            }
            return true; // Keep all other students too
        });
        
        console.log(`Protected ${protectedCount} imported students from removal`);
    }

    applyArabicStudentNames() {
        const namesById = this.getArabicStudentNamesById();
        let updated = 0;

        // Only apply Arabic names to non-imported students with IDs 1-30 (sample data)
        // Never override imported students
        this.students = this.students.map(student => {
            const id = Number(student.id);
            
            // Skip if student is imported (protected)
            if (this.isImportedStudent(id)) {
                console.log(`Skipping Arabic name for imported student: ${student.name} (ID: ${id})`);
                return student;
            }
            
            // Skip if ID is beyond sample data range (likely imported)
            if (id > 30) return student;
            
            const arabicName = namesById[id];
            if (!arabicName) return student;
            if (student.name === arabicName) return student;
            updated += 1;
            return {
                ...student,
                name: arabicName
            };
        });

        if (updated > 0) {
            console.log(`Arabic names applied: ${updated} students updated`);
            return true;
        }

        return false;
    }

    // Emergency Data Recovery Functions
    emergencyDataRestore() {
        console.log('Emergency data restore initiated...');
        const success = this.restoreFromBackup();
        if (success) {
            this.saveDataToStorage();
            this.renderStudents();
            this.renderAttendance();
            this.renderBusSubscriptions();
            this.renderFeePayments();
            this.updateDashboard();
            alert('Emergency data restore completed successfully!');
        } else {
            alert('No backup data found for emergency restore.');
        }
    }

    exportAllData() {
        console.log('Exporting all data...');
        const allData = {
            timestamp: new Date().toISOString(),
            students: this.students,
            attendance: this.attendance,
            busSubscriptions: this.busSubscriptions,
            feePayments: this.feePayments
        };
        
        const dataStr = JSON.stringify(allData, null, 2);
        // Fix: Ensure proper UTF-8 encoding for Arabic characters
        const dataBlob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `school_data_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        console.log('Data exported successfully');
    }

    importAllData(jsonData) {
        console.log('Importing data...');
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            
            // Create backup before import
            this.createDataBackup();
            
            // Import data with validation
            if (data.students && Array.isArray(data.students)) {
                this.students = data.students;
                console.log(`Imported ${this.students.length} students`);
            }
            
            if (data.attendance && Array.isArray(data.attendance)) {
                this.attendance = data.attendance;
                console.log(`Imported ${this.attendance.length} attendance records`);
            }
            
            if (data.busSubscriptions && Array.isArray(data.busSubscriptions)) {
                this.busSubscriptions = data.busSubscriptions;
                console.log(`Imported ${this.busSubscriptions.length} bus subscriptions`);
            }
            
            if (data.feePayments && Array.isArray(data.feePayments)) {
                this.feePayments = data.feePayments;
                console.log(`Imported ${this.feePayments.length} fee payments`);
            }
            
            // Save imported data
            this.saveDataToStorage();
            
            // Refresh all displays
            this.renderStudents();
            this.renderAttendance();
            this.renderBusSubscriptions();
            this.renderFeePayments();
            this.updateDashboard();
            
            console.log('Data import completed successfully');
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    // Password-Protected Delete Functions
    deleteAllStudents(password) {
        // Set your admin password here
        const ADMIN_PASSWORD = 'admin123';
        
        if (password !== ADMIN_PASSWORD) {
            alert('Incorrect password! Access denied.');
            return false;
        }
        
        if (!confirm('⚠️ WARNING: This will permanently delete ALL students and their associated data (attendance, bus subscriptions, fee payments). This action cannot be undone!\n\nAre you absolutely sure you want to continue?')) {
            return false;
        }
        
        console.log('=== DELETING ALL STUDENTS ===');
        
        try {
            // Create final backup before deletion
            console.log('Creating final backup before deletion...');
            this.createDataBackup();
            
            // Get counts before deletion
            const studentCount = this.students.length;
            const attendanceCount = this.attendance.length;
            const busCount = this.busSubscriptions.length;
            const feesCount = this.feePayments.length;
            
            // Delete all student-related data
            this.students = [];
            this.attendance = [];
            this.busSubscriptions = [];
            this.feePayments = [];
            
            // Save empty data
            this.saveDataToStorage();
            
            // Refresh all displays
            this.renderStudents();
            this.renderAttendance();
            this.renderBusSubscriptions();
            this.renderFeePayments();
            this.updateDashboard();
            
            console.log('All data deleted successfully');
            alert(`✅ All student data has been deleted:\n\n• ${studentCount} students\n• ${attendanceCount} attendance records\n• ${busCount} bus subscriptions\n• ${feesCount} fee payments\n\nA backup was created before deletion.`);
            
            return true;
        } catch (error) {
            console.error('Error deleting all students:', error);
            alert('❌ Error occurred while deleting students. Please try again.');
            return false;
        }
    }

    clearAllData(password) {
        // Set your admin password here
        const ADMIN_PASSWORD = 'admin123';
        
        if (password !== ADMIN_PASSWORD) {
            alert('Incorrect password! Access denied.');
            return false;
        }
        
        if (!confirm('⚠️ CRITICAL WARNING: This will completely reset the entire system to factory defaults. ALL data will be permanently deleted!\n\nThis includes:\n• All students\n• All attendance records\n• All bus subscriptions\n• All fee payments\n• All backups\n\nThis action CANNOT be undone!\n\nType "DELETE" to confirm:')) {
            return false;
        }
        
        const confirmation = prompt('Type "DELETE" to confirm complete system reset:');
        if (confirmation !== 'DELETE') {
            alert('Reset cancelled. Confirmation text did not match.');
            return false;
        }
        
        console.log('=== COMPLETE SYSTEM RESET ===');
        
        try {
            // Clear ALL localStorage data
            localStorage.clear();
            
            // Reset all data arrays
            this.students = [];
            this.attendance = [];
            this.busSubscriptions = [];
            this.feePayments = [];
            
            // Re-initialize with sample data
            this.initializeSampleData();
            
            // Save fresh data
            this.saveDataToStorage();
            
            // Refresh all displays
            this.renderStudents();
            this.renderAttendance();
            this.renderBusSubscriptions();
            this.renderFeePayments();
            this.updateDashboard();
            
            console.log('System reset completed');
            alert('✅ System has been completely reset to factory defaults.\n\nAll previous data has been permanently deleted.\nThe system will now reload with sample data.');
            
            // Reload page after 2 seconds
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
            return true;
        } catch (error) {
            console.error('Error resetting system:', error);
            alert('❌ Error occurred while resetting system. Please try again.');
            return false;
        }
    }

    initializeSampleData() {
        // Add provided students for KG1 class
        this.students = [
            {
                id: 1,
                name: "محمود أنور عايش",
                class: "KG1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 2,
                name: "مريم ياسر أحمد العموري",
                class: "KG1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 3,
                name: "مجد أنور بسام أبو ناصر",
                class: "KG1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 4,
                name: "صابر عدنان ناجي",
                class: "KG1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 5,
                name: "زايد محمد سكيك",
                class: "KG1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 6,
                name: "محمد مؤمن عزام الدراوي",
                class: "KG1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 7,
                name: "لينا سعيد محمد بشارات",
                class: "KG1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 11,
                name: "ليا عبد العزيز يوسف صالح",
                class: "KG1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 12,
                name: "خطاب خالد طه",
                class: "KG1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 13,
                name: "أمير مراد عوض الرجوب",
                class: "KG1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 14,
                name: "بركة خالد رجه طه",
                class: "KG1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 15,
                name: "Kanan Mahmoud Ibrahim Hajji",
                class: "KG1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 16,
                name: "Jawan Shakib Baher Al-Awawi",
                class: "KG1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 17,
                name: "Narges Hamdan Qashata",
                class: "KG2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 18,
                name: "Mustafa Hossam Sufyan Zahran",
                class: "KG2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 19,
                name: "Maysoon Hassan Hani Al-Nirab",
                class: "KG2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 20,
                name: "Yaman Ahmad Eiad Jawad",
                class: "KG2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 21,
                name: "Omar Alaa Mohammed Qafisha",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 22,
                name: "Salma Muyed Suleiman Al-Wasema",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 23,
                name: "Julia Rajaei Saadi Al-Karki",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 24,
                name: "Dania Nammar Raqi Hamida",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 25,
                name: "Yassin Taha Adel Shakhshir",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 26,
                name: "Yousef Taha Adel Shakhshir",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 27,
                name: "Mohammed Barakah Rajeh Taha",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 28,
                name: "Sila Hamouda Saeed Salah",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 29,
                name: "Mohammed Saher Nabil Eshtiya",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 30,
                name: "Sawar Khaled Taha",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 31,
                name: "Abi Abu Al-Nada",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 32,
                name: "Yusra Ahmad Abdul Nasser Abu Shahla",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 33,
                name: "Majed Wael Al-Khalili",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 34,
                name: "Zakaria Bakr Zakaria Al-Turkmani",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 35,
                name: "Omar Alaa Mohammed Qafisha",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 36,
                name: "Farah Abu Hasnin",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 37,
                name: "Joud Makki",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 38,
                name: "Adam Abdul Qader Al-Nakhala",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 39,
                name: "Yousef Mazen Al-Dahdouh",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 40,
                name: "Hisham Awad",
                class: "1",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 41,
                name: "Sema Hani Suleiman Al-Gharabli",
                class: "2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 42,
                name: "Kanan Shakib Al-Awawi",
                class: "2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 43,
                name: "Nour Mazen Suleiman Al-Sayed",
                class: "2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 44,
                name: "Suad Hamada Al-Ashi",
                class: "2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 45,
                name: "Hani Atta Hassan Al-Nirab",
                class: "2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 46,
                name: "Ahmad Wael Abu Shamaleh",
                class: "2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 47,
                name: "Yousef Abdullah Jaber Shaqlih",
                class: "2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 48,
                name: "Osama Zayed Arsan Al-Kilani",
                class: "2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 49,
                name: "Nashat Fadi Mohammed Al-Jaabah",
                class: "2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 50,
                name: "Rital Amjad Ahmad Abu Areqoub",
                class: "2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 51,
                name: "Nada Ayman Yousef Abu Dawoud",
                class: "2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 52,
                name: "Omar Hatem Mohammed Hamoud",
                class: "2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 53,
                name: "Lana Mahmoud Ibrahim Dahbour",
                class: "2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 54,
                name: "Yousef Riyadh Zakaria Aseelah",
                class: "2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 55,
                name: "Salma Mahmoud Abdullah Abu Sariya",
                class: "2",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 56,
                name: "Amro Kifah Ahmad Nawahda",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 57,
                name: "Taliya Rajaei Saadi Al-Karki",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 58,
                name: "Mohammed Nammar Raqi Hamida",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 59,
                name: "Al-Baraa Abdul Aziz Yousef Saleh",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 60,
                name: "Razan Ali Mohammed Asafra",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 61,
                name: "Ayesha Zahir Rabeh Qibha",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 62,
                name: "Naya Hamouda Saeed Salah",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 63,
                name: "Al-Hassan Wael Kamil Al-Jabari",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 64,
                name: "Tameem Basel Hesham Al-Haimoni",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 65,
                name: "Amir Hassan Yousef Zayed",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 66,
                name: "Haitham Abdul Raouf Mahmoud Injas",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 67,
                name: "Adnan Naji Jamal Al-Khudari",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 68,
                name: "Mira Ali Eissam Al-Madhoun",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 69,
                name: "Zayna Bakr Zakaria Al-Turkmani",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 70,
                name: "Zain Al-Deen Hossam Sufyan Zahran",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 71,
                name: "Nay Abdullah Jaber Shaqlih",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 72,
                name: "Yousef Mohammed Abdul Qader Al-Amsi",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 73,
                name: "Kareem Mohammed Joudah",
                class: "3",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 74,
                name: "Mohammed Zayed Arsan Al-Kilani",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 75,
                name: "Mesk Mohammed Salem Awad",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 76,
                name: "Elain Shady Talat Balawneh",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 77,
                name: "Hisham Basel Hesham Al-Haimoni",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 78,
                name: "Jawan Fadi Mohammed Al-Jaabah",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 79,
                name: "Amira Amjad Ahmad Abu Areqoub",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 80,
                name: "Tala Nael Saadi Al-Sakhl",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 81,
                name: "Lana Wael Kamil Al-Jabari",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 82,
                name: "Omar Ahmad Eiad Jawad",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 83,
                name: "Abdulrahman Murad Awad Al-Rajoub",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 84,
                name: "Musa Saher Nabil Eshtiya",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 85,
                name: "Alma Hatem Mohammed Hamoud",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 86,
                name: "Taya Mahmoud Ibrahim Hajji",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 87,
                name: "Hamza Riyadh Zakaria Aseelah",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 88,
                name: "Sham Abdul Aziz Yousef Saleh",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 89,
                name: "Ibrahim Mahmoud Abdullah Abu Sariya",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 90,
                name: "Hiba Nedal Abdul Razzaq Zalloum",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 91,
                name: "Saeda Mahmoud Ghassoub Saad",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 92,
                name: "Mahmoud Mo'men Ezzam Al-Derawi",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 93,
                name: "Ahmad Mo'men Ezzam Al-Derawi",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 94,
                name: "Munir Mohammed Munir Minaa",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 95,
                name: "Yousef Naji Jamal Al-Khudari",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 96,
                name: "Mariam Omar Yousef Makki",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 97,
                name: "Siraj Ahmad Abdullah Abu Asaker",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 98,
                name: "Ezzat Mazen Ezzat Al-Dahdouh",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 99,
                name: "Ahmad Abu Al-Nada",
                class: "4",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 100,
                name: "Dania Rajaei Saadi Al-Karki",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 101,
                name: "Layan Ali Mohammed Asafra",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 102,
                name: "Majed Hatem Mohammed Hamoud",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 103,
                name: "Aseel Saeed Mohammed Besharat",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 104,
                name: "Suhaib Zahir Rabeh Qibha",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 105,
                name: "Ibrahim Barakah Rajeh Taha",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 106,
                name: "Tolin Hamouda Saeed Salah",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 107,
                name: "Mayar Khaled Taha",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 108,
                name: "Tala Wael Kamil Al-Jabari",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 109,
                name: "Adam Mansour Al-Baydh",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 110,
                name: "Mohammed Maysara Al-Hanafi",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 111,
                name: "Al-Hassan Ali Eissam Al-Madhoun",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 112,
                name: "Abdul Fattah Hamdan Qashata",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 113,
                name: "Amal Atta Hassan Al-Nirab",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 114,
                name: "Salma Wael Ahmad Abu Shamaleh",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 115,
                name: "Azzam Mohammed Azzam Arafat",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 116,
                name: "Nahla Mohammed Majed Al-Nounou",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 117,
                name: "Mohammed Saji Obaid",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 118,
                name: "Amro Mohammed Abdul Qader Al-Amsi",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 119,
                name: "Jana Al-Taweel",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 120,
                name: "Sara Dawas",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 121,
                name: "Lynn Al-Ghalayini",
                class: "5",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 122,
                name: "Omar Emad Sayed Abed",
                class: "6 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 123,
                name: "Kareem Nael Mahmoud Al-Halis",
                class: "6 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 124,
                name: "Mohammed Madhi",
                class: "6 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 125,
                name: "Zain Madhi",
                class: "6 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 126,
                name: "Mohammed Wael Mohammed Sheikh Khalil",
                class: "6 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 127,
                name: "Ezz Al-Deen Muyed Suleiman Qawasmi",
                class: "6 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 128,
                name: "Nasr Nammar Raqi Hamida",
                class: "6 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 129,
                name: "Al-Baraa Rateb Abdullah Zidan",
                class: "6 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 130,
                name: "Nour Al-Deen Murad Awad Al-Rajoub",
                class: "6 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 131,
                name: "Talin Shady Talat Balawneh",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 132,
                name: "Obaida Ahmad Eiad Jawad",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 133,
                name: "Lamar Khaled Taha",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 134,
                name: "Iliya Saher Nabil Eshtiya",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 135,
                name: "Tala Hamouda Saeed Salah",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 136,
                name: "Ibrar Taha Adel Shakhshir",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 137,
                name: "Raghad Riyadh Zakaria Aseelah",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 138,
                name: "Najoud Mahmoud Ibrahim Dahbour",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 139,
                name: "Layan Mahmoud Abdullah Abu Sariya",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 140,
                name: "Zayna Kifah Ahmad Nawahda",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 141,
                name: "Jana Nedal Abdul Razzaq Zalloum",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 142,
                name: "Aimah Ayman Yousef Abu Dawoud",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 143,
                name: "Aya Hassan Yousef Zayed",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 144,
                name: "Aya Atta Hassan Al-Nirab",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 145,
                name: "Naya Mohammed Azzam Arafat",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 146,
                name: "Mesk Tariq Farwaneh",
                class: "6 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 147,
                name: "Abdulrahman Alaa Mohammed Qafisha",
                class: "7 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 148,
                name: "Rashed Rajaei Saadi Al-Karki",
                class: "7 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 149,
                name: "Abdullah Mahmoud Abdullah Abu Sariya",
                class: "7 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 150,
                name: "Mohammed Ali Mohammed Asafra",
                class: "7 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 151,
                name: "Abdulrahman Nasser Abdul Fattah Nazzal",
                class: "7 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 152,
                name: "Ezz Al-Deen Hatem Mohammed Hamoud",
                class: "7 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 153,
                name: "Mohammed Saeed Mohammed Besharat",
                class: "7 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 154,
                name: "Hashem Basel Hesham Al-Haimoni",
                class: "7 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 155,
                name: "Suleiman Khodor Suleiman Radi",
                class: "7 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 156,
                name: "Osama Mazen Suleiman Al-Sayed",
                class: "7 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 157,
                name: "Jamal Naji Jamal Al-Khudari",
                class: "7 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 158,
                name: "Mohammed Hossam Sufyan Zahran",
                class: "7 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 159,
                name: "Abdullah Ahmad Abdullah Abu Asaker",
                class: "7 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 160,
                name: "Alma Hatem Saeed Abu Al-Quraya",
                class: "7 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 161,
                name: "Raghad Mohammed Skaik",
                class: "7 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 162,
                name: "Joud Abdul Qader Ismail Al-Nakhala",
                class: "7 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 163,
                name: "Layan Abdul Raouf Mahmoud Injas",
                class: "7 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 164,
                name: "Jana Hassan Yousef Zayed",
                class: "7 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 165,
                name: "Mona Allah Mohammed Salem Awad",
                class: "7 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 166,
                name: "Dima Nael Saadi Al-Sakhl",
                class: "7 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 167,
                name: "Lamar Khaled Taha",
                class: "7 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 168,
                name: "Ibrar Taha Adel Shakhshir",
                class: "7 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 169,
                name: "Hala Abdul Aziz Yousef Saleh",
                class: "7 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 170,
                name: "Asmaa Naji Mohammed Al-Obayyat",
                class: "7 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 171,
                name: "Mariyah Mahmoud Ghassoub Saad",
                class: "7 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 172,
                name: "Jihad Kifah Ahmad Nawahda",
                class: "7 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 173,
                name: "Moath Mohammed Salem Awad",
                class: "8 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 174,
                name: "Yahya Murad Awad Al-Rajoub",
                class: "8 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 175,
                name: "Nabil Saher Nabil Eshtiya",
                class: "8 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 176,
                name: "Abdulrahman Nammar Raqi Hamida",
                class: "8 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 177,
                name: "Omar Naji Mohammed Al-Obayyat",
                class: "8 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 178,
                name: "Mahmoud Abdul Raouf Mahmoud Injas",
                class: "8 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 179,
                name: "Ismail Abdul Qader Ismail Al-Nakhala",
                class: "8 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 180,
                name: "Mohammed Khaled Mohammed Issa",
                class: "8 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 181,
                name: "Qutaybah Ayman Yousef Abu Dawoud",
                class: "8 Boys",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 182,
                name: "Sarah Ahmad Abdullah Abu Asaker",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 183,
                name: "Hayam Atta Hassan Al-Nirab",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 184,
                name: "Farah Mazen Suleiman Al-Sayed",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 185,
                name: "Layan Madhi",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 186,
                name: "Luma Hani Suleiman Al-Gharabli",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 187,
                name: "Fadwa Nedal Abdul Razzaq Zalloum",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 188,
                name: "Alma Muyed Suleiman Qawasmi",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 189,
                name: "Lamar Mahmoud Ibrahim Dahbour",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 190,
                name: "Aliya Ali Mohammed Asafra",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 191,
                name: "Rahaf Riyadh Zakaria Aseelah",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 192,
                name: "Joud Mahmoud Ibrahim Hajji",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 193,
                name: "Malakah Zahir Rabeh Qibha",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 194,
                name: "Nour Al-Huda Ahmad Eiad Jawad",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 195,
                name: "Sarah Wael Kamil Al-Jabari",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 196,
                name: "Lana Fadi Mohammed Al-Jaabah",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 197,
                name: "Layan Shady Talat Balawneh",
                class: "8 Girls",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 198,
                name: "Miral Emad Saeed Abed",
                class: "9",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 199,
                name: "Sufyan Hossam Sufyan Zahran",
                class: "9",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 200,
                name: "Aliya Hisham Badr Al-Deen Al-Khazandar",
                class: "9",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 201,
                name: "Muhannad Ahmad Abdul Fattah Al-Shawa",
                class: "9",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 202,
                name: "Omar Mohammed Khamees Joudah",
                class: "9",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 203,
                name: "Abdullah Saji Obaid",
                class: "9",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 204,
                name: "Ibrahim Tariq Farwaneh",
                class: "9",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 205,
                name: "Mohammed Harb",
                class: "9",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 206,
                name: "Zain Abu Al-Nada",
                class: "9",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 207,
                name: "Abdulrahman Hatem Mohammed Hamoud",
                class: "10",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 208,
                name: "Yousef Naji Mohammed Al-Obayyat",
                class: "10",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 209,
                name: "Zayna Hussein Mohammed Zaki Al-Nabih",
                class: "10",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 210,
                name: "Faeda Hisham Badr Al-Deen Al-Khazandar",
                class: "10",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 211,
                name: "Ali Jameel Sarhan",
                class: "10",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 212,
                name: "Shahd Ayman Madhi",
                class: "10",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 213,
                name: "Yazin Muhannad Ibrahim Khayal",
                class: "10",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 214,
                name: "Wasim Madhi",
                class: "10",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 215,
                name: "Malak Hani Suleiman Al-Gharabli",
                class: "10",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 216,
                name: "Mohammed Hamdan Qashata",
                class: "10",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 217,
                name: "Suleiman Hani Al-Gharabli",
                class: "11",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 218,
                name: "Dana Hatem Saeed Abu Al-Quraya",
                class: "11",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 219,
                name: "Bana Wasim Nammar Shihabir",
                class: "11",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 220,
                name: "Mohammed Al-Taweel",
                class: "11",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 221,
                name: "Kareem Dawas",
                class: "11",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 222,
                name: "Ali Abu Al-Nada",
                class: "11",
                phone: "Not provided",
                busSubscriber: false
            },
            {
                id: 223,
                name: "Yazin Maysara Al-Hanafi",
                class: "11",
                phone: "Not provided",
                busSubscriber: false
            }
        ];
        
        // Initialize empty arrays for other data (only if they don't exist)
        if (!this.busSubscriptions) this.busSubscriptions = [];
        if (!this.attendance) this.attendance = [];  // Only clear if empty
        if (!this.feePayments) this.feePayments = [];
        
        // Save to storage
        this.saveDataToStorage();
    }

    // Event Listeners
    setupEventListeners() {
        const safeOn = (id, eventName, handler) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener(eventName, handler);
            }
        };

        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.switchSection(section);
            });
        });

        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 's':
                        e.preventDefault();
                        this.switchSection('students');
                        break;
                    case 'a':
                        e.preventDefault();
                        this.switchSection('attendance');
                        break;
                    case 'b':
                        e.preventDefault();
                        this.switchSection('bus');
                        break;
                    case 'f':
                        e.preventDefault();
                        this.switchSection('fees');
                        break;
                    case 'd':
                        e.preventDefault();
                        this.switchSection('dashboard');
                        break;
                    case 'n':
                        e.preventDefault();
                        this.openStudentModal();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.exportStudents();
                        break;
                }
            }
        });

        // Student Form
        safeOn('student-form', 'submit', (e) => {
            e.preventDefault();
            this.saveStudent();
        });

        // Bus Form
        safeOn('bus-form', 'submit', (e) => {
            e.preventDefault();
            this.saveBusSubscription();
        });

        // Route Form
        safeOn('route-form', 'submit', (e) => {
            e.preventDefault();
            this.saveRoute();
        });

        // Fee Form
        safeOn('fee-form', 'submit', (e) => {
            e.preventDefault();
            if (window.sms && typeof window.sms.saveFeePayment === 'function') {
                window.sms.saveFeePayment();
            } else {
                alert('Fee payment saving is not available. Please refresh the page.');
            }
        });

        // Search and Filters
        safeOn('student-search', 'input', () => {
            this.currentPage = 1;
            this.renderStudents();
        });
        safeOn('class-filter', 'change', () => {
            this.currentPage = 1;
            this.renderStudents();
        });
        safeOn('attendance-class-filter', 'change', () => this.renderAttendance());
        safeOn('attendance-search', 'input', () => this.renderAttendance());
        safeOn('attendance-date', 'change', () => this.renderAttendance());
        safeOn('bus-route-filter', 'change', () => this.renderBusSubscriptions());
        safeOn('bus-class-filter', 'change', () => this.renderBusSubscriptions());
        safeOn('fees-class-filter', 'change', () => this.renderFeePayments());
        safeOn('fees-month', 'change', () => this.renderFeePayments());
        safeOn('fee-status-filter', 'change', () => this.renderStudents());

        // Close modals on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });
    }

    // Navigation
    switchSection(sectionName) {
        console.log('switchSection called with:', sectionName);
        
        // Safety check - wait for DOM to be ready
        if (!document.getElementById(sectionName)) {
            console.error('Section not found:', sectionName);
            console.log('Available sections:', Array.from(document.querySelectorAll('.section')).map(s => s.id));
            return;
        }
        
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        console.log('Activating section:', sectionName);
        document.getElementById(sectionName).classList.add('active');
        
        const navBtn = document.querySelector(`[data-section="${sectionName}"]`);
        if (navBtn) {
            navBtn.classList.add('active');
        } else {
            console.warn('Navigation button not found for section:', sectionName);
        }

        // Refresh data when switching sections
        if (sectionName === 'attendance') {
            console.log('Rendering attendance in switchSection...');
            this.renderAttendance();
        }
    }

    quickFeePayment(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        // Open fee modal with student pre-selected
        const modal = document.getElementById('fee-modal');
        const studentSelect = document.getElementById('fee-student');
        
        // Populate student dropdown and select current student
        studentSelect.innerHTML = '';
        this.students.forEach(s => {
            studentSelect.innerHTML += `<option value="${s.id}" ${s.id === studentId ? 'selected' : ''}>${s.name} - ${(s.class === 'KG1' || s.class === 'KG2') ? s.class : `Grade ${s.class}`}</option>`;
        });
        
        // Set current month
        const currentMonth = new Date().getMonth() + 1;
        document.getElementById('fee-month').value = currentMonth;
        
        // Set today's date
        document.getElementById('fee-date').value = new Date().toISOString().split('T')[0];
        
        // Pre-fill bus fee if student is bus subscriber
        if (student.busSubscriber) {
            const busSubscription = this.busSubscriptions.find(b => b.studentId === studentId);
            if (busSubscription) {
                document.getElementById('fee-bus').value = busSubscription.monthlyFee;
            }
        }
        
        modal.classList.add('show');
    }

    quickBusSubscription(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        // Check if student already has bus subscription
        const existingSubscription = this.busSubscriptions.find(b => b.studentId === studentId);
        if (existingSubscription) {
            alert(`${student.name} already has a bus subscription: ${existingSubscription.route}`);
            return;
        }

        // Open bus modal with student pre-selected
        const modal = document.getElementById('bus-modal');
        const studentSelect = document.getElementById('bus-student');
        const routeSelect = document.getElementById('bus-route');
        
        // Clear and populate route dropdown using route manager for live data
        routeSelect.innerHTML = '<option value="">Select Route</option>';
        const routes = routeManager.getRoutes();
        console.log('DEBUG: quickBusSubscription - Routes from routeManager:', routes);
        routes.forEach(route => {
            console.log('DEBUG: quickBusSubscription - Adding route to dropdown:', route.name);
            routeSelect.innerHTML += `<option value="${route.name}">${route.name}</option>`;
        });
        
        // Populate student dropdown and select current student
        studentSelect.innerHTML = '';
        this.students.forEach(s => {
            const existingSub = this.busSubscriptions.find(b => b.studentId === s.id);
            if (!existingSub) {
                studentSelect.innerHTML += `<option value="${s.id}" ${s.id === studentId ? 'selected' : ''}>${s.name} - ${(s.class === 'KG1' || s.class === 'KG2') ? s.class : `Grade ${s.class}`}</option>`;
            }
        });
        
        modal.classList.add('show');
    }

    // Student Management
    openStudentModal(studentId = null) {
        this.currentEditingStudent = studentId;
        const modal = document.getElementById('student-modal');
        
        // Populate the student route dropdown
        const studentRouteSelect = document.getElementById('student-route');
        console.log('DEBUG: Student route dropdown element found:', !!studentRouteSelect);
        if (studentRouteSelect) {
            console.log('DEBUG: About to populate student route dropdown');
            console.log('DEBUG: routeManager exists:', !!routeManager);
            const routes = routeManager.getRoutes();
            console.log('DEBUG: Routes from routeManager:', routes);
            studentRouteSelect.innerHTML = '<option value="">No Bus</option>';
            routes.forEach(route => {
                console.log('DEBUG: Adding route to student dropdown:', route.name);
                studentRouteSelect.innerHTML += `<option value="${route.name}">${route.name}</option>`;
            });
            console.log('DEBUG: Student route dropdown populated with', routes.length, 'routes');
        } else {
            console.log('DEBUG: Student route dropdown element NOT found!');
        }
        
        if (studentId) {
            const student = this.students.find(s => s.id === studentId);
            document.getElementById('student-name').value = student.name;
            document.getElementById('student-class').value = student.class;
            document.getElementById('student-phone').value = student.phone;
            
            // Set the route if student has one
            if (studentRouteSelect && student.route) {
                studentRouteSelect.value = student.route;
            }
        } else {
            document.getElementById('student-form').reset();
        }
        
        modal.classList.add('show');
    }

    saveStudent() {
        const name = document.getElementById('student-name').value.trim();
        const studentClass = document.getElementById('student-class').value;
        const phone = document.getElementById('student-phone').value.trim();

        if (!name || !studentClass) {
            alert('Please fill in student name and class');
            return;
        }

        if (this.currentEditingStudent) {
            // Edit existing student
            console.log('Editing existing student:', this.currentEditingStudent);
            const studentIndex = this.students.findIndex(s => s.id === this.currentEditingStudent);
            this.students[studentIndex] = {
                ...this.students[studentIndex],
                name,
                class: studentClass,
                phone: phone || 'Not provided'
            };
            console.log('Student updated:', this.students[studentIndex]);
        } else {
            // Add new student
            console.log('Adding new student with data:', { name, studentClass, phone });
            const newStudent = {
                id: this.getNextStudentId(),
                name,
                class: studentClass,
                phone: phone || 'Not provided',
                busSubscriber: false // Default to false, managed through bus section
            };
            this.students.push(newStudent);
            console.log('New student added:', newStudent);
            console.log('Total students after adding:', this.students.length);
        }

        console.log('Saving students to storage...');
        this.saveDataToStorage();
        console.log('Rendering students...');
        this.renderStudents();
        console.log('Updating dashboard...');
        this.updateDashboard();
        console.log('Closing modal...');
        this.closeModal('student-modal');
        console.log('Student add operation complete!');
    }

    deleteStudent(studentId) {
        // Check if this is an imported student
        if (this.isImportedStudent(studentId)) {
            const student = this.students.find(s => s.id === studentId);
            if (!confirm(`⚠️ WARNING: This is an imported student: "${student.name}".\n\nImported students are protected and should NOT be deleted.\n\nAre you absolutely sure you want to delete this protected imported student?`)) {
                return; // Don't delete if user cancels
            }
        } else {
            if (!confirm('Are you sure you want to delete this student?')) {
                return;
            }
        }

        // Remove the student
        this.students = this.students.filter(s => s.id !== studentId);
        
        // Remove from protection if it was imported
        if (this.isImportedStudent(studentId)) {
            this.importedStudentIds.delete(studentId);
            console.log(`Removed imported student from protection: ${studentId}`);
        }
        
        // Clean up related data
        this.attendance = this.attendance.filter(a => a.studentId !== studentId);
        this.busSubscriptions = this.busSubscriptions.filter(b => b.studentId !== studentId);
        this.feePayments = this.feePayments.filter(f => f.studentId !== studentId);
        
        // Save and refresh
        this.saveDataToStorage();
        this.renderStudents();
        this.updateDashboard();
        
        console.log(`Deleted student with ID: ${studentId}`);
    }

    deleteSelectedStudents() {
        const ids = Array.from(this.selectedStudents);

        if (ids.length === 0) {
            alert('No students selected');
            return;
        }

        if (!confirm(`Are you sure you want to delete ${ids.length} selected student(s)?`)) {
            return;
        }

        const idSet = new Set(ids.map(id => Number(id)));

        this.students = this.students.filter(s => !idSet.has(Number(s.id)));
        this.attendance = this.attendance.filter(a => !idSet.has(Number(a.studentId)));
        this.busSubscriptions = this.busSubscriptions.filter(b => !idSet.has(Number(b.studentId)));
        this.feePayments = this.feePayments.filter(f => !idSet.has(Number(f.studentId)));

        this.selectedStudents.clear();
        const selectAll = document.getElementById('select-all');
        if (selectAll) selectAll.checked = false;

        this.saveDataToStorage();
        this.renderStudents();
        this.updateDashboard();
    }

    renderStudents() {
        const searchTerm = document.getElementById('student-search').value.toLowerCase();
        const classFilter = document.getElementById('class-filter').value;
        const feeStatusFilter = document.getElementById('fee-status-filter').value;
        
        let filteredStudents = this.students.filter(student => {
            const matchesSearch = student.name.toLowerCase().includes(searchTerm);
            const matchesClass = !classFilter || student.class === classFilter;
            
            let matchesFeeStatus = true;
            if (feeStatusFilter) {
                const feeStatus = this.getStudentFeeStatus(student.id);
                matchesFeeStatus = feeStatus.status === feeStatusFilter;
            }
            
            return matchesSearch && matchesClass && matchesFeeStatus;
        });

        // Update count
        document.getElementById('student-count').textContent = `${filteredStudents.length} students`;

        // Pagination
        const totalPages = Math.ceil(filteredStudents.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

        // Update page info
        document.getElementById('page-info').textContent = `Page ${this.currentPage} of ${totalPages || 1}`;

        const tbody = document.getElementById('students-table');
        tbody.innerHTML = '';

        if (paginatedStudents.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No students found</td></tr>';
            this.renderPagination(0);
            return;
        }

        paginatedStudents.forEach(student => {
            const row = document.createElement('tr');
            const isSelected = this.selectedStudents.has(student.id);
            const feeStatus = this.getStudentFeeStatus(student.id);
            
            let feeStatusHtml = '';
            if (feeStatus.status === 'paid') {
                feeStatusHtml = `<span class="status-badge status-paid">✅ Paid $${feeStatus.amount}</span>`;
            } else {
                feeStatusHtml = `<span class="status-badge status-unpaid">❌ Unpaid</span>`;
            }
            
            row.innerHTML = `
                <td><input type="checkbox" ${isSelected ? 'checked' : ''} onchange="sms.toggleStudentSelection(${student.id})"></td>
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td>${(student.class === 'KG1' || student.class === 'KG2') ? student.class : (student.class === '6 Boys' ? 'Grade 6 Boys' : (student.class === '6 Girls' ? 'Grade 6 Girls' : (student.class === '7 Boys' ? 'Grade 7 Boys' : (student.class === '7 Girls' ? 'Grade 7 Girls' : (student.class === '8 Boys' ? 'Grade 8 Boys' : (student.class === '8 Girls' ? 'Grade 8 Girls' : `Grade ${student.class}`))))))}</td>
                <td>${student.phone}</td>
                <td>${student.busSubscriber ? '✅ Yes' : '❌ No'}</td>
                <td>${feeStatusHtml}</td>
                <td>
                    <button class="btn btn-sm btn-success" onclick="sms.quickFeePayment(${student.id})" title="Record Fee Payment">💰</button>
                    <button class="btn btn-sm btn-primary" onclick="sms.quickBusSubscription(${student.id})" title="Add Bus Subscription">🚌</button>
                    <button class="btn btn-sm btn-primary" onclick="sms.openStudentModal(${student.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="sms.deleteStudent(${student.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        this.renderPagination(totalPages);
    }

    renderPagination(totalPages) {
        const paginationDiv = document.getElementById('students-pagination');
        paginationDiv.innerHTML = '';

        if (totalPages <= 1) return;

        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '← Previous';
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.onclick = () => this.changePage(this.currentPage - 1);
        paginationDiv.appendChild(prevBtn);

        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = i === this.currentPage ? 'active' : '';
            pageBtn.onclick = () => this.changePage(i);
            paginationDiv.appendChild(pageBtn);
        }

        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Next →';
        nextBtn.disabled = this.currentPage === totalPages;
        nextBtn.onclick = () => this.changePage(this.currentPage + 1);
        paginationDiv.appendChild(nextBtn);

        // Page info
        const pageInfo = document.createElement('span');
        pageInfo.className = 'pagination-info';
        pageInfo.textContent = `${this.currentPage} / ${totalPages}`;
        paginationDiv.appendChild(pageInfo);
    }

    changePage(page) {
        this.currentPage = page;
        this.renderStudents();
    }

    toggleStudentSelection(studentId) {
        if (this.selectedStudents.has(studentId)) {
            this.selectedStudents.delete(studentId);
        } else {
            this.selectedStudents.add(studentId);
        }
    }

    toggleSelectAll() {
        const selectAllCheckbox = document.getElementById('select-all');
        const checkboxes = document.querySelectorAll('#students-table input[type="checkbox"]');
        
        if (selectAllCheckbox.checked) {
            // Select all visible students
            checkboxes.forEach(checkbox => {
                if (checkbox.id !== 'select-all') {
                    checkbox.checked = true;
                    const studentId = parseInt(checkbox.getAttribute('onchange').match(/\d+/)[0]);
                    this.selectedStudents.add(studentId);
                }
            });
        } else {
            // Deselect all
            checkboxes.forEach(checkbox => {
                if (checkbox.id !== 'select-all') {
                    checkbox.checked = false;
                }
            });
            this.selectedStudents.clear();
        }
    }

    // Attendance Management
    markTodayAttendance() {
        const today = new Date().toISOString().split('T')[0];
        const existingAttendance = this.attendance.filter(a => a.date === today);
        
        if (existingAttendance.length > 0) {
            if (!confirm('Attendance for today already exists. Do you want to overwrite it?')) {
                return;
            }
            this.attendance = this.attendance.filter(a => a.date !== today);
        }

        this.students.forEach(student => {
            this.attendance.push({
                id: this.getNextAttendanceId(),
                studentId: student.id,
                date: today,
                status: 'present',
                markedBy: 'System',
                markedAt: new Date().toISOString()
            });
        });

        this.saveDataToStorage();
        
        console.log('Switching to attendance section...');
        // Switch to attendance section and render with delay to ensure DOM is ready
        setTimeout(() => {
            this.switchSection('attendance');
            
            console.log('Setting date field to:', today);
            // Set the date field to today
            document.getElementById('attendance-date').value = today;
            
            console.log('Attendance marking complete!');
        }, 100);
    }

    renderAttendance() {
        console.log('=== NEW ATTENDANCE SYSTEM START ===');
        
        const grid = document.getElementById('attendance-grid');
        const dateInput = document.getElementById('attendance-date');
        const date = dateInput.value || new Date().toISOString().split('T')[0];
        
        // Ensure date is set to today if not already set
        if (!dateInput.value) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
            console.log('Set date to today:', today);
        }
        
        const classFilter = document.getElementById('attendance-class-filter').value;
        const searchTerm = document.getElementById('attendance-search').value.toLowerCase();
        
        console.log('Debug info:');
        console.log('- Total students:', this.students.length);
        console.log('- Date:', date);
        console.log('- Date input value:', dateInput.value);
        console.log('- Class filter:', classFilter);
        console.log('- Search term:', searchTerm);
        console.log('- Total attendance records:', this.attendance.length);
        
        // Filter students
        let filteredStudents = this.students;
        if (classFilter) {
            // Handle grade-level filters (e.g., "4", "6", "7", "8")
            if (classFilter === '4' || classFilter === '6' || classFilter === '7' || classFilter === '8') {
                filteredStudents = filteredStudents.filter(s => 
                    s.class === classFilter || 
                    s.class === `${classFilter} Boys` || 
                    s.class === `${classFilter} Girls`
                );
            } else {
                filteredStudents = filteredStudents.filter(s => s.class === classFilter);
            }
        }
        if (searchTerm) {
            filteredStudents = filteredStudents.filter(s => 
                s.name.toLowerCase().includes(searchTerm)
            );
        }
        
        console.log('- Filtered students:', filteredStudents.length);
        
        // If no students exist, show message
        if (this.students.length === 0) {
            grid.innerHTML = '<div class="empty-state">No students found in the system. Please add students first.</div>';
            document.getElementById('attendance-summary-text').textContent = '0 students';
            document.getElementById('present-count').textContent = '0';
            document.getElementById('absent-count').textContent = '0';
            document.getElementById('unmarked-count').textContent = '0';
            return;
        }
        
        // Calculate statistics
        let presentCount = 0;
        let absentCount = 0;
        let unmarkedCount = 0;
        
        const studentHTML = filteredStudents.map(student => {
            const attendance = this.attendance.find(a => 
                String(a.studentId) === String(student.id) && a.date === date
            );
            
            console.log(`Student ${student.id} (${student.name}): attendance =`, attendance);
            
            if (attendance) {
                if (attendance.status === 'present') presentCount++;
                else if (attendance.status === 'absent') absentCount++;
            } else {
                unmarkedCount++;
            }
            
            const status = attendance ? attendance.status : 'not-marked';
            const statusClass = status === 'present' ? 'present' : status === 'absent' ? 'absent' : '';
            
            return `
                <div class="attendance-card">
                    <div class="student-info">
                        <strong>${student.name}</strong>
                        <small>${this.getDisplayClassName(student.class)} • ID: ${student.id}</small>
                    </div>
                    <div class="attendance-status">
                        <span class="status-badge status-${status}">
                            ${status === 'not-marked' ? 'Not Marked' : status}
                        </span>
                    </div>
                    <div class="attendance-actions">
                        <button class="btn-attendance ${statusClass}" 
                                onclick="console.log('Present button clicked for student ${student.id}'); window.markAttendance('${student.id}', 'present')"
                                data-status="present">
                            ✓ Present
                        </button>
                        <button class="btn-attendance ${status === 'absent' ? 'absent' : ''}" 
                                onclick="console.log('Absent button clicked for student ${student.id}'); window.markAttendance('${student.id}', 'absent')"
                                data-status="absent">
                            ✗ Absent
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Update statistics
        document.getElementById('attendance-summary-text').textContent = 
            `${filteredStudents.length} students`;
        document.getElementById('present-count').textContent = presentCount;
        document.getElementById('absent-count').textContent = absentCount;
        document.getElementById('unmarked-count').textContent = unmarkedCount;
        
        // Render students
        if (filteredStudents.length === 0) {
            grid.innerHTML = '<div class="empty-state">No students found</div>';
        } else {
            grid.innerHTML = studentHTML;
        }
        
        console.log('=== NEW ATTENDANCE SYSTEM COMPLETE ===');
    }
    
    // Global attendance function
    markAttendance(studentId, status) {
        console.log('=== MARK ATTENDANCE CALLED ===');
        console.log('Student ID:', studentId);
        console.log('Status:', status);
        
        // Show immediate feedback
        const button = event.target;
        console.log('Button clicked:', button);
        
        // Add visual feedback immediately
        button.style.transform = 'scale(0.9)';
        button.style.opacity = '0.7';
        
        setTimeout(() => {
            button.style.transform = 'scale(1)';
            button.style.opacity = '1';
        }, 200);
        
        const date = document.getElementById('attendance-date').value || new Date().toISOString().split('T')[0];
        console.log('Date being used:', date);
        console.log('Current attendance records:', this.attendance.length);
        
        // Find existing attendance
        const existingIndex = this.attendance.findIndex(a => 
            String(a.studentId) === String(studentId) && a.date === date
        );
        
        console.log('Existing attendance index:', existingIndex);
        
        if (existingIndex !== -1) {
            // Update existing
            console.log('Updating existing attendance');
            this.attendance[existingIndex].status = status;
            this.attendance[existingIndex].markedAt = new Date().toISOString();
            console.log('Updated attendance:', this.attendance[existingIndex]);
        } else {
            // Create new
            console.log('Creating new attendance record');
            const newRecord = {
                id: Date.now().toString(),
                studentId: String(studentId),
                date: date,
                status: status,
                markedAt: new Date().toISOString()
            };
            this.attendance.push(newRecord);
            console.log('New attendance record:', newRecord);
        }
        
        console.log('Total attendance records after:', this.attendance.length);
        console.log('All attendance records:', this.attendance);
        
        // Force save to storage
        try {
            this.saveDataToStorage();
            console.log('Data saved to storage successfully');
        } catch (error) {
            console.error('Error saving to storage:', error);
        }
        
        // Force re-render with delay
        setTimeout(() => {
            console.log('Re-rendering attendance...');
            this.renderAttendance();
            this.updateDashboard();
            console.log('Re-render complete');
        }, 100);
        
        console.log('=== MARK ATTENDANCE COMPLETE ===');
    }
    
    // Bulk attendance functions
    markAllPresent() {
        const date = document.getElementById('attendance-date').value || new Date().toISOString().split('T')[0];
        const classFilter = document.getElementById('attendance-class-filter').value;
        
        let studentsToMark = this.students;
        if (classFilter) {
            // Handle grade-level filters (e.g., "4", "6", "7", "8")
            if (classFilter === '4' || classFilter === '6' || classFilter === '7' || classFilter === '8') {
                studentsToMark = studentsToMark.filter(s => 
                    s.class === classFilter || 
                    s.class === `${classFilter} Boys` || 
                    s.class === `${classFilter} Girls`
                );
            } else {
                studentsToMark = studentsToMark.filter(s => s.class === classFilter);
            }
        }
        
        if (!confirm(`Mark all ${studentsToMark.length} students as Present?`)) return;
        
        studentsToMark.forEach(student => {
            const existingIndex = this.attendance.findIndex(a => 
                a.studentId === student.id && a.date === date
            );
            
            if (existingIndex !== -1) {
                this.attendance[existingIndex].status = 'present';
                this.attendance[existingIndex].markedAt = new Date().toISOString();
            } else {
                this.attendance.push({
                    id: Date.now().toString(),
                    studentId: student.id,
                    date: date,
                    status: 'present',
                    markedAt: new Date().toISOString()
                });
            }
        });
        
        this.saveDataToStorage();
        this.renderAttendance();
        this.updateDashboard();
        alert(`Marked ${studentsToMark.length} students as Present`);
    }
    
    markAllAbsent() {
        const date = document.getElementById('attendance-date').value || new Date().toISOString().split('T')[0];
        const classFilter = document.getElementById('attendance-class-filter').value;
        
        let studentsToMark = this.students;
        if (classFilter) {
            // Handle grade-level filters (e.g., "4", "6", "7", "8")
            if (classFilter === '4' || classFilter === '6' || classFilter === '7' || classFilter === '8') {
                studentsToMark = studentsToMark.filter(s => 
                    s.class === classFilter || 
                    s.class === `${classFilter} Boys` || 
                    s.class === `${classFilter} Girls`
                );
            } else {
                studentsToMark = studentsToMark.filter(s => s.class === classFilter);
            }
        }
        
        if (!confirm(`Mark all ${studentsToMark.length} students as Absent?`)) return;
        
        studentsToMark.forEach(student => {
            const existingIndex = this.attendance.findIndex(a => 
                a.studentId === student.id && a.date === date
            );
            
            if (existingIndex !== -1) {
                this.attendance[existingIndex].status = 'absent';
                this.attendance[existingIndex].markedAt = new Date().toISOString();
            } else {
                this.attendance.push({
                    id: Date.now().toString(),
                    studentId: student.id,
                    date: date,
                    status: 'absent',
                    markedAt: new Date().toISOString()
                });
            }
        });
        
        this.saveDataToStorage();
        this.renderAttendance();
        this.updateDashboard();
        alert(`Marked ${studentsToMark.length} students as Absent`);
    }

    // Export/Import Functions
    // Export attendance by week days - separate files for each class
    exportAttendance() {
        try {
            console.log('=== EXPORT ATTENDANCE START ===');
            
            const date = document.getElementById('attendance-date').value || new Date().toISOString().split('T')[0];
            const classFilter = document.getElementById('attendance-class-filter').value;
            
            console.log('Export parameters:');
            console.log('- Date:', date);
            console.log('- Class filter:', classFilter);
            console.log('- Total students:', this.students.length);
            console.log('- Total attendance records:', this.attendance.length);
            
            // Check if students data exists
            if (!this.students || this.students.length === 0) {
                console.error('No students data available');
                alert('No students data available. Please add students first.');
                return;
            }
            
            // Check if class filter is selected
            if (!classFilter) {
                alert('Please select a class to export.\nChoose a class from dropdown and then click Export.');
                return;
            }
        
        // Get week dates (Sunday to Thursday)
        const selectedDate = new Date(date);
        let dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        
        console.log('=== WEEK CALCULATION DEBUG ===');
        console.log('Selected date:', selectedDate.toISOString().split('T')[0]);
        console.log('Day of week:', dayOfWeek, '(0=Sunday, 1=Monday, ..., 6=Saturday)');
        
        // Always calculate from Sunday of the current week
        // Find the most recent Sunday (including today if it's Sunday)
        const sunday = new Date(selectedDate);
        const daysToGoBack = dayOfWeek; // If today is Sunday (0), go back 0 days; if Monday (1), go back 1 day, etc.
        sunday.setDate(selectedDate.getDate() - daysToGoBack);
        
        console.log('Days to go back to Sunday:', daysToGoBack);
        console.log('Calculated Sunday:', sunday.toISOString().split('T')[0]);
        
        // Generate week dates (Sunday to Thursday only)
        const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
        const weekDates = [];
        
        for (let i = 0; i < 5; i++) { // Only 5 days: Sunday (0) to Thursday (4)
            const currentDate = new Date(sunday);
            currentDate.setDate(sunday.getDate() + i);
            const dateStr = currentDate.toISOString().split('T')[0];
            weekDates.push({
                dayName: weekDays[i],
                date: dateStr
            });
            console.log(`Day ${i}: ${weekDays[i]} = ${dateStr}`);
        }
        
        console.log('Final weekDates:', weekDates);
        console.log('=== END WEEK CALCULATION DEBUG ===');
        
        console.log('Week dates:', weekDates);
        
        // Filter attendance for the selected class only
        const studentsInClass = this.students.filter(s => s.class === classFilter);
        const classAttendance = this.attendance.filter(a => {
            const student = this.students.find(s => String(s.id) === String(a.studentId));
            return student && student.class === classFilter;
        });
        
        console.log(`Selected class: ${classFilter}`);
        console.log(`Students in class: ${studentsInClass.length}`);
        console.log(`Attendance records for class: ${classAttendance.length}`);
        
        if (classAttendance.length === 0) {
            console.log('No attendance found for class:', classFilter);
            alert(`No attendance records found for class "${classFilter}" this week.\nPlease mark some attendance for this class first.`);
            return;
        }
        
        console.log('Proceeding with export for class:', classFilter, 'with', classAttendance.length, 'records');

        // Group by days for selected class
        const classWeekGroups = {};
        weekDays.forEach(day => {
            classWeekGroups[day] = [];
        });
        
        classAttendance.forEach(attendance => {
            const student = this.students.find(s => String(s.id) === String(attendance.studentId));
            if (student && student.class === classFilter) {
                // Find which day this attendance belongs to
                const dayInfo = weekDates.find(wd => wd.date === attendance.date);
                if (dayInfo) {
                    classWeekGroups[dayInfo.dayName].push({
                        studentId: attendance.studentId,
                        studentName: student.name,
                        date: attendance.date,
                        status: attendance.status,
                        markedBy: attendance.markedBy || 'System',
                        markedAt: attendance.markedAt || new Date().toISOString()
                    });
                }
            }
        });

        // Create CSV for selected class - days in correct order
        let csvContent = [['Student ID', 'Student Name', 'Date', 'Status', 'Marked By', 'Marked At']];
        
        // Add students grouped by days in chronological order (Sunday to Thursday)
        for (let i = 0; i < weekDays.length; i++) {
            const day = weekDays[i]; // Sunday, Monday, Tuesday, Wednesday, Thursday
            if (classWeekGroups[day].length > 0) {
                csvContent.push([`=== ${day.toUpperCase()} ===`, '', '', '', '', '']); // Day header
                classWeekGroups[day].forEach(record => {
                    // Convert date to day name
                    const recordDate = new Date(record.date);
                    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
                    const dayIndex = recordDate.getDay(); // 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
                    const dayName = dayNames[dayIndex] || 'Unknown';
                    
                    console.log(`Record date: ${record.date}, Day index: ${dayIndex}, Day name: ${dayName}`);
                    
                    csvContent.push([
                        record.studentId,
                        record.studentName,
                        `${dayName} (${record.date})`, // Day name with actual date
                        record.status,
                        record.markedBy,
                        record.markedAt
                    ]);
                });
                csvContent.push(['', '', '', '', '', '']); // Empty line between days
            }
        }
        
        const csvRows = csvContent.map(row => {
            if (Array.isArray(row)) {
                return row.map(cell => `"${cell}"`).join(',');
            } else {
                return `"${row}"`;
            }
        });
        const csvString = csvRows.join('\n');

        // Add BOM for Arabic support
        const BOM = '\uFEFF';
        const csvWithBOM = BOM + csvString;
        
        // Create and download CSV file for the selected class
        console.log(`Creating CSV file for class ${classFilter}...`);
        const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
        console.log(`Blob created for ${classFilter}, size:`, blob.size, 'bytes');
        
        const url = window.URL.createObjectURL(blob);
        console.log(`Blob URL created for ${classFilter}:`, url);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_${classFilter}_week_${weekDates[0].date}_to_${weekDates[4].date}.csv`;
        a.style.display = 'none';
        
        // Add to document, trigger click, then remove
        document.body.appendChild(a);
        console.log(`Added link to document for ${classFilter}`);
        
        // Try multiple click methods
        try {
            a.click();
            console.log(`Method 1: click() called for ${classFilter}`);
        } catch (e) {
            console.log(`Method 1 failed for ${classFilter}:`, e);
        }
        
        try {
            const event = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
            });
            a.dispatchEvent(event);
            console.log(`Method 2: dispatchEvent called for ${classFilter}`);
        } catch (e) {
            console.log(`Method 2 failed for ${classFilter}:`, e);
        }
        
        // Fallback: show download link
        setTimeout(() => {
            try {
                document.body.removeChild(a);
                console.log(`Link removed from document for ${classFilter}`);
            } catch (e) {
                console.log(`Remove failed for ${classFilter}:`, e);
            }
            
            // If download didn't work, show link
            if (confirm(`Download for ${classFilter} may not have started automatically. Click OK to open download link.`)) {
                window.open(url, '_blank');
            }
        }, 1000);
        
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
            console.log(`URL revoked for ${classFilter}`);
        }, 5000);
        
        console.log('=== EXPORT ATTENDANCE COMPLETE ===');
        } catch (error) {
            console.error('Export error:', error);
            alert('Export failed: ' + error.message + '\nPlease check console for details.');
        }
    }

    exportStudents() {
        const csvContent = [
            ['ID', 'Name', 'Class', 'Phone', 'Bus Subscriber'],
            ...this.students.map(student => [
                student.id,
                student.name,
                student.class,
                student.phone,
                student.busSubscriber ? 'Yes' : 'No'
            ])
        ].map(row => row.join(',')).join('\n');

        // Fix: Add BOM for proper UTF-8 encoding to support Arabic characters
        const BOM = '\uFEFF';
        const csvWithBOM = BOM + csvContent;
        
        const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    importStudents(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csv = e.target.result;
                const lines = csv.split('\n');
                const headers = lines[0].split(',');
                
                const newStudents = [];
                // Get the next available ID to avoid conflicts
                let nextId = this.getNextStudentId();
                
                for (let i = 1; i < lines.length; i++) {
                    if (lines[i].trim() === '') continue;
                    
                    const values = lines[i].split(',');
                    if (values.length >= 4) {
                        const studentId = nextId++;
                        const student = {
                            id: studentId,
                            name: values[1].trim().replace(/"/g, ''),
                            class: values[2].trim(),
                            phone: values[3].trim(),
                            busSubscriber: values[4]?.trim().toLowerCase() === 'yes',
                            isImported: true, // Mark as imported
                            importDate: new Date().toISOString() // Track when imported
                        };
                        
                        // Mark this ID as protected
                        this.importedStudentIds.add(studentId);
                        newStudents.push(student);
                    }
                }

                if (newStudents.length > 0) {
                    this.students.push(...newStudents);
                    this.saveDataToStorage();
                    this.renderStudents();
                    this.updateDashboard();
                    alert(`Successfully imported ${newStudents.length} students! These students are now protected and will never be removed.`);
                } else {
                    alert('No valid student data found in CSV file.');
                }
            } catch (error) {
                alert('Error importing CSV file. Please check the format.');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }

    // Bus Management
    openBusModal() {
        const modal = document.getElementById('bus-modal');
        const studentSelect = document.getElementById('bus-student');
        const routeSelect = document.getElementById('bus-route');
        
        // Clear form
        studentSelect.value = '';
        routeSelect.innerHTML = '<option value="">Select Route</option>';
        
        // Populate route dropdown using route manager for live data
        const routes = routeManager.getRoutes();
        console.log('DEBUG: Routes from routeManager:', routes);
        console.log('DEBUG: Routes count:', routes.length);
        routes.forEach(route => {
            console.log('DEBUG: Adding route to dropdown:', route.name);
            routeSelect.innerHTML += `<option value="${route.name}">${route.name}</option>`;
        });
        
        // Populate student dropdown
        studentSelect.innerHTML = '<option value="">Select Student</option>';
        this.students.forEach(student => {
            const existingSubscription = this.busSubscriptions.find(b => b.studentId === student.id);
            if (!existingSubscription) {
                studentSelect.innerHTML += `<option value="${student.id}">${student.name} - Grade ${student.class}</option>`;
            }
        });
        
        modal.classList.add('show');
    }

    saveBusSubscription() {
        const studentId = parseInt(document.getElementById('bus-student').value);
        const route = document.getElementById('bus-route').value.trim();
        const monthlyFee = parseFloat(document.getElementById('bus-fee').value);

        if (!studentId || !route || !monthlyFee) {
            alert('Please fill in all required fields');
            return;
        }

        const newSubscription = {
            id: this.getNextBusId(),
            studentId,
            route,
            monthlyFee,
            status: 'active'
        };

        this.busSubscriptions.push(newSubscription);
        
        // Update student's bus subscriber status
        const student = this.students.find(s => s.id === studentId);
        if (student) {
            student.busSubscriber = true;
        }

        this.saveDataToStorage();
        this.renderBusSubscriptions();
        this.renderStudents(); // Refresh student table to update bus status
        this.updateDashboard();
        this.closeModal('bus-modal');
    }

    deleteBusSubscription(subscriptionId) {
        if (confirm('Are you sure you want to remove this bus subscription?')) {
            const subscription = this.busSubscriptions.find(b => b.id === subscriptionId);
            if (subscription) {
                // Update student's bus subscriber status
                const student = this.students.find(s => s.id === subscription.studentId);
                if (student) {
                    student.busSubscriber = false;
                }
            }
            
            this.busSubscriptions = this.busSubscriptions.filter(b => b.id !== subscriptionId);
            this.saveDataToStorage();
            this.renderBusSubscriptions();
            this.renderStudents();
            this.updateDashboard();
        }
    }

    renderBusSubscriptions() {
        const tableBody = document.getElementById('bus-table');
        const grid = document.getElementById('bus-routes-grid');
        if (!tableBody && !grid) return;

        const monthFilterEl = document.getElementById('bus-month-filter');
        const routeFilterEl = document.getElementById('bus-route-filter');
        const classFilterEl = document.getElementById('bus-class-filter');
        const monthFilter = monthFilterEl ? monthFilterEl.value : '';
        const routeFilter = routeFilterEl ? routeFilterEl.value : '';
        const classFilter = classFilterEl ? classFilterEl.value : '';

        // Get routes from route manager
        const routes = routeManager.getRoutes();
        
        // Populate route filter dropdown (if it exists in the current page)
        const routeFilterSelect = document.getElementById('bus-route-filter');
        if (routeFilterSelect) {
            const currentValue = routeFilterSelect.value;
            routeFilterSelect.innerHTML = '<option value="">All Routes</option>';
            routes.forEach(route => {
                routeFilterSelect.innerHTML += `<option value="${route.name}">${route.name}</option>`;
            });
            routeFilterSelect.value = currentValue;
        }

        // Table-based rendering (index.html)
        if (tableBody) {
            tableBody.innerHTML = '';

            const filteredSubs = this.busSubscriptions.filter(sub => {
                const student = this.students.find(s => String(s.id) === String(sub.studentId));
                if (!student) return false;

                const matchesClass = !classFilter || String(student.class) === String(classFilter);
                const matchesRoute = !routeFilter || String(sub.route) === String(routeFilter);
                const matchesMonth = !monthFilter || String(sub.month) === String(monthFilter);

                return matchesClass && matchesRoute && matchesMonth;
            });

            if (filteredSubs.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7" class="empty-state">No bus subscriptions found</td></tr>';
                return;
            }

            filteredSubs.forEach(sub => {
                const student = this.students.find(s => String(s.id) === String(sub.studentId));
                if (!student) return;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${student.id}</td>
                    <td>${student.name}</td>
                    <td>${this.getDisplayClassName(student.class)}</td>
                    <td>${sub.route || ''}</td>
                    <td>$${Number(sub.monthlyFee || 0).toFixed(2)}</td>
                    <td><span class="status-badge status-${sub.status}">${sub.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="sms.editBusSubscription(${sub.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="sms.deleteBusSubscription(${sub.id})">Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            return;
        }

        if (!grid) return;
        
        // Group subscriptions by route
        const subscriptionsByRoute = {};
        routes.forEach(route => {
            subscriptionsByRoute[route.name] = [];
        });
        
        // Add "No Route" category for subscriptions without routes
        subscriptionsByRoute['No Route'] = [];
        
        // Group subscriptions
        this.busSubscriptions.forEach(sub => {
            const routeName = sub.route || 'No Route';
            if (!subscriptionsByRoute[routeName]) {
                subscriptionsByRoute[routeName] = [];
            }
            subscriptionsByRoute[routeName].push(sub);
        });
        
        // Clear grid
        grid.innerHTML = '';
        
        // Create route sections
        let hasContent = false;
        
        Object.entries(subscriptionsByRoute).forEach(([routeName, subscriptions]) => {
            // Apply filters
            let filteredSubscriptions = subscriptions.filter(sub => {
                const student = this.students.find(s => s.id === sub.studentId);
                if (!student) return false;
                
                const matchesRoute = !routeFilter || routeName === routeFilter;
                const matchesClass = !classFilter || student.class === classFilter;
                
                return matchesRoute && matchesClass;
            });
            
            // Skip if no subscriptions after filtering
            if (filteredSubscriptions.length === 0) {
                return;
            }
            
            hasContent = true;
            
            // Create route section
            const routeSection = document.createElement('div');
            routeSection.className = 'route-section';
            
            // Route header
            const routeHeader = document.createElement('div');
            routeHeader.className = 'route-header';
            routeHeader.innerHTML = `
                <h3 class="route-title">${routeName}</h3>
                <span class="route-count">${filteredSubscriptions.length} students</span>
            `;
            
            // Students grid
            const studentsGrid = document.createElement('div');
            studentsGrid.className = 'route-students-grid';
            
            filteredSubscriptions.forEach(sub => {
                const student = this.students.find(s => s.id === sub.studentId);
                if (!student) return;
                
                const studentCard = document.createElement('div');
                studentCard.className = 'bus-student-card';
                studentCard.innerHTML = `
                    <div class="bus-student-info">
                        <div class="bus-student-name">${student.name}</div>
                        <div class="bus-student-class">Grade ${student.class}</div>
                    </div>
                    <div class="bus-student-details">
                        <span class="bus-student-fee">$${sub.monthlyFee}/month</span>
                        <span class="bus-student-status ${sub.status}">${sub.status}</span>
                    </div>
                    <div class="bus-student-actions">
                        <button class="btn btn-sm btn-primary" onclick="sms.editBusSubscription(${sub.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="sms.deleteBusSubscription(${sub.id})">Delete</button>
                    </div>
                `;
                studentsGrid.appendChild(studentCard);
            });
            
            routeSection.appendChild(routeHeader);
            routeSection.appendChild(studentsGrid);
            grid.appendChild(routeSection);
        });
        
        // Show empty state if no content
        if (!hasContent) {
            grid.innerHTML = '<div class="empty-state">No bus subscriptions found matching the selected filters.</div>';
        }
    }

    // Route Management
    openRouteModal() {
        const modal = document.getElementById('route-modal');
        const routeNameInput = document.getElementById('route-name');
        const routeAreaInput = document.getElementById('route-area');
        const routesList = document.getElementById('current-routes-list');
        
        // Clear form
        routeNameInput.value = '';
        routeAreaInput.value = '';
        
        // Populate routes list
        const routes = routeManager.getRoutes();
        routesList.innerHTML = '';
        
        if (routes.length === 0) {
            routesList.innerHTML = '<div class="empty-state">No routes found. Add your first route below!</div>';
        } else {
            routes.forEach(route => {
                const routeItem = document.createElement('div');
                routeItem.className = 'route-item';
                routeItem.innerHTML = `
                    <div class="route-info">
                        <div class="route-name">${route.name}</div>
                        <div class="route-area">${route.area}</div>
                    </div>
                    <div class="route-actions">
                        <button class="btn btn-sm btn-primary" onclick="sms.editRoute(${route.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="sms.deleteRoute(${route.id})">Delete</button>
                    </div>
                `;
                routesList.appendChild(routeItem);
            });
        }
        
        modal.classList.add('show');
    }

    saveRoute() {
        console.log('=== SAVE ROUTE START (INDEPENDENT SYSTEM) ===');
        const routeName = document.getElementById('route-name').value.trim();
        const routeArea = document.getElementById('route-area').value.trim();

        console.log('Saving route:', { routeName, routeArea });

        if (!routeName || !routeArea) {
            alert('Please fill in all required fields');
            return;
        }

        // Use independent route manager
        const newRoute = routeManager.addRoute(routeName, routeArea);
        
        console.log('Route added via route manager:', newRoute);
        
        // Update local reference
        this.busRoutes = routeManager.getRoutes();
        console.log('Updated local routes:', this.busRoutes.length);
        
        this.closeModal('route-modal');
        
        // Update bus dropdown
        this.renderBusSubscriptions();
        
        console.log('=== SAVE ROUTE END (INDEPENDENT SYSTEM) ===');
    }

    getNextRouteId() {
        if (this.busRoutes.length === 0) {
            return 1;
        }
        // Find the highest existing ID and add 1
        const maxId = Math.max(...this.busRoutes.map(route => route.id));
        return maxId + 1;
    }

    deleteRoute(routeId) {
        console.log('=== DELETE ROUTE START ===');
        console.log('Route ID to delete:', routeId);
        console.log('Current routes before delete:', routeManager.getRoutes());
        
        if (!confirm('Are you sure you want to delete this route? This will affect all bus subscriptions using this route.')) {
            console.log('User cancelled deletion');
            return;
        }

        // Use independent route manager
        const deletedRoute = routeManager.deleteRoute(routeId);
        
        console.log('Route manager delete result:', deletedRoute);
        
        if (deletedRoute) {
            console.log('Route deleted via route manager:', deletedRoute);
            
            // Update local reference
            this.busRoutes = routeManager.getRoutes();
            console.log('Updated local routes after delete:', this.busRoutes.length);
            
            // Update bus subscriptions that use this route
            this.busSubscriptions.forEach(sub => {
                if (sub.route && sub.route.includes(deletedRoute.name)) {
                    sub.route = 'Route Removed - Please Update';
                }
            });

        
        // Skip if no subscriptions after filtering
        if (filteredSubscriptions.length === 0) return;
        
        hasContent = true;
        
        // Create route section
        const routeSection = document.createElement('div');
        routeSection.className = 'route-section';
        
        // Route header
        const routeHeader = document.createElement('div');
        routeHeader.className = 'route-header';
        routeHeader.innerHTML = `
            <h3 class="route-title">${routeName}</h3>
            <span class="route-count">${filteredSubscriptions.length} students</span>
        `;
        
        // Students grid
        const studentsGrid = document.createElement('div');
        studentsGrid.className = 'route-students-grid';
        
        filteredSubscriptions.forEach(sub => {
            const student = this.students.find(s => s.id === sub.studentId);
            if (!student) return;
            
            const studentCard = document.createElement('div');
            studentCard.className = 'bus-student-card';
            studentCard.innerHTML = `
                <div class="bus-student-info">
                    <div class="bus-student-name">${student.name}</div>
                    <div class="bus-student-class">Grade ${student.class}</div>
                </div>
                <div class="bus-student-details">
                    <span class="bus-student-fee">$${sub.monthlyFee}/month</span>
                    <span class="bus-student-status ${sub.status}">${sub.status}</span>
                </div>
                <div class="bus-student-actions">
                    <button class="btn btn-sm btn-primary" onclick="sms.editBusSubscription(${sub.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="sms.deleteBusSubscription(${sub.id})">Delete</button>
                </div>
            `;
            studentsGrid.appendChild(studentCard);
        });
        
        routeSection.appendChild(routeHeader);
        routeSection.appendChild(studentsGrid);
        grid.appendChild(routeSection);
        });
    
    // Show empty state if no content
    if (!hasContent) {
        grid.innerHTML = '<div class="empty-state">No bus subscriptions found matching the selected filters.</div>';
    }
}

function openRouteModal() {
    const modal = document.getElementById('route-modal');
    const routeNameInput = document.getElementById('route-name');
    const routeAreaInput = document.getElementById('route-area');
    const routesList = document.getElementById('current-routes-list');
    
    // Clear form
    routeNameInput.value = '';
    routeAreaInput.value = '';
    
    // Populate routes list
    const routes = routeManager.getRoutes();
    routesList.innerHTML = '';
    
    if (routes.length === 0) {
        routesList.innerHTML = '<div class="empty-state">No routes found. Add your first route below!</div>';
    } else {
        routes.forEach(route => {
            const routeItem = document.createElement('div');
            routeItem.className = 'route-item';
            routeItem.innerHTML = `
                <div class="route-info">
                    <div class="route-name">${route.name}</div>
                    <div class="route-area">${route.area}</div>
                </div>
                <div class="route-actions">
                    <button class="btn btn-sm btn-primary" onclick="sms.editRoute(${route.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="sms.deleteRoute(${route.id})">Delete</button>
                </div>
            `;
            routesList.appendChild(routeItem);
        });
    }
    
    modal.classList.add('show');
}

function saveRoute() {
    console.log('=== SAVE ROUTE START (INDEPENDENT SYSTEM) ===');
    const routeName = document.getElementById('route-name').value.trim();
    const routeArea = document.getElementById('route-area').value.trim();
    if (!route) return;

        const modal = document.getElementById('route-modal');
        const routeNameInput = document.getElementById('route-name');
        const routeAreaInput = document.getElementById('route-area');
        const routesList = document.getElementById('current-routes-list');
        
        // Populate form with route data
        routeNameInput.value = route.name;
        routeAreaInput.value = route.area;
        
        // Change save button to update mode
        const saveBtn = modal.querySelector('button[type="submit"]');
        saveBtn.textContent = 'Update Route';
        saveBtn.onclick = () => this.updateRoute(routeId);
        
        // Scroll to form
        const formContainer = modal.querySelector('.route-form-container');
        formContainer.scrollIntoView({ behavior: 'smooth' });
        
        modal.classList.add('show');
    }

    updateRoute(routeId) {
        const routeName = document.getElementById('route-name').value.trim();
        const routeArea = document.getElementById('route-area').value.trim();

        if (!routeName || !routeArea) {
            alert('Please fill in all required fields');
            return;
        }

        // Use independent route manager
        const updated = routeManager.updateRoute(routeId, routeName, routeArea);
        
        if (updated) {
            console.log('Route updated via route manager:', { routeId, routeName, routeArea });
            
            // Update local reference
            this.busRoutes = routeManager.getRoutes();
            
            this.saveDataToStorage();
            this.renderBusSubscriptions(); // Update bus table to show route changes
            this.closeModal('route-modal');
        }
    }

    // Fee Management
    openFeeModal() {
        const modal = document.getElementById('fee-modal');
        const studentSelect = document.getElementById('fee-student');
        
        // Populate student dropdown
        studentSelect.innerHTML = '<option value="">Select Student</option>';
        this.students.forEach(student => {
            studentSelect.innerHTML += `<option value="${student.id}">${student.name} - Grade ${student.class}</option>`;
        });
        
        modal.classList.add('show');
    }

    saveFeePayment() {
        const studentId = parseInt(document.getElementById('fee-student').value);
        const month = document.getElementById('fee-month').value;
        const tuitionFee = parseFloat(document.getElementById('fee-tuition').value);
        const busFee = parseFloat(document.getElementById('fee-bus').value) || 0;
        const paymentDate = document.getElementById('fee-date').value;

        if (!studentId || !month || !tuitionFee || !paymentDate) {
            alert('Please fill in all required fields');
            return;
        }

        // Check if payment already exists for this student and month
        const existingPayment = this.feePayments.find(f => 
            f.studentId === studentId && f.month === month
        );

        if (existingPayment) {
            if (!confirm('Payment for this student and month already exists. Do you want to overwrite it?')) {
                return;
            }
            this.feePayments = this.feePayments.filter(f => 
                !(f.studentId === studentId && f.month === month)
            );
        }

        const newPayment = {
            id: this.getNextFeeId(),
            studentId,
            month,
            year: new Date(paymentDate).getFullYear(),
            tuitionFee,
            busFee,
            total: tuitionFee + busFee,
            paymentDate,
            status: 'paid'
        };

        this.feePayments.push(newPayment);
        this.saveDataToStorage();
        this.renderFeePayments();
        this.renderStudents(); // Refresh student table to update fee status
        this.updateDashboard();
        this.closeModal('fee-modal');
    }

    deleteFeePayment(paymentId) {
        if (confirm('Are you sure you want to delete this payment record?')) {
            this.feePayments = this.feePayments.filter(f => f.id !== paymentId);
            this.saveDataToStorage();
            this.renderFeePayments();
            this.renderStudents(); // Refresh student table to update fee status
            this.updateDashboard();
        }
    }

    renderFeePayments() {
        const monthFilterEl = document.getElementById('fees-month');
        const classFilterEl = document.getElementById('fees-class-filter');
        const tbody = document.getElementById('fees-table');

        if (!tbody) return;

        const monthFilter = monthFilterEl ? monthFilterEl.value : '';
        const classFilter = classFilterEl ? classFilterEl.value : '';
        
        let filteredPayments = this.feePayments;
        
        if (monthFilter) {
            filteredPayments = filteredPayments.filter(f => String(f.month) === String(monthFilter));
        }
        
        if (classFilter) {
            const studentsInClass = this.students
                .filter(s => String(s.class) === String(classFilter))
                .map(s => String(s.id));
            filteredPayments = filteredPayments.filter(f => studentsInClass.includes(String(f.studentId)));
        }

        tbody.innerHTML = '';

        if (filteredPayments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No fee payments found</td></tr>';
            return;
        }

        filteredPayments.forEach(payment => {
            const student = this.students.find(s => s.id === payment.studentId);
            if (!student) return;

            const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                              'July', 'August', 'September', 'October', 'November', 'December'];
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td>${(student.class === 'KG1' || student.class === 'KG2') ? student.class : (student.class === '6 Boys' ? 'Grade 6 Boys' : (student.class === '6 Girls' ? 'Grade 6 Girls' : (student.class === '7 Boys' ? 'Grade 7 Boys' : (student.class === '7 Girls' ? 'Grade 7 Girls' : (student.class === '8 Boys' ? 'Grade 8 Boys' : (student.class === '8 Girls' ? 'Grade 8 Girls' : `Grade ${student.class}`))))))}</td>
                <td>${monthNames[payment.month]}</td>
                <td>$${payment.tuitionFee.toFixed(2)}</td>
                <td>$${payment.busFee.toFixed(2)}</td>
                <td><strong>$${payment.total.toFixed(2)}</strong></td>
                <td><span class="status-badge status-${payment.status}">${payment.status}</span></td>
                <td>${payment.paymentDate}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="sms.deleteFeePayment(${payment.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Dashboard
    updateDashboard() {
        this.updateStatistics();
        this.updateClassDistribution();
        this.updateAlerts();
        this.updateRecentActivity();
        this.updateFeeProgress();
        this.updateAttendanceChart();
    }

    updateStatistics() {
        // Total Students
        document.getElementById('total-students').textContent = this.students.length;

        // Today's Attendance
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = this.attendance.filter(a => a.date === today);
        const presentCount = todayAttendance.filter(a => a.status === 'present').length;
        const absentCount = todayAttendance.filter(a => a.status === 'absent').length;

        document.getElementById('attendance-today').textContent = presentCount;
        document.getElementById('absent-today').textContent = absentCount;

        // Attendance Rate
        const attendanceRate = todayAttendance.length > 0 ? 
            Math.round((presentCount / todayAttendance.length) * 100) : 0;
        document.getElementById('attendance-rate').textContent = `${attendanceRate}%`;

        // Monthly Fee Collection
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const monthlyFees = (Array.isArray(this.feePayments) ? this.feePayments : []).filter(f => {
            if (!f || f.status !== 'paid') return false;
            const fallbackDate = f.paymentDate ? new Date(f.paymentDate) : null;
            const m = Number(f.month ?? (fallbackDate ? (fallbackDate.getMonth() + 1) : NaN));
            const y = Number(f.year ?? (fallbackDate ? fallbackDate.getFullYear() : NaN));
            return m === currentMonth && y === currentYear;
        });
        const totalCollected = monthlyFees.reduce((sum, fee) => sum + Number(fee.total || 0), 0);
        const feeCollectionEl = document.getElementById('fee-collection');
        if (feeCollectionEl) feeCollectionEl.textContent = `$${totalCollected.toFixed(2)}`;

        // Bus Subscriptions
        const activeBusSubscriptions = this.busSubscriptions.filter(b => b.status === 'active').length;
        document.getElementById('bus-subscriptions').textContent = activeBusSubscriptions;
    }

    updateClassDistribution() {
        const classDistribution = {};
        
        // Count students by class
        this.students.forEach(student => {
            const className = this.getDisplayClassName(student.class);
            classDistribution[className] = (classDistribution[className] || 0) + 1;
        });

        const classGrid = document.getElementById('class-distribution');
        classGrid.innerHTML = '';

        Object.entries(classDistribution).forEach(([className, count]) => {
            const classItem = document.createElement('div');
            classItem.className = 'class-item';
            classItem.innerHTML = `
                <div class="class-name">${className}</div>
                <div class="class-count">${count}</div>
            `;
            classGrid.appendChild(classItem);
        });
    }

    updateAlerts() {
        const alerts = [];
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        // Unpaid fees alert
        const unpaidStudents = this.students.filter(student => {
            const feeStatus = this.getStudentFeeStatus(student.id);
            return feeStatus.status === 'unpaid';
        });

        if (unpaidStudents.length > 0) {
            alerts.push({
                type: 'warning',
                icon: '💰',
                title: 'Unpaid Fees',
                message: `${unpaidStudents.length} students have unpaid fees for this month`
            });
        }

        // Missing attendance alert
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = this.attendance.filter(a => a.date === today);
        const expectedAttendance = this.students.length;
        
        if (todayAttendance.length < expectedAttendance) {
            const missingCount = expectedAttendance - todayAttendance.length;
            alerts.push({
                type: 'danger',
                icon: '📝',
                title: 'Missing Attendance',
                message: `${missingCount} students' attendance not marked today`
            });
        }

        // Render alerts
        const alertsContainer = document.getElementById('alerts-container');
        alertsContainer.innerHTML = '';

        if (alerts.length === 0) {
            alertsContainer.innerHTML = `
                <div class="alert-item success">
                    <span class="alert-icon">✅</span>
                    <div class="alert-content">
                        <div class="alert-title">All Systems Good</div>
                        <div class="alert-message">No alerts at this time</div>
                    </div>
                </div>
            `;
        } else {
            alerts.forEach(alert => {
                const alertItem = document.createElement('div');
                alertItem.className = `alert-item ${alert.type}`;
                alertItem.innerHTML = `
                    <span class="alert-icon">${alert.icon}</span>
                    <div class="alert-content">
                        <div class="alert-title">${alert.title}</div>
                        <div class="alert-message">${alert.message}</div>
                    </div>
                `;
                alertsContainer.appendChild(alertItem);
            });
        }
    }

    updateRecentActivity() {
        const activities = [];
        const now = new Date();

        // Recent fee payments
        const recentPayments = this.feePayments
            .filter(p => {
                const paymentDate = new Date(p.paymentDate);
                return (now - paymentDate) < (7 * 24 * 60 * 60 * 1000); // Last 7 days
            })
            .slice(-5)
            .reverse();

        recentPayments.forEach(payment => {
            const student = this.students.find(s => s.id === payment.studentId);
            if (student) {
                activities.push({
                    icon: '💰',
                    title: `Fee payment recorded for ${student.name}`,
                    time: this.formatTimeAgo(payment.paymentDate)
                });
            }
        });

        // Render activities
        const activityList = document.getElementById('recent-activity');
        activityList.innerHTML = '';

        if (activities.length === 0) {
            activityList.innerHTML = '<div class="activity-item"><div class="activity-content"><div class="activity-title">No recent activity</div></div></div>';
        } else {
            activities.slice(0, 10).forEach(activity => {
                const activityItem = document.createElement('div');
                activityItem.className = 'activity-item';
                activityItem.innerHTML = `
                    <div class="activity-icon">${activity.icon}</div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-time">${activity.time}</div>
                    </div>
                `;
                activityList.appendChild(activityItem);
            });
        }
    }

    updateFeeProgress() {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        // Calculate expected fees
        const expectedFees = this.students.length * 50; // Assuming $50 per student
        
        // Calculate collected fees
        const collectedFees = (Array.isArray(this.feePayments) ? this.feePayments : [])
            .filter(f => {
                if (!f || f.status !== 'paid') return false;
                const fallbackDate = f.paymentDate ? new Date(f.paymentDate) : null;
                const m = Number(f.month ?? (fallbackDate ? (fallbackDate.getMonth() + 1) : NaN));
                const y = Number(f.year ?? (fallbackDate ? fallbackDate.getFullYear() : NaN));
                return m === currentMonth && y === currentYear;
            })
            .reduce((sum, fee) => sum + Number(fee.total || 0), 0);

        // Calculate percentage
        const percentage = expectedFees > 0 ? Math.round((collectedFees / expectedFees) * 100) : 0;

        // Update UI
        document.getElementById('fees-collected-text').textContent = `$${Number(collectedFees || 0).toFixed(2)} collected`;
        document.getElementById('fees-total-text').textContent = `$${Number(expectedFees || 0).toFixed(2)} total`;
        document.getElementById('fees-progress').style.width = `${percentage}%`;
        document.getElementById('fees-percentage').textContent = `${percentage}%`;
    }

    updateAttendanceChart() {
        const chart = document.getElementById('attendance-chart');
        const last7Days = [];
        const attendanceData = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            last7Days.push(dayName);
            
            const dayAttendance = this.attendance.filter(a => a.date === dateStr);
            const presentCount = dayAttendance.filter(a => a.status === 'present').length;
            attendanceData.push(presentCount);
        }

        // Simple text representation of chart
        const maxAttendance = Math.max(...attendanceData, 1);
        
        let chartHTML = '<div style="display: flex; align-items: flex-end; height: 100%; gap: 8px; padding: 10px;">';
        
        attendanceData.forEach((count, index) => {
            const height = (count / maxAttendance) * 150;
            const color = count > 0 ? '#4CAF50' : '#e0e0e0';
            
            chartHTML += `
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;">
                    <div style="width: 100%; height: ${height}px; background: ${color}; border-radius: 4px 4px 0 0;"></div>
                    <div style="font-size: 10px; color: #666;">${last7Days[index]}</div>
                    <div style="font-size: 9px; font-weight: bold;">${count}</div>
                </div>
            `;
        });
        
        chartHTML += '</div>';
        chart.innerHTML = chartHTML;
    }

    // Quick Action Methods
    markTodayAttendance() {
        this.switchSection('attendance');
        setTimeout(() => {
            document.getElementById('attendance-date').focus();
        }, 100);
    }

    generateMonthlyReport() {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
        
        let report = `Monthly Report - ${monthNames[currentMonth]} ${currentYear}\n\n`;
        report += `Total Students: ${this.students.length}\n\n`;
        
        // Create and download report
        const blob = new Blob([report], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `monthly-report-${currentMonth}-${currentYear}.txt`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    sendFeeReminders() {
        const unpaidStudents = this.students.filter(student => {
            const feeStatus = this.getStudentFeeStatus(student.id);
            return feeStatus.status === 'unpaid';
        });

        if (unpaidStudents.length === 0) {
            alert('All students have paid their fees!');
            return;
        }

        alert(`Generated fee reminders for ${unpaidStudents.length} students!`);
    }

    exportAllData() {
        const allData = {
            students: this.students,
            attendance: this.attendance,
            busSubscriptions: this.busSubscriptions,
            feePayments: this.feePayments,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `school-data-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);

        alert('All data exported successfully!');
    }

    toggleTask(taskType) {
        const checkbox = document.getElementById(`${taskType}-marked`);
        if (checkbox.checked) {
            console.log(`Task ${taskType} marked as complete`);
        } else {
            console.log(`Task ${taskType} marked as incomplete`);
        }
    }

    // Helper Methods
    getDisplayClassName(className) {
        // Handle special class names with gender
        if (className === 'KG1' || className === 'KG2') {
            return className;
        } else if (className === '4 Boys' || className === '6 Boys' || className === '7 Boys' || className === '8 Boys') {
            return `Grade ${className}`;
        } else if (className === '4 Girls' || className === '6 Girls' || className === '7 Girls' || className === '8 Girls') {
            return `Grade ${className}`;
        } else {
            return `Grade ${className}`;
        }
    }

    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    }

    // Utility Functions
    setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('attendance-date').value = today;
        document.getElementById('fee-date').value = today;
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
        if (modalId === 'student-modal') {
            this.currentEditingStudent = null;
        }
    }
}

*/

// Global Functions for onclick handlers
function openStudentModal(studentId = null) {
    sms.openStudentModal(studentId);
}

function openBusModal() {
    sms.openBusModal();
}

function openRouteModal() {
    sms.openRouteModal();
}

function openFeeModal() {
    if (window.sms && typeof window.sms.openFeeModal === 'function') {
        window.sms.openFeeModal();
        return;
    }

    const modal = document.getElementById('fee-modal');
    const studentSelect = document.getElementById('fee-student');
    if (!modal || !studentSelect) return;

    studentSelect.innerHTML = '<option value="">Select Student</option>';
    if (window.sms && Array.isArray(window.sms.students)) {
        window.sms.students.forEach(student => {
            studentSelect.innerHTML += `<option value="${student.id}">${student.name} - Grade ${student.class}</option>`;
        });
    }

    modal.classList.add('show');
}

function markTodayAttendance() {
    sms.markTodayAttendance();
}

function closeModal(modalId) {
    sms.closeModal(modalId);
}

// Test function for debugging
function testAttendanceFunction() {
    console.log('Test function called');
    if (window.sms && window.sms.markStudentAttendance) {
        console.log('sms.markStudentAttendance is available');
        alert('Attendance functions are working!');
    } else {
        console.error('sms.markStudentAttendance is NOT available');
        alert('Error: Attendance functions not available');
    }
}

// Test function for export
function testExport() {
    console.log('=== TESTING EXPORT FUNCTION ===');
    console.log('window.sms available:', !!window.sms);
    console.log('exportAttendance available:', !!(window.sms && window.sms.exportAttendance));
    
    if (window.sms && window.sms.exportAttendance) {
        console.log('Students count:', window.sms.students.length);
        console.log('Attendance count:', window.sms.attendance.length);
        console.log('Date field value:', document.getElementById('attendance-date').value);
        console.log('Class filter value:', document.getElementById('attendance-class-filter').value);
        
        // Check if there are any attendance records for today
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = window.sms.attendance.filter(a => a.date === today);
        console.log('Today attendance records:', todayAttendance.length);
        
        if (todayAttendance.length === 0) {
            alert('No attendance records for today!\nPlease mark some attendance first, then try export.');
        } else {
            alert('Export function is working!\nFound ' + todayAttendance.length + ' attendance records for today.');
        }
    } else {
        alert('Export function not available - check console');
    }
}

// Add missing toggleAttendanceView function
function toggleAttendanceView() {
    console.log('Toggle attendance view called');
    // Simple toggle between grid and list view
    const grid = document.getElementById('attendance-grid');
    if (grid) {
        if (grid.style.display === 'none') {
            grid.style.display = 'grid';
            console.log('Showing grid view');
        } else {
            grid.style.display = 'none';
            console.log('Hiding grid view');
        }
    }
}

// Simple export test function
function testExportButton() {
    console.log('=== EXPORT BUTTON TEST ===');
    console.log('window.sms available:', !!window.sms);
    console.log('exportAttendance function available:', !!(window.sms && window.sms.exportAttendance));
    
    if (window.sms && window.sms.exportAttendance) {
        console.log('Students count:', window.sms.students.length);
        console.log('Attendance count:', window.sms.attendance.length);
        
        // Check today's attendance
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = window.sms.attendance.filter(a => a.date === today);
        console.log('Today attendance records:', todayAttendance.length);
        
        if (todayAttendance.length === 0) {
            alert('No attendance for today!\nPlease mark some attendance first:\n1. Click "✅ All Present" OR\n2. Click individual Present/Absent buttons\n3. Then try export again.');
        } else {
            alert('Found ' + todayAttendance.length + ' attendance records for today. Export should work!');
        }
    } else {
        alert('Export function not available');
    }
}

// Make testExportButton available immediately
window.testExportButton = testExportButton;

// Test function for individual buttons
function testIndividualButton() {
    console.log('=== TESTING INDIVIDUAL BUTTONS ===');
    console.log('window.sms available:', !!window.sms);
    console.log('window.markAttendance available:', !!window.markAttendance);
    
    if (window.sms && window.markAttendance) {
        // Get first student ID if available
        if (window.sms.students && window.sms.students.length > 0) {
            const firstStudent = window.sms.students[0];
            console.log('Testing with student:', firstStudent.id, firstStudent.name);
            
            // Test the function directly
            window.markAttendance(firstStudent.id, 'present');
            alert('Test completed! Check console for details.');
        } else {
            alert('No students available for testing');
        }
    } else {
        alert('Functions not available - check console');
    }
}

// Initialize the system
let sms;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing School Management System...');
    sms = new SchoolManagementSystem();
    // Make sms globally accessible for onclick handlers
    window.sms = sms;

    let serverSyncTimer = null;
    let applyingRemoteAttendance = false;
    let lastRemoteAttendanceJson = '';
    let serverHydrated = false;

    const postToServer = async (type, data) => {
        try {
            await fetch('/api/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ type, data })
            });
        } catch (_) {
            // ignore
        }
    };

    const scheduleServerSync = () => {
        if (!serverHydrated) return;
        if (applyingRemoteAttendance) return;
        if (serverSyncTimer) clearTimeout(serverSyncTimer);
        serverSyncTimer = setTimeout(async () => {
            if (!window.sms) return;
            await postToServer('students', window.sms.students || []);
            await postToServer('teachers', window.sms.teachers || []);
            await postToServer('attendance', window.sms.attendance || []);
            await postToServer('teacher-attendance', window.sms.teacherAttendance || []);
            await postToServer('bus', window.sms.busSubscriptions || []);
            await postToServer('fees', window.sms.feePayments || []);
            await postToServer('teacher-salaries', window.sms.teacherSalaries || []);
        }, 800);
    };

    const hydrateFromServer = async () => {
        try {
            const res = await fetch('/api/data');
            if (!res.ok) {
                serverHydrated = true;
                return;
            }
            const data = await res.json();

            const remoteStudents = Array.isArray(data?.students) ? data.students : null;
            const remoteAttendance = Array.isArray(data?.attendance) ? data.attendance : null;
            const remoteBus = Array.isArray(data?.busSubscriptions) ? data.busSubscriptions : null;
            const remoteFees = Array.isArray(data?.feePayments) ? data.feePayments : null;

            const hasLocalStudents = !!localStorage.getItem('school_students');
            const hasLocalAttendance = !!localStorage.getItem('school_attendance');
            const hasLocalBus = !!localStorage.getItem('school_bus');
            const hasLocalFees = !!localStorage.getItem('school_fees');

            if (remoteStudents && (!hasLocalStudents || remoteStudents.length > 0)) {
                window.sms.students = remoteStudents;
                try { localStorage.setItem('school_students', JSON.stringify(remoteStudents)); } catch (_) {}
            }
            if (remoteAttendance && (!hasLocalAttendance || remoteAttendance.length > 0)) {
                window.sms.attendance = remoteAttendance;
                try { localStorage.setItem('school_attendance', JSON.stringify(remoteAttendance)); } catch (_) {}
            }
            if (remoteBus && (!hasLocalBus || remoteBus.length > 0)) {
                window.sms.busSubscriptions = remoteBus;
                try { localStorage.setItem('school_bus', JSON.stringify(remoteBus)); } catch (_) {}
            }
            if (remoteFees && (!hasLocalFees || remoteFees.length > 0)) {
                window.sms.feePayments = remoteFees;
                try { localStorage.setItem('school_fees', JSON.stringify(remoteFees)); } catch (_) {}
            }

            if (typeof window.sms.renderStudents === 'function') {
                window.sms.renderStudents();
            }
            if (typeof window.sms.renderAttendance === 'function') {
                window.sms.renderAttendance();
            }
            if (typeof window.sms.renderBusSubscriptions === 'function') {
                window.sms.renderBusSubscriptions();
            }
            if (typeof window.sms.renderFeePayments === 'function') {
                window.sms.renderFeePayments();
            }
            if (typeof window.sms.updateDashboard === 'function') {
                window.sms.updateDashboard();
            }
        } catch (_) {
            // ignore
        } finally {
            serverHydrated = true;
        }
    };

    if (window.sms && typeof window.sms.saveDataToStorage === 'function') {
        const originalSave = window.sms.saveDataToStorage.bind(window.sms);
        window.sms.saveDataToStorage = function(...args) {
            const result = originalSave(...args);
            scheduleServerSync();
            return result;
        };
    }

    hydrateFromServer().then(() => {
        scheduleServerSync();
    });

    setInterval(async () => {
        try {
            const res = await fetch('/api/data');
            if (!res.ok) return;
            const data = await res.json();
            const remoteAttendance = Array.isArray(data?.attendance) ? data.attendance : [];
            const remoteJson = JSON.stringify(remoteAttendance);
            if (remoteJson === lastRemoteAttendanceJson) return;
            lastRemoteAttendanceJson = remoteJson;

            applyingRemoteAttendance = true;
            window.sms.attendance = remoteAttendance;
            try {
                localStorage.setItem('school_attendance', remoteJson);
            } catch (_) {
                // ignore
            }
            if (typeof window.sms.renderAttendance === 'function') {
                window.sms.renderAttendance();
            }
            if (typeof window.sms.updateDashboard === 'function') {
                window.sms.updateDashboard();
            }
            applyingRemoteAttendance = false;
        } catch (_) {
            // ignore
        }
    }, 3000);

    window.addEventListener('storage', (e) => {
        if (!window.sms) return;
        if (e.key !== 'school_attendance') return;

        try {
            const next = JSON.parse(e.newValue || '[]') || [];
            window.sms.attendance = Array.isArray(next) ? next : [];
            if (typeof window.sms.renderAttendance === 'function') {
                window.sms.renderAttendance();
            }
            if (typeof window.sms.updateDashboard === 'function') {
                window.sms.updateDashboard();
            }
        } catch (_) {
            // ignore
        }
    });
    
    // Debug: check if saveFeePayment exists on the instance
    console.log('sms.saveFeePayment type after instantiation:', typeof sms.saveFeePayment);
    console.log('sms object keys:', Object.getOwnPropertyNames(sms).filter(k => k.includes('Fee')));
    
    // Global fee payment save helper to bypass binding issues
    window.saveFeePaymentNow = function() {
        console.log('saveFeePaymentNow called');
        console.log('window.sms exists:', !!window.sms);
        console.log('window.sms.saveFeePayment type:', typeof window.sms?.saveFeePayment);
        if (window.sms && typeof window.sms.saveFeePayment === 'function') {
            window.sms.saveFeePayment();
        } else {
            alert('Fee payment saving is not available.');
        }
    };
    
    // Make markAttendance globally available
    window.markAttendance = (studentId, status) => {
        console.log('markAttendance called with:', studentId, status);
        if (window.sms) {
            window.sms.markAttendance(studentId, status);
        } else {
            console.error('SMS not available');
        }
    };
    
    // Make test function globally available
    window.testIndividualButton = testIndividualButton;
    window.testExport = testExport;
    window.toggleAttendanceView = toggleAttendanceView;
    window.testExportButton = testExportButton;
    
    console.log('School Management System initialized');
});
