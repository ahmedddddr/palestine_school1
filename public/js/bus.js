// Bus Subscription Management - Direct API calls
document.addEventListener('DOMContentLoaded', function() {
    // Add load functions as prototype methods
    if (typeof SchoolManagementSystem !== 'undefined') {
        SchoolManagementSystem.prototype.loadBusSubscriptionsFromServer = async function() {
            try {
                if (!this.busSubscriptions) this.busSubscriptions = [];
                
                const busRes = await fetch('/api/bus', { credentials: 'include' });
                
                if (busRes.ok) {
                    try {
                        const busData = await busRes.json();
                        this.busSubscriptions = Array.isArray(busData) ? busData : [];
                        console.log('✅ Bus subscriptions loaded from server:', this.busSubscriptions.length);
                    } catch (e) {
                        console.error('❌ Failed to parse bus subscriptions JSON:', e);
                        this.busSubscriptions = [];
                    }
                } else {
                    console.warn('⚠️ Bus subscriptions API returned non-OK status:', busRes.status);
                    this.busSubscriptions = [];
                }
            } catch (error) {
                console.error('❌ Failed to load bus subscriptions from server:', error);
                if (!this.busSubscriptions) this.busSubscriptions = [];
            }
        };
    }

    // Override saveBusSubscription to use direct API calls
    if (typeof SchoolManagementSystem !== 'undefined') {
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
                    
                    // Update student's bus subscriber status locally
                    const student = this.students.find(s => s.id === studentId);
                    if (student) {
                        student.busSubscriber = true;
                    }
                    
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
        SchoolManagementSystem.prototype.deleteBusSubscription = async function(subscriptionId) {
            if (!confirm('Are you sure you want to delete this bus subscription?')) {
                return;
            }

            try {
                // Find subscription before deleting to get studentId
                const subscription = this.busSubscriptions.find(b => b.id === subscriptionId);
                const studentId = subscription ? subscription.studentId : null;

                const response = await fetch(`/api/bus/${subscriptionId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });

                if (response.ok) {
                    // Remove from local data
                    this.busSubscriptions = this.busSubscriptions.filter(b => b.id !== subscriptionId);
                    
                    // Update student's bus subscriber status
                    if (studentId) {
                        const student = this.students.find(s => s.id === studentId);
                        if (student) {
                            student.busSubscriber = false;
                        }
                    }
                    
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

    // Load bus subscriptions when page loads
    setTimeout(() => {
        if (typeof sms !== 'undefined') {
            console.log('Loading bus subscriptions from server...');
            sms.loadBusSubscriptionsFromServer();
        }
    }, 1500);
});
