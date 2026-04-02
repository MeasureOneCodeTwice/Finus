//Note: this code is all chatGPT written.

const http = require('http');
const { spawn } = require('child_process');

const PORT = 4444;
const SECOND = 1000;
const COOLDOWN = 10 * SECOND;

let lastRun = 0;
let restarting = false;

const server = http.createServer((req, res) => {
  let body = '';

  req.on('data', chunk => {
    body += chunk;
  });

  req.on('end', () => {
    const now = Date.now();

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    
    if (now - lastRun < COOLDOWN) {
      console.log(`[${new Date().toISOString()}] Webhook ignored due to cooldown`);
      return 
    }
    lastRun = now;

    if (restarting) {
      console.log(`[${new Date().toISOString()}] Webhook ignored due to in-progress restart`);
      return 
    }
    restarting = true;

    console.log(`[${new Date().toISOString()}] Upgrading services...`);
    const script = spawn('./upgrade-images.sh');

    script.on('close', (code) => {
      restarting = false;
      if(code === 0) {
        console.log(`[${new Date().toISOString()}] Finished upgrading services`);
      } else {
        console.log(`[${new Date().toISOString()}] Failed to upgrade services. Code: ${code}`);
      }
    });

    script.on('error', (err) => {
      console.error(`[${new Date().toISOString()}] Script error:`, err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error');
    });
  });
});

server.listen(PORT, () => {
  console.log(`Webhook listener running on port ${PORT}`);
});
