// Sample student data for testing
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

// Function to load sample data
function loadSampleData() {
    if (!localStorage.getItem('students')) {
        localStorage.setItem('students', JSON.stringify(sampleStudents));
        console.log('Sample students loaded:', sampleStudents.length);
    }
}

// Load sample data when page loads
loadSampleData();
