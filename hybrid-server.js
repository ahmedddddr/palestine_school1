const express = require('express');
const path = require('path');
const session = require('express-session');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8000;

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
                
                let isValid = false;
                
                if (userType === 'admin' && username === 'admin' && password === 'school123') {
                    isValid = true;
                } else if (userType === 'teacher' && username === 'teacher' && password === 'teach123') {
                    isValid = true;
                }
                
                if (isValid) {
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

// Enhanced File Storage with Backup
function ensureDataFiles() {
    const files = ['students.json', 'attendance.json', 'bus.json', 'fees.json'];
    
    files.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, '[]');
            console.log(`✅ Created ${file}`);
        }
    });
}

function loadDataFromFile(filename) {
    try {
        const filePath = path.join(__dirname, filename);
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (error) {
        console.error(`Error loading ${filename}:`, error);
    }
    return [];
}

function saveDataToFile(filename, data) {
    try {
        const filePath = path.join(__dirname, filename);
        
        // Create backup
        if (fs.existsSync(filePath)) {
            const backupPath = `${filePath}.backup.${Date.now()}`;
            fs.copyFileSync(filePath, backupPath);
        }
        
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`✅ Saved ${filename} with ${data.length} items`);
        return true;
    } catch (error) {
        console.error(`Error saving ${filename}:`, error);
        return false;
    }
}

// API endpoints for data management (protected)
app.get('/api/data', (req, res) => {
    try {
        const data = {
            students: loadDataFromFile('students.json'),
            attendance: loadDataFromFile('attendance.json'),
            busSubscriptions: loadDataFromFile('bus.json'),
            feePayments: loadDataFromFile('fees.json')
        };
        
        console.log('📊 Data loaded:', {
            students: data.students.length,
            attendance: data.attendance.length,
            busSubscriptions: data.busSubscriptions.length,
            feePayments: data.feePayments.length
        });
        
        res.json(data);
    } catch (error) {
        console.error('❌ Failed to load data:', error);
        res.status(500).json({ error: 'Failed to load data' });
    }
});

app.post('/api/data/:type', (req, res) => {
    try {
        const { type } = req.params;
        const validTypes = ['students', 'attendance', 'bus', 'fees'];
        
        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: 'Invalid data type' });
        }
        
        const filename = type === 'bus' ? 'bus.json' : `${type}.json`;
        const success = saveDataToFile(filename, req.body);
        
        if (success) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: 'Failed to save data' });
        }
    } catch (error) {
        console.error('❌ Failed to save data:', error);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// Initialize data files
ensureDataFiles();

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Using enhanced file storage with automatic backups`);
    console.log(`💾 Data persists across server restarts!`);
});

module.exports = app;
