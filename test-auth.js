// Test MongoDB Authentication
const { MongoClient } = require('mongodb');

// Test different connection string formats
const connectionStrings = [
    'mongodb+srv://ahmedghobashy517_db_user:ahmed234@cluster0.1gyc0dj.mongodb.net/?appName=Cluster0',
    'mongodb+srv://ahmedghobashy517_db_user:ahmed234@cluster0.1gyc0dj.mongodb.net/school-management',
    'mongodb+srv://ahmedghobashy517_db_user:ahmed234@cluster0.1gyc0dj.mongodb.net/test'
];

async function testConnection(connectionString, index) {
    const client = new MongoClient(connectionString);
    
    try {
        console.log(`\n🔌 Testing connection ${index + 1}...`);
        await client.connect();
        console.log(`✅ Connection ${index + 1} successful!`);
        
        // List databases
        const admin = client.db().admin();
        const databases = await admin.listDatabases();
        console.log('📊 Available databases:', databases.databases.map(db => db.name));
        
        await client.close();
        return true;
        
    } catch (error) {
        console.log(`❌ Connection ${index + 1} failed:`, error.message);
        await client.close();
        return false;
    }
}

async function testAllConnections() {
    console.log('🚀 Testing MongoDB connection strings...\n');
    
    let success = false;
    for (let i = 0; i < connectionStrings.length; i++) {
        const result = await testConnection(connectionStrings[i], i);
        if (result) {
            success = true;
            break;
        }
    }
    
    if (!success) {
        console.log('\n💡 Possible solutions:');
        console.log('1. Check your MongoDB Atlas username and password');
        console.log('2. Make sure your IP is whitelisted in Network Access');
        console.log('3. Verify your cluster name (cluster0.1gyc0dj.mongodb.net)');
        console.log('4. Check if your database user has the right permissions');
    }
}

testAllConnections();
