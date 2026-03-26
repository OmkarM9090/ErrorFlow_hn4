const http = require('http');

const req = http.request('http://localhost:3000/api/audit/optimize-output', { method: 'POST' }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('RESPONSE:', data));
});
req.on('error', err => console.error('REQUEST ERROR:', err));
req.end();
