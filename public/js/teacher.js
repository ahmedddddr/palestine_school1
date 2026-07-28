// Teacher Management Functions
// These functions extend the SchoolManagementSystem class

// Global functions for onclick handlers - must be defined first
window.openTeacherModal = function(teacherId = null) {
    if (typeof sms !== 'undefined') {
        sms.openTeacherModal(teacherId);
    }
};

window.deleteTeacher = function(teacherId) {
    if (typeof sms !== 'undefined') {
        sms.deleteTeacher(teacherId);
    }
};

window.openTeacherSalaryModal = function() {
    const modal = document.getElementById('teacher-salary-modal');
    const teacherSelect = document.getElementById('salary-teacher');
    
    // Populate teacher dropdown
    teacherSelect.innerHTML = '<option value="">Select Teacher</option>';
    
    if (typeof sms !== 'undefined' && sms.teachers && sms.teachers.length > 0) {
        sms.teachers.forEach(teacher => {
            teacherSelect.innerHTML += `<option value="${teacher.id}">${teacher.name} - ${teacher.subject}</option>`;
        });
    } else {
        // If no teachers available, show a message
        teacherSelect.innerHTML = '<option value="">No teachers available</option>';
    }
    
    modal.classList.add('show');
};

window.markTodayTeacherAttendance = function() {
    const dateInput = document.getElementById('teacher-attendance-date');
    const selectedDate = dateInput?.value || new Date().toISOString().split('T')[0];
    
    if (typeof sms !== 'undefined' && typeof sms.markAllTeachersPresent === 'function') {
        sms.markAllTeachersPresent();
    } else {
        alert('Teacher attendance system not initialized');
    }
};

// Add teacher management methods to the class
if (typeof SchoolManagementSystem !== 'undefined') {
    SchoolManagementSystem.prototype.openTeacherModal = function(teacherId = null) {
        this.currentEditingTeacher = teacherId;
        const modal = document.getElementById('teacher-modal');
        
        if (teacherId) {
            const teacher = this.teachers.find(t => t.id === teacherId);
            document.getElementById('teacher-name').value = teacher.name;
            document.getElementById('teacher-subject').value = teacher.subject;
            document.getElementById('teacher-classes').value = teacher.classes;
            document.getElementById('teacher-phone').value = teacher.phone;
            document.getElementById('teacher-salary').value = teacher.salary;
        } else {
            document.getElementById('teacher-form').reset();
        }
        
        modal.classList.add('show');
    };

    SchoolManagementSystem.prototype.saveTeacher = async function() {
        const name = document.getElementById('teacher-name').value.trim();
        const subject = document.getElementById('teacher-subject').value;
        const classes = document.getElementById('teacher-classes').value.trim();
        const phone = document.getElementById('teacher-phone').value.trim();
        const salary = parseFloat(document.getElementById('teacher-salary').value);

        if (!name || !subject) {
            alert('Please fill in teacher name and subject');
            return;
        }

        try {
            if (this.currentEditingTeacher) {
                // Update existing teacher
                const response = await fetch(`/api/teachers/${this.currentEditingTeacher}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, subject, classes, phone: phone || 'Not provided', salary })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    const teacherIndex = this.teachers.findIndex(t => t.id === this.currentEditingTeacher);
                    this.teachers[teacherIndex] = result.data;
                } else {
                    throw new Error('Failed to update teacher');
                }
            } else {
                // Add new teacher
                const response = await fetch('/api/teachers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, subject, classes, phone: phone || 'Not provided', salary })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    this.teachers.push(result.data);
                } else {
                    throw new Error('Failed to add teacher');
                }
            }

            this.renderTeachers();
            this.closeModal('teacher-modal');
        } catch (error) {
            console.error('Error saving teacher:', error);
            alert('Failed to save teacher. Please try again.');
        }
    };

    SchoolManagementSystem.prototype.deleteTeacher = async function(teacherId) {
        if (!confirm('Are you sure you want to delete this teacher?')) {
            return;
        }

        try {
            const response = await fetch(`/api/teachers/${teacherId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.teachers = this.teachers.filter(t => t.id !== teacherId);
                this.renderTeachers();
            } else {
                throw new Error('Failed to delete teacher');
            }
        } catch (error) {
            console.error('Error deleting teacher:', error);
            alert('Failed to delete teacher. Please try again.');
        }
    };

    SchoolManagementSystem.prototype.renderTeachers = function() {
        const searchTerm = document.getElementById('teacher-search')?.value.toLowerCase() || '';
        const subjectFilter = document.getElementById('teacher-subject-filter')?.value || '';

        let filteredTeachers = this.teachers.filter(teacher => {
            const matchesSearch = teacher.name.toLowerCase().includes(searchTerm);
            const matchesSubject = !subjectFilter || teacher.subject === subjectFilter;
            return matchesSearch && matchesSubject;
        });

        const tbody = document.getElementById('teachers-table');
        if (!tbody) return;

        if (filteredTeachers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No teachers found</td></tr>';
            return;
        }

        tbody.innerHTML = filteredTeachers.map(teacher => `
            <tr>
                <td>${teacher.id}</td>
                <td>${teacher.name}</td>
                <td>${teacher.subject}</td>
                <td>${teacher.classes || 'N/A'}</td>
                <td>${teacher.phone}</td>
                <td>$${teacher.salary.toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="openTeacherModal(${teacher.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTeacher(${teacher.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    };

    SchoolManagementSystem.prototype.getNextTeacherId = function() {
        if (this.teachers.length === 0) return 1;
        return Math.max(...this.teachers.map(t => t.id)) + 1;
    };

    // Teacher Attendance Management
    SchoolManagementSystem.prototype.renderTeacherAttendance = function() {
        const dateInput = document.getElementById('teacher-attendance-date');
        const selectedDate = dateInput?.value || new Date().toISOString().split('T')[0];
        const searchTerm = document.getElementById('teacher-attendance-search')?.value.toLowerCase() || '';
        const subjectFilter = document.getElementById('teacher-attendance-subject-filter')?.value || '';

        let filteredTeachers = this.teachers.filter(teacher => {
            const matchesSearch = teacher.name.toLowerCase().includes(searchTerm);
            const matchesSubject = !subjectFilter || teacher.subject === subjectFilter;
            return matchesSearch && matchesSubject;
        });

        const grid = document.getElementById('teacher-attendance-grid');
        if (!grid) return;

        if (filteredTeachers.length === 0) {
            grid.innerHTML = '<div style="text-align:center;padding:20px;">No teachers found</div>';
            return;
        }

        let presentCount = 0;
        let absentCount = 0;
        let unmarkedCount = 0;

        grid.innerHTML = filteredTeachers.map(teacher => {
            const attendance = this.teacherAttendance.find(a => 
                a.teacherId === teacher.id && a.date === selectedDate
            );
            
            let status = 'unmarked';
            if (attendance) {
                status = attendance.status;
                if (status === 'present') presentCount++;
                else if (status === 'absent') absentCount++;
            } else {
                unmarkedCount++;
            }

            return `
                <div class="attendance-card ${status}">
                    <div class="attendance-info">
                        <h4>${teacher.name}</h4>
                        <p>${teacher.subject}</p>
                    </div>
                    <div class="attendance-actions">
                        <button class="btn btn-sm ${status === 'present' ? 'btn-success' : 'btn-secondary'}" 
                                onclick="sms.markTeacherAttendance(${teacher.id}, 'present', '${selectedDate}')">
                            ✅ Present
                        </button>
                        <button class="btn btn-sm ${status === 'absent' ? 'btn-danger' : 'btn-secondary'}" 
                                onclick="sms.markTeacherAttendance(${teacher.id}, 'absent', '${selectedDate}')">
                            ❌ Absent
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Update stats
        const presentEl = document.getElementById('teacher-present-count');
        const absentEl = document.getElementById('teacher-absent-count');
        const unmarkedEl = document.getElementById('teacher-unmarked-count');
        const summaryEl = document.getElementById('teacher-attendance-summary-text');

        if (presentEl) presentEl.textContent = presentCount;
        if (absentEl) absentEl.textContent = absentCount;
        if (unmarkedEl) unmarkedEl.textContent = unmarkedCount;
        if (summaryEl) summaryEl.textContent = `${filteredTeachers.length} teachers loaded`;
    };

    SchoolManagementSystem.prototype.markTeacherAttendance = async function(teacherId, status, date) {
        try {
            const existing = this.teacherAttendance.find(a => 
                a.teacherId === teacherId && a.date === date
            );

            if (existing) {
                // Update existing attendance
                const response = await fetch(`/api/teacher-attendance/${existing.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status })
                });

                if (response.ok) {
                    const result = await response.json();
                    const index = this.teacherAttendance.findIndex(a => a.id === existing.id);
                    this.teacherAttendance[index] = result.data;
                } else {
                    throw new Error('Failed to update attendance');
                }
            } else {
                // Add new attendance record
                const response = await fetch('/api/teacher-attendance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ teacherId, date, status, notes: '' })
                });

                if (response.ok) {
                    const result = await response.json();
                    this.teacherAttendance.push(result.data);
                } else {
                    throw new Error('Failed to mark attendance');
                }
            }

            this.renderTeacherAttendance();
        } catch (error) {
            console.error('Error marking teacher attendance:', error);
            alert('Failed to mark attendance. Please try again.');
        }
    };

    SchoolManagementSystem.prototype.markAllTeachersPresent = async function() {
        const dateInput = document.getElementById('teacher-attendance-date');
        const selectedDate = dateInput?.value || new Date().toISOString().split('T')[0];

        try {
            for (const teacher of this.teachers) {
                const existing = this.teacherAttendance.find(a => 
                    a.teacherId === teacher.id && a.date === selectedDate
                );

                if (existing) {
                    await fetch(`/api/teacher-attendance/${existing.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'present' })
                    });
                } else {
                    await fetch('/api/teacher-attendance', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ teacherId: teacher.id, date: selectedDate, status: 'present', notes: '' })
                    });
                }
            }

            // Reload data from server
            const response = await fetch('/api/teacher-attendance');
            if (response.ok) {
                this.teacherAttendance = await response.json();
            }
            
            this.renderTeacherAttendance();
        } catch (error) {
            console.error('Error marking all teachers present:', error);
            alert('Failed to mark all teachers present. Please try again.');
        }
    };

    SchoolManagementSystem.prototype.markAllTeachersAbsent = async function() {
        const dateInput = document.getElementById('teacher-attendance-date');
        const selectedDate = dateInput?.value || new Date().toISOString().split('T')[0];

        try {
            for (const teacher of this.teachers) {
                const existing = this.teacherAttendance.find(a => 
                    a.teacherId === teacher.id && a.date === selectedDate
                );

                if (existing) {
                    await fetch(`/api/teacher-attendance/${existing.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'absent' })
                    });
                } else {
                    await fetch('/api/teacher-attendance', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ teacherId: teacher.id, date: selectedDate, status: 'absent', notes: '' })
                    });
                }
            }

            // Reload data from server
            const response = await fetch('/api/teacher-attendance');
            if (response.ok) {
                this.teacherAttendance = await response.json();
            }
            
            this.renderTeacherAttendance();
        } catch (error) {
            console.error('Error marking all teachers absent:', error);
            alert('Failed to mark all teachers absent. Please try again.');
        }
    };

    SchoolManagementSystem.prototype.getNextTeacherAttendanceId = function() {
        if (this.teacherAttendance.length === 0) return 1;
        return Math.max(...this.teacherAttendance.map(a => a.id)) + 1;
    };

    // Teacher Salaries Management
    SchoolManagementSystem.prototype.renderTeacherSalaries = function() {
        const monthFilter = document.getElementById('teacher-salaries-month')?.value || '';
        const yearFilter = document.getElementById('teacher-salaries-year')?.value || '';
        const statusFilter = document.getElementById('teacher-salaries-status-filter')?.value || '';

        let filteredSalaries = this.teacherSalaries.filter(salary => {
            const matchesMonth = !monthFilter || salary.month === parseInt(monthFilter);
            const matchesYear = !yearFilter || salary.year === parseInt(yearFilter);
            
            let matchesStatus = true;
            if (statusFilter === 'paid') matchesStatus = salary.paid >= salary.total;
            else if (statusFilter === 'unpaid') matchesStatus = salary.paid === 0;
            else if (statusFilter === 'partial') matchesStatus = salary.paid > 0 && salary.paid < salary.total;

            return matchesMonth && matchesYear && matchesStatus;
        });

        const tbody = document.getElementById('teacher-salaries-table');
        if (!tbody) return;

        if (filteredSalaries.length === 0) {
            tbody.innerHTML = '<tr><td colspan="13" style="text-align:center;">No salary records found</td></tr>';
            return;
        }

        tbody.innerHTML = filteredSalaries.map(salary => {
            const teacher = this.teachers.find(t => t.id === salary.teacherId);
            const teacherName = teacher ? teacher.name : 'Unknown';
            const subject = teacher ? teacher.subject : 'Unknown';
            const baseSalary = salary.baseSalary || 0;
            const bonus = salary.bonus || 0;
            const deductions = salary.deductions || 0;
            const paid = salary.paid || 0;
            const total = baseSalary + bonus - deductions;
            const balance = total - paid;
            let status = 'unpaid';
            if (paid >= total) status = 'paid';
            else if (paid > 0) status = 'partial';

            const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                               'July', 'August', 'September', 'October', 'November', 'December'];
            
            return `
                <tr>
                    <td>${teacherName}</td>
                    <td>${subject}</td>
                    <td>${monthNames[salary.month] || salary.month}</td>
                    <td>${salary.year}</td>
                    <td>$${baseSalary.toFixed(2)}</td>
                    <td>$${bonus.toFixed(2)}</td>
                    <td>$${deductions.toFixed(2)}</td>
                    <td>$${total.toFixed(2)}</td>
                    <td>$${paid.toFixed(2)}</td>
                    <td>$${balance.toFixed(2)}</td>
                    <td><span class="status-badge status-${status}">${status}</span></td>
                    <td>${salary.paymentDate || 'N/A'}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="alert('Edit functionality coming soon')">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="sms.deleteTeacherSalary(${salary.id})">Delete</button>
                    </td>
                </tr>
            `;
        }).join('');
    };

    SchoolManagementSystem.prototype.deleteTeacherSalary = async function(salaryId) {
        if (!confirm('Are you sure you want to delete this salary record?')) {
            return;
        }

        try {
            const response = await fetch(`/api/teacher-salaries/${salaryId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.teacherSalaries = this.teacherSalaries.filter(s => s.id !== salaryId);
                this.renderTeacherSalaries();
            } else {
                throw new Error('Failed to delete salary record');
            }
        } catch (error) {
            console.error('Error deleting teacher salary:', error);
            alert('Failed to delete salary record. Please try again.');
        }
    };

    SchoolManagementSystem.prototype.exportTeacherAttendance = function() {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Teacher ID,Teacher Name,Subject,Date,Status,Notes\n"
            + this.teacherAttendance.map(a => {
                const teacher = this.teachers.find(t => t.id === a.teacherId);
                return `${a.teacherId},"${teacher?.name || 'Unknown'}","${teacher?.subject || 'Unknown'}",${a.date},${a.status},"${a.notes || ''}"`;
            }).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "teacher_attendance.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
}

// Initialize teacher form handler
document.addEventListener('DOMContentLoaded', function() {
    const teacherForm = document.getElementById('teacher-form');
    if (teacherForm) {
        teacherForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (typeof sms !== 'undefined') {
                sms.saveTeacher();
            }
        });
    }

    const teacherSalaryForm = document.getElementById('teacher-salary-form');
    if (teacherSalaryForm) {
        teacherSalaryForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const teacherId = parseInt(document.getElementById('salary-teacher').value);
            const month = parseInt(document.getElementById('salary-month').value);
            const year = parseInt(document.getElementById('salary-year').value);
            const baseSalary = parseFloat(document.getElementById('salary-base').value);
            const bonus = parseFloat(document.getElementById('salary-bonus').value) || 0;
            const deductions = parseFloat(document.getElementById('salary-deductions').value) || 0;
            const paid = parseFloat(document.getElementById('salary-paid').value);
            const paymentDate = document.getElementById('salary-date').value;
            const notes = document.getElementById('salary-notes').value;

            try {
                const response = await fetch('/api/teacher-salaries', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        teacherId,
                        month,
                        year,
                        baseSalary,
                        bonus,
                        deductions,
                        paid,
                        paymentDate,
                        notes
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    if (typeof sms !== 'undefined') {
                        sms.teacherSalaries.push(result.data);
                        sms.renderTeacherSalaries();
                        sms.closeModal('teacher-salary-modal');
                    }
                    alert('Teacher salary payment recorded successfully');
                } else {
                    throw new Error('Failed to record salary payment');
                }
            } catch (error) {
                console.error('Error recording teacher salary:', error);
                alert('Failed to record salary payment. Please try again.');
            }
        });
    }

    // Teacher search and filter handlers
    const teacherSearch = document.getElementById('teacher-search');
    if (teacherSearch) {
        teacherSearch.addEventListener('input', function() {
            if (typeof sms !== 'undefined') {
                sms.renderTeachers();
            }
        });
    }

    const teacherSubjectFilter = document.getElementById('teacher-subject-filter');
    if (teacherSubjectFilter) {
        teacherSubjectFilter.addEventListener('change', function() {
            if (typeof sms !== 'undefined') {
                sms.renderTeachers();
            }
        });
    }

    // Teacher attendance event handlers
    const teacherAttendanceDate = document.getElementById('teacher-attendance-date');
    if (teacherAttendanceDate) {
        teacherAttendanceDate.addEventListener('change', function() {
            if (typeof sms !== 'undefined') {
                sms.renderTeacherAttendance();
            }
        });
    }

    const teacherAttendanceSearch = document.getElementById('teacher-attendance-search');
    if (teacherAttendanceSearch) {
        teacherAttendanceSearch.addEventListener('input', function() {
            if (typeof sms !== 'undefined') {
                sms.renderTeacherAttendance();
            }
        });
    }

    const teacherAttendanceSubjectFilter = document.getElementById('teacher-attendance-subject-filter');
    if (teacherAttendanceSubjectFilter) {
        teacherAttendanceSubjectFilter.addEventListener('change', function() {
            if (typeof sms !== 'undefined') {
                sms.renderTeacherAttendance();
            }
        });
    }

    // Teacher salaries event handlers
    const teacherSalariesMonth = document.getElementById('teacher-salaries-month');
    if (teacherSalariesMonth) {
        teacherSalariesMonth.addEventListener('change', function() {
            if (typeof sms !== 'undefined') {
                sms.renderTeacherSalaries();
            }
        });
    }

    const teacherSalariesYear = document.getElementById('teacher-salaries-year');
    if (teacherSalariesYear) {
        teacherSalariesYear.addEventListener('change', function() {
            if (typeof sms !== 'undefined') {
                sms.renderTeacherSalaries();
            }
        });
    }

    const teacherSalariesStatusFilter = document.getElementById('teacher-salaries-status-filter');
    if (teacherSalariesStatusFilter) {
        teacherSalariesStatusFilter.addEventListener('change', function() {
            if (typeof sms !== 'undefined') {
                sms.renderTeacherSalaries();
            }
        });
    }

    // Set default date for teacher attendance
    if (teacherAttendanceDate) {
        teacherAttendanceDate.value = new Date().toISOString().split('T')[0];
    }

    // Set default year for teacher salaries
    const teacherSalariesYearSelect = document.getElementById('teacher-salaries-year');
    if (teacherSalariesYearSelect) {
        teacherSalariesYearSelect.value = new Date().getFullYear().toString();
    }

    // Override switchSection to render teacher sections when activated
    if (typeof sms !== 'undefined' && sms.switchSection) {
        const originalSwitchSection = sms.switchSection.bind(sms);
        sms.switchSection = function(sectionName) {
            originalSwitchSection(sectionName);
            
            if (sectionName === 'teachers' && typeof this.renderTeachers === 'function') {
                this.renderTeachers();
            } else if (sectionName === 'teacher-attendance' && typeof this.renderTeacherAttendance === 'function') {
                this.renderTeacherAttendance();
            } else if (sectionName === 'teacher-salaries' && typeof this.renderTeacherSalaries === 'function') {
                this.renderTeacherSalaries();
            }
        };
    }

    // Load teacher data from server on page load
    async function loadTeacherDataFromServer() {
        try {
            const [teachersRes, teacherAttendanceRes, teacherSalariesRes] = await Promise.all([
                fetch('/api/teachers'),
                fetch('/api/teacher-attendance'),
                fetch('/api/teacher-salaries')
            ]);

            if (teachersRes.ok && typeof sms !== 'undefined') {
                sms.teachers = await teachersRes.json();
                console.log('✅ Teachers loaded from server:', sms.teachers.length);
            }

            if (teacherAttendanceRes.ok && typeof sms !== 'undefined') {
                sms.teacherAttendance = await teacherAttendanceRes.json();
                console.log('✅ Teacher attendance loaded from server:', sms.teacherAttendance.length);
            }

            if (teacherSalariesRes.ok && typeof sms !== 'undefined') {
                sms.teacherSalaries = await teacherSalariesRes.json();
                console.log('✅ Teacher salaries loaded from server:', sms.teacherSalaries.length);
            }
        } catch (error) {
            console.error('❌ Failed to load teacher data from server:', error);
        }
    }

    // Load teacher data when page loads
    loadTeacherDataFromServer();
});
