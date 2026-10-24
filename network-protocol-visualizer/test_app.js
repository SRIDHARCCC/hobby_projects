/**
 * Automated Verification & Algorithmic Unit Tests
 * NetLab: Network Architecture & Protocol Visualizer
 */

const fs = require('fs');
const path = require('path');
const { NetworkEngine } = require('./network-engine.js');

console.log('=== Running Verification for NetLab: Network Architecture & Protocol Visualizer ===\n');

// 1. File Completeness
const requiredFiles = [
  'index.html',
  'style.css',
  'app.js',
  'network-engine.js',
  'server.py',
  'Dockerfile',
  'nginx.conf',
  '.dockerignore',
  'README.md'
];

let allPassed = true;

console.log('[1/3] Checking file existence and non-zero sizes...');
requiredFiles.forEach(file => {
  const p = path.join(__dirname, file);
  if (!fs.existsSync(p) || fs.statSync(p).size === 0) {
    console.error(`  ✗ Missing or empty file: ${file}`);
    allPassed = false;
  } else {
    console.log(`  ✓ ${file} (${fs.statSync(p).size} bytes)`);
  }
});

// 2. Network Engine Algorithmic Verification
console.log('\n[2/3] Verifying NetworkEngine algorithmic logic...');
const engine = new NetworkEngine();

// Test A: TCP Handshake State Machine
const handshake = engine.simulateTcpHandshake(1000, 5000);
if (handshake.length === 3 && handshake[0].flag === 'SYN' && handshake[1].flag === 'SYN-ACK' && handshake[2].flag === 'ACK') {
  console.log('  ✓ TCP 3-Way Handshake (SYN -> SYN-ACK -> ACK) sequence verified.');
} else {
  console.error('  ✗ TCP Handshake simulation failed.');
  allPassed = false;
}

// Test B: HTTP Serialization
const rawReq = engine.formatRawHttpRequest('GET', '/api/ping', { Host: 'localhost:8080' });
if (rawReq.startsWith('GET /api/ping HTTP/1.1') && rawReq.includes('Host: localhost:8080')) {
  console.log('  ✓ HTTP Request wire format serialization verified.');
} else {
  console.error('  ✗ HTTP Request serialization failed.');
  allPassed = false;
}

const rawResp = engine.formatRawHttpResponse(200, {}, '{"ok":true}');
if (rawResp.startsWith('HTTP/1.1 200 OK') && rawResp.includes('Content-Length: 11')) {
  console.log('  ✓ HTTP Response status and byte calculation verified.');
} else {
  console.error('  ✗ HTTP Response serialization failed.');
  allPassed = false;
}

// Test C: Scalability Model
console.log('\n[3/3] Verifying Scalability & Load Simulation...');
const scaleRes = engine.simulateScalability(1000);
if (scaleRes.concurrentUsers === 1000 && scaleRes.singleHost.failedUsers > 900 && scaleRes.productionCloud.successUsers === 1000) {
  console.log('  ✓ Scalability load model correctly identifies single-host bottleneck at 1,000 users.');
} else {
  console.error('  ✗ Scalability model produced unexpected output:', scaleRes);
  allPassed = false;
}

if (!allPassed) {
  console.error('\n❌ Verification suite failed.');
  process.exit(1);
}

console.log('\n🎉 All tests passed successfully!');
process.exit(0);
