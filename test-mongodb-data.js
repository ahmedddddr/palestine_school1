// Test adding data to MongoDB Atlas
const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://ahmedghobashy517_db_user:ahmed234@cluster0.1gyc0dj.mongodb.net/?appName=Cluster0';

async function addTestData() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB Atlas');
        
        const db = client.db('school-management');
        
        // Add test student
        await db.collection('students').insertOne({
            id: 1,
            name: 'Ahmed Mohamed',
            class: 'Grade 1',
            phone: '059-123-4567',
            busSubscriber: true,
            route: 'Route 1: North Area'
        });
        
        // Add test bus subscription
        await db.collection('busSubscriptions').insertOne({
            id: 1,
            studentId: 1,
            route: 'Route 1: North Area',
            monthlyFee: 50,
            status: 'Active',
            startDate: '2024-02-20'
        });
        
        // Add test attendance
        await db.collection('attendance').insertOne({
            studentId: 1,
            date: '2024-02-20',
            status: 'Present',
            time: '08:00 AM'
        });
        
        // Add test fee payment
        await db.collection('feePayments').insertOne({
            studentId: 1,
            amount: 200,
            date: '2024-02-20',
            month: 'February',
            status: 'Paid'
        });
        
        console.log('🎉 Test data added successfully!');
        console.log('📊 Check your school-management database in MongoDB Atlas');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

addTestData();
