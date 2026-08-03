// Bus Subscription Management - Database Integration
document.addEventListener('DOMContentLoaded', function() {
    // Route Manager - Database backed
    const routeManager = {
        routes: [],
        
        async loadRoutes() {
            try {
                const response = await fetch('/api/routes', { credentials: 'include' });
                if (response.ok) {
                    const data = await response.json();
                    this.routes = Array.isArray(data) ? data : [];
                } else {
                    console.warn('Failed to load routes from database');
                    this.routes = [];
                }
            } catch (e) {
                console.error('Error loading routes:', e);
                this.routes = [];
            }
        },
        
        async addRoute(name, area) {
            try {
                const response = await fetch('/api/routes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ name, area })
                });
                if (response.ok) {
                    const result = await response.json();
                    await this.loadRoutes();
                    return result.data || result;
                }
            } catch (e) {
                console.error('Error adding route:', e);
            }
        },
        
        async deleteRoute(id) {
            try {
                const response = await fetch(`/api/routes/${id}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });
                if (response.ok) {
                    await this.loadRoutes();
                }
            } catch (e) {
                console.error('Error deleting route:', e);
            }
        },
        
        getRoutes() {
            return this.routes;
        },
        
        getRoute(id) {
            return this.routes.find(r => r.id === id);
        }
    };
    
    // Load routes on startup
    routeManager.loadRoutes();
    
    // Global functions for onclick handlers
    window.openBusModal = function() {
        const modal = document.getElementById('bus-modal');
        const studentSelect = document.getElementById('bus-student');
        const routeSelect = document.getElementById('bus-route');
        
        if (!modal || !studentSelect || !routeSelect) return;
        
        // Populate routes
        const routes = routeManager.getRoutes();
        routeSelect.innerHTML = '<option value="">Select Route</option>';
        routes.forEach(r => {
            routeSelect.innerHTML += `<option value="${r.name}">${r.name} - ${r.area}</option>`;
        });
        
        // Populate students (only those without bus subscriptions)
        studentSelect.innerHTML = '<option value="">Select Student</option>';
        if (typeof sms !== 'undefined' && sms.students) {
            sms.students.forEach(student => {
                const hasSubscription = sms.busSubscriptions && sms.busSubscriptions.some(b => b.studentId === student.id);
                if (!hasSubscription) {
                    studentSelect.innerHTML += `<option value="${student.id}">${student.name} - Grade ${student.class}</option>`;
                }
            });
        }
        
        // Reset form
        document.getElementById('bus-form').reset();
        
        // Set save button to add mode
        const saveBtn = modal.querySelector('button[type="submit"]');
        if (saveBtn) {
            saveBtn.textContent = 'Save Subscription';
            saveBtn.onclick = null;
        }
        
        modal.classList.add('show');
    };
    
    window.openRouteModal = function() {
        const modal = document.getElementById('route-modal');
        if (!modal) return;
        
        // Render current routes
        const routesList = document.getElementById('current-routes-list');
        if (routesList) {
            const routes = routeManager.getRoutes();
            if (routes.length === 0) {
                routesList.innerHTML = '<p>No routes defined yet.</p>';
            } else {
                routesList.innerHTML = routes.map(r => `
                    <div class="route-item">
                        <strong>${r.name}</strong> - ${r.area}
                        <button class="btn btn-sm btn-danger" onclick="deleteRoute(${r.id})">Delete</button>
                    </div>
                `).join('');
            }
        }
        
        // Reset form
        document.getElementById('route-form').reset();
        modal.classList.add('show');
    };
    
    window.deleteRoute = function(routeId) {
        if (confirm('Are you sure you want to delete this route?')) {
            routeManager.deleteRoute(routeId);
            openRouteModal(); // Refresh the modal
            if (typeof sms !== 'undefined' && sms.renderBusSubscriptions) {
                sms.renderBusSubscriptions();
            }
        }
    };
    
    window.closeModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
        }
    };
    
    // Add bus management methods to SchoolManagementSystem
    if (typeof SchoolManagementSystem !== 'undefined') {
        SchoolManagementSystem.prototype.loadBusSubscriptionsFromServer = async function() {
            try {
                const response = await fetch('/api/bus', { credentials: 'include' });
                if (response.ok) {
                    const data = await response.json();
                    this.busSubscriptions = Array.isArray(data) ? data : [];
                    
                    // Update student bus subscriber status
                    if (this.students && this.students.length > 0) {
                        this.students.forEach(student => {
                            const hasBus = this.busSubscriptions.some(bus => bus.studentId === student.id);
                            student.busSubscriber = hasBus;
                        });
                    }
                    
                    this.renderBusSubscriptions();
                    this.renderStudents();
                    this.updateDashboard();
                } else {
                    console.warn('Failed to load bus subscriptions from server');
                }
            } catch (e) {
                console.error('Error loading bus subscriptions:', e);
            }
        };
        
        SchoolManagementSystem.prototype.renderBusSubscriptions = function() {
            const tableBody = document.getElementById('bus-table');
            if (!tableBody) return;
            
            const routeFilter = document.getElementById('bus-route-filter')?.value || '';
            const classFilter = document.getElementById('bus-class-filter')?.value || '';
            const searchTerm = document.getElementById('bus-search')?.value.toLowerCase() || '';
            
            // Populate route filter
            const routeFilterSelect = document.getElementById('bus-route-filter');
            if (routeFilterSelect) {
                const routes = routeManager.getRoutes();
                const currentValue = routeFilterSelect.value;
                routeFilterSelect.innerHTML = '<option value="">All Routes</option>';
                routes.forEach(r => {
                    routeFilterSelect.innerHTML += `<option value="${r.name}">${r.name}</option>`;
                });
                routeFilterSelect.value = currentValue;
            }
            
            // Ensure busSubscriptions exists
            if (!this.busSubscriptions || !Array.isArray(this.busSubscriptions)) {
                this.busSubscriptions = [];
            }
            
            // Ensure students exists
            if (!this.students || !Array.isArray(this.students)) {
                this.students = [];
            }
            
            // Filter subscriptions
            const filteredSubs = this.busSubscriptions.filter(sub => {
                const student = this.students.find(s => String(s.id) === String(sub.studentId));
                if (!student) return false;
                
                const matchesRoute = !routeFilter || String(sub.route) === String(routeFilter);
                const matchesClass = !classFilter || String(student.class) === String(classFilter);
                const matchesSearch = !searchTerm || student.name.toLowerCase().includes(searchTerm);
                
                return matchesRoute && matchesClass && matchesSearch;
            });
            
            if (filteredSubs.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No bus subscriptions found</td></tr>';
                return;
            }
            
            tableBody.innerHTML = filteredSubs.map(sub => {
                const student = this.students.find(s => String(s.id) === String(sub.studentId));
                if (!student) return '';
                
                return `
                    <tr>
                        <td>${student.id}</td>
                        <td>${student.name}</td>
                        <td>${this.getDisplayClassName(student.class)}</td>
                        <td>${sub.route || ''}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="sms.editBusSubscription(${sub.id})">Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="sms.deleteBusSubscription(${sub.id})">Delete</button>
                        </td>
                    </tr>
                `;
            }).join('');
        };
        
        SchoolManagementSystem.prototype.saveBusSubscription = async function() {
            const studentId = parseInt(document.getElementById('bus-student').value);
            const route = document.getElementById('bus-route').value.trim();
            
            if (!studentId || !route) {
                alert('Please fill in all required fields');
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
                        status: 'active',
                        startDate: new Date().toISOString().split('T')[0]
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    
                    // Update student's bus subscriber status locally
                    const student = this.students.find(s => s.id === studentId);
                    if (student) {
                        student.busSubscriber = true;
                    }
                    
                    closeModal('bus-modal');
                    await this.loadBusSubscriptionsFromServer();
                    alert('Bus subscription added successfully');
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
        
        SchoolManagementSystem.prototype.editBusSubscription = function(subscriptionId) {
            const subscription = this.busSubscriptions.find(s => String(s.id) === String(subscriptionId));
            if (!subscription) return;
            
            const modal = document.getElementById('bus-modal');
            const studentSelect = document.getElementById('bus-student');
            const routeSelect = document.getElementById('bus-route');
            if (!modal || !studentSelect || !routeSelect) return;
            
            // Populate routes
            const routes = routeManager.getRoutes();
            routeSelect.innerHTML = '<option value="">Select Route</option>';
            routes.forEach(r => {
                routeSelect.innerHTML += `<option value="${r.name}">${r.name} - ${r.area}</option>`;
            });
            
            // Populate students (include the current one)
            studentSelect.innerHTML = '<option value="">Select Student</option>';
            this.students.forEach(student => {
                const isCurrent = String(student.id) === String(subscription.studentId);
                const hasOtherSubscription = this.busSubscriptions.some(b => String(b.studentId) === String(student.id) && String(b.id) !== String(subscription.id));
                if (isCurrent || !hasOtherSubscription) {
                    studentSelect.innerHTML += `<option value="${student.id}">${student.name} - Grade ${student.class}</option>`;
                }
            });
            
            studentSelect.value = String(subscription.studentId);
            routeSelect.value = subscription.route || '';
            
            const saveBtn = modal.querySelector('button[type="submit"]');
            if (saveBtn) {
                saveBtn.textContent = 'Update Subscription';
                saveBtn.type = 'button';
                saveBtn.onclick = () => this.updateBusSubscription(subscriptionId);
            }
            
            modal.classList.add('show');
        };
        
        SchoolManagementSystem.prototype.updateBusSubscription = async function(subscriptionId) {
            const studentId = parseInt(document.getElementById('bus-student').value);
            const route = document.getElementById('bus-route').value.trim();
            
            if (!studentId || !route) {
                alert('Please fill in all required fields');
                return;
            }
            
            try {
                const response = await fetch(`/api/bus/${subscriptionId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        studentId,
                        route,
                        status: 'active'
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    
                    // Update student's bus subscriber status locally
                    const student = this.students.find(s => s.id === studentId);
                    if (student) student.busSubscriber = true;
                    
                    closeModal('bus-modal');
                    await this.loadBusSubscriptionsFromServer();
                    alert('Bus subscription updated successfully');
                } else {
                    const errorText = await response.text().catch(() => 'Unknown error');
                    console.error('Failed to update bus subscription:', errorText);
                    alert('Failed to update bus subscription. Please try again.');
                }
            } catch (error) {
                console.error('Error updating bus subscription:', error);
                alert('Failed to update bus subscription. Please try again.');
            }
        };
        
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
                    const subscription = this.busSubscriptions.find(b => b.id === subscriptionId);
                    const studentId = subscription ? subscription.studentId : null;
                    
                    // Remove from local data
                    this.busSubscriptions = this.busSubscriptions.filter(b => b.id !== subscriptionId);
                    
                    // Update student's bus subscriber status
                    if (studentId) {
                        const student = this.students.find(s => s.id === studentId);
                        if (student) {
                            const hasOtherBus = this.busSubscriptions.some(b => b.studentId === studentId);
                            student.busSubscriber = hasOtherBus;
                        }
                    }
                    
                    await this.loadBusSubscriptionsFromServer();
                    alert('Bus subscription deleted successfully');
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
        
        SchoolManagementSystem.prototype.getNextBusId = function() {
            if (this.busSubscriptions.length === 0) return 1;
            return Math.max(...this.busSubscriptions.map(b => b.id)) + 1;
        };
        
        SchoolManagementSystem.prototype.getDisplayClassName = function(classValue) {
            const classMap = {
                'KG1': 'KG1',
                'KG2': 'KG2',
                '1': 'Grade 1',
                '2': 'Grade 2',
                '3': 'Grade 3',
                '4 Boys': 'Grade 4 Boys',
                '4 Girls': 'Grade 4 Girls',
                '5': 'Grade 5',
                '6 Boys': 'Grade 6 Boys',
                '6 Girls': 'Grade 6 Girls',
                '7 Boys': 'Grade 7 Boys',
                '7 Girls': 'Grade 7 Girls',
                '8 Boys': 'Grade 8 Boys',
                '8 Girls': 'Grade 8 Girls',
                '9': 'Grade 9',
                '10': 'Grade 10',
                '11': 'Grade 11'
            };
            return classMap[classValue] || classValue;
        };
    }
    
    // Event listeners for bus filters
    document.getElementById('bus-route-filter')?.addEventListener('change', function() {
        if (typeof sms !== 'undefined') {
            sms.renderBusSubscriptions();
        }
    });
    
    document.getElementById('bus-class-filter')?.addEventListener('change', function() {
        if (typeof sms !== 'undefined') {
            sms.renderBusSubscriptions();
        }
    });
    
    document.getElementById('bus-search')?.addEventListener('input', function() {
        if (typeof sms !== 'undefined') {
            sms.renderBusSubscriptions();
        }
    });
    
    // Bus form submission
    document.getElementById('bus-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        if (typeof sms !== 'undefined') {
            sms.saveBusSubscription();
        }
    });
    
    // Route form submission
    document.getElementById('route-form')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const routeName = document.getElementById('route-name').value.trim();
        const routeArea = document.getElementById('route-area').value.trim();
        
        if (!routeName || !routeArea) {
            alert('Please fill in all route fields');
            return;
        }
        
        await routeManager.addRoute(routeName, routeArea);
        openRouteModal(); // Refresh the modal
        if (typeof sms !== 'undefined' && sms.renderBusSubscriptions) {
            sms.renderBusSubscriptions();
        }
        alert('Route added successfully');
    });
    
    // Load bus subscriptions from server when page loads
    setTimeout(() => {
        if (typeof sms !== 'undefined') {
            sms.loadBusSubscriptionsFromServer();
        }
    }, 1000);
    
    // Make routeManager globally accessible
    window.routeManager = routeManager;
});

