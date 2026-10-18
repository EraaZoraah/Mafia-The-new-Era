import http from 'node:http';
const req = http.get({host: '127.0.0.1', port: process.env.PORT || 3000, path: '/api/health', timeout: 4000}, res => {
  res.resume();
  process.exit(res.statusCode === 200 ? 0 : 1);
});
req.on('timeout', () => req.destroy(new Error('Healthcheck timeout')));
req.on('error', () => process.exit(1));
