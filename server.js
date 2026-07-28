require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const fs = require('fs');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 8000;
const NODE_ENV = process.env.NODE_ENV || 'production';
const MONGODB_URI = (process.env.MONGODB_URI || '').trim();

let db;
let mongoClient;

async function connectToMongoDB() {
    if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI is required. Please set MONGODB_URI environment variable.');
        throw new Error('MONGODB_URI is required');
    }
    try {
        mongoClient = new MongoClient(MONGODB_URI);
        await mongoClient.connect();
        let dbName = 'school-management';
        try {
            const parsed = new URL(MONGODB_URI.replace(/^mongodb(\+srv)?:\/\//, 'http://'));
            if (parsed.pathname && parsed.pathname.length > 1) {
                dbName = parsed.pathname.slice(1);
            }
            console.log(`✅ Connected to MongoDB "${dbName}" @ ${parsed.host}`);
        } catch (parseErr) {
            console.log(`✅ Connected to MongoDB (using default database: ${dbName})`);
        }
        db = mongoClient.db(dbName);
        await ensureMongoIndexes();
        return true;
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        throw new Error('MongoDB connection failed');
    }
}

async function ensureMongoIndexes() {
    if (!db) return;
    try {
        const timeout = new AbortController();
        const t = setTimeout(() => timeout.abort(), 15000);
        const opts = process.env.NODE_ENV === 'production' ? {} : { maxTimeMS: 10000 };
        await db.collection('users').createIndex({ username: 1 }, { unique: true, ...opts });
        await db.collection('users').createIndex({ branchId: 1, ...opts });
        await db.collection('students').createIndex({ branchId: 1, ...opts });
        await db.collection('teachers').createIndex({ branchId: 1, ...opts });
        await db.collection('attendance').createIndex({ branchId: 1, date: 1, ...opts });
        await db.collection('attendance').createIndex({ studentId: 1, date: 1, ...opts });
        await db.collection('fees').createIndex({ branchId: 1, ...opts });
        await db.collection('fees').createIndex({ studentId: 1, month: 1, year: 1, ...opts });
        await db.collection('busSubscriptions').createIndex({ branchId: 1, ...opts });
        await db.collection('teacherAttendance').createIndex({ branchId: 1, date: 1, ...opts });
        await db.collection('teacherAttendance').createIndex({ teacherId: 1, date: 1, ...opts });
        await db.collection('teacherSalaries').createIndex({ branchId: 1, ...opts });
        await db.collection('teacherSalaries').createIndex({ teacherId: 1, month: 1, year: 1, ...opts });
        await db.collection('branches').createIndex({ id: 1 }, { unique: true, ...opts });
        await db.collection('branches').createIndex({ branchCode: 1 }, { unique: true, ...opts });
        clearTimeout(t);
    } catch (e) {
        console.log('ℹ️  Index setup note (non-critical):', e.message);
    }
}

async function getCollection(name, query = {}) {
    if (!db) throw new Error('Database not connected');
    try {
        return await db.collection(name).find(query).toArray();
    } catch (e) {
        console.error(`Mongo read ${name}:`, e.message);
        throw e;
    }
}

async function saveCollection(name, data) {
    if (!db) throw new Error('Database not connected');
    try {
        const col = db.collection(name);
        if (!Array.isArray(data) || data.length === 0) {
            await col.deleteMany({});
            return true;
        }
        const ids = data.map(d => d.id).filter(id => id !== undefined && id !== null);
        if (ids.length > 0) {
            await col.deleteMany({ id: { $nin: ids } });
        }
        for (const doc of data) {
            if (doc.id !== undefined && doc.id !== null) {
                await col.updateOne({ id: doc.id }, { $set: doc }, { upsert: true });
            } else {
                await col.insertOne(doc);
            }
        }
        return true;
    } catch (e) {
        console.error(`Mongo write ${name}:`, e.message);
        throw e;
    }
}

async function upsertInCollection(name, query, doc) {
    if (!db) throw new Error('Database not connected');
    try {
        const col = db.collection(name);
        const res = await col.updateOne(query, { $set: doc }, { upsert: true });
        return res.upsertedCount > 0 || res.modifiedCount > 0;
    } catch (e) {
        console.error(`Mongo upsert ${name}:`, e.message);
        throw e;
    }
}

async function removeFromCollection(name, query) {
    if (!db) throw new Error('Database not connected');
    try {
        await db.collection(name).deleteMany(query);
        return true;
    } catch (e) {
        console.error(`Mongo delete ${name}:`, e.message);
        throw e;
    }
}

app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : 0);

app.use(helmet({
    contentSecurityPolicy: false,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    frameguard: { action: 'deny' },
    noSniff: true,
    permittedCrossDomainPolicies: { policy: 'none' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true
}));

app.use((req, res, next) => {
    const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "script-src-attr 'unsafe-inline'",
        "script-src-elem 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "style-src-attr 'unsafe-inline'",
        "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: https:",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
        NODE_ENV === 'production' || process.env.TRUST_PROXY === 'true' ? "upgrade-insecure-requests" : null
    ].filter(Boolean).join('; ') + ';';
    res.setHeader('Content-Security-Policy', csp);
    next();
});

app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    next();
});

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

const cookieSecure = NODE_ENV === 'production' || process.env.TRUST_PROXY === 'true';
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-insecure-change-me-please',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: cookieSecure,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 8 * 60 * 60 * 1000
    }
}));

const loginLimiter = rateLimit({
    windowMs: 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Try again later.' },
    skipSuccessfulRequests: false
});

const apiLimiter = rateLimit({
    windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '60000'),
    max: parseInt(process.env.API_RATE_LIMIT_MAX || '500'),
    standardHeaders: true,
    legacyHeaders: false
});

function sanitizeString(str, maxLen = 255) {
    if (typeof str !== 'string') return '';
    return str.replace(/[<>]/g, '').trim().slice(0, maxLen);
}

function isValidRole(role) {
    return ['super_admin', 'branch_admin', 'teacher'].includes(role);
}

function requireAuth(role = null) {
    return (req, res, next) => {
        if (!req.session || !req.session.authenticated) {
            return req.accepts('html') ? res.redirect('/login') : res.status(401).json({ error: 'Unauthorized' });
        }
        if (role && req.session.role !== role) {
            return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
        }
        next();
    };
}

function requireAnyRole(roles = []) {
    return (req, res, next) => {
        if (!req.session || !req.session.authenticated) {
            return req.accepts('html') ? res.redirect('/login') : res.status(401).json({ error: 'Unauthorized' });
        }
        if (!roles.includes(req.session.role)) {
            return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
        }
        next();
    };
}

function scopeByBranch(req, res, next) {
    if (!req.session || !req.session.authenticated) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.session.role === 'super_admin') {
        req.branchScope = null;
        return next();
    }
    if (!req.session.branchId) {
        return res.status(403).json({ error: 'User has no branch assignment' });
    }
    req.branchScope = req.session.branchId;
    next();
}

async function initializeDefaults() {
    const branches = await getCollection('branches');
    if (!Array.isArray(branches) || branches.length === 0) {
        const defaults = [
            { id: 1, name: 'Cairo Main Branch', location: 'Nasr City, Cairo', admin: 'cairo_admin', branchCode: 'cairo', status: 'active', createdAt: new Date().toISOString() },
            { id: 2, name: 'Alexandria Branch', location: 'Smouha, Alexandria', admin: 'alex_admin', branchCode: 'alexandria', status: 'active', createdAt: new Date().toISOString() },
            { id: 3, name: 'Giza Branch', location: 'Dokki, Giza', admin: 'giza_admin', branchCode: 'giza', status: 'active', createdAt: new Date().toISOString() }
        ];
        await saveCollection('branches', defaults);
        console.log('✅ Initialized default branches');
    }

    const users = await getCollection('users');
    const anyUser = users && users.length > 0;

    if (!anyUser) {
        const saltRounds = 12;
        const adminHash = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD || 'Admin@123', saltRounds);
        const branchHash = await bcrypt.hash(process.env.BRANCH_ADMIN_PASSWORD || 'Branch@123', saltRounds);
        const initialUsers = [
            {
                id: 'super_admin_1',
                username: sanitizeString(process.env.SUPER_ADMIN_USERNAME || 'superadmin', 50),
                password: adminHash,
                role: 'super_admin',
                branchId: null,
                displayName: 'System Super Admin',
                isActive: true,
                createdAt: new Date().toISOString(),
                lastLogin: null
            },
            {
                id: 'branch_admin_1',
                username: sanitizeString(process.env.BRANCH_ADMIN_USERNAME || 'branchadmin', 50),
                password: branchHash,
                role: 'branch_admin',
                branchId: 1,
                displayName: 'Cairo Branch Admin',
                isActive: true,
                createdAt: new Date().toISOString(),
                lastLogin: null
            }
        ];
        await saveCollection('users', initialUsers);
        console.log('✅ Initialized default users');
        console.log('   ⚠️  Super Admin:', process.env.SUPER_ADMIN_USERNAME || 'superadmin', ' / change password on first login!');
        console.log('   ⚠️  Branch Admin:', process.env.BRANCH_ADMIN_USERNAME || 'branchadmin', ' / branchId=1');
    }

    const busSubscriptions = await getCollection('busSubscriptions');
    if (!Array.isArray(busSubscriptions) || busSubscriptions.length === 0) {
        const defaultBusRoutes = [
            { id: 1, route: 'Route A - Downtown', studentId: null, fee: 500, paid: 0, month: 'January', year: 2026, branchId: 1, createdAt: new Date().toISOString() },
            { id: 2, route: 'Route B - Suburbs', studentId: null, fee: 600, paid: 0, month: 'January', year: 2026, branchId: 1, createdAt: new Date().toISOString() },
            { id: 3, route: 'Route C - Airport Road', studentId: null, fee: 700, paid: 0, month: 'January', year: 2026, branchId: 2, createdAt: new Date().toISOString() }
        ];
        await saveCollection('busSubscriptions', defaultBusRoutes);
        console.log('✅ Initialized default bus routes');
    }

    const students = await getCollection('students');
    if (students.length > 0 && students[0].branchId === undefined) {
        const migrated = students.map(s => ({ ...s, branchId: s.branchId || 1 }));
        await saveCollection('students', migrated);
        console.log('✅ Migrated students with branchId');
    }

    const teachers = await getCollection('teachers');
    if (teachers.length > 0 && teachers[0].branchId === undefined) {
        const migrated = teachers.map(t => ({ ...t, branchId: t.branchId || 1 }));
        await saveCollection('teachers', migrated);
        console.log('✅ Migrated teachers with branchId');
    }

    const attendance = await getCollection('attendance');
    if (attendance.length > 0 && attendance[0].branchId === undefined) {
        const migrated = attendance.map(a => ({ ...a, branchId: a.branchId || 1 }));
        await saveCollection('attendance', migrated);
        console.log('✅ Migrated attendance with branchId');
    }

    const fees = await getCollection('fees');
    if (fees.length > 0 && fees[0].branchId === undefined) {
        const migrated = fees.map(f => ({ ...f, branchId: f.branchId || 1 }));
        await saveCollection('fees', migrated);
        console.log('✅ Migrated fees with branchId');
    }

    const busSub = await getCollection('busSubscriptions');
    if (busSub.length > 0 && busSub[0].branchId === undefined) {
        const migrated = busSub.map(b => ({ ...b, branchId: b.branchId || 1 }));
        await saveCollection('busSubscriptions', migrated);
        console.log('✅ Migrated busSubscriptions with branchId');
    }
}

function filteredByScope(data, scope) {
    if (!scope || scope === null) return data;
    return data.filter(item => String(item.branchId) === String(scope));
}

app.get('/login', (req, res) => {
    if (req.session && req.session.authenticated) {
        return res.redirect(req.session.role === 'teacher' ? '/teacher' : '/');
    }
    res.sendFile(path.join(__dirname, 'public', 'html', 'login.html'));
});

app.post('/login', loginLimiter, async (req, res) => {
    const username = sanitizeString(req.body.username || '', 50);
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password are required.' });
    }

    const users = await getCollection('users', { username, isActive: true });
    const user = users[0];

    if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    let ok = false;
    try {
        ok = await bcrypt.compare(password, user.password);
    } catch (e) {
        ok = false;
    }

    if (!ok) {
        return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    req.session.authenticated = true;
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;
    req.session.branchId = user.branchId;
    req.session.displayName = user.displayName || user.username;
    req.session.loginAt = new Date().toISOString();

    const now = new Date().toISOString();
    const allUsers = await getCollection('users');
    const idx = allUsers.findIndex(u => u.id === user.id);
    if (idx >= 0) {
        allUsers[idx].lastLogin = now;
        await saveCollection('users', allUsers);
    }

    const redirect = user.role === 'teacher' ? '/teacher' :
                     user.role === 'super_admin' ? '/master-control' : '/';
    res.json({ success: true, redirect, role: user.role, branchId: user.branchId });
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

app.get('/api/auth/me', (req, res) => {
    if (!req.session || !req.session.authenticated) {
        return res.status(401).json({ authenticated: false });
    }
    res.json({
        authenticated: true,
        username: req.session.username,
        role: req.session.role,
        branchId: req.session.branchId,
        displayName: req.session.displayName
    });
});

app.post('/api/auth/change-password', requireAuth(), async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }
    const users = await getCollection('users', { id: req.session.userId });
    const user = users[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });
    const hash = await bcrypt.hash(newPassword, 12);
    user.password = hash;
    const all = await getCollection('users');
    const idx = all.findIndex(u => u.id === user.id);
    if (idx >= 0) all[idx] = user;
    await saveCollection('users', all);
    res.json({ success: true });
});

app.use(requireAuth());
app.use(apiLimiter);
app.use(scopeByBranch);

app.get('/api/branches', async (req, res) => {
    const all = await getCollection('branches');
    if (req.branchScope === null) {
        res.json(all);
    } else {
        res.json(all.filter(b => String(b.id) === String(req.branchScope)));
    }
});

app.post('/api/branches', requireAuth('super_admin'), async (req, res) => {
    const name = sanitizeString(req.body.name, 100);
    const location = sanitizeString(req.body.location, 200);
    const branchCode = sanitizeString(req.body.branchCode, 50);
    const status = sanitizeString(req.body.status || 'active', 20);
    const adminUsername = req.body.admin ? sanitizeString(req.body.admin, 50) : '';
    const adminPassword = req.body.adminPassword ? String(req.body.adminPassword) : '';
    const adminDisplayName = sanitizeString(req.body.adminDisplayName || (adminUsername ? `${name} Admin` : ''), 100);

    if (!name) return res.status(400).json({ error: 'Branch name is required' });
    const all = await getCollection('branches');
    const nextId = all.reduce((m, b) => Math.max(m, Number(b.id) || 0), 0) + 1;
    const finalBranchCode = branchCode || `branch_${nextId}`;
    const newBranch = {
        id: nextId,
        name,
        location,
        branchCode: finalBranchCode,
        admin: adminUsername,
        status: ['active', 'inactive'].includes(status) ? status : 'active',
        createdAt: new Date().toISOString()
    };
    all.push(newBranch);
    await saveCollection('branches', all);

    if (adminUsername && adminPassword && adminPassword.length >= 8) {
        try {
            const existingUsers = await getCollection('users', { username: adminUsername });
            if (existingUsers.length === 0) {
                const hash = await bcrypt.hash(adminPassword, 12);
                const allUsers = await getCollection('users');
                allUsers.push({
                    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                    username: adminUsername,
                    password: hash,
                    role: 'branch_admin',
                    branchId: nextId,
                    displayName: adminDisplayName || `${name} Admin`,
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    lastLogin: null
                });
                await saveCollection('users', allUsers);
            } else {
                console.log(`[branches] user ${adminUsername} already exists, skipping auto-create`);
            }
        } catch (uErr) {
            console.error('[branches] auto-create user failed:', uErr.message);
        }
    }

    res.json({ success: true, branch: newBranch });
});

app.put('/api/branches/:id', requireAuth('super_admin'), async (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid branch id' });
    const all = await getCollection('branches');
    const idx = all.findIndex(b => Number(b.id) === id);
    if (idx < 0) return res.status(404).json({ error: 'Branch not found' });
    all[idx] = {
        ...all[idx],
        name: req.body.name ? sanitizeString(req.body.name, 100) : all[idx].name,
        location: req.body.location !== undefined ? sanitizeString(req.body.location, 200) : all[idx].location,
        branchCode: req.body.branchCode ? sanitizeString(req.body.branchCode, 50) : all[idx].branchCode,
        admin: req.body.admin !== undefined ? sanitizeString(req.body.admin, 50) : all[idx].admin,
        status: req.body.status ? (['active', 'inactive'].includes(req.body.status) ? req.body.status : all[idx].status) : all[idx].status,
        updatedAt: new Date().toISOString()
    };
    await saveCollection('branches', all);

    try {
        if (req.body.admin) {
            const newAdminUsername = sanitizeString(req.body.admin, 50);
            const newAdminPassword = req.body.adminPassword ? String(req.body.adminPassword) : '';
            const allUsers = await getCollection('users');
            let userIdx = allUsers.findIndex(u =>
                String(u.branchId) === String(id) && u.role === 'branch_admin'
            );
            if (userIdx < 0) {
                userIdx = allUsers.findIndex(u => u.username === newAdminUsername);
            }
            if (userIdx < 0 && newAdminPassword && newAdminPassword.length >= 8) {
                const hash = await bcrypt.hash(newAdminPassword, 12);
                allUsers.push({
                    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                    username: newAdminUsername,
                    password: hash,
                    role: 'branch_admin',
                    branchId: id,
                    displayName: `${all[idx].name} Admin`,
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    lastLogin: null
                });
                await saveCollection('users', allUsers);
            } else if (userIdx >= 0) {
                if (newAdminUsername && allUsers[userIdx].username !== newAdminUsername) {
                    allUsers[userIdx].username = newAdminUsername;
                }
                if (newAdminPassword && newAdminPassword.length >= 8) {
                    allUsers[userIdx].password = await bcrypt.hash(newAdminPassword, 12);
                }
                allUsers[userIdx].updatedAt = new Date().toISOString();
                await saveCollection('users', allUsers);
            }
        }
    } catch (uErr) {
        console.error('[branches PUT] admin user update failed:', uErr.message);
    }

    res.json({ success: true, branch: all[idx] });
});

app.delete('/api/branches/:id', requireAuth('super_admin'), async (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid branch id' });
    await removeFromCollection('branches', { id });
    try {
        const allUsers = await getCollection('users');
        const remaining = allUsers.filter(u => !(u.role === 'branch_admin' && String(u.branchId) === String(id)));
        await saveCollection('users', remaining);
    } catch (e) { console.error('Delete branch admin user cleanup failed:', e.message); }
    res.json({ success: true });
});

app.get('/api/users', requireAnyRole(['super_admin', 'branch_admin']), async (req, res) => {
    const users = await getCollection('users');
    let data = users.map(({ password, ...rest }) => rest);
    if (req.branchScope !== null) {
        data = data.filter(u =>
            u.branchId !== null &&
            String(u.branchId) === String(req.branchScope)
        );
    }
    res.json(data);
});

app.post('/api/users', requireAnyRole(['super_admin', 'branch_admin']), async (req, res) => {
    const username = sanitizeString(req.body.username, 50);
    const password = req.body.password ? String(req.body.password) : '';
    const role = isValidRole(req.body.role) ? req.body.role : 'teacher';
    const branchId = Number(req.body.branchId) || null;
    const displayName = sanitizeString(req.body.displayName || req.body.username, 100);

    if (!username || password.length < 8) {
        return res.status(400).json({ error: 'Username and password (min 8 chars) required.' });
    }

    if (req.session.role === 'branch_admin') {
        if (role === 'super_admin') return res.status(403).json({ error: 'Cannot create super_admin' });
        if (branchId !== null && String(branchId) !== String(req.session.branchId)) {
            return res.status(403).json({ error: 'Branch admin can only create users for own branch.' });
        }
        if (branchId === null) return res.status(400).json({ error: 'branchId required.' });
    }

    const existing = await getCollection('users', { username });
    if (existing.length > 0) return res.status(409).json({ error: 'Username already exists.' });

    const hash = await bcrypt.hash(password, 12);
    const all = await getCollection('users');
    const newUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        username,
        password: hash,
        role,
        branchId: (role === 'super_admin') ? null : (branchId || req.session.branchId || null),
        displayName,
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: null
    };
    all.push(newUser);
    await saveCollection('users', all);
    const { password: _, ...safe } = newUser;
    res.json({ success: true, user: safe });
});

app.put('/api/users/:id', requireAnyRole(['super_admin', 'branch_admin']), async (req, res) => {
    const id = String(req.params.id);
    const all = await getCollection('users');
    const idx = all.findIndex(u => String(u.id) === id);
    if (idx < 0) return res.status(404).json({ error: 'User not found' });

    if (req.session.role === 'branch_admin') {
        if (String(all[idx].branchId) !== String(req.session.branchId)) {
            return res.status(403).json({ error: 'Cannot modify user outside your branch.' });
        }
        if (req.body.role === 'super_admin' || (req.body.branchId !== undefined && String(req.body.branchId) !== String(req.session.branchId))) {
            return res.status(403).json({ error: 'Invalid permission change.' });
        }
    }

    if (req.body.username) all[idx].username = sanitizeString(req.body.username, 50);
    if (req.body.role && isValidRole(req.body.role)) all[idx].role = req.body.role;
    if (req.body.branchId !== undefined) all[idx].branchId = Number(req.body.branchId) || null;
    if (req.body.displayName !== undefined) all[idx].displayName = sanitizeString(req.body.displayName, 100);
    if (req.body.isActive !== undefined) all[idx].isActive = !!req.body.isActive;
    if (req.body.password && String(req.body.password).length >= 8) {
        all[idx].password = await bcrypt.hash(String(req.body.password), 12);
    }
    all[idx].updatedAt = new Date().toISOString();

    await saveCollection('users', all);
    const { password: _, ...safe } = all[idx];
    res.json({ success: true, user: safe });
});

app.delete('/api/users/:id', requireAnyRole(['super_admin', 'branch_admin']), async (req, res) => {
    const id = String(req.params.id);
    const all = await getCollection('users');
    const target = all.find(u => String(u.id) === id);
    if (!target) return res.status(404).json({ error: 'User not found' });

    if (req.session.role === 'branch_admin' && String(target.branchId) !== String(req.session.branchId)) {
        return res.status(403).json({ error: 'Cannot delete user outside your branch.' });
    }
    if (String(target.id) === String(req.session.userId)) {
        return res.status(400).json({ error: 'Cannot delete your own account.' });
    }
    await removeFromCollection('users', { id });
    res.json({ success: true });
});

app.get('/api/data', async (req, res) => {
    try {
        const students = filteredByScope(await getCollection('students'), req.branchScope);
        const teachers = filteredByScope(await getCollection('teachers'), req.branchScope);
        const attendance = filteredByScope(await getCollection('attendance'), req.branchScope);
        const teacherAttendance = filteredByScope(await getCollection('teacherAttendance'), req.branchScope);
        const fees = filteredByScope(await getCollection('fees'), req.branchScope);
        const busSubscriptions = filteredByScope(await getCollection('busSubscriptions'), req.branchScope);
        const teacherSalaries = filteredByScope(await getCollection('teacherSalaries'), req.branchScope);
        const branches = req.branchScope === null ? await getCollection('branches') : (await getCollection('branches')).filter(b => String(b.id) === String(req.branchScope));
        res.json({ students, teachers, attendance, teacherAttendance, fees, busSubscriptions, teacherSalaries, branches, currentBranchId: req.branchScope });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load data' });
    }
});

app.get('/api/students', async (req, res) => {
    res.json(filteredByScope(await getCollection('students'), req.branchScope));
});

app.post('/api/students', async (req, res) => {
    const all = await getCollection('students');
    const body = req.body;
    const branchId = req.branchScope || Number(body.branchId) || 1;
    const nextId = all.reduce((m, s) => Math.max(m, Number(s.id) || 0), 0) + 1;
    const record = {
        id: nextId,
        name: sanitizeString(body.name, 150),
        class: sanitizeString(body.class, 50),
        phone: sanitizeString(body.phone, 100),
        busSubscriber: !!body.busSubscriber,
        branchId: Number(branchId),
        createdAt: new Date().toISOString()
    };
    all.push(record);
    await saveCollection('students', all);
    res.json({ success: true, data: record });
});

app.put('/api/students/:id', async (req, res) => {
    const id = Number(req.params.id);
    const all = await getCollection('students');
    const idx = all.findIndex(s => Number(s.id) === id);
    if (idx < 0) return res.status(404).json({ error: 'Not found' });
    if (req.branchScope !== null && String(all[idx].branchId) !== String(req.branchScope)) {
        return res.status(403).json({ error: 'Not your branch' });
    }
    const body = req.body;
    all[idx] = {
        ...all[idx],
        name: body.name ? sanitizeString(body.name, 150) : all[idx].name,
        class: body.class !== undefined ? sanitizeString(body.class, 50) : all[idx].class,
        phone: body.phone !== undefined ? sanitizeString(body.phone, 100) : all[idx].phone,
        busSubscriber: body.busSubscriber !== undefined ? !!body.busSubscriber : all[idx].busSubscriber,
        updatedAt: new Date().toISOString()
    };
    await saveCollection('students', all);
    res.json({ success: true, data: all[idx] });
});

app.delete('/api/students/:id', async (req, res) => {
    const id = Number(req.params.id);
    const all = await getCollection('students');
    const idx = all.findIndex(s => Number(s.id) === id);
    if (idx < 0) return res.status(404).json({ error: 'Not found' });
    if (req.branchScope !== null && String(all[idx].branchId) !== String(req.branchScope)) {
        return res.status(403).json({ error: 'Not your branch' });
    }
    all.splice(idx, 1);
    await saveCollection('students', all);
    res.json({ success: true });
});

app.get('/api/teachers', async (req, res) => {
    res.json(filteredByScope(await getCollection('teachers'), req.branchScope));
});

app.post('/api/teachers', requireAnyRole(['super_admin', 'branch_admin']), async (req, res) => {
    const all = await getCollection('teachers');
    const body = req.body;
    const branchId = req.branchScope || Number(body.branchId) || 1;
    const nextId = all.reduce((m, s) => Math.max(m, Number(s.id) || 0), 0) + 1;
    const record = {
        id: nextId,
        name: sanitizeString(body.name, 150),
        subject: sanitizeString(body.subject, 100),
        classes: sanitizeString(body.classes, 200),
        phone: sanitizeString(body.phone, 100),
        salary: Number(body.salary) || 0,
        branchId: Number(branchId),
        createdAt: new Date().toISOString()
    };
    all.push(record);
    await saveCollection('teachers', all);
    res.json({ success: true, data: record });
});

app.put('/api/teachers/:id', requireAnyRole(['super_admin', 'branch_admin']), async (req, res) => {
    const id = Number(req.params.id);
    const all = await getCollection('teachers');
    const idx = all.findIndex(t => Number(t.id) === id);
    if (idx < 0) return res.status(404).json({ error: 'Not found' });
    if (req.branchScope !== null && String(all[idx].branchId) !== String(req.branchScope)) {
        return res.status(403).json({ error: 'Not your branch' });
    }
    const body = req.body;
    all[idx] = {
        ...all[idx],
        name: body.name ? sanitizeString(body.name, 150) : all[idx].name,
        subject: body.subject !== undefined ? sanitizeString(body.subject, 100) : all[idx].subject,
        classes: body.classes !== undefined ? sanitizeString(body.classes, 200) : all[idx].classes,
        phone: body.phone !== undefined ? sanitizeString(body.phone, 100) : all[idx].phone,
        salary: body.salary !== undefined ? (Number(body.salary) || 0) : all[idx].salary,
        updatedAt: new Date().toISOString()
    };
    await saveCollection('teachers', all);
    res.json({ success: true, data: all[idx] });
});

app.delete('/api/teachers/:id', requireAnyRole(['super_admin', 'branch_admin']), async (req, res) => {
    const id = Number(req.params.id);
    const all = await getCollection('teachers');
    const idx = all.findIndex(t => Number(t.id) === id);
    if (idx < 0) return res.status(404).json({ error: 'Not found' });
    if (req.branchScope !== null && String(all[idx].branchId) !== String(req.branchScope)) {
        return res.status(403).json({ error: 'Not your branch' });
    }
    all.splice(idx, 1);
    await saveCollection('teachers', all);
    res.json({ success: true });
});

app.get('/api/attendance', async (req, res) => {
    res.json(filteredByScope(await getCollection('attendance'), req.branchScope));
});

app.post('/api/attendance', async (req, res) => {
    const all = await getCollection('attendance');
    const body = req.body;
    const branchId = req.branchScope || Number(body.branchId) || 1;
    const record = {
        id: body.id || `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        studentId: Number(body.studentId),
        date: sanitizeString(body.date, 30),
        status: ['present', 'absent', 'late'].includes(body.status) ? body.status : 'present',
        notes: sanitizeString(body.notes || '', 250),
        branchId: Number(branchId),
        createdAt: new Date().toISOString()
    };
    const existing = all.findIndex(a => String(a.id) === String(record.id));
    if (existing >= 0) all[existing] = record;
    else all.push(record);
    await saveCollection('attendance', all);
    res.json({ success: true, data: record });
});

app.post('/api/attendance/batch', async (req, res) => {
    const all = await getCollection('attendance');
    const records = Array.isArray(req.body.records) ? req.body.records : [];
    const branchId = req.branchScope || Number(req.body.branchId) || 1;
    const now = new Date().toISOString();
    const added = [];
    for (const body of records) {
        const r = {
            id: body.id || `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            studentId: Number(body.studentId),
            date: sanitizeString(body.date, 30),
            status: ['present', 'absent', 'late'].includes(body.status) ? body.status : 'present',
            notes: sanitizeString(body.notes || '', 250),
            branchId: Number(body.branchId || branchId),
            createdAt: now
        };
        const idx = all.findIndex(a => String(a.id) === String(r.id) || (Number(a.studentId) === Number(r.studentId) && a.date === r.date && String(a.branchId) === String(r.branchId)));
        if (idx >= 0) all[idx] = { ...all[idx], ...r, id: all[idx].id };
        else all.push(r);
        added.push(r);
    }
    await saveCollection('attendance', all);
    res.json({ success: true, count: added.length });
});

app.delete('/api/attendance/:id', requireAnyRole(['super_admin', 'branch_admin']), async (req, res) => {
    const id = String(req.params.id);
    const all = await getCollection('attendance');
    const idx = all.findIndex(a => String(a.id) === id);
    if (idx < 0) return res.status(404).json({ error: 'Not found' });
    if (req.branchScope !== null && String(all[idx].branchId) !== String(req.branchScope)) {
        return res.status(403).json({ error: 'Not your branch' });
    }
    all.splice(idx, 1);
    await saveCollection('attendance', all);
    res.json({ success: true });
});

// Teacher Attendance API
app.get('/api/teacher-attendance', async (req, res) => {
    res.json(filteredByScope(await getCollection('teacherAttendance'), req.branchScope));
});

app.post('/api/teacher-attendance', async (req, res) => {
    const all = await getCollection('teacherAttendance');
    const body = req.body;
    const branchId = req.branchScope || Number(body.branchId) || 1;
    const nextId = all.reduce((m, s) => Math.max(m, Number(s.id) || 0), 0) + 1;
    const record = {
        id: nextId,
        teacherId: Number(body.teacherId),
        date: sanitizeString(body.date, 30),
        status: ['present', 'absent', 'late', 'half-day'].includes(body.status) ? body.status : 'present',
        checkIn: sanitizeString(body.checkIn || '', 10),
        checkOut: sanitizeString(body.checkOut || '', 10),
        notes: sanitizeString(body.notes || '', 250),
        branchId: Number(body.branchId || branchId),
        createdAt: new Date().toISOString()
    };
    all.push(record);
    await saveCollection('teacherAttendance', all);
    res.json({ success: true, data: record });
});

app.put('/api/teacher-attendance/:id', async (req, res) => {
    const id = Number(req.params.id);
    const all = await getCollection('teacherAttendance');
    const idx = all.findIndex(a => Number(a.id) === id);
    if (idx < 0) return res.status(404).json({ error: 'Not found' });
    if (req.branchScope !== null && String(all[idx].branchId) !== String(req.branchScope)) {
        return res.status(403).json({ error: 'Not your branch' });
    }
    const body = req.body;
    all[idx] = {
        ...all[idx],
        date: body.date !== undefined ? sanitizeString(body.date, 30) : all[idx].date,
        status: body.status !== undefined && ['present', 'absent', 'late', 'half-day'].includes(body.status) ? body.status : all[idx].status,
        checkIn: body.checkIn !== undefined ? sanitizeString(body.checkIn, 10) : all[idx].checkIn,
        checkOut: body.checkOut !== undefined ? sanitizeString(body.checkOut, 10) : all[idx].checkOut,
        notes: body.notes !== undefined ? sanitizeString(body.notes, 250) : all[idx].notes,
        updatedAt: new Date().toISOString()
    };
    await saveCollection('teacherAttendance', all);
    res.json({ success: true, data: all[idx] });
});

app.delete('/api/teacher-attendance/:id', requireAnyRole(['super_admin', 'branch_admin']), async (req, res) => {
    const id = Number(req.params.id);
    const all = await getCollection('teacherAttendance');
    const idx = all.findIndex(a => Number(a.id) === id);
    if (idx < 0) return res.status(404).json({ error: 'Not found' });
    if (req.branchScope !== null && String(all[idx].branchId) !== String(req.branchScope)) {
        return res.status(403).json({ error: 'Not your branch' });
    }
    all.splice(idx, 1);
    await saveCollection('teacherAttendance', all);
    res.json({ success: true });
});

// Teacher Salaries API
app.get('/api/teacher-salaries', async (req, res) => {
    res.json(filteredByScope(await getCollection('teacherSalaries'), req.branchScope));
});

app.post('/api/teacher-salaries', async (req, res) => {
    const all = await getCollection('teacherSalaries');
    const body = req.body;
    const branchId = req.branchScope || Number(body.branchId) || 1;
    const nextId = all.reduce((m, s) => Math.max(m, Number(s.id) || 0), 0) + 1;
    const record = {
        id: nextId,
        teacherId: Number(body.teacherId),
        baseSalary: Number(body.baseSalary) || 0,
        bonus: Number(body.bonus) || 0,
        deductions: Number(body.deductions) || 0,
        totalSalary: (Number(body.baseSalary) || 0) + (Number(body.bonus) || 0) - (Number(body.deductions) || 0),
        month: sanitizeString(body.month, 20),
        year: Number(body.year) || new Date().getFullYear(),
        paymentStatus: ['pending', 'paid', 'partial'].includes(body.paymentStatus) ? body.paymentStatus : 'pending',
        paymentDate: body.paymentDate ? sanitizeString(body.paymentDate, 30) : null,
        notes: sanitizeString(body.notes || '', 250),
        branchId: Number(body.branchId || branchId),
        createdAt: new Date().toISOString()
    };
    all.push(record);
    await saveCollection('teacherSalaries', all);
    res.json({ success: true, data: record });
});

app.put('/api/teacher-salaries/:id', async (req, res) => {
    const id = Number(req.params.id);
    const all = await getCollection('teacherSalaries');
    const idx = all.findIndex(s => Number(s.id) === id);
    if (idx < 0) return res.status(404).json({ error: 'Not found' });
    if (req.branchScope !== null && String(all[idx].branchId) !== String(req.branchScope)) {
        return res.status(403).json({ error: 'Not your branch' });
    }
    const body = req.body;
    const baseSalary = body.baseSalary !== undefined ? Number(body.baseSalary) : all[idx].baseSalary;
    const bonus = body.bonus !== undefined ? Number(body.bonus) : all[idx].bonus;
    const deductions = body.deductions !== undefined ? Number(body.deductions) : all[idx].deductions;
    all[idx] = {
        ...all[idx],
        baseSalary,
        bonus,
        deductions,
        totalSalary: baseSalary + bonus - deductions,
        month: body.month !== undefined ? sanitizeString(body.month, 20) : all[idx].month,
        year: body.year !== undefined ? Number(body.year) : all[idx].year,
        paymentStatus: body.paymentStatus !== undefined && ['pending', 'paid', 'partial'].includes(body.paymentStatus) ? body.paymentStatus : all[idx].paymentStatus,
        paymentDate: body.paymentDate !== undefined ? sanitizeString(body.paymentDate, 30) : all[idx].paymentDate,
        notes: body.notes !== undefined ? sanitizeString(body.notes, 250) : all[idx].notes,
        updatedAt: new Date().toISOString()
    };
    await saveCollection('teacherSalaries', all);
    res.json({ success: true, data: all[idx] });
});

app.delete('/api/teacher-salaries/:id', requireAnyRole(['super_admin', 'branch_admin']), async (req, res) => {
    const id = Number(req.params.id);
    const all = await getCollection('teacherSalaries');
    const idx = all.findIndex(s => Number(s.id) === id);
    if (idx < 0) return res.status(404).json({ error: 'Not found' });
    if (req.branchScope !== null && String(all[idx].branchId) !== String(req.branchScope)) {
        return res.status(403).json({ error: 'Not your branch' });
    }
    all.splice(idx, 1);
    await saveCollection('teacherSalaries', all);
    res.json({ success: true });
});

app.get('/api/fees', async (req, res) => {
    res.json(filteredByScope(await getCollection('fees'), req.branchScope));
});

app.post('/api/fees', async (req, res) => {
    const all = await getCollection('fees');
    const body = req.body;
    const branchId = req.branchScope || Number(body.branchId) || 1;
    const nextId = all.reduce((m, s) => Math.max(m, Number(s.id) || 0), 0) + 1;
    const record = {
        id: nextId,
        studentId: Number(body.studentId),
        month: sanitizeString(body.month, 20),
        year: Number(body.year) || new Date().getFullYear(),
        amount: Number(body.amount) || 0,
        paid: Number(body.paid) || 0,
        status: sanitizeString(body.status || 'unpaid', 20),
        branchId: Number(branchId),
        createdAt: new Date().toISOString()
    };
    all.push(record);
    await saveCollection('fees', all);
    res.json({ success: true, data: record });
});

app.put('/api/fees/:id', async (req, res) => {
    const id = Number(req.params.id);
    const all = await getCollection('fees');
    const idx = all.findIndex(f => Number(f.id) === id);
    if (idx < 0) return res.status(404).json({ error: 'Not found' });
    if (req.branchScope !== null && String(all[idx].branchId) !== String(req.branchScope)) {
        return res.status(403).json({ error: 'Not your branch' });
    }
    const body = req.body;
    all[idx] = {
        ...all[idx],
        month: body.month ? sanitizeString(body.month, 20) : all[idx].month,
        year: body.year !== undefined ? (Number(body.year) || all[idx].year) : all[idx].year,
        amount: body.amount !== undefined ? (Number(body.amount) || 0) : all[idx].amount,
        paid: body.paid !== undefined ? (Number(body.paid) || 0) : all[idx].paid,
        status: body.status ? sanitizeString(body.status, 20) : all[idx].status,
        updatedAt: new Date().toISOString()
    };
    await saveCollection('fees', all);
    res.json({ success: true, data: all[idx] });
});

app.delete('/api/fees/:id', requireAnyRole(['super_admin', 'branch_admin']), async (req, res) => {
    const id = Number(req.params.id);
    const all = await getCollection('fees');
    const idx = all.findIndex(f => Number(f.id) === id);
    if (idx < 0) return res.status(404).json({ error: 'Not found' });
    if (req.branchScope !== null && String(all[idx].branchId) !== String(req.branchScope)) {
        return res.status(403).json({ error: 'Not your branch' });
    }
    all.splice(idx, 1);
    await saveCollection('fees', all);
    res.json({ success: true });
});

app.get('/api/bus', async (req, res) => {
    res.json(filteredByScope(await getCollection('busSubscriptions'), req.branchScope));
});

app.post('/api/bus', async (req, res) => {
    const all = await getCollection('busSubscriptions');
    const body = req.body;
    const branchId = req.branchScope || Number(body.branchId) || 1;
    const nextId = all.reduce((m, s) => Math.max(m, Number(s.id) || 0), 0) + 1;
    const record = {
        id: nextId,
        studentId: Number(body.studentId),
        route: sanitizeString(body.route, 150),
        fee: Number(body.fee) || 0,
        paid: Number(body.paid) || 0,
        month: sanitizeString(body.month, 20),
        year: Number(body.year) || new Date().getFullYear(),
        branchId: Number(branchId),
        createdAt: new Date().toISOString()
    };
    all.push(record);
    await saveCollection('busSubscriptions', all);
    res.json({ success: true, data: record });
});

app.put('/api/bus/:id', async (req, res) => {
    const id = Number(req.params.id);
    const all = await getCollection('busSubscriptions');
    const idx = all.findIndex(b => Number(b.id) === id);
    if (idx < 0) return res.status(404).json({ error: 'Not found' });
    if (req.branchScope !== null && String(all[idx].branchId) !== String(req.branchScope)) {
        return res.status(403).json({ error: 'Not your branch' });
    }
    const body = req.body;
    all[idx] = {
        ...all[idx],
        route: body.route !== undefined ? sanitizeString(body.route, 150) : all[idx].route,
        fee: body.fee !== undefined ? (Number(body.fee) || 0) : all[idx].fee,
        paid: body.paid !== undefined ? (Number(body.paid) || 0) : all[idx].paid,
        month: body.month ? sanitizeString(body.month, 20) : all[idx].month,
        year: body.year !== undefined ? (Number(body.year) || all[idx].year) : all[idx].year,
        updatedAt: new Date().toISOString()
    };
    await saveCollection('busSubscriptions', all);
    res.json({ success: true, data: all[idx] });
});

app.delete('/api/bus/:id', requireAnyRole(['super_admin', 'branch_admin']), async (req, res) => {
    const id = Number(req.params.id);
    const all = await getCollection('busSubscriptions');
    const idx = all.findIndex(b => Number(b.id) === id);
    if (idx < 0) return res.status(404).json({ error: 'Not found' });
    if (req.branchScope !== null && String(all[idx].branchId) !== String(req.branchScope)) {
        return res.status(403).json({ error: 'Not your branch' });
    }
    all.splice(idx, 1);
    await saveCollection('busSubscriptions', all);
    res.json({ success: true });
});

app.post('/api/save', requireAnyRole(['super_admin', 'branch_admin']), async (req, res) => {
    try {
        const { type, data } = req.body;
        const validTypes = ['students', 'attendance', 'bus', 'fees', 'teachers', 'branches', 'teacher-attendance', 'teacher-salaries'];
        if (!validTypes.includes(type)) return res.status(400).json({ error: 'Invalid type' });
        const colNameMap = {
            'bus': 'busSubscriptions',
            'teacher-attendance': 'teacherAttendance',
            'teacher-salaries': 'teacherSalaries'
        };
        const colName = colNameMap[type] || type;
        const raw = Array.isArray(data) ? data : [];
        const scoped = req.branchScope === null ? raw : raw.map(item => ({ ...item, branchId: req.branchScope }));
        await saveCollection(colName, scoped);
        res.json({ success: true });
    } catch (error) {
        console.error('Error in /api/save:', error);
        res.status(500).json({ error: 'Failed to save data', details: error.message });
    }
});

app.post('/api/admin/seed-from-json', requireAuth('super_admin'), async (req, res) => {
    try {
        const force = req.body && req.body.force === true;
        const fs = require('fs');
        const dataDir = path.join(__dirname, 'data');
        const specs = {
            branches:         { file: 'branches.json',         unique: ['id', 'branchCode'] },
            users:            { file: 'users.json',            unique: ['username'] },
            students:         { file: 'students.json',         indexed: ['branchId', 'class'] },
            teachers:         { file: 'teachers.json',         indexed: ['branchId', 'subject'] },
            attendance:       { file: 'attendance.json',       indexed: ['branchId', 'date', 'studentId'] },
            fees:             { file: 'fees.json',             indexed: ['branchId', 'studentId', 'month', 'year'] },
            busSubscriptions: { file: 'busSubscriptions.json', indexed: ['branchId', 'studentId'] }
        };
        const results = [];
        const col = db;
        for (const [name, spec] of Object.entries(specs)) {
            const fp = path.join(dataDir, spec.file);
            const entry = { collection: name, file: spec.file, inserted: 0, duplicates: 0, errors: 0, skipped: 0 };
            if (!fs.existsSync(fp)) { entry.skipped = 1; results.push(entry); continue; }
            let docs = [];
            try {
                const raw = fs.readFileSync(fp, 'utf8').trim();
                docs = raw ? JSON.parse(raw) : [];
            } catch (e) {
                entry.errors = 1; entry.error = 'parse: ' + e.message; results.push(entry); continue;
            }
            if (!Array.isArray(docs) || docs.length === 0) { results.push(entry); continue; }
            try {
                const isEmpty = await (async () => {
                    if (col) return (await col.collection(name).estimatedDocumentCount()) === 0;
                    const existing = await getCollection(name);
                    return !existing || existing.length === 0;
                })();
                if (!isEmpty && !force) { entry.skipped = 1; entry.note = 'collection not empty (use ?force to overwrite)'; results.push(entry); continue; }
                if (col) {
                    const target = col.collection(name);
                    if (spec.unique) for (const f of spec.unique) try { await target.createIndex({ [f]: 1 }, { unique: true }); } catch (_) {}
                    if (spec.indexed) for (const f of spec.indexed) try { await target.createIndex({ [f]: 1 }); } catch (_) {}
                    if (force) { try { await target.drop(); } catch(_) {} }
                    try {
                        const r = await target.insertMany(docs, { ordered: !spec.unique || spec.unique.length === 0 });
                        entry.inserted = r.insertedCount || 0;
                    } catch (e) {
                        if (spec.unique && e.code === 11000 && Array.isArray(e.writeErrors)) {
                            entry.duplicates = e.writeErrors.filter(w => w.code === 11000).length;
                            entry.errors = e.writeErrors.length - entry.duplicates;
                            entry.inserted = (e.result && e.result.nInserted) || 0;
                        } else { throw e; }
                    }
                } else {
                    let existing = (await getCollection(name)) || [];
                    if (force) existing = [];
                    if (existing.length === 0) {
                        await saveCollection(name, docs);
                        entry.inserted = docs.length;
                    } else {
                        entry.skipped = 1;
                        entry.note = 'json-file mode: collection already has data, force not used';
                    }
                }
            } catch (e2) {
                entry.errors = entry.errors || 1;
                entry.error = String(e2.message || e2).slice(0, 200);
            }
            results.push(entry);
        }
        res.json({ success: true, storage: db ? 'MongoDB' : 'JSON', results });
    } catch (e) {
        console.error('[seed-from-json]', e);
        res.status(500).json({ error: e.message || 'Seeding failed' });
    }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    if (!req.session || !req.session.authenticated) return res.redirect('/login');
    const role = req.session.role;
    if (role === 'super_admin') return res.redirect('/master-control');
    if (role === 'teacher') return res.redirect('/teacher');
    res.sendFile(path.join(__dirname, 'public', 'html', 'index.html'));
});

app.get('/master-control', requireAuth('super_admin'), (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'master-control.html'));
});

app.get('/branch-admin', requireAnyRole(['super_admin', 'branch_admin']), (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'branch-admin.html'));
});

app.get('/teacher', requireAnyRole(['super_admin', 'branch_admin', 'teacher']), (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'teacher.html'));
});

app.use((err, req, res, next) => {
    console.error('[SERVER ERROR]', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
    if (req.accepts('html')) {
        if (!req.session || !req.session.authenticated) return res.redirect('/login');
        return res.status(404).send('404 Not Found');
    }
    res.status(404).json({ error: 'Not found' });
});

async function boot() {
    const connected = await connectToMongoDB();
    await initializeDefaults();
    const shouldListen = !process.env.VERCEL && require.main === module;
    if (shouldListen) {
        app.listen(PORT, () => {
            const storageLabel = db
                ? `MongoDB (${db.databaseName})`
                : `Local JSON files (${path.relative(process.cwd(), DATA_DIR) || 'data'}/)`;
            console.log('');
            console.log('========================================');
            console.log('   Seeds Palestine Schools - Server');
            console.log('========================================');
            console.log(`🌐 Mode       : ${NODE_ENV}`);
            console.log(`🚀 URL        : http://localhost:${PORT}`);
            console.log(`🗄️  Storage    : ${storageLabel}`);
            if (MONGODB_URI && !db) console.log(`   ⚠️  (MONGODB_URI was set but connection failed — see error above)`);
            console.log(`🔒 TLS proxy  : ${cookieSecure ? 'Expected (trust proxy ON)' : 'Disabled'}`);
            console.log('');
            console.log('🛡️  Security layers active:');
            console.log('   ✅ Helmet CSP / HSTS / Frameguard');
            console.log('   ✅ httpOnly + SameSite session cookies');
            console.log('   ✅ Bcrypt password hashing');
            console.log('   ✅ Login rate limiting');
            console.log('   ✅ Role-based access control');
            console.log('   ✅ Branch-level data scoping');
            console.log('   ✅ Input sanitization');
            console.log('');
            console.log('👤 Default accounts (change passwords on first login!):');
            console.log('   Super Admin  :', process.env.SUPER_ADMIN_USERNAME || 'superadmin');
            console.log('   Branch Admin :', process.env.BRANCH_ADMIN_USERNAME || 'branchadmin', '(branchId=1)');
            console.log('');
            console.log('💾 Migration tip: Run `node migrate-files-to-mongodb.js` to import JSON into MongoDB.');
            console.log('');
        });
    } else {
        const storageLabel = db ? `MongoDB (${db.databaseName})` : `JSON files`;
        console.log(`✅ Server handler ready (storage: ${storageLabel})`);
    }
    return app;
}

const IS_VERCEL_HANDLER = !!process.env.VERCEL || !!process.env.NOW_BUILDER;
let bootPromise;

if (!IS_VERCEL_HANDLER && require.main === module) {
    boot().catch(err => {
        console.error('Boot failed:', err);
        process.exit(1);
    });
} else {
    bootPromise = boot().catch(err => console.error('Handler boot warning:', err));
}

// Export for Vercel with boot completion
module.exports = async (req, res) => {
    if (bootPromise) {
        await bootPromise;
    }
    return app(req, res);
};
