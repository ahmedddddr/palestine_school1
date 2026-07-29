// Student Management - Direct API calls like teacher section
document.addEventListener('DOMContentLoaded', function() {
    // Load students from server on page load
    async function loadStudentsFromServer() {
        try {
            if (typeof sms !== 'undefined') {
                if (!sms.students) sms.students = [];
                
                const studentsRes = await fetch('/api/students', { credentials: 'include' });
                
                if (studentsRes.ok) {
                    try {
                        const studentsData = await studentsRes.json();
                        sms.students = Array.isArray(studentsData) ? studentsData : [];
                        console.log('✅ Students loaded from server:', sms.students.length);
                    } catch (e) {
                        console.error('❌ Failed to parse students JSON:', e);
                        sms.students = [];
                    }
                } else {
                    console.warn('⚠️ Students API returned non-OK status:', studentsRes.status);
                    sms.students = [];
                }
            }
        } catch (error) {
            console.error('❌ Failed to load students from server:', error);
            if (typeof sms !== 'undefined' && !sms.students) {
                sms.students = [];
            }
        }
    }

    // Override saveStudent to use direct API calls
    if (typeof SchoolManagementSystem !== 'undefined') {
        const originalSaveStudent = SchoolManagementSystem.prototype.saveStudent;
        SchoolManagementSystem.prototype.saveStudent = async function() {
            const name = document.getElementById('student-name').value.trim();
            const studentClass = document.getElementById('student-class').value;
            const phone = document.getElementById('student-phone').value.trim();

            if (!name || !studentClass) {
                alert('Please fill in student name and class');
                return;
            }

            try {
                let response;
                if (this.currentEditingStudent) {
                    // Edit existing student
                    console.log('Editing existing student:', this.currentEditingStudent);
                    response = await fetch(`/api/students/${this.currentEditingStudent}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                            name,
                            class: studentClass,
                            phone: phone || 'Not provided'
                        })
                    });
                } else {
                    // Add new student
                    console.log('Adding new student with data:', { name, studentClass, phone });
                    response = await fetch('/api/students', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                            name,
                            class: studentClass,
                            phone: phone || 'Not provided'
                        })
                    });
                }

                if (response.ok) {
                    const result = await response.json();
                    alert('Student saved successfully');
                    this.closeModal('student-modal');
                    
                    // Reload student data from server
                    await loadStudentsFromServer();
                    this.renderStudents();
                    this.updateDashboard();
                } else {
                    const errorText = await response.text().catch(() => 'Unknown error');
                    console.error('Failed to save student:', errorText);
                    alert('Failed to save student. Please try again.');
                }
            } catch (error) {
                console.error('Error saving student:', error);
                alert('Failed to save student. Please try again.');
            }
        };
    }

    // Override deleteStudent to use direct API calls
    if (typeof SchoolManagementSystem !== 'undefined') {
        const originalDeleteStudent = SchoolManagementSystem.prototype.deleteStudent;
        SchoolManagementSystem.prototype.deleteStudent = async function(studentId) {
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

            try {
                // Delete from server via API
                const response = await fetch(`/api/students/${studentId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });

                if (response.ok) {
                    // Remove from local arrays
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
                    
                    // Reload from server to ensure consistency
                    await loadStudentsFromServer();
                    this.renderStudents();
                    this.updateDashboard();
                    
                    console.log(`Deleted student with ID: ${studentId}`);
                } else {
                    const errorText = await response.text().catch(() => 'Unknown error');
                    console.error('Failed to delete student:', errorText);
                    alert('Failed to delete student. Please try again.');
                }
            } catch (error) {
                console.error('Error deleting student:', error);
                alert('Failed to delete student. Please try again.');
            }
        };
    }

    // Override markAttendance to use direct API calls
    if (typeof SchoolManagementSystem !== 'undefined') {
        const originalMarkAttendance = SchoolManagementSystem.prototype.markAttendance;
        SchoolManagementSystem.prototype.markAttendance = async function(studentId, status) {
            console.log('=== MARK ATTENDANCE CALLED ===');
            console.log('Student ID:', studentId);
            console.log('Status:', status);
            
            const date = document.getElementById('attendance-date').value || new Date().toISOString().split('T')[0];
            console.log('Date being used:', date);
            
            // Find existing attendance
            const existingIndex = this.attendance.findIndex(a => 
                String(a.studentId) === String(studentId) && a.date === date
            );
            
            try {
                // Use POST for both create and update (API handles both)
                console.log('Saving attendance via API');
                const response = await fetch('/api/attendance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        id: existingIndex !== -1 ? this.attendance[existingIndex].id : undefined,
                        studentId: String(studentId),
                        date: date,
                        status: status
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    // Update local data
                    if (existingIndex !== -1) {
                        this.attendance[existingIndex] = result.data;
                    } else {
                        this.attendance.push(result.data);
                    }
                    
                    this.renderAttendance();
                    this.updateDashboard();
                    console.log('✅ Attendance saved to server');
                } else {
                    const errorText = await response.text().catch(() => 'Unknown error');
                    console.error('Failed to save attendance:', errorText);
                    alert('Failed to save attendance. Please try again.');
                }
            } catch (error) {
                console.error('Error saving attendance:', error);
                alert('Failed to save attendance. Please try again.');
            }
        };
    }

    // Override saveBusSubscription to use direct API calls
    if (typeof SchoolManagementSystem !== 'undefined') {
        const originalSaveBusSubscription = SchoolManagementSystem.prototype.saveBusSubscription;
        SchoolManagementSystem.prototype.saveBusSubscription = async function() {
            const studentId = parseInt(document.getElementById('bus-student').value);
            const route = document.getElementById('bus-route').value.trim();
            const monthlyFee = parseFloat(document.getElementById('bus-fee').value);

            if (!studentId || !route || isNaN(monthlyFee)) {
                alert('Please fill in all bus subscription fields');
                return;
            }

            try {
                const response = await fetch('/api/bus', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        studentId,
                        route,
                        monthlyFee,
                        startDate: new Date().toISOString().split('T')[0]
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    alert('Bus subscription added successfully');
                    this.closeModal('bus-modal');
                    
                    // Reload bus subscriptions from server
                    await this.loadBusSubscriptionsFromServer();
                    this.renderBusSubscriptions();
                    this.renderStudents();
                    this.updateDashboard();
                } else {
                    const errorText = await response.text().catch(() => 'Unknown error');
                    console.error('Failed to save bus subscription:', errorText);
                    alert('Failed to save bus subscription. Please try again.');
                }
            } catch (error) {
                console.error('Error saving bus subscription:', error);
                alert('Failed to save bus subscription. Please try again.');
            }
        };
    }

    // Override deleteBusSubscription to use direct API calls
    if (typeof SchoolManagementSystem !== 'undefined') {
        const originalDeleteBusSubscription = SchoolManagementSystem.prototype.deleteBusSubscription;
        SchoolManagementSystem.prototype.deleteBusSubscription = async function(subscriptionId) {
            if (!confirm('Are you sure you want to delete this bus subscription?')) {
                return;
            }

            try {
                const response = await fetch(`/api/bus/${subscriptionId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });

                if (response.ok) {
                    // Remove from local data
                    this.busSubscriptions = this.busSubscriptions.filter(b => b.id !== subscriptionId);
                    
                    // Reload from server
                    await this.loadBusSubscriptionsFromServer();
                    this.renderBusSubscriptions();
                    this.renderStudents();
                    this.updateDashboard();
                    
                    console.log('✅ Bus subscription deleted from server');
                } else {
                    const errorText = await response.text().catch(() => 'Unknown error');
                    console.error('Failed to delete bus subscription:', errorText);
                    alert('Failed to delete bus subscription. Please try again.');
                }
            } catch (error) {
                console.error('Error deleting bus subscription:', error);
                alert('Failed to delete bus subscription. Please try again.');
            }
        };
    }

    // Load bus subscriptions from server
    async function loadBusSubscriptionsFromServer() {
        try {
            if (typeof sms !== 'undefined') {
                if (!sms.busSubscriptions) sms.busSubscriptions = [];
                
                const busRes = await fetch('/api/bus', { credentials: 'include' });
                
                if (busRes.ok) {
                    try {
                        const busData = await busRes.json();
                        sms.busSubscriptions = Array.isArray(busData) ? busData : [];
                        console.log('✅ Bus subscriptions loaded from server:', sms.busSubscriptions.length);
                    } catch (e) {
                        console.error('❌ Failed to parse bus subscriptions JSON:', e);
                        sms.busSubscriptions = [];
                    }
                } else {
                    console.warn('⚠️ Bus subscriptions API returned non-OK status:', busRes.status);
                    sms.busSubscriptions = [];
                }
            }
        } catch (error) {
            console.error('❌ Failed to load bus subscriptions from server:', error);
            if (typeof sms !== 'undefined' && !sms.busSubscriptions) {
                sms.busSubscriptions = [];
            }
        }
    }

    // Load attendance from server
    async function loadAttendanceFromServer() {
        try {
            if (typeof sms !== 'undefined') {
                if (!sms.attendance) sms.attendance = [];
                
                const attendanceRes = await fetch('/api/attendance', { credentials: 'include' });
                
                if (attendanceRes.ok) {
                    try {
                        const attendanceData = await attendanceRes.json();
                        sms.attendance = Array.isArray(attendanceData) ? attendanceData : [];
                        console.log('✅ Attendance loaded from server:', sms.attendance.length);
                    } catch (e) {
                        console.error('❌ Failed to parse attendance JSON:', e);
                        sms.attendance = [];
                    }
                } else {
                    console.warn('⚠️ Attendance API returned non-OK status:', attendanceRes.status);
                    sms.attendance = [];
                }
            }
        } catch (error) {
            console.error('❌ Failed to load attendance from server:', error);
            if (typeof sms !== 'undefined' && !sms.attendance) {
                sms.attendance = [];
            }
        }
    }

    // Load all data when page loads
    loadStudentsFromServer();
    loadBusSubscriptionsFromServer();
    loadAttendanceFromServer();
});
