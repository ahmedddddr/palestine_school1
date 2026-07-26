// Palestinian School Management System JavaScript - Complete Original System (All Features Preserved)

console.log('=== SCRIPT LOADING START ===');

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

// INDEPENDENT ATTENDANCE SYSTEM
class AttendanceManager {
    constructor() {
        this.attendance = [];
        this.loadAttendance();
    }
    
    loadAttendance() {
        try {
            const localStorageAttendance = localStorage.getItem('INDEPENDENT_ATTENDANCE');
            const sessionStorageAttendance = sessionStorage.getItem('INDEPENDENT_ATTENDANCE');
            
            if (localStorageAttendance) {
                this.attendance = JSON.parse(localStorageAttendance);
                console.log('Loaded attendance from localStorage:', this.attendance.length);
            } else if (sessionStorageAttendance) {
                this.attendance = JSON.parse(sessionStorageAttendance);
                console.log('Loaded attendance from sessionStorage:', this.attendance.length);
            } else {
                console.log('No saved attendance found, starting empty');
                this.attendance = [];
            }
        } catch (error) {
            console.error('Error loading attendance:', error);
            this.attendance = [];
        }
    }
    
    saveAttendance() {
        try {
            const attendanceJson = JSON.stringify(this.attendance);
            localStorage.setItem('INDEPENDENT_ATTENDANCE', attendanceJson);
            sessionStorage.setItem('INDEPENDENT_ATTENDANCE', attendanceJson);
            console.log('Attendance saved to both localStorage and sessionStorage');
        } catch (error) {
            console.error('Error saving attendance:', error);
        }
    }
    
    addAttendance(studentId, date, status) {
        const existingIndex = this.attendance.findIndex(a => 
            String(a.studentId) === String(studentId) && a.date === date
        );
        
        if (existingIndex !== -1) {
            this.attendance[existingIndex] = {
                studentId: String(studentId),
                date: date,
                status: status,
                timestamp: new Date().toISOString()
            };
        } else {
            this.attendance.push({
                studentId: String(studentId),
                date: date,
                status: status,
                timestamp: new Date().toISOString()
            });
        }
        
        this.saveAttendance();
        console.log('Attendance added:', { studentId, date, status });
    }
    
    getAttendance(studentId, date) {
        return this.attendance.find(a => 
            String(a.studentId) === String(studentId) && a.date === date
        );
    }
    
    getAttendanceByDate(date) {
        return this.attendance.filter(a => a.date === date);
    }
    
    getAttendanceByStudent(studentId) {
        return this.attendance.filter(a => String(a.studentId) === String(studentId));
    }
}

class SchoolManagementSystem {
    constructor() {
        console.log('=== CONSTRUCTOR START ===');
        this.students = [];
        this.attendance = [];
        this.busSubscriptions = [];
        this.feePayments = [];
        this.currentEditingStudent = null;
        this.currentPage = 1;
        
        // Initialize independent route manager
        if (!routeManager) {
            routeManager = new RouteManager();
            console.log('Route manager initialized');
        }
        
        // Initialize attendance manager
        this.attendanceManager = new AttendanceManager();
        
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
        this.setupAutoSave(); // Add auto-save functionality
        this.updateDashboard();
        this.renderStudents();
        this.renderBusSubscriptions();
        this.renderFeePayments();
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
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        // Check if student has paid for current month
        const payment = this.feePayments.find(f => 
            f.studentId === studentId && 
            f.month == currentMonth
        );
        
        if (payment) {
            return {
                status: 'paid',
                amount: payment.total,
                date: payment.paymentDate
            };
        } else {
            return {
                status: 'unpaid',
                amount: 0,
                date: null
            };
        }
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
            const studentExists = this.students.some(s => s.id === record.studentId);
            if (!studentExists) {
                console.log('Removing attendance for non-existent student:', record.studentId);
                cleaned = true;
                return false;
            }
            
            // Ensure valid status
            if (!record.status || !['present', 'absent', 'late'].includes(record.status)) {
                console.log('Fixing invalid attendance status:', record);
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
            const studentExists = this.students.some(s => s.id === sub.studentId);
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
            const studentExists = this.students.some(s => s.id === payment.studentId);
            if (!studentExists) {
                console.log('Removing fee payment for non-existent student:', payment.studentId);
                cleaned = true;
                return false;
            }
            
            return true;
        });
        
        if (cleaned) {
            console.log('Data was cleaned, saving cleaned data...');
            this.saveDataToStorage();
        }
        
        console.log('=== DATA VALIDATION AND CLEANUP COMPLETE ===');
    }

    loadDataFromStorage() {
        console.log('=== LOAD DATA FROM STORAGE START ===');
        let dataLoaded = false;
        
        // Try to load main data object first
        try {
            const mainData = localStorage.getItem('school_data_main');
            if (mainData) {
                const parsedData = JSON.parse(mainData);
                console.log('Loaded main data object:', parsedData.version);
                
                if (parsedData.data) {
                    this.students = parsedData.data.students || [];
                    this.attendance = parsedData.data.attendance || [];
                    this.busSubscriptions = parsedData.data.busSubscriptions || [];
                    this.busRoutes = parsedData.data.busRoutes || [];
                    this.feePayments = parsedData.data.feePayments || [];
                    dataLoaded = true;
                    console.log('Data loaded from main object');
                }
            }
        } catch (error) {
            console.error('Error loading main data object:', error);
        }
        
        // Fallback to individual arrays if main object failed
        if (!dataLoaded) {
            console.log('Trying individual array loading...');
            
            // Load students
            const savedStudents = localStorage.getItem('school_students');
            if (savedStudents) {
                try {
                    this.students = JSON.parse(savedStudents);
                    console.log('Loaded', this.students.length, 'students from localStorage');
                    dataLoaded = true;
                } catch (error) {
                    console.error('Error loading students, trying backup...', error);
                }
            }
            
            // Load attendance
            const savedAttendance = localStorage.getItem('school_attendance');
            if (savedAttendance) {
                try {
                    this.attendance = JSON.parse(savedAttendance);
                    console.log('Loaded', this.attendance.length, 'attendance records');
                } catch (error) {
                    console.error('Error loading attendance:', error);
                    this.attendance = [];
                }
            }
            
            // Load bus subscriptions
            const savedBus = localStorage.getItem('school_bus');
            if (savedBus) {
                try {
                    this.busSubscriptions = JSON.parse(savedBus);
                    console.log('Loaded', this.busSubscriptions.length, 'bus subscriptions');
                } catch (error) {
                    console.error('Error loading bus subscriptions:', error);
                    this.busSubscriptions = [];
                }
            }
            
            // Load bus routes
            const savedRoutes = localStorage.getItem('school_bus_routes');
            if (savedRoutes) {
                try {
                    this.busRoutes = JSON.parse(savedRoutes);
                    console.log('Loaded', this.busRoutes.length, 'bus routes');
                } catch (error) {
                    console.error('Error loading bus routes:', error);
                    this.busRoutes = [];
                }
            }
            
            // Load fee payments
            const savedFees = localStorage.getItem('school_fees');
            if (savedFees) {
                try {
                    this.feePayments = JSON.parse(savedFees);
                    console.log('Loaded', this.feePayments.length, 'fee payments');
                } catch (error) {
                    console.error('Error loading fee payments:', error);
                    this.feePayments = [];
                }
            }
        }
        
        // Add sample students if none exist
        if (this.students.length === 0) {
            console.log('No students found, adding sample data...');
            this.initializeSampleData();
        }
        
        // Update local reference to routes
        this.busRoutes = routeManager.getRoutes();
        console.log('Updated local routes from route manager:', this.busRoutes.length);
        
        console.log('=== LOAD DATA FROM STORAGE COMPLETE ===');
    }

    initializeSampleData() {
        console.log('=== INITIALIZING SAMPLE DATA ===');
        
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
            { id: 10, name: "سارة محمد", class: "3", phone: "0508888888", busSubscriber: false }
        ];
        
        // Add sample bus subscriptions
        this.busSubscriptions = [
            { id: 1, studentId: 1, route: 'Route 1: North Area', monthlyFee: 100, status: 'active' },
            { id: 2, studentId: 3, route: 'Route 2: South Area', monthlyFee: 120, status: 'active' },
            { id: 3, studentId: 5, route: 'Route 3: East Area', monthlyFee: 110, status: 'active' },
            { id: 4, studentId: 7, route: 'Route 4: West Area', monthlyFee: 105, status: 'active' },
            { id: 5, studentId: 9, route: 'Route 5: City Center', monthlyFee: 115, status: 'active' }
        ];
        
        // Add sample fee payments
        this.feePayments = [
            { id: 1, studentId: 1, month: 1, year: 2024, amount: 500, status: 'paid', paymentDate: '2024-01-05' },
            { id: 2, studentId: 2, month: 1, year: 2024, amount: 500, status: 'paid', paymentDate: '2024-01-06' },
            { id: 3, studentId: 3, month: 1, year: 2024, amount: 500, status: 'unpaid', paymentDate: null }
        ];
        
        // Add sample attendance
        const today = new Date().toISOString().split('T')[0];
        this.attendance = [
            { id: 1, studentId: 1, date: today, status: 'present', timestamp: new Date().toISOString() },
            { id: 2, studentId: 2, date: today, status: 'present', timestamp: new Date().toISOString() },
            { id: 3, studentId: 3, date: today, status: 'absent', timestamp: new Date().toISOString() }
        ];
        
        this.saveDataToStorage();
        console.log('Sample data initialized and saved');
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });
        
        // Form submissions
        const studentForm = document.getElementById('student-form');
        if (studentForm) {
            studentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addStudent();
            });
        }
        
        // Filter event listeners
        const studentClassFilter = document.getElementById('student-class-filter');
        if (studentClassFilter) {
            studentClassFilter.addEventListener('change', () => this.renderStudents());
        }
        
        const busRouteFilter = document.getElementById('bus-route-filter');
        if (busRouteFilter) {
            busRouteFilter.addEventListener('change', () => this.renderBusSubscriptions());
        }
        
        const busClassFilter = document.getElementById('bus-class-filter');
        if (busClassFilter) {
            busClassFilter.addEventListener('change', () => this.renderBusSubscriptions());
        }
        
        // Attendance filters
        const attendanceDateFilter = document.getElementById('attendance-date');
        if (attendanceDateFilter) {
            attendanceDateFilter.addEventListener('change', () => this.renderAttendance());
        }
        
        const attendanceClassFilter = document.getElementById('attendance-class-filter');
        if (attendanceClassFilter) {
            attendanceClassFilter.addEventListener('change', () => this.renderAttendance());
        }
        
        // Fees filters
        const feesClassFilter = document.getElementById('fees-class-filter');
        if (feesClassFilter) {
            feesClassFilter.addEventListener('change', () => this.renderFeePayments());
        }
        
        const feesMonthFilter = document.getElementById('fees-month');
        if (feesMonthFilter) {
            feesMonthFilter.addEventListener('change', () => this.renderFeePayments());
        }
        
        console.log('Event listeners setup complete');
    }
    
    switchTab(tabName) {
        console.log('Switching to tab:', tabName);
        
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab content
        const selectedTab = document.getElementById(tabName);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
        
        // Add active class to clicked button
        const clickedBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (clickedBtn) {
            clickedBtn.classList.add('active');
        }
        
        // Refresh data for the selected tab
        if (tabName === 'students') {
            this.renderStudents();
        } else if (tabName === 'bus') {
            this.renderBusSubscriptions();
        } else if (tabName === 'attendance') {
            this.renderAttendance();
        } else if (tabName === 'fees') {
            this.renderFeePayments();
        }
    }
    
    updateDashboard() {
        console.log('Updating dashboard...');
        
        const totalStudents = this.students.length;
        const todayAttendance = this.attendanceManager.getAttendanceByDate(new Date().toISOString().split('T')[0]);
        const presentToday = todayAttendance.filter(a => a.status === 'present').length;
        const absentToday = todayAttendance.filter(a => a.status === 'absent').length;
        const busSubscribers = this.students.filter(s => s.busSubscriber).length;
        
        // Update dashboard elements
        const totalStudentsEl = document.getElementById('total-students');
        if (totalStudentsEl) totalStudentsEl.textContent = totalStudents;
        
        const presentTodayEl = document.getElementById('present-today');
        if (presentTodayEl) presentTodayEl.textContent = presentToday;
        
        const absentTodayEl = document.getElementById('absent-today');
        if (absentTodayEl) absentTodayEl.textContent = absentToday;
        
        const busSubscribersEl = document.getElementById('bus-subscribers');
        if (busSubscribersEl) busSubscribersEl.textContent = busSubscribers;
        
        console.log('Dashboard updated:', { totalStudents, presentToday, absentToday, busSubscribers });
    }
    
    renderStudents() {
        console.log('Rendering students...');
        const grid = document.getElementById('students-grid');
        if (!grid) return;
        
        const classFilter = document.getElementById('student-class-filter');
        const filterValue = classFilter ? classFilter.value : '';
        
        let filteredStudents = this.students;
        if (filterValue) {
            filteredStudents = this.students.filter(s => s.class === filterValue);
        }
        
        grid.innerHTML = '';
        
        // Add toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'students-toolbar';
        toolbar.innerHTML = `
            <div class="toolbar-left">
                <button class="btn btn-primary" onclick="sms.openStudentModal()">
                    <span>+</span> Add Student
                </button>
                <button class="btn btn-secondary" onclick="sms.exportStudents()">
                    📥 Export
                </button>
                <label class="btn btn-info">
                    📤 Import
                    <input type="file" accept=".json" onchange="sms.importStudents(event)" style="display: none;">
                </label>
            </div>
            <div class="toolbar-right">
                <input type="text" id="student-search" placeholder="Search students..." onkeyup="sms.searchStudents(this.value)">
            </div>
        `;
        grid.appendChild(toolbar);
        
        const studentsContainer = document.createElement('div');
        studentsContainer.className = 'students-container';
        
        filteredStudents.forEach(student => {
            const studentCard = document.createElement('div');
            studentCard.className = 'student-card';
            studentCard.innerHTML = `
                <div class="student-info">
                    <h3>${student.name}</h3>
                    <p>ID: ${student.id}</p>
                    <p>Class: ${student.class}</p>
                    <p>Phone: ${student.phone}</p>
                    <p>Bus: ${student.busSubscriber ? 'Yes' : 'No'}</p>
                </div>
                <div class="student-actions">
                    <button class="btn btn-sm btn-info" onclick="sms.viewStudentDetails(${student.id})">Details</button>
                    <button class="btn btn-sm btn-primary" onclick="sms.editStudent(${student.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="sms.deleteStudent(${student.id})">Delete</button>
                </div>
            `;
            studentsContainer.appendChild(studentCard);
        });
        
        grid.appendChild(studentsContainer);
        
        console.log('Rendered', filteredStudents.length, 'students');
    }
    
    renderBusSubscriptions() {
        console.log('Rendering bus subscriptions...');
        const grid = document.getElementById('bus-routes-grid');
        if (!grid) return;
        
        const routeFilter = document.getElementById('bus-route-filter');
        const classFilter = document.getElementById('bus-class-filter');
        const routeFilterValue = routeFilter ? routeFilter.value : '';
        const classFilterValue = classFilter ? classFilter.value : '';
        
        // Get routes from route manager
        const routes = routeManager.getRoutes();
        
        // Populate route filter dropdown
        const routeFilterSelect = document.getElementById('bus-route-filter');
        if (routeFilterSelect) {
            routeFilterSelect.innerHTML = '<option value="">All Routes</option>';
            routes.forEach(route => {
                routeFilterSelect.innerHTML += `<option value="${route.name}">${route.name}</option>`;
            });
        }
        
        // Group subscriptions by route
        const subscriptionsByRoute = {};
        routes.forEach(route => {
            subscriptionsByRoute[route.name] = [];
        });
        
        // Add "No Route" category
        subscriptionsByRoute['No Route'] = [];
        
        // Group subscriptions
        this.busSubscriptions.forEach(sub => {
            const routeName = sub.route || 'No Route';
            if (!subscriptionsByRoute[routeName]) {
                subscriptionsByRoute[routeName] = [];
            }
            subscriptionsByRoute[routeName].push(sub);
        });
        
        grid.innerHTML = '';
        let hasContent = false;
        
        Object.entries(subscriptionsByRoute).forEach(([routeName, subscriptions]) => {
            // Apply filters
            let filteredSubscriptions = subscriptions.filter(sub => {
                const student = this.students.find(s => s.id === sub.studentId);
                if (!student) return false;
                
                const matchesRoute = !routeFilterValue || routeName === routeFilterValue;
                const matchesClass = !classFilterValue || student.class === classFilterValue;
                
                return matchesRoute && matchesClass;
            });
            
            if (filteredSubscriptions.length === 0) return;
            
            hasContent = true;
            
            // Create route section
            const routeSection = document.createElement('div');
            routeSection.className = 'route-section';
            
            const routeHeader = document.createElement('div');
            routeHeader.className = 'route-header';
            routeHeader.innerHTML = `
                <h3 class="route-title">${routeName}</h3>
                <span class="route-count">${filteredSubscriptions.length} students</span>
            `;
            
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
        
        if (!hasContent) {
            grid.innerHTML = '<div class="empty-state">No bus subscriptions found matching the selected filters.</div>';
        }
        
        console.log('Rendered bus subscriptions');
    }
    
    renderAttendance() {
        console.log('Rendering attendance...');
        const grid = document.getElementById('attendance-grid');
        if (!grid) return;
        
        const dateFilter = document.getElementById('attendance-date');
        const classFilter = document.getElementById('attendance-class-filter');
        const dateValue = dateFilter ? dateFilter.value : new Date().toISOString().split('T')[0];
        const classValue = classFilter ? classFilter.value : '';
        
        let filteredStudents = this.students;
        if (classValue) {
            filteredStudents = this.students.filter(s => s.class === classValue);
        }
        
        grid.innerHTML = '';
        
        // Add toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'attendance-toolbar';
        toolbar.innerHTML = `
            <div class="toolbar-left">
                <h3>Attendance for ${dateValue}</h3>
                <span class="student-count">${filteredStudents.length} students</span>
            </div>
            <div class="toolbar-right">
                <button class="btn btn-success" onclick="sms.markAllPresent()">Mark All Present</button>
                <button class="btn btn-danger" onclick="sms.markAllAbsent()">Mark All Absent</button>
                <button class="btn btn-secondary" onclick="sms.clearAllAttendance()">Clear All</button>
            </div>
        `;
        grid.appendChild(toolbar);
        
        const attendanceContainer = document.createElement('div');
        attendanceContainer.className = 'attendance-container';
        
        // Calculate statistics
        let presentCount = 0;
        let absentCount = 0;
        let notMarkedCount = 0;
        
        filteredStudents.forEach(student => {
            const attendance = this.attendanceManager.getAttendance(student.id, dateValue);
            const status = attendance ? attendance.status : 'not-marked';
            
            if (status === 'present') presentCount++;
            else if (status === 'absent') absentCount++;
            else notMarkedCount++;
            
            const attendanceCard = document.createElement('div');
            attendanceCard.className = 'attendance-card';
            attendanceCard.innerHTML = `
                <div class="attendance-info">
                    <h3>${student.name}</h3>
                    <p>ID: ${student.id}</p>
                    <p>Class: ${student.class}</p>
                </div>
                <div class="attendance-status">
                    <span class="status-badge ${status}">${status.replace('-', ' ')}</span>
                </div>
                <div class="attendance-actions">
                    <button class="btn btn-sm btn-success" onclick="sms.markAttendance(${student.id}, 'present')">✓ Present</button>
                    <button class="btn btn-sm btn-danger" onclick="sms.markAttendance(${student.id}, 'absent')">✗ Absent</button>
                </div>
            `;
            attendanceContainer.appendChild(attendanceCard);
        });
        
        grid.appendChild(attendanceContainer);
        
        // Add statistics footer
        const statsFooter = document.createElement('div');
        statsFooter.className = 'attendance-stats';
        statsFooter.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Present:</span>
                <span class="stat-value present">${presentCount}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Absent:</span>
                <span class="stat-value absent">${absentCount}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Not Marked:</span>
                <span class="stat-value not-marked">${notMarkedCount}</span>
            </div>
        `;
        grid.appendChild(statsFooter);
        
        console.log('Rendered attendance for', filteredStudents.length, 'students');
    }
    
    renderFeePayments() {
        console.log('Rendering fee payments...');
        const grid = document.getElementById('fees-grid');
        if (!grid) return;
        
        const classFilter = document.getElementById('fees-class-filter');
        const monthFilter = document.getElementById('fees-month');
        const classValue = classFilter ? classFilter.value : '';
        const monthValue = monthFilter ? monthFilter.value : new Date().toISOString().slice(0, 7);
        
        let filteredStudents = this.students;
        if (classValue) {
            filteredStudents = this.students.filter(s => s.class === classValue);
        }
        
        grid.innerHTML = '';
        
        filteredStudents.forEach(student => {
            const feeCard = document.createElement('div');
            feeCard.className = 'fee-card';
            
            const feePaid = this.feePayments.some(payment => 
                payment.studentId === student.id && 
                payment.month === monthValue && 
                payment.status === 'paid'
            );
            
            feeCard.innerHTML = `
                <div class="fee-info">
                    <h3>${student.name}</h3>
                    <p>ID: ${student.id}</p>
                    <p>Class: ${student.class}</p>
                </div>
                <div class="fee-status">
                    <span class="fee-badge ${feePaid ? 'paid' : 'unpaid'}">
                        ${feePaid ? 'Paid' : 'Unpaid'}
                    </span>
                    <p class="fee-month">${monthValue}</p>
                </div>
                <div class="fee-actions">
                    ${!feePaid ? `<button class="btn btn-sm btn-success" onclick="sms.markFeePaid(${student.id}, '${monthValue}')">Mark Paid</button>` : ''}
                </div>
            `;
            grid.appendChild(feeCard);
        });
        
        console.log('Rendered fee payments for', filteredStudents.length, 'students');
    }
    
    setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            if (!input.value) {
                input.value = today;
            }
        });
    }
    
    // CRUD Operations
    addStudent() {
        const form = document.getElementById('student-form');
        if (!form) {
            this.openStudentModal();
            return;
        }
        
        const name = form.querySelector('input[name="name"]').value;
        const studentClass = form.querySelector('input[name="class"]').value;
        const phone = form.querySelector('input[name="phone"]').value;
        const busSubscriber = form.querySelector('input[name="busSubscriber"]').checked;
        
        if (!name || !studentClass) {
            alert('Please fill in all required fields');
            return;
        }
        
        const student = {
            id: this.getNextStudentId(),
            name: name,
            class: studentClass,
            phone: phone || 'Not provided',
            busSubscriber: busSubscriber
        };
        
        this.students.push(student);
        this.saveDataToStorage();
        this.renderStudents();
        this.updateDashboard();
        
        form.reset();
        this.closeModal('student-modal');
        alert('Student added successfully!');
        
        console.log('Added student:', student);
    }
    
    openStudentModal(student = null) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'student-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${student ? 'Edit Student' : 'Add New Student'}</h2>
                    <button class="close-btn" onclick="sms.closeModal('student-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="student-form">
                        <div class="form-group">
                            <label for="student-name">Name *</label>
                            <input type="text" id="student-name" name="name" value="${student ? student.name : ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="student-class">Class *</label>
                            <select id="student-class" name="class" required>
                                <option value="">Select Class</option>
                                <option value="KG1" ${student && student.class === 'KG1' ? 'selected' : ''}>KG1</option>
                                <option value="KG2" ${student && student.class === 'KG2' ? 'selected' : ''}>KG2</option>
                                <option value="1" ${student && student.class === '1' ? 'selected' : ''}>Grade 1</option>
                                <option value="2" ${student && student.class === '2' ? 'selected' : ''}>Grade 2</option>
                                <option value="3" ${student && student.class === '3' ? 'selected' : ''}>Grade 3</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="student-phone">Phone</label>
                            <input type="tel" id="student-phone" name="phone" value="${student ? student.phone : ''}" placeholder="05XXXXXXXX">
                        </div>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="student-bus" name="busSubscriber" ${student && student.busSubscriber ? 'checked' : ''}>
                                Bus Subscriber
                            </label>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="sms.closeModal('student-modal')">Cancel</button>
                            <button type="submit" class="btn btn-primary">${student ? 'Update' : 'Add'} Student</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        // Setup form submission
        const form = modal.querySelector('#student-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (student) {
                this.updateStudent(student.id);
            } else {
                this.addStudent();
            }
        });
    }
    
    updateStudent(id) {
        const form = document.getElementById('student-form');
        const student = this.students.find(s => s.id === id);
        
        if (!student || !form) return;
        
        const name = form.querySelector('input[name="name"]').value;
        const studentClass = form.querySelector('select[name="class"]').value;
        const phone = form.querySelector('input[name="phone"]').value;
        const busSubscriber = form.querySelector('input[name="busSubscriber"]').checked;
        
        if (!name || !studentClass) {
            alert('Please fill in all required fields');
            return;
        }
        
        student.name = name;
        student.class = studentClass;
        student.phone = phone || 'Not provided';
        student.busSubscriber = busSubscriber;
        
        this.saveDataToStorage();
        this.renderStudents();
        this.updateDashboard();
        this.closeModal('student-modal');
        
        alert('Student updated successfully!');
        console.log('Updated student:', student);
    }
    
    editStudent(id) {
        const student = this.students.find(s => s.id === id);
        if (!student) return;
        
        this.openStudentModal(student);
    }
    
    deleteStudent(id) {
        if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) return;
        
        const index = this.students.findIndex(s => s.id === id);
        if (index !== -1) {
            const student = this.students[index];
            this.students.splice(index, 1);
            
            // Remove related data
            this.busSubscriptions = this.busSubscriptions.filter(sub => sub.studentId !== id);
            this.feePayments = this.feePayments.filter(payment => payment.studentId !== id);
            
            this.saveDataToStorage();
            this.renderStudents();
            this.renderBusSubscriptions();
            this.renderFeePayments();
            this.updateDashboard();
            
            alert(`Student ${student.name} deleted successfully!`);
            console.log('Deleted student:', id);
        }
    }
    
    viewStudentDetails(id) {
        const student = this.students.find(s => s.id === id);
        if (!student) return;
        
        const attendance = this.attendanceManager.getAttendanceByStudent(id);
        const busSubscription = this.busSubscriptions.find(sub => sub.studentId === id);
        const feePayments = this.feePayments.filter(payment => payment.studentId === id);
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'student-details-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Student Details</h2>
                    <button class="close-btn" onclick="sms.closeModal('student-details-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="student-details">
                        <div class="detail-section">
                            <h3>Basic Information</h3>
                            <p><strong>ID:</strong> ${student.id}</p>
                            <p><strong>Name:</strong> ${student.name}</p>
                            <p><strong>Class:</strong> ${student.class}</p>
                            <p><strong>Phone:</strong> ${student.phone}</p>
                            <p><strong>Bus Subscriber:</strong> ${student.busSubscriber ? 'Yes' : 'No'}</p>
                        </div>
                        
                        <div class="detail-section">
                            <h3>Bus Subscription</h3>
                            ${busSubscription ? `
                                <p><strong>Route:</strong> ${busSubscription.route}</p>
                                <p><strong>Monthly Fee:</strong> $${busSubscription.monthlyFee}</p>
                                <p><strong>Status:</strong> <span class="status-badge ${busSubscription.status}">${busSubscription.status}</span></p>
                            ` : '<p>No bus subscription</p>'}
                        </div>
                        
                        <div class="detail-section">
                            <h3>Recent Attendance</h3>
                            ${attendance.length > 0 ? `
                                <div class="attendance-list">
                                    ${attendance.slice(-5).reverse().map(a => `
                                        <div class="attendance-item">
                                            <span>${a.date}</span>
                                            <span class="status-badge ${a.status}">${a.status}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : '<p>No attendance records</p>'}
                        </div>
                        
                        <div class="detail-section">
                            <h3>Fee Payments</h3>
                            ${feePayments.length > 0 ? `
                                <div class="fee-list">
                                    ${feePayments.map(payment => `
                                        <div class="fee-item">
                                            <span>${payment.month}</span>
                                            <span class="fee-badge ${payment.status}">${payment.status} - $${payment.amount}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : '<p>No fee payment records</p>'}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="sms.editStudent(${student.id})">Edit Student</button>
                    <button class="btn btn-secondary" onclick="sms.closeModal('student-details-modal')">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }
    
    // Modal management
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
        }
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }
    }
    
    // Search functionality
    searchStudents(query) {
        if (!query) {
            this.renderStudents();
            return;
        }
        
        const filteredStudents = this.students.filter(student => 
            student.name.toLowerCase().includes(query.toLowerCase()) ||
            student.id.toString().includes(query) ||
            student.class.toLowerCase().includes(query.toLowerCase()) ||
            student.phone.includes(query)
        );
        
        const grid = document.getElementById('students-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        if (filteredStudents.length === 0) {
            grid.innerHTML = '<div class="empty-state">No students found matching your search.</div>';
            return;
        }
        
        filteredStudents.forEach(student => {
            const studentCard = document.createElement('div');
            studentCard.className = 'student-card';
            studentCard.innerHTML = `
                <div class="student-info">
                    <h3>${student.name}</h3>
                    <p>ID: ${student.id}</p>
                    <p>Class: ${student.class}</p>
                    <p>Phone: ${student.phone}</p>
                    <p>Bus: ${student.busSubscriber ? 'Yes' : 'No'}</p>
                </div>
                <div class="student-actions">
                    <button class="btn btn-sm btn-info" onclick="sms.viewStudentDetails(${student.id})">Details</button>
                    <button class="btn btn-sm btn-primary" onclick="sms.editStudent(${student.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="sms.deleteStudent(${student.id})">Delete</button>
                </div>
            `;
            grid.appendChild(studentCard);
        });
        
        console.log('Search results:', filteredStudents.length, 'students found');
    }
    
    exportStudents() {
        const dataStr = JSON.stringify(this.students, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `students_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        console.log('Students data exported successfully');
    }
    
    importStudents(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedStudents = JSON.parse(e.target.result);
                
                if (!Array.isArray(importedStudents)) {
                    throw new Error('Invalid file format');
                }
                
                const validStudents = importedStudents.filter(student => 
                    student.name && student.class && student.id
                );
                
                if (validStudents.length === 0) {
                    throw new Error('No valid students found in file');
                }
                
                // Assign new IDs to avoid conflicts
                validStudents.forEach(student => {
                    student.id = this.getNextStudentId();
                });
                
                this.students.push(...validStudents);
                this.saveDataToStorage();
                this.renderStudents();
                this.updateDashboard();
                
                alert(`Successfully imported ${validStudents.length} students!`);
                console.log('Imported students:', validStudents.length);
                
            } catch (error) {
                alert('Error importing students: ' + error.message);
                console.error('Import error:', error);
            }
        };
        
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    }
    
    markAttendance(studentId, status) {
        const dateFilter = document.getElementById('attendance-date');
        const date = dateFilter ? dateFilter.value : new Date().toISOString().split('T')[0];
        
        this.attendanceManager.addAttendance(studentId, date, status);
        this.renderAttendance();
        this.updateDashboard();
        
        console.log('Marked attendance:', { studentId, status, date });
    }
    
    markAllPresent() {
        const dateFilter = document.getElementById('attendance-date');
        const date = dateFilter ? dateFilter.value : new Date().toISOString().split('T')[0];
        const classFilter = document.getElementById('attendance-class-filter');
        const classValue = classFilter ? classFilter.value : '';
        
        let filteredStudents = this.students;
        if (classValue) {
            filteredStudents = this.students.filter(s => s.class === classValue);
        }
        
        filteredStudents.forEach(student => {
            this.attendanceManager.addAttendance(student.id, date, 'present');
        });
        
        this.renderAttendance();
        this.updateDashboard();
        alert(`Marked all ${filteredStudents.length} students as present!`);
    }
    
    markAllAbsent() {
        const dateFilter = document.getElementById('attendance-date');
        const date = dateFilter ? dateFilter.value : new Date().toISOString().split('T')[0];
        const classFilter = document.getElementById('attendance-class-filter');
        const classValue = classFilter ? classFilter.value : '';
        
        let filteredStudents = this.students;
        if (classValue) {
            filteredStudents = this.students.filter(s => s.class === classValue);
        }
        
        filteredStudents.forEach(student => {
            this.attendanceManager.addAttendance(student.id, date, 'absent');
        });
        
        this.renderAttendance();
        this.updateDashboard();
        alert(`Marked all ${filteredStudents.length} students as absent!`);
    }
    
    clearAllAttendance() {
        const dateFilter = document.getElementById('attendance-date');
        const date = dateFilter ? dateFilter.value : new Date().toISOString().split('T')[0];
        const classFilter = document.getElementById('attendance-class-filter');
        const classValue = classFilter ? classFilter.value : '';
        
        let filteredStudents = this.students;
        if (classValue) {
            filteredStudents = this.students.filter(s => s.class === classValue);
        }
        
        filteredStudents.forEach(student => {
            const index = this.attendanceManager.attendance.findIndex(a => 
                String(a.studentId) === String(student.id) && a.date === date
            );
            if (index !== -1) {
                this.attendanceManager.attendance.splice(index, 1);
            }
        });
        
        this.attendanceManager.saveAttendance();
        this.renderAttendance();
        this.updateDashboard();
        alert(`Cleared attendance for all ${filteredStudents.length} students!`);
    }
    
    markFeePaid(studentId, month) {
        const payment = {
            id: this.getNextFeeId(),
            studentId: studentId,
            month: month,
            amount: 500,
            status: 'paid',
            date: new Date().toISOString().split('T')[0]
        };
        
        this.feePayments.push(payment);
        this.saveDataToStorage();
        this.renderFeePayments();
        
        console.log('Marked fee paid:', payment);
    }
    
    editBusSubscription(id) {
        const subscription = this.busSubscriptions.find(s => s.id === id);
        if (!subscription) return;
        
        const newStatus = prompt('Enter status (active/inactive):', subscription.status);
        if (newStatus && (newStatus === 'active' || newStatus === 'inactive')) {
            subscription.status = newStatus;
            this.saveDataToStorage();
            this.renderBusSubscriptions();
            console.log('Updated bus subscription:', subscription);
        }
    }
    
    deleteBusSubscription(id) {
        if (!confirm('Are you sure you want to delete this bus subscription?')) return;
        
        const index = this.busSubscriptions.findIndex(s => s.id === id);
        if (index !== -1) {
            this.busSubscriptions.splice(index, 1);
            this.saveDataToStorage();
            this.renderBusSubscriptions();
            console.log('Deleted bus subscription:', id);
        }
    }
    
    // Route management methods
    addRoute(routeName, routeArea) {
        return routeManager.addRoute(routeName, routeArea);
    }
    
    updateRoute(routeId, routeName, routeArea) {
        const success = routeManager.updateRoute(routeId, routeName, routeArea);
        if (success) {
            this.busRoutes = routeManager.getRoutes();
            console.log('Updated local routes after update:', this.busRoutes.length);
        }
        return success;
    }
    
    deleteRoute(routeId) {
        const deletedRoute = routeManager.deleteRoute(routeId);
        if (deletedRoute) {
            this.busRoutes = routeManager.getRoutes();
            console.log('Updated local routes after delete:', this.busRoutes.length);
            
            // Update bus subscriptions that use this route
            this.busSubscriptions.forEach(sub => {
                if (sub.route && sub.route.includes(deletedRoute.name)) {
                    sub.route = 'Route Removed - Please Update';
                }
            });
        }
        return deletedRoute;
    }
    
    // Additional methods from backup
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
        
        if (!routeName || !routeArea) {
            alert('Please fill in both route name and area');
            return;
        }
        
        const modal = document.getElementById('route-modal');
        const editingRouteId = modal.dataset.editingRouteId;
        
        if (editingRouteId) {
            // Update existing route
            const success = this.updateRoute(parseInt(editingRouteId), routeName, routeArea);
            if (success) {
                alert('Route updated successfully!');
            }
        } else {
            // Add new route
            const newRoute = this.addRoute(routeName, routeArea);
            if (newRoute) {
                alert('Route added successfully!');
            }
        }
        
        // Update local reference
        this.busRoutes = routeManager.getRoutes();
        console.log('Updated local routes:', this.busRoutes.length);
        
        this.closeModal('route-modal');
        
        // Update bus dropdown
        this.renderBusSubscriptions();
        
        console.log('=== SAVE ROUTE END (INDEPENDENT SYSTEM) ===');
    }
    
    getNextRouteId() {
        return routeManager.getNextId();
    }
    
    editRoute(routeId) {
        const route = routeManager.getRoutes().find(r => r.id === routeId);
        if (!route) return;
        
        const modal = document.getElementById('route-modal');
        const routeNameInput = document.getElementById('route-name');
        const routeAreaInput = document.getElementById('route-area');
        
        routeNameInput.value = route.name;
        routeAreaInput.value = route.area;
        
        modal.dataset.editingRouteId = routeId;
        modal.classList.add('show');
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
            this.renderBusSubscriptions(); // Update bus table to show route changes
            this.closeModal('route-modal');
        }
    }
    
    // Fee Management
    openFeeModal(studentId = null) {
        const modal = document.getElementById('fee-modal');
        const studentSelect = document.getElementById('fee-student-select');
        const monthSelect = document.getElementById('fee-month');
        const yearSelect = document.getElementById('fee-year');
        
        // Populate student select
        studentSelect.innerHTML = '<option value="">Select Student</option>';
        this.students.forEach(student => {
            studentSelect.innerHTML += `<option value="${student.id}" ${studentId == student.id ? 'selected' : ''}>${student.name} - ${student.class}</option>`;
        });
        
        // Set current month and year
        const currentDate = new Date();
        monthSelect.value = currentDate.getMonth() + 1;
        yearSelect.value = currentDate.getFullYear();
        
        modal.classList.add('show');
    }
    
    saveFeePayment() {
        const studentId = parseInt(document.getElementById('fee-student-select').value);
        const month = parseInt(document.getElementById('fee-month').value);
        const year = parseInt(document.getElementById('fee-year').value);
        const tuitionFee = parseFloat(document.getElementById('tuition-fee').value) || 500;
        const busFee = parseFloat(document.getElementById('bus-fee').value) || 0;
        const paymentDate = document.getElementById('payment-date').value;
        
        if (!studentId || !month || !year || !paymentDate) {
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
    
    // Additional utility methods
    getArabicStudentNamesById() {
        return {
            1: 'محمود أنور عايش',
            2: 'مريم ياسر أحمد العموري',
            3: 'عمر أحمد محمد سعيد',
            4: 'فاطمة خالد محمود أبو الهيجاء',
            5: 'عبدالله محمد إبراهيم أبو شريعة',
            6: 'نورا أحمد علي الحسنات',
            7: 'حمزة يوسف عبدالله أبو لبدة',
            8: 'سارة محمد عبدالرحمن النتشة',
            9: 'أحمد محمود سالم الدحدوح',
            10: 'ليلى خالد عمر أبو ريا'
        };
    }
    
    // Export functions
    exportAttendance() {
        const dateFilter = document.getElementById('attendance-date');
        const date = dateFilter ? dateFilter.value : new Date().toISOString().split('T')[0];
        
        const todayAttendance = this.attendanceManager.getAttendanceByDate(date);
        
        if (todayAttendance.length === 0) {
            alert('No attendance records for today!\nPlease mark some attendance first, then try export.');
            return;
        }
        
        const exportData = todayAttendance.map(record => {
            const student = this.students.find(s => s.id == record.studentId);
            return {
                studentId: record.studentId,
                studentName: student ? student.name : 'Unknown',
                class: student ? student.class : 'Unknown',
                date: record.date,
                status: record.status,
                timestamp: record.timestamp
            };
        });
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `attendance_${date}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        console.log('Attendance exported successfully');
    }
    
    // Statistics and reporting
    updateStatistics() {
        const totalStudents = this.students.length;
        const totalAttendance = this.attendance.length;
        const totalBusSubscriptions = this.busSubscriptions.length;
        const totalFeePayments = this.feePayments.length;
        
        console.log('=== STATISTICS UPDATE ===');
        console.log('Total Students:', totalStudents);
        console.log('Total Attendance Records:', totalAttendance);
        console.log('Total Bus Subscriptions:', totalBusSubscriptions);
        console.log('Total Fee Payments:', totalFeePayments);
        
        // Update dashboard if elements exist
        const totalStudentsEl = document.getElementById('total-students');
        if (totalStudentsEl) totalStudentsEl.textContent = totalStudents;
        
        const totalAttendanceEl = document.getElementById('total-attendance');
        if (totalAttendanceEl) totalAttendanceEl.textContent = totalAttendance;
        
        const totalBusEl = document.getElementById('total-bus');
        if (totalBusEl) totalBusEl.textContent = totalBusSubscriptions;
        
        const totalFeesEl = document.getElementById('total-fees');
        if (totalFeesEl) totalFeesEl.textContent = totalFeePayments;
    }
}

// Initialize the system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== DOM LOADED ===');
    window.sms = new SchoolManagementSystem();
    console.log('=== SYSTEM INITIALIZED ===');
});

console.log('=== SCRIPT LOADING END ===');
