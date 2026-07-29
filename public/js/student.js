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

    // Load students when page loads
    loadStudentsFromServer();
});
