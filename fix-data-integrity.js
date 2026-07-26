require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const readJSON = (name, fallback = []) => {
    const fp = path.join(DATA_DIR, `${name}.json`);
    try {
        if (fs.existsSync(fp)) {
            const raw = fs.readFileSync(fp, 'utf8');
            return raw.trim() ? JSON.parse(raw) : fallback;
        }
    } catch (_) {}
    return fallback;
};

const writeJSON = (name, data) => {
    const fp = path.join(DATA_DIR, `${name}.json`);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2));
    console.log(`  ✅ Saved ${fp}`);
    return true;
};

async function fixBranches() {
    console.log('🔧 Fixing branches...');
    const branches = readJSON('branches', []);
    const hasBranch1 = branches.some(b => Number(b.id) === 1);
    if (!hasBranch1) {
        const cairo = {
            id: 1,
            name: 'Cairo Main Branch',
            location: 'Nasr City, Cairo',
            admin: 'branchadmin',
            branchCode: 'cairo',
            status: 'active',
            createdAt: new Date().toISOString()
        };
        branches.unshift(cairo);
        console.log('  ➕ Added Cairo Main Branch (id=1)');
    }
    const fixed = branches.map(b => ({
        id: Number(b.id),
        name: b.name || `Branch ${b.id}`,
        location: b.location || '',
        branchCode: b.branchCode || `branch_${b.id}`,
        admin: b.admin || '',
        status: b.status || 'active',
        students: typeof b.students === 'number' ? b.students : undefined,
        revenue: typeof b.revenue === 'number' ? b.revenue : undefined,
        teachers: typeof b.teachers === 'number' ? b.teachers : undefined,
        createdAt: b.createdAt || new Date().toISOString(),
        updatedAt: b.updatedAt
    })).filter(b => b.id > 0);
    writeJSON('branches', fixed);
    console.log(`  📊 ${fixed.length} branches total`);
    return fixed;
}

async function fixStudents() {
    console.log('🔧 Fixing students (adding branchId)...');
    let students = readJSON('students', []);
    const rootFp = path.join(__dirname, 'students.json');
    if ((!students || students.length === 0) && fs.existsSync(rootFp)) {
        try {
            const raw = fs.readFileSync(rootFp, 'utf8');
            if (raw.trim()) {
                students = JSON.parse(raw);
                console.log(`  📥 Loaded ${students.length} students from root students.json`);
            }
        } catch (e) {
            console.log('  ⚠️  Failed to read root students.json:', e.message);
        }
    }
    let changed = 0;
    const fixed = students.map(s => {
        const ns = { ...s };
        ns.id = Number(ns.id) || ns.id;
        if (!ns.branchId) {
            ns.branchId = 1;
            changed++;
        } else {
            ns.branchId = Number(ns.branchId);
        }
        if (ns.busSubscriber === undefined) ns.busSubscriber = false;
        if (ns.isImported === undefined) ns.isImported = false;
        return ns;
    });
    writeJSON('students', fixed);
    console.log(`  📊 ${fixed.length} students total (${changed} got branchId=1)`);
    return fixed;
}

async function fixTeachers() {
    console.log('🔧 Fixing teachers & syncing teacher logins to users...');
    const teachers = readJSON('teachers', []);
    const users = readJSON('users', []);
    const saltRounds = 12;
    const plaintextPasswords = {};
    let teacherChanged = 0;
    const fixedTeachers = teachers.map(t => {
        const nt = { ...t };
        nt.id = Number(nt.id) || nt.id;
        if (!nt.branchId) {
            nt.branchId = 1;
            teacherChanged++;
        } else {
            nt.branchId = Number(nt.branchId);
        }
        if (nt.username && nt.password && typeof nt.password === 'string' && nt.password.length < 30) {
            plaintextPasswords[nt.username] = nt.password;
            nt.password = '[removed - see users.json]';
            teacherChanged++;
        }
        return nt;
    });
    if (fixedTeachers.length > 0) writeJSON('teachers', fixedTeachers);
    let userChanged = 0;
    const usernamesInUsers = new Set(users.map(u => u.username));
    for (const t of fixedTeachers) {
        if (!t.username) continue;
        const existingIdx = users.findIndex(u => u.username === t.username);
        if (existingIdx >= 0) {
            const u = users[existingIdx];
            if (typeof u.password === 'string' && u.password.length < 30) {
                const hash = await bcrypt.hash(u.password, saltRounds);
                u.password = hash;
                userChanged++;
            }
            u.role = 'teacher';
            u.branchId = t.branchId;
            u.displayName = t.name || u.displayName || t.username;
            u.isActive = true;
        } else {
            const plainPw = plaintextPasswords[t.username] || 'teach123';
            const hash = await bcrypt.hash(plainPw, saltRounds);
            users.push({
                id: `teacher_user_${t.id}_${Date.now().toString(36)}`,
                username: t.username,
                password: hash,
                role: 'teacher',
                branchId: t.branchId,
                displayName: t.name || t.username,
                isActive: true,
                createdAt: new Date().toISOString(),
                lastLogin: null
            });
            usernamesInUsers.add(t.username);
            userChanged++;
            console.log(`  ➕ Added teacher user: ${t.username} (${t.name})`);
        }
    }
    if (userChanged > 0) writeJSON('users', users);
    console.log(`  📊 ${fixedTeachers.length} teachers total, ${users.length} users total (${userChanged} user updates/additions)`);
    return { teachers: fixedTeachers, users };
}

async function fixUsersPasswords() {
    console.log('🔧 Fixing any remaining plaintext user passwords...');
    const users = readJSON('users', []);
    const saltRounds = 12;
    let changed = 0;
    const fixed = [];
    for (const u of users) {
        const nu = { ...u };
        if (nu.password && typeof nu.password === 'string' && nu.password.length < 30 && !nu.password.startsWith('$2')) {
            console.log(`  🔐 Hashing password for user: ${nu.username}`);
            nu.password = await bcrypt.hash(nu.password, saltRounds);
            changed++;
        }
        if (nu.role === 'branch_admin' && nu.branchId !== null) nu.branchId = Number(nu.branchId) || nu.branchId;
        fixed.push(nu);
    }
    if (changed > 0) writeJSON('users', fixed);
    else console.log('  ✅ All user passwords already hashed');
    return fixed;
}

function ensureCollections() {
    console.log('🔧 Ensuring all collections exist as empty arrays...');
    const needed = ['attendance', 'fees', 'busSubscriptions'];
    for (const name of needed) {
        const fp = path.join(DATA_DIR, `${name}.json`);
        if (!fs.existsSync(fp)) {
            writeJSON(name, []);
            console.log(`  🆕 Created ${name}.json`);
        } else {
            const data = readJSON(name, null);
            if (data === null || !Array.isArray(data)) {
                writeJSON(name, []);
                console.log(`  🔄 Reset ${name}.json to []`);
            } else {
                console.log(`  ✅ ${name}.json exists (${data.length} records)`);
            }
        }
    }
}

async function main() {
    console.log('========================================================');
    console.log('  Seeds Palestine Schools — Data Integrity & DB Link ');
    console.log('========================================================\n');
    console.log(`📁 Data directory: ${DATA_DIR}\n`);
    await fixBranches();
    console.log('');
    await fixStudents();
    console.log('');
    await fixTeachers();
    console.log('');
    await fixUsersPasswords();
    console.log('');
    ensureCollections();
    console.log('');
    console.log('🎉 Data integrity complete.');
    console.log('');
    console.log('💡 Next: If you want real MongoDB instead of JSON files:');
    console.log('   Option 1: Local Docker MongoDB');
    console.log('     docker compose up -d');
    console.log('     # then set MONGODB_URI in .env and run:');
    console.log('     node migrate-files-to-mongodb.js');
    console.log('');
    console.log('   Option 2: MongoDB Atlas (cloud)');
    console.log('     Create cluster at mongodb.com and paste MONGODB_URI in .env');
    console.log('     node migrate-files-to-mongodb.js');
    console.log('');
    console.log('▶️  Start server with:  npm start');
    console.log('   (Server auto-selects MongoDB if MONGODB_URI set, else JSON files in ./data/)');
}

main().catch(e => {
    console.error('❌ Failed:', e);
    process.exit(1);
});
