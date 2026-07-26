const express = require('express');
const path = require('path');
const session = require('express-session');
const fs = require('fs');

const app = express();
const PORT = 8000;

// Admin credentials (change these for production)
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
        secure: false, // Set to true if using HTTPS
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
            :root {
                --pal-black: #111111;
                --pal-white: #ffffff;
                --pal-green: #007a3d;
                --pal-red: #ce1126;
                --text: #0f172a;
                --muted: #64748b;
                --card: rgba(255, 255, 255, 0.92);
                --border: rgba(15, 23, 42, 0.12);
            }
            * { box-sizing: border-box; }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 0;
                min-height: 100vh;
                min-height: 100dvh;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--text);
                background:
                    radial-gradient(1200px 700px at 15% 10%, rgba(0, 122, 61, 0.25), transparent 60%),
                    radial-gradient(900px 600px at 85% 15%, rgba(206, 17, 38, 0.22), transparent 55%),
                    linear-gradient(180deg, #0b1220 0%, #0f172a 100%);
                position: relative;
                overflow: hidden;
            }
            body::before {
                content: '';
                position: absolute;
                inset: 0;
                background:
                    linear-gradient(135deg, rgba(17, 17, 17, 0.35) 0%, rgba(17, 17, 17, 0.05) 45%, rgba(255, 255, 255, 0.06) 100%),
                    repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.03) 0, rgba(255, 255, 255, 0.03) 6px, rgba(255, 255, 255, 0.00) 6px, rgba(255, 255, 255, 0.00) 12px);
                pointer-events: none;
            }
            .login-shell {
                width: min(980px, 92vw);
                display: grid;
                grid-template-columns: 1.2fr 1fr;
                gap: 24px;
                position: relative;
                z-index: 1;
                padding: 18px;
            }
            .brand-panel {
                border: 1px solid rgba(255, 255, 255, 0.14);
                border-radius: 16px;
                padding: 28px;
                background: rgba(255, 255, 255, 0.06);
                backdrop-filter: blur(10px);
                color: var(--pal-white);
                box-shadow: 0 20px 50px rgba(0,0,0,0.30);
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                min-height: 420px;
            }
            .brand-title {
                margin: 0;
                font-size: 30px;
                letter-spacing: 0.3px;
            }
            .brand-sub {
                margin: 10px 0 0 0;
                color: rgba(255,255,255,0.85);
                line-height: 1.5;
            }
            .flag-bar {
                margin-top: 18px;
                height: 10px;
                border-radius: 999px;
                overflow: hidden;
                display: grid;
                grid-template-columns: 1fr 1fr 1fr 1fr;
                border: 1px solid rgba(255,255,255,0.18);
            }
            .flag-bar span:nth-child(1) { background: var(--pal-black); }
            .flag-bar span:nth-child(2) { background: var(--pal-white); }
            .flag-bar span:nth-child(3) { background: var(--pal-green); }
            .flag-bar span:nth-child(4) { background: var(--pal-red); }
            .brand-footer {
                margin-top: 18px;
                padding-top: 16px;
                border-top: 1px solid rgba(255,255,255,0.16);
                display: grid;
                gap: 8px;
                color: rgba(255,255,255,0.80);
                font-size: 14px;
                line-height: 1.5;
            }
            .login-container {
                background: var(--card);
                padding: 28px;
                border-radius: 16px;
                box-shadow: 0 20px 50px rgba(0,0,0,0.30);
                width: 100%;
                border: 1px solid var(--border);
                backdrop-filter: blur(8px);
            }
            .login-header {
                margin-bottom: 22px;
            }
            .login-header h1 {
                color: var(--text);
                margin: 0;
                font-size: 22px;
                letter-spacing: 0.2px;
            }
            .login-header p {
                color: var(--muted);
                margin: 8px 0 0 0;
                font-size: 14px;
                line-height: 1.5;
            }
            .form-group {
                margin-bottom: 16px;
            }
            .form-group label {
                display: block;
                margin-bottom: 6px;
                color: #0f172a;
                font-weight: 600;
                font-size: 13px;
            }
            .form-group input {
                width: 100%;
                padding: 12px 12px;
                border: 1px solid rgba(15, 23, 42, 0.18);
                border-radius: 10px;
                font-size: 15px;
                transition: border-color 0.2s, box-shadow 0.2s;
                background: rgba(255,255,255,0.92);
            }
            .form-group input:focus {
                outline: none;
                border-color: rgba(0, 122, 61, 0.70);
                box-shadow: 0 0 0 4px rgba(0, 122, 61, 0.15);
            }
            .login-btn {
                width: 100%;
                padding: 12px;
                background: linear-gradient(90deg, var(--pal-green), #0b8a46);
                color: white;
                border: none;
                border-radius: 12px;
                font-size: 15px;
                font-weight: 700;
                cursor: pointer;
                transition: transform 0.12s, filter 0.12s;
            }
            .login-btn:hover { filter: brightness(1.03); transform: translateY(-1px); }
            .login-btn:active { transform: translateY(0); }
            .error-message {
                background: rgba(206, 17, 38, 0.12);
                color: #7f1d1d;
                padding: 10px 12px;
                border-radius: 12px;
                margin-bottom: 16px;
                border: 1px solid rgba(206, 17, 38, 0.25);
                text-align: center;
                display: none;
                font-weight: 600;
                font-size: 13px;
            }
            .school-info {
                margin-top: 18px;
                padding-top: 14px;
                border-top: 1px solid rgba(15, 23, 42, 0.10);
                color: var(--muted);
                font-size: 13px;
                line-height: 1.6;
            }
            .pill {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 8px 10px;
                border-radius: 999px;
                border: 1px solid rgba(15, 23, 42, 0.12);
                background: rgba(255,255,255,0.70);
                color: rgba(15, 23, 42, 0.85);
                font-weight: 600;
                margin-top: 12px;
            }
            @media (max-width: 880px) {
                .login-shell { grid-template-columns: 1fr; }
                .brand-panel { min-height: auto; }
            }

            @media (max-width: 520px) {
                body {
                    align-items: flex-start;
                    justify-content: flex-start;
                }
                .login-shell {
                    width: 100%;
                    padding: calc(14px + env(safe-area-inset-top)) calc(12px + env(safe-area-inset-right)) calc(18px + env(safe-area-inset-bottom)) calc(12px + env(safe-area-inset-left));
                    gap: 14px;
                }
                .brand-panel { padding: 18px; border-radius: 14px; }
                .brand-title { font-size: 24px; }
                .login-container { padding: 18px; border-radius: 14px; }
                .login-header h1 { font-size: 20px; }
                .form-group input { font-size: 16px; padding: 12px; }
                .login-btn { padding: 13px; }
            }
        </style>
    </head>
    <body>
        <div class="login-shell">
            <div class="brand-panel">
                <div>
                    <h1 class="brand-title">Seeds Palestine Schools</h1>
                    <p class="brand-sub">School Management System for Students, Attendance, Fees, and Transportation.</p>
                    <div class="flag-bar" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
                    <div class="pill">Secure login for staff only</div>
                </div>
                <div class="brand-footer">
                    <div><strong>Admin</strong>: Full access (students, fees, bus, reports)</div>
                    <div><strong>Teacher</strong>: Attendance and bus routes</div>
                </div>
            </div>

            <div class="login-container">
                <div class="login-header">
                    <h1>Sign in</h1>
                    <p>Enter your staff account details to continue.</p>
                </div>
            
            <div class="error-message" id="error-message">
                Invalid username or password
            </div>
            
            <form id="login-form" method="POST" action="/login">
                <div class="form-group">
                    <label for="username">Username</label>
                    <input type="text" id="username" name="username" required>
                </div>
                
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required>
                </div>
                
                <button type="submit" class="login-btn">
                    Login to System
                </button>
            </form>
            
            <div class="school-info">
                <div><strong>Tip:</strong> If you have trouble signing in, contact the school administrator.</div>
            </div>
            </div>
        </div>
        
        <script>
            // Show error message if URL contains error parameter
            if (window.location.search.includes('error=1')) {
                document.getElementById('error-message').style.display = 'block';
            }
        </script>
    </body>
    </html>
    `);
});

// Login POST handler
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // Check admin credentials
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.authenticated = true;
        req.session.userType = 'admin';
        req.session.username = username;
        res.redirect('/');
    }
    // Check teacher credentials
    else if (username === TEACHER_USERNAME && password === TEACHER_PASSWORD) {
        req.session.authenticated = true;
        req.session.userType = 'teacher';
        req.session.username = username;
        res.redirect('/teacher');
    }
    else {
        res.redirect('/login?error=1');
    }
});

// Logout handler
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/');
        }
        res.redirect('/login');
    });
});

// Protect all routes except login
app.use((req, res, next) => {
    if (req.path === '/login' || req.path === '/logout') {
        return next();
    }

    if (req.path.startsWith('/api/')) {
        if (req.session && req.session.authenticated) {
            return next();
        }
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Check if user is authenticated
    if (req.session && req.session.authenticated) {
        // Allow teachers to access teacher page
        if (req.path === '/teacher' && req.session.userType === 'teacher') {
            return next();
        }
        // Allow admins to access all pages
        if (req.session.userType === 'admin') {
            return next();
        }
        // Redirect teachers trying to access admin pages
        if (req.session.userType === 'teacher' && req.path !== '/teacher') {
            return res.redirect('/teacher');
        }
    }
    
    // Redirect to login if not authenticated
    res.redirect('/login');
});

// Teacher portal route
app.get('/teacher', (req, res) => {
    res.sendFile(path.join(__dirname, 'teacher.html'));
});

// Serve static files (CSS, JS, images) - only after authentication check
app.use(express.static(path.join(__dirname)));

// Protect all routes except login and static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoints for data management (protected)
app.get('/api/data', (req, res) => {
    try {
        const data = {
            students: JSON.parse(fs.readFileSync(path.join(__dirname, 'students.json'), 'utf8') || '[]'),
            attendance: JSON.parse(fs.readFileSync(path.join(__dirname, 'attendance.json'), 'utf8') || '[]'),
            busSubscriptions: JSON.parse(fs.readFileSync(path.join(__dirname, 'bus.json'), 'utf8') || '[]'),
            feePayments: JSON.parse(fs.readFileSync(path.join(__dirname, 'fees.json'), 'utf8') || '[]'),
            teachers: JSON.parse(fs.readFileSync(path.join(__dirname, 'teachers.json'), 'utf8') || '[]'),
            branches: JSON.parse(fs.readFileSync(path.join(__dirname, 'branches.json'), 'utf8') || '[]')
        };
        res.json(data);
    } catch (fileError) {
        res.json({ students: [], attendance: [], busSubscriptions: [], feePayments: [], teachers: [], branches: [] });
    }
});

app.post('/api/save', (req, res) => {
    try {
        const { type, data } = req.body;
        let filename;
        
        switch(type) {
            case 'students':
                filename = 'students.json';
                break;
            case 'attendance':
                filename = 'attendance.json';
                break;
            case 'bus':
                filename = 'bus.json';
                break;
            case 'fees':
                filename = 'fees.json';
                break;
            case 'teachers':
                filename = 'teachers.json';
                break;
            case 'branches':
                filename = 'branches.json';
                break;
            default:
                return res.status(400).json({ error: 'Invalid data type' });
        }
        
        fs.writeFileSync(path.join(__dirname, filename), JSON.stringify(data, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🏫 School Management Server running on http://localhost:${PORT}`);
    console.log(`📝 Login URL: http://localhost:${PORT}/login`);
    console.log(`🚀 Server started successfully!`);
});

module.exports = app;
