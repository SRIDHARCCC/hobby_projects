/**
 * End-to-end verification script for SQLi-Lab
 */
const fs = require('fs');
const path = require('path');
const { EduSQLEngine, DEFAULT_USERS, DEFAULT_SECRETS } = require('./sql-engine.js');

console.log("=== RUNNING SQLI-LAB INTEGRATION SUITE ===");

// Check 1: 10 Users requirement
console.log(`\n[Check 1] Verifying 10 Users and Passwords:`);
if (DEFAULT_USERS.length !== 10) {
  console.error(`FAILED: Expected exactly 10 users, found ${DEFAULT_USERS.length}`);
  process.exit(1);
}

DEFAULT_USERS.forEach((user, i) => {
  if (!user.username || !user.password) {
    console.error(`FAILED: User ${i} is missing username or password`);
    process.exit(1);
  }
  console.log(`  User ${i + 1}: ${user.username} | Password: ${user.password} | Name: ${user.full_name} | Role: ${user.role}`);
});
console.log(`✓ Check 1 Passed: Exactly 10 users with passwords verified.`);

// Check 2: Core Exploit Vectors
const engine = new EduSQLEngine();

console.log(`\n[Check 2] Verifying Core SQL Injection Vectors:`);

// 2a: Tautology bypass
const rTautology = engine.executeLogin("' OR '1'='1", "fake", "vulnerable");
if (!rTautology.success || !rTautology.authenticatedUser) {
  console.error("FAILED: Tautology bypass failed");
  process.exit(1);
}
console.log(`  ✓ 2a: Tautology bypass successful (Authenticated as: ${rTautology.authenticatedUser.username}, Matched rows: ${rTautology.rows.length})`);

// 2b: Targeted Admin Comment bypass
const rAdmin = engine.executeLogin("admin' --", "wrong", "vulnerable");
if (!rAdmin.success || rAdmin.authenticatedUser.username !== 'admin') {
  console.error("FAILED: Targeted admin comment bypass failed");
  process.exit(1);
}
console.log(`  ✓ 2b: Targeted Admin Comment bypass successful (Target: admin, Password check bypassed)`);

// 2c: Targeted Alice Comment bypass
const rAlice = engine.executeLogin("alice_w' --", "wrong", "vulnerable");
if (!rAlice.success || rAlice.authenticatedUser.username !== 'alice_w') {
  console.error("FAILED: Targeted Alice comment bypass failed");
  process.exit(1);
}
console.log(`  ✓ 2c: Targeted Alice Comment bypass successful (Target: alice_w)`);

// 2d: Destructive Stacked query simulation
const rDrop = engine.executeLogin("'; DROP TABLE users; --", "wrong", "vulnerable");
if (!rDrop.error || !rDrop.error.includes("DROPPED")) {
  console.error("FAILED: Stacked query drop table failed");
  process.exit(1);
}
console.log(`  ✓ 2d: Stacked Query Drop Table simulation successfully trapped`);

// Reset DB after destructive drop
engine.resetDatabase();

// Check 3: Parameterized Defense (Secure Mode)
console.log(`\n[Check 3] Verifying Parameterized Query (Prepared Statement) Defense:`);
const rSecureAttack = engine.executeLogin("' OR '1'='1", "fake", "secure");
if (rSecureAttack.success) {
  console.error("FAILED: Secure mode permitted SQL injection attack!");
  process.exit(1);
}
console.log(`  ✓ 3a: Secure Mode successfully blocked Tautology injection (0 rows matched)`);

const rSecureLegit = engine.executeLogin("ian_m", "ChaosTheory#1993", "secure");
if (!rSecureLegit.success || rSecureLegit.authenticatedUser.username !== 'ian_m') {
  console.error("FAILED: Legitimate login failed in secure mode");
  process.exit(1);
}
console.log(`  ✓ 3b: Legitimate credentials authenticated properly in secure mode (User: ${rSecureLegit.authenticatedUser.username})`);

// Check 4: UNION-based Data Leakage
console.log(`\n[Check 4] Verifying UNION-based Search Exfiltration:`);
const rSearchUnion = engine.executeSearch("' UNION SELECT id, username, password, email, role, secret_data FROM users --", "vulnerable");
if (!rSearchUnion.isUnionLeak || rSearchUnion.results.length < 10) {
  console.error("FAILED: UNION search exfiltration failed");
  process.exit(1);
}
console.log(`  ✓ 4a: UNION injection leaked ${rSearchUnion.results.length} confidential records`);

const rSearchSecure = engine.executeSearch("' UNION SELECT id, username, password, email, role, secret_data FROM users --", "secure");
if (rSearchSecure.isUnionLeak || rSearchSecure.results.length !== 0) {
  console.error("FAILED: Secure search failed to neutralize injection");
  process.exit(1);
}
console.log(`  ✓ 4b: Secure Search neutralized UNION attack safely`);

// Check 5: HTML, CSS, JS and server files exist and are non-empty
console.log(`\n[Check 5] Verifying Project File Integrity:`);
const requiredFiles = ['index.html', 'style.css', 'app.js', 'sql-engine.js', 'server.py', 'README.md', 'Dockerfile', 'nginx.conf'];
requiredFiles.forEach(f => {
  const filePath = path.join(__dirname, f);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
    console.error(`FAILED: File ${f} is missing or empty`);
    process.exit(1);
  }
  console.log(`  ✓ ${f} (${fs.statSync(filePath).size} bytes)`);
});

console.log("\n==========================================");
console.log("🎉 ALL TESTS PASSED! APPLICATION VERIFIED.");
console.log("==========================================");
