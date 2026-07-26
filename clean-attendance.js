// NEW CLEAN ATTENDANCE SYSTEM - FROM SCRATCH
class CleanAttendanceSystem {
    constructor() {
        this.students = [];
        this.attendance = [];
        this.init();
    }

    // Load sample data if no students exist
    loadSampleData() {
        if (!localStorage.getItem('students')) {
            const sampleStudents = [
                { id: "1", name: "أحمد محمد", class: "KG1", phone: "0501234567", busSubscriber: true },
                { id: "2", name: "فاطمة علي", class: "KG1", phone: "0507654321", busSubscriber: false },
                { id: "3", name: "محمد أحمد", class: "KG2", phone: "0501111111", busSubscriber: true },
                { id: "4", name: "مريم حسن", class: "KG2", phone: "0502222222", busSubscriber: false },
                { id: "5", name: "عبدالله خالد", class: "1", phone: "0503333333", busSubscriber: true },
                { id: "6", name: "نورا سالم", class: "1", phone: "0504444444", busSubscriber: false },
                { id: "7", name: "عمر يوسف", class: "2", phone: "0505555555", busSubscriber: true },
                { id: "8", name: "ليلى إبراهيم", class: "2", phone: "0506666666", busSubscriber: false },
                { id: "9", name: "حمزة ناصر", class: "3", phone: "0507777777", busSubscriber: true },
                { id: "10", name: "سارة محمد", class: "3", phone: "0508888888", busSubscriber: false },
                { id: "11", name: "خالد أحمد", class: "4", phone: "0509999999", busSubscriber: true },
                { id: "12", name: "آمنة علي", class: "4", phone: "0500000000", busSubscriber: false },
                { id: "13", name: "ياسر محمود", class: "5", phone: "0501212121", busSubscriber: true },
                { id: "14", name: "رنا خالد", class: "5", phone: "0502323232", busSubscriber: false },
                { id: "15", name: "سالم عمر", class: "6", phone: "0503434343", busSubscriber: true },
                { id: "16", name: "هناء أحمد", class: "6", phone: "0504545454", busSubscriber: false },
                { id: "17", name: "فارس محمد", class: "7", phone: "0505656565", busSubscriber: true },
                { id: "18", name: "داليا حسن", class: "7", phone: "0506767676", busSubscriber: false },
                { id: "19", name: "براء علي", class: "8", phone: "0507878787", busSubscriber: true },
                { id: "20", name: "ميساء خالد", class: "8", phone: "0508989898", busSubscriber: false }
            ];
            localStorage.setItem('students', JSON.stringify(sampleStudents));
            console.log('Sample students loaded:', sampleStudents.length);
        }
    }

    init() {
        this.loadSampleData();
        this.loadData();
        this.setupEventListeners();
        this.setTodayDate();
        this.renderAttendance();
    }

    // Set today's date automatically
    setTodayDate() {
        const dateInput = document.getElementById('attendance-date');
        if (dateInput && !dateInput.value) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
            console.log('Set date to today:', today);
        }
    }

    // Load data from localStorage
    loadData() {
        const studentsData = localStorage.getItem('students');
        const attendanceData = localStorage.getItem('attendance');
        
        this.students = studentsData ? JSON.parse(studentsData) : [];
        this.attendance = attendanceData ? JSON.parse(attendanceData) : [];
        
        console.log('Loaded', this.students.length, 'students');
        console.log('Loaded', this.attendance.length, 'attendance records');
    }

    // Save data to localStorage
    saveData() {
        localStorage.setItem('students', JSON.stringify(this.students));
        localStorage.setItem('attendance', JSON.stringify(this.attendance));
    }

    // Setup event listeners
    setupEventListeners() {
        // Date change
        document.getElementById('attendance-date')?.addEventListener('change', () => {
            this.renderAttendance();
        });

        // Class filter
        document.getElementById('attendance-class-filter')?.addEventListener('change', () => {
            this.renderAttendance();
        });

        // Search
        document.getElementById('attendance-search')?.addEventListener('input', () => {
            this.renderAttendance();
        });

        // Bulk actions
        document.getElementById('mark-all-present')?.addEventListener('click', () => {
            this.markAll('present');
        });

        document.getElementById('mark-all-absent')?.addEventListener('click', () => {
            this.markAll('absent');
        });

        // Export
        document.getElementById('export-attendance')?.addEventListener('click', () => {
            this.exportAttendance();
        });
    }

    // Get current date
    getCurrentDate() {
        const dateInput = document.getElementById('attendance-date');
        return dateInput?.value || new Date().toISOString().split('T')[0];
    }

    // Get filtered students
    getFilteredStudents() {
        const classFilter = document.getElementById('attendance-class-filter')?.value || '';
        const searchTerm = document.getElementById('attendance-search')?.value.toLowerCase() || '';
        
        let filtered = this.students;
        
        // Filter by class
        if (classFilter) {
            filtered = filtered.filter(s => s.class === classFilter);
        }
        
        // Filter by search
        if (searchTerm) {
            filtered = filtered.filter(s => 
                s.name.toLowerCase().includes(searchTerm)
            );
        }
        
        return filtered;
    }

    // Mark individual student attendance
    markStudent(studentId, status) {
        console.log('Marking student', studentId, 'as', status);
        
        const date = this.getCurrentDate();
        
        // Remove existing attendance for this student and date
        this.attendance = this.attendance.filter(a => 
            !(a.studentId === studentId && a.date === date)
        );
        
        // Add new attendance record
        this.attendance.push({
            id: Date.now().toString(),
            studentId: studentId,
            date: date,
            status: status,
            markedAt: new Date().toISOString()
        });
        
        this.saveData();
        this.renderAttendance();
        
        console.log('Attendance marked successfully');
    }

    // Mark all students
    markAll(status) {
        const students = this.getFilteredStudents();
        const date = this.getCurrentDate();
        
        if (!confirm(`Mark all ${students.length} students as ${status}?`)) {
            return;
        }
        
        students.forEach(student => {
            // Remove existing attendance
            this.attendance = this.attendance.filter(a => 
                !(a.studentId === student.id && a.date === date)
            );
            
            // Add new attendance
            this.attendance.push({
                id: Date.now().toString() + Math.random(),
                studentId: student.id,
                date: date,
                status: status,
                markedAt: new Date().toISOString()
            });
        });
        
        this.saveData();
        this.renderAttendance();
        
        alert(`Marked ${students.length} students as ${status}`);
    }

    // Get attendance status for student
    getStudentStatus(studentId) {
        const date = this.getCurrentDate();
        const record = this.attendance.find(a => 
            a.studentId === studentId && a.date === date
        );
        return record ? record.status : 'not-marked';
    }

    // Calculate statistics
    getStatistics() {
        const students = this.getFilteredStudents();
        let present = 0;
        let absent = 0;
        let unmarked = 0;
        
        students.forEach(student => {
            const status = this.getStudentStatus(student.id);
            if (status === 'present') present++;
            else if (status === 'absent') absent++;
            else unmarked++;
        });
        
        return { present, absent, unmarked, total: students.length };
    }

    // Render attendance
    renderAttendance() {
        const container = document.getElementById('attendance-container');
        const students = this.getFilteredStudents();
        const stats = this.getStatistics();
        
        // Update statistics
        document.getElementById('total-students').textContent = stats.total;
        document.getElementById('present-count').textContent = stats.present;
        document.getElementById('absent-count').textContent = stats.absent;
        document.getElementById('unmarked-count').textContent = stats.unmarked;
        
        // Render students
        if (students.length === 0) {
            container.innerHTML = '<div class="empty-state">No students found</div>';
            return;
        }
        
        const html = students.map(student => {
            const status = this.getStudentStatus(student.id);
            const statusClass = status === 'present' ? 'present' : status === 'absent' ? 'absent' : '';
            
            return `
                <div class="student-card ${statusClass}">
                    <div class="student-info">
                        <h3>${student.name}</h3>
                        <p>${student.class} • ID: ${student.id}</p>
                    </div>
                    <div class="student-status">
                        <span class="status-badge ${status}">${status === 'not-marked' ? 'Not Marked' : status}</span>
                    </div>
                    <div class="student-actions">
                        <button class="btn btn-present" onclick="cleanAttendance.markStudent('${student.id}', 'present')">
                            ✓ Present
                        </button>
                        <button class="btn btn-absent" onclick="cleanAttendance.markStudent('${student.id}', 'absent')">
                            ✗ Absent
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
    }

    // Export attendance
    exportAttendance() {
        console.log('=== EXPORT START ===');
        
        const students = this.getFilteredStudents();
        const date = this.getCurrentDate();
        
        console.log('Exporting', students.length, 'students for date:', date);
        
        // Group by grades
        const grades = {};
        students.forEach(student => {
            const status = this.getStudentStatus(student.id);
            const grade = this.getGradeName(student.class);
            
            if (!grades[grade]) {
                grades[grade] = [];
            }
            
            grades[grade].push({
                id: student.id,
                name: student.name,
                class: student.class,
                status: status
            });
        });
        
        console.log('Grades grouped:', Object.keys(grades));
        
        // Create CSV with UTF-8 BOM for Arabic support
        const BOM = '\uFEFF';
        let csv = BOM + 'Student ID,Name,Class,Grade,Status\n';
        
        Object.keys(grades).sort().forEach(grade => {
            csv += `\n=== ${grade.toUpperCase()} ===\n`;
            grades[grade].forEach(student => {
                csv += `"${student.id}","${student.name}","${student.class}","${grade}","${student.status}"\n`;
            });
        });
        
        console.log('CSV created, length:', csv.length);
        
        try {
            // Download
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `attendance_${date}.csv`;
            a.style.display = 'none';
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            console.log('Export completed successfully');
            alert('Attendance exported successfully!');
            
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please check console for details.');
        }
        
        console.log('=== EXPORT END ===');
    }

    // Get grade name from class
    getGradeName(className) {
        if (className.includes('KG')) return className;
        if (className.includes('Boys') || className.includes('Girls')) {
            return 'Grade ' + className.split(' ')[0];
        }
        return 'Grade ' + className;
    }
}

// Initialize when DOM is ready
let cleanAttendance;
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Clean Attendance System...');
    
    // Show loading message
    const container = document.getElementById('attendance-container');
    if (container) {
        container.innerHTML = '<div class="empty-state">Loading attendance system...</div>';
        console.log('Set loading message');
    } else {
        console.error('attendance-container not found!');
    }
    
    try {
        cleanAttendance = new CleanAttendanceSystem();
        window.cleanAttendance = cleanAttendance;
        console.log('Clean Attendance System initialized successfully');
    } catch (error) {
        console.error('Error initializing Clean Attendance System:', error);
        if (container) {
            container.innerHTML = `<div class="empty-state">Error loading system: ${error.message}</div>`;
        }
    }
});
