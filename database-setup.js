// Database Setup for Persistent Storage on Render

// Option 1: MongoDB (Free on MongoDB Atlas)
const mongoose = require('mongoose');

// Database schemas
const studentSchema = new mongoose.Schema({
    id: Number,
    name: String,
    class: String,
    phone: String,
    busSubscriber: Boolean,
    route: String
});

const attendanceSchema = new mongoose.Schema({
    studentId: Number,
    date: String,
    status: String,
    time: String
});

const busSubscriptionSchema = new mongoose.Schema({
    id: Number,
    studentId: Number,
    route: String,
    monthlyFee: Number,
    status: String,
    startDate: String
});

const feePaymentSchema = new mongoose.Schema({
    studentId: Number,
    amount: Number,
    date: String,
    month: String,
    status: String
});

// Models
const Student = mongoose.model('Student', studentSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);
const BusSubscription = mongoose.model('BusSubscription', busSubscriptionSchema);
const FeePayment = mongoose.model('FeePayment', feePaymentSchema);

// API endpoints for database
async function getDatabaseData() {
    return {
        students: await Student.find({}),
        attendance: await Attendance.find({}),
        busSubscriptions: await BusSubscription.find({}),
        feePayments: await FeePayment.find({})
    };
}

async function saveDatabaseData(dataType, data) {
    switch(dataType) {
        case 'students':
            await Student.deleteMany({});
            await Student.insertMany(data);
            break;
        case 'attendance':
            await Attendance.deleteMany({});
            await Attendance.insertMany(data);
            break;
        case 'bus':
            await BusSubscription.deleteMany({});
            await BusSubscription.insertMany(data);
            break;
        case 'fees':
            await FeePayment.deleteMany({});
            await FeePayment.insertMany(data);
            break;
    }
}

// Connection string for MongoDB Atlas (replace with your own)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/school-management';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

module.exports = { getDatabaseData, saveDatabaseData };
