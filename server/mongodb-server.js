const express = require('express');
const path = require('path');
const session = require('express-session');
const fs = require('fs');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 8000;

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ahmedghobashy517_db_user:ahmed234@cluster0.1gyc0dj.mongodb.net/?appName=Cluster0';
const client = new MongoClient(MONGODB_URI);

let db;

// Connect to MongoDB
async function connectToMongoDB() {
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB Atlas');
        db = client.db('palestine-schools-egypt');
        
        // Create indexes for better performance
        await db.collection('students').createIndex({ id: 1 }, { unique: true });
        await db.collection('students').createIndex({ class: 1 });
        await db.collection('attendance').createIndex({ studentId: 1, date: 1 });
        await db.collection('attendance').createIndex({ date: 1 });
        await db.collection('fees').createIndex({ studentId: 1, month: 1 });
        await db.collection('busSubscriptions').createIndex({ studentId: 1 });
        await db.collection('teachers').createIndex({ username: 1 }, { unique: true });
        await db.collection('branches').createIndex({ admin: 1 }, { unique: true });
        
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        console.log('⚠️ Falling back to file storage');
    }
}

// Admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'school123';

// Teacher credentials
const TEACHER_USERNAME = 'teacher';
const TEACHER_PASSWORD = 'teach123';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: 'school-management-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session && req.session.authenticated) {
        return next();
    }
    res.redirect('/login');
}

// Login page
app.get('/login', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Seeds Palestine Schools - Login</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 20px;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .login-container {
                background: white;
                padding: 40px;
                border-radius: 15px;
                box-shadow: 0 15px 35px rgba(0,0,0,0.1);
                max-width: 400px;
                width: 100%;
            }
            .logo {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo h1 {
                color: #333;
                margin: 10px 0;
                font-size: 24px;
            }
            .flag {
                font-size: 40px;
                margin-bottom: 10px;
            }
            .form-group {
                margin-bottom: 20px;
            }
            label {
                display: block;
                margin-bottom: 5px;
                color: #555;
                font-weight: 500;
            }
            input[type="text"], input[type="password"] {
                width: 100%;
                padding: 12px;
                border: 2px solid #e1e5e9;
                border-radius: 8px;
                font-size: 16px;
                transition: border-color 0.3s;
            }
            input[type="text"]:focus, input[type="password"]:focus {
                outline: none;
                border-color: #667eea;
            }
            .btn {
                width: 100%;
                padding: 12px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s;
            }
            .btn:hover {
                transform: translateY(-2px);
            }
            .user-type {
                margin-bottom: 20px;
            }
            .user-type label {
                display: inline-block;
                margin-right: 15px;
                cursor: pointer;
            }
            .user-type input[type="radio"] {
                margin-right: 5px;
            }
            .error {
                color: #e74c3c;
                text-align: center;
                margin-bottom: 15px;
                display: none;
            }
        </style>
    </head>
    <body>
        <div class="login-container">
            <div class="logo">
                <div class="flag">🇵🇸</div>
                <h1>Seeds Palestine Schools</h1>
            </div>
            
            <div class="error" id="error-message">Invalid username or password</div>
            
            <form id="login-form">
                <div class="user-type">
                    <label><input type="radio" name="userType" value="admin" checked> Admin</label>
                    <label><input type="radio" name="userType" value="teacher"> Teacher</label>
                </div>
                
                <div class="form-group">
                    <label for="username">Username:</label>
                    <input type="text" id="username" name="username" required>
                </div>
                
                <div class="form-group">
                    <label for="password">Password:</label>
                    <input type="password" id="password" name="password" required>
                </div>
                
                <button type="submit" class="btn">Login</button>
            </form>
        </div>

        <script>
            document.getElementById('login-form').addEventListener('submit', function(e) {
                e.preventDefault();
                
                const userType = document.querySelector('input[name="userType"]:checked').value;
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                
                // Simple validation (in production, this should be server-side)
                let isValid = false;
                
                if (userType === 'admin' && username === 'admin' && password === 'school123') {
                    isValid = true;
                } else if (userType === 'teacher' && username === 'teacher' && password === 'teach123') {
                    isValid = true;
                }
                
                if (isValid) {
                    // Store login info in session
                    fetch('/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ username, password, userType })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            window.location.href = '/';
                        } else {
                            document.getElementById('error-message').style.display = 'block';
                        }
                    });
                } else {
                    document.getElementById('error-message').style.display = 'block';
                }
            });
        </script>
    </body>
    </html>
    `);
});

// Handle login
app.post('/login', (req, res) => {
    const { username, password, userType } = req.body;
    
    let isAuthenticated = false;
    
    if (userType === 'admin' && username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        isAuthenticated = true;
        req.session.userType = 'admin';
    } else if (userType === 'teacher' && username === TEACHER_USERNAME && password === TEACHER_PASSWORD) {
        isAuthenticated = true;
        req.session.userType = 'teacher';
    }
    
    if (isAuthenticated) {
        req.session.authenticated = true;
        req.session.username = username;
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve main page
app.get('/', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// MongoDB API endpoints
async function getCollectionData(collectionName) {
    if (!db) {
        // Fallback to file storage
        try {
            const filePath = path.join(__dirname, `${collectionName}.json`);
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
        } catch (error) {
            console.log(`Error reading ${collectionName}.json:`, error);
        }
        return [];
    }
    
    try {
        const collection = db.collection(collectionName);
        return await collection.find({}).toArray();
    } catch (error) {
        console.error(`Error fetching ${collectionName}:`, error);
        return [];
    }
}

async function saveCollectionData(collectionName, data) {
    if (!db) {
        // Fallback to file storage
        try {
            const filePath = path.join(__dirname, `${collectionName}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error(`Error saving ${collectionName}.json:`, error);
            return false;
        }
    }
    
    try {
        const collection = db.collection(collectionName);
        await collection.deleteMany({});
        if (Array.isArray(data) && data.length > 0) {
            await collection.insertMany(data);
        }
        return true;
    } catch (error) {
        console.error(`Error saving ${collectionName}:`, error);
        return false;
    }
}

// New function to add/update single document
async function upsertDocument(collectionName, document, query) {
    if (!db) {
        // Fallback to file storage
        try {
            const filePath = path.join(__dirname, `${collectionName}.json`);
            let existingData = [];
            if (fs.existsSync(filePath)) {
                existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
            
            const index = existingData.findIndex(item => 
                query && Object.keys(query).every(key => item[key] === query[key])
            );
            
            if (index >= 0) {
                existingData[index] = { ...existingData[index], ...document };
            } else {
                existingData.push(document);
            }
            
            fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
            return true;
        } catch (error) {
            console.error(`Error upserting to ${collectionName}.json:`, error);
            return false;
        }
    }
    
    try {
        const collection = db.collection(collectionName);
        if (query) {
            await collection.updateOne(query, { $set: document }, { upsert: true });
        } else {
            await collection.insertOne(document);
        }
        return true;
    } catch (error) {
        console.error(`Error upserting to ${collectionName}:`, error);
        return false;
    }
}

// API endpoints for data management (protected)
app.get('/api/data', async (req, res) => {
    try {
        const data = {
            students: await getCollectionData('students'),
            attendance: await getCollectionData('attendance'),
            busSubscriptions: await getCollectionData('busSubscriptions'),
            feePayments: await getCollectionData('feePayments'),
            teachers: await getCollectionData('teachers'),
            branches: await getCollectionData('branches')
        };
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load data' });
    }
});

app.post('/api/data/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const validTypes = ['students', 'attendance', 'bus', 'fees'];
        
        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: 'Invalid data type' });
        }
        
        const collectionName = type === 'bus' ? 'busSubscriptions' : type;
        const success = await saveCollectionData(collectionName, req.body);
        
        if (success) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: 'Failed to save data' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// Compatibility route for existing front-end calls (POST /api/save)
app.post('/api/save', async (req, res) => {
    try {
        const { type, data } = req.body;
        const validTypes = ['students', 'attendance', 'bus', 'fees', 'teachers', 'branches'];

        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: 'Invalid data type' });
        }

        const collectionName = type === 'bus' ? 'busSubscriptions' : type;
        const success = await saveCollectionData(collectionName, Array.isArray(data) ? data : []);

        if (success) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: 'Failed to save data' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// New API endpoint for single document operations
app.post('/api/upsert', async (req, res) => {
    try {
        const { type, document, query } = req.body;
        const validTypes = ['students', 'attendance', 'bus', 'fees', 'teachers', 'branches'];

        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: 'Invalid data type' });
        }

        const collectionName = type === 'bus' ? 'busSubscriptions' : type;
        const success = await upsertDocument(collectionName, document, query);

        if (success) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: 'Failed to save document' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to save document' });
    }
});

// API endpoint to delete document
app.delete('/api/document/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        const validTypes = ['students', 'attendance', 'bus', 'fees', 'teachers', 'branches'];

        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: 'Invalid data type' });
        }

        const collectionName = type === 'bus' ? 'busSubscriptions' : type;
        
        if (db) {
            await db.collection(collectionName).deleteOne({ id: parseInt(id) });
        } else {
            // Fallback to file storage
            const filePath = path.join(__dirname, `${collectionName}.json`);
            let existingData = [];
            if (fs.existsSync(filePath)) {
                existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
            existingData = existingData.filter(item => item.id !== parseInt(id));
            fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete document' });
    }
});

// Start server
connectToMongoDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 MongoDB Status: ${db ? 'Connected' : 'Using file storage'}`);
    });
});

module.exports = app;
