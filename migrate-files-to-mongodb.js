#!/usr/bin/env node
/**
 * migrate-files-to-mongodb.js
 * ------------------------------------------------------------
 * One-time data migration tool.
 * Reads all JSON files from ./data/ and inserts them into MongoDB
 * using the MONGODB_URI in your .env file.
 *
 * Safe defaults:
 *   - DRY_RUN=1         : Print what WOULD happen without writing
 *   - DROP=1            : Drop target collection before inserting
 *   - ONLY=students,fees: Only migrate these collections (comma-sep)
 *   - SKIP_INDEXES=1    : Skip index creation
 *
 * Usage examples:
 *   node migrate-files-to-mongodb.js
 *   DRY_RUN=1 node migrate-files-to-mongodb.js
 *   DROP=1 ONLY=branches,users node migrate-files-to-mongodb.js
 * ------------------------------------------------------------
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const DATA_DIR = path.join(__dirname, 'data');
const MONGODB_URI = (process.env.MONGODB_URI || '').trim();

const DRY_RUN = ['1', 'true', 'yes'].includes((process.env.DRY_RUN || '').toLowerCase());
const DROP_FIRST = ['1', 'true', 'yes'].includes((process.env.DROP || '').toLowerCase());
const SKIP_INDEXES = ['1', 'true', 'yes'].includes((process.env.SKIP_INDEXES || '').toLowerCase());
const ONLY_LIST = process.env.ONLY
    ? process.env.ONLY.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    : null;

const COLLECTIONS = {
    branches:         { file: 'branches.json',         unique: ['id', 'branchCode'] },
    users:            { file: 'users.json',            unique: ['username'] },
    students:         { file: 'students.json',         indexed: ['branchId', 'class'] },
    teachers:         { file: 'teachers.json',         indexed: ['branchId', 'subject'] },
    attendance:       { file: 'attendance.json',       indexed: ['branchId', 'date', 'studentId'] },
    fees:             { file: 'fees.json',             indexed: ['branchId', 'studentId', 'month', 'year'] },
    busSubscriptions: { file: 'busSubscriptions.json', indexed: ['branchId', 'studentId'] }
};

const ALLOW_DROP_CONFIRMATION_FLAG = process.env.I_KNOW_WHAT_I_AM_DOING === '1';

function normalizeId(item, targetIdKey = '_id') {
    const out = { ...item };
    if (out._id && typeof out._id !== 'object') {
        try {
            const oidStr = String(out._id);
            if (/^[0-9a-fA-F]{24}$/.test(oidStr)) {
                out._id = require('mongodb').ObjectId.createFromHexString(oidStr);
            }
        } catch (_) {}
    }
    return out;
}

function readJSONSafe(file) {
    const fp = path.join(DATA_DIR, file);
    if (!fs.existsSync(fp)) {
        console.log(`   ⚠️  ${file} not found — skipping`);
        return null;
    }
    try {
        const raw = fs.readFileSync(fp, 'utf8');
        if (!raw.trim()) return [];
        const data = JSON.parse(raw);
        if (!Array.isArray(data)) {
            console.log(`   ⚠️  ${file} is not an array — skipping (wrap in [] to migrate)`);
            return null;
        }
        return data;
    } catch (e) {
        console.log(`   ❌ Failed to parse ${file}: ${e.message}`);
        return null;
    }
}

async function createIndexes(col, name, spec) {
    console.log(`   🗂️  Creating indexes on "${name}"...`);
    if (spec.unique) {
        for (const f of spec.unique) {
            try {
                await col.createIndex({ [f]: 1 }, { unique: true });
                console.log(`      ✅ unique({${f}:1})`);
            } catch (e) { console.log(`      ℹ️  unique({${f}:1}) skipped: ${e.message}`); }
        }
    }
    if (spec.indexed) {
        for (const f of spec.indexed) {
            try {
                await col.createIndex({ [f]: 1 });
                console.log(`      ✅ index({${f}:1})`);
            } catch (e) { console.log(`      ℹ️  index({${f}:1}) skipped: ${e.message}`); }
        }
    }
}

function parseDbNameAndHost(uri) {
    try {
        const normalized = uri.replace(/^mongodb(\+srv)?:\/\//, 'http://');
        const u = new URL(normalized);
        const host = u.host;
        const name = (u.pathname && u.pathname.length > 1) ? u.pathname.slice(1) : 'school-management';
        return { host, name };
    } catch (e) {
        return { host: 'unknown', name: 'school-management' };
    }
}

async function main() {
    console.log('========================================================');
    console.log(' Seeds Palestine Schools — JSON → MongoDB Migration ');
    console.log('========================================================');

    if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI is not set in .env — nothing to do.');
        console.log('   Set it to a MongoDB URI (Atlas / local) and re-run.');
        console.log('   Example: MONGODB_URI=mongodb://localhost:27017/school-management');
        process.exit(1);
    }

    const { host, name } = parseDbNameAndHost(MONGODB_URI);
    console.log(`🔌 Target DB:  ${name}`);
    console.log(`🌍 Host:       ${host}`);
    console.log(`👁️  Dry run:    ${DRY_RUN ? 'YES (no writes)' : 'NO — writing to DB'}`);
    console.log(`💥 Drop first: ${DROP_FIRST ? 'YES (collections will be wiped)' : 'NO (insert only)'}`);
    console.log(`🎯 Only:       ${ONLY_LIST ? ONLY_LIST.join(', ') : 'all collections'}`);
    console.log('');

    if (DROP_FIRST && !ALLOW_DROP_CONFIRMATION_FLAG && !DRY_RUN) {
        console.log('💥 You have set DROP=1. This will PERMANENTLY delete existing documents.');
        console.log('   To confirm, re-run with:');
        console.log('      I_KNOW_WHAT_I_AM_DOING=1 DROP=1 node migrate-files-to-mongodb.js');
        process.exit(2);
    }

    const filesExist = Object.entries(COLLECTIONS).filter(([k, spec]) => {
        if (ONLY_LIST && !ONLY_LIST.includes(k.toLowerCase())) return false;
        return fs.existsSync(path.join(DATA_DIR, spec.file));
    });

    if (filesExist.length === 0) {
        console.log('ℹ️  Nothing to migrate. Check the ./data/ folder or the ONLY filter.');
        process.exit(0);
    }

    const entries = Object.entries(COLLECTIONS);
    const toMigrate = ONLY_LIST
        ? entries.filter(([k]) => ONLY_LIST.includes(k.toLowerCase()))
        : entries;

    if (toMigrate.length === 0) {
        console.log('ℹ️  No collections match the ONLY filter.');
        process.exit(0);
    }

    let client;
    try {
        client = new MongoClient(MONGODB_URI);
        console.log('🔌 Connecting to MongoDB...');
        await client.connect();
        console.log('✅ Connected successfully');
        const db = client.db(name);
        console.log('');

        for (const [collName, spec] of toMigrate) {
            console.log(`📦 Migrating "${collName}" (${spec.file})`);
            const data = readJSONSafe(spec.file);
            if (data === null) continue;
            const documents = data.map((doc, i) => {
                const out = normalizeId(doc);
                if (out._id === undefined && typeof out.id !== 'undefined') {
                    // We keep both _id (Mongo native, only if ObjectId) and id (our domain id).
                }
                return out;
            });
            console.log(`   📄 Found ${documents.length} document(s) in JSON`);
            const col = db.collection(collName);

            if (DROP_FIRST && documents.length > 0) {
                const info = DRY_RUN ? '[DRY RUN]' : '';
                console.log(`   💥 Drop collection first ${info}...`);
                if (!DRY_RUN) {
                    try { await col.drop(); }
                    catch (e) { console.log(`      ℹ️  drop skipped: ${e.message}`); }
                }
            }

            if (!SKIP_INDEXES && !DRY_RUN) {
                await createIndexes(col, collName, spec);
            } else if (DRY_RUN && !SKIP_INDEXES) {
                console.log(`   🗂️  [DRY RUN] Would create indexes for "${collName}"`);
            }

            let inserted = 0;
            let skippedDuplicates = 0;
            let errors = 0;

            if (DRY_RUN) {
                console.log(`   ✅ [DRY RUN] Would insert ${documents.length} document(s) into "${collName}"`);
            } else if (documents.length > 0) {
                // If there are unique indexes (e.g. username, id), do ordered=false insertMany
                // to tolerate partial duplicates.
                const hasUnique = Array.isArray(spec.unique) && spec.unique.length > 0;
                try {
                    const res = await col.insertMany(documents, { ordered: hasUnique ? false : true });
                    inserted = res.insertedCount || 0;
                    console.log(`   ✅ Inserted ${inserted} document(s)`);
                } catch (e) {
                    if (hasUnique && e.code === 11000 && Array.isArray(e.writeErrors)) {
                        skippedDuplicates = e.writeErrors.filter(we => we.code === 11000).length;
                        errors = e.writeErrors.length - skippedDuplicates;
                        inserted = e.result && e.result.nInserted ? e.result.nInserted : inserted;
                        console.log(`   ⚠️  Inserted ${inserted}, skipped ${skippedDuplicates} duplicate(s), ${errors} other error(s)`);
                        if (errors > 0 && e.writeErrors) {
                            e.writeErrors.slice(0, 3).forEach(we => console.log(`      ❌ #${we.index}: ${we.errmsg}`));
                        }
                    } else {
                        console.log(`   ❌ insertMany failed: ${e.message}`);
                        // Fallback: insert one-by-one for debugging visibility.
                        console.log('   ➰ Trying one-by-one insert as fallback...');
                        inserted = 0;
                        skippedDuplicates = 0;
                        errors = 0;
                        for (const doc of documents) {
                            try {
                                await col.insertOne(doc);
                                inserted++;
                            } catch (ie) {
                                if (ie.code === 11000) skippedDuplicates++;
                                else { errors++; }
                            }
                        }
                        console.log(`   ✅ Inserted ${inserted} / ${documents.length} (dup skipped=${skippedDuplicates}, errors=${errors})`);
                    }
                }
            }
            console.log('');
        }

        console.log('🎉 Migration complete. Summary:');
        console.log('   Mode:', DRY_RUN ? 'DRY RUN (no changes written)' : 'LIVE (data written to MongoDB)');
        console.log('');
        console.log('   Next step: set .env like this and start server:');
        console.log('     MONGODB_URI=<your-uri>');
        console.log('     # Optional: FORCE_FILE_STORAGE=false');
        console.log('     npm start');
    } catch (e) {
        console.error('');
        console.error('❌ Migration failed:', e.message);
        process.exit(1);
    } finally {
        if (client) try { await client.close(); } catch (_) {}
    }
}

main();
