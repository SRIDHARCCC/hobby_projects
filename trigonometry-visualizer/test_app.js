/**
 * Automated Verification & Unit Test Suite for TrigLab (Trigonometry Visualizer)
 */
const fs = require('fs');
const path = require('path');
const TrigEngine = require('./trig-engine.js');

console.log('=== Running Verification for TrigLab (Trigonometry Visualizer) ===');

let allPassed = true;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
  } else {
    console.error(`  ❌ FAILED: ${message}`);
    allPassed = false;
  }
}

// 1. Required Files Check
console.log('\n[Phase 1] Checking Required Repository Files:');
const requiredFiles = [
  'index.html',
  'style.css',
  'app.js',
  'trig-engine.js',
  'server.py',
  'Dockerfile',
  'nginx.conf',
  '.dockerignore',
  'README.md'
];

requiredFiles.forEach(file => {
  const p = path.join(__dirname, file);
  if (!fs.existsSync(p) || fs.statSync(p).size === 0) {
    console.error(`  ❌ Missing or empty file: ${file}`);
    allPassed = false;
  } else {
    console.log(`  ✓ Verified ${file} (${fs.statSync(p).size} bytes)`);
  }
});

// 2. Math & Trigonometric Domain Logic Tests
console.log('\n[Phase 2] Verifying Core Trigonometric Calculations:');

// Test 90° Special Values (User Request: why sin 90 is 1 & cos 90 is 0 & tan 90 is infinity)
const res90 = TrigEngine.calculate(90);
assert(res90.functions.sin.val === 1, 'sin(90°) === 1');
assert(res90.functions.cos.val === 0, 'cos(90°) === 0');
assert(res90.functions.tan.val === null && res90.functions.tan.isUndefined, 'tan(90°) is Undefined (infinite/asymptote)');
assert(res90.functions.sec.isUndefined, 'sec(90°) is Undefined (1/0)');
assert(res90.functions.csc.val === 1, 'csc(90°) === 1');
assert(res90.functions.cot.val === 0, 'cot(90°) === 0');

// Test 0° Cardinal Values
const res0 = TrigEngine.calculate(0);
assert(res0.functions.sin.val === 0, 'sin(0°) === 0');
assert(res0.functions.cos.val === 1, 'cos(0°) === 1');
assert(res0.functions.tan.val === 0, 'tan(0°) === 0');
assert(res0.functions.csc.isUndefined, 'csc(0°) is Undefined (1/0)');
assert(res0.functions.sec.val === 1, 'sec(0°) === 1');
assert(res0.functions.cot.isUndefined, 'cot(0°) is Undefined (1/0)');

// Test 180° Cardinal Values
const res180 = TrigEngine.calculate(180);
assert(res180.functions.sin.val === 0, 'sin(180°) === 0');
assert(res180.functions.cos.val === -1, 'cos(180°) === -1');
assert(res180.functions.tan.val === 0, 'tan(180°) === 0');
assert(res180.functions.csc.isUndefined, 'csc(180°) is Undefined');
assert(res180.functions.sec.val === -1, 'sec(180°) === -1');

// Test 270° Cardinal Values
const res270 = TrigEngine.calculate(270);
assert(res270.functions.sin.val === -1, 'sin(270°) === -1');
assert(res270.functions.cos.val === 0, 'cos(270°) === 0');
assert(res270.functions.tan.isUndefined, 'tan(270°) is Undefined');
assert(res270.functions.csc.val === -1, 'csc(270°) === -1');
assert(res270.functions.sec.isUndefined, 'sec(270°) is Undefined');

// Test Benchmark 30°, 45°, 60°
const res30 = TrigEngine.calculate(30);
assert(Math.abs(res30.functions.sin.val - 0.5) < 1e-9, 'sin(30°) === 0.5');
assert(Math.abs(res30.functions.cos.val - Math.sqrt(3) / 2) < 1e-9, 'cos(30°) === √3/2');
assert(res30.functions.sin.text === '1/2', 'sin(30°) displays exact radical "1/2"');

const res45 = TrigEngine.calculate(45);
assert(Math.abs(res45.functions.tan.val - 1.0) < 1e-9, 'tan(45°) === 1.0');
assert(res45.functions.tan.text === '1', 'tan(45°) displays exact text "1"');

// Test 3. Pythagorean Identity sin²θ + cos²θ = 1 across all 360 degrees
console.log('\n[Phase 3] Verifying Pythagorean Identity sin²(θ) + cos²(θ) = 1 for 0°–360°:');
let pythagorasPassed = true;
for (let angle = 0; angle <= 360; angle += 5) {
  const calc = TrigEngine.calculate(angle);
  const s = calc.functions.sin.val;
  const c = calc.functions.cos.val;
  const sum = s * s + c * c;
  if (Math.abs(sum - 1.0) > 1e-9) {
    pythagorasPassed = false;
    console.error(`Pythagorean identity failed at angle ${angle}: sin² + cos² = ${sum}`);
    break;
  }
}
assert(pythagorasPassed, 'sin²(θ) + cos²(θ) = 1 holds true for all sampled angles in [0°, 360°]');

// Test 4. Quadrant Classification and ASTC Rules
console.log('\n[Phase 4] Verifying Quadrant Classification & ASTC Signs:');
const q1 = TrigEngine.getQuadrantInfo(45);
assert(q1.quadrant === 'I' && q1.signs.sin === '+' && q1.signs.cos === '+' && q1.signs.tan === '+', 'Q1 (45°): ALL positive');

const q2 = TrigEngine.getQuadrantInfo(135);
assert(q2.quadrant === 'II' && q2.signs.sin === '+' && q2.signs.cos === '-' && q2.signs.tan === '-', 'Q2 (135°): SINE positive, others negative');

const q3 = TrigEngine.getQuadrantInfo(225);
assert(q3.quadrant === 'III' && q3.signs.sin === '-' && q3.signs.cos === '-' && q3.signs.tan === '+', 'Q3 (225°): TANGENT positive, others negative');

const q4 = TrigEngine.getQuadrantInfo(315);
assert(q4.quadrant === 'IV' && q4.signs.sin === '-' && q4.signs.cos === '+' && q4.signs.tan === '-', 'Q4 (315°): COSINE positive, others negative');

// Test 5. Teacher Explanations and Quiz Data Structure
console.log('\n[Phase 5] Verifying Educational Teacher Topics & Quiz Data:');
assert(Array.isArray(TrigEngine.TEACHER_TOPICS) && TrigEngine.TEACHER_TOPICS.length >= 6, 'Teacher topics populated (at least 6 topics)');
const sin90Topic = TrigEngine.TEACHER_TOPICS.find(t => t.id === 'sin-90');
const tan90Topic = TrigEngine.TEACHER_TOPICS.find(t => t.id === 'tan-90');
assert(!!sin90Topic, 'Topic "Why is sin(90°) = 1?" present');
assert(!!tan90Topic, 'Topic "Why is tan(90°) Infinity / Undefined?" present');

assert(Array.isArray(TrigEngine.QUIZ_QUESTIONS) && TrigEngine.QUIZ_QUESTIONS.length >= 5, 'Quiz questions populated (at least 5 questions)');

if (!allPassed) {
  console.error('\n❌ Verification suite FAILED!');
  process.exit(1);
}

console.log('\n🎉 ALL TRIGONOMETRY ENGINE & COMPLIANCE CHECKS PASSED SUCCESSFULLY!\n');
