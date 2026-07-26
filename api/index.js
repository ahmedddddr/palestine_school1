const path = require('path');
const fs = require('fs');

process.chdir(__dirname);
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production';
if (!process.env.PORT) process.env.PORT = '3000';
if (typeof process.env.TRUST_PROXY === 'undefined') process.env.TRUST_PROXY = 'true';

const DATA_DIR = path.join(__dirname, '..', 'data');
try {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
} catch (_) {}

const app = require('../server.js');

if (app && typeof app === 'function' && !app.__vercel_listening) {
  module.exports = (req, res) => {
    try {
      app(req, res);
    } catch (e) {
      console.error('Vercel handler error:', e);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  };
} else if (app && typeof app.listen === 'function') {
  module.exports = (req, res) => {
    try {
      app(req, res);
    } catch (e) {
      console.error('Vercel handler error:', e);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  };
} else {
  module.exports = (req, res) => {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Server failed to load. Check logs and ensure MONGODB_URI is configured in Vercel env vars.' }));
  };
}
