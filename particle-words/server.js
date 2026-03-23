const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3100;
const HTML_FILE = path.join(__dirname, 'index.html');

const server = http.createServer((req, res) => {
  // Serve the HTML for any request
  fs.readFile(HTML_FILE, 'utf8', (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error loading page');
      return;
    }
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Frame-Options': 'ALLOWALL',
    });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[NAVADA Particle Words] Serving on port ${PORT}`);
});
