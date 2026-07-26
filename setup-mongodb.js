// MongoDB Setup Helper
// Replace YOUR_ACTUAL_PASSWORD with your real MongoDB Atlas password

const { MongoClient } = require('mongodb');

// IMPORTANT: Replace this with your actual password from MongoDB Atlas
const MONGODB_URI = 'mongodb+srv://ahmedghobashy517_db_user:ahmed234@cluster0.1gyc0dj.mongodb.net/?appName=Cluster0';

async function testConnection() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        console.log('🔌 Connecting to MongoDB Atlas...');
        await client.connect();
        console.log('✅ Connected successfully!');
        
        // Test database operations
        const db = client.db('school-management');
        
        // Test creating collections
        console.log('📊 Creating test collections...');
        
        // Insert test data
        const testStudent = { id: 1, name: 'Test Student', class: 'Grade 1', phone: '123-456-7890' };
        await db.collection('students').insertOne(testStudent);
        console.log('✅ Test student inserted');
        
        // Read test data
        const students = await db.collection('students').find({}).toArray();
        console.log('📚 Found students:', students.length);
        
        // Clean up test data
        await db.collection('students').deleteMany({});
        console.log('🧹 Test data cleaned up');
        
        console.log('🎉 MongoDB Atlas is ready for production!');
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        
        if (error.message.includes('Authentication failed')) {
            console.log('💡 Solution: Check your password in the connection string');
        } else if (error.message.includes('ENOTFOUND')) {
            console.log('💡 Solution: Check your cluster name and network connection');
        } else {
            console.log('💡 Solution: Make sure your IP is whitelisted in MongoDB Atlas');
        }
    } finally {
        await client.close();
    }
}

console.log('🚀 Testing MongoDB Atlas connection...');
console.log('📝 Make sure to replace YOUR_ACTUAL_PASSWORD with your real password!');
testConnection();
