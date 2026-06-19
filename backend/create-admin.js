// Run this ONCE after the backend is started:
// node create-admin.js

const http = require('http');

const data = JSON.stringify({
  username: 'admin',
  email: 'admin@musicapp.com',
  password: 'admin123456'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/admin/seed-admin',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const parsed = JSON.parse(body);
    if (res.statusCode === 201) {
      console.log('✅ Admin created successfully!');
      console.log('📧 Email:    admin@musicapp.com');
      console.log('🔑 Password: admin123456');
      console.log('\nYou can now log in with these credentials in the app.');
    } else {
      console.log('ℹ️  Response:', parsed.message);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Error:', e.message);
  console.log('Make sure the backend is running first (npm run dev)');
});

req.write(data);
req.end();
