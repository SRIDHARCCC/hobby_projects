/**
 * Automated Verification & Test Suite for SoftmaxLab
 * Validates file structure and mathematical correctness of SamplingEngine.
 */

const fs = require('fs');
const path = require('path');
const Engine = require('./sampling-engine.js');

console.log('===============================================================');
console.log('🧪 Running Test Suite: SoftmaxLab');
console.log('===============================================================\n');

let failedTests = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    failedTests++;
  } else {
    console.log(`  ✓ ${message}`);
  }
}

// 1. File Completeness
console.log('[1/4] Checking required files...');
const requiredFiles = [
  'index.html',
  'style.css',
  'sampling-engine.js',
  'app.js',
  'server.py',
  'Dockerfile',
  'nginx.conf',
  '.dockerignore',
  'README.md'
];

requiredFiles.forEach(file => {
  const p = path.join(__dirname, file);
  assert(fs.existsSync(p) && fs.statSync(p).size > 0, `File exists and non-empty: ${file}`);
});

// 2. Softmax & Temperature Unit Tests
console.log('\n[2/4] Testing Softmax & Temperature Mathematical Engine...');
try {
  // Test basic softmax sums to 1
  const logits = [2.0, 1.0, 0.1];
  const res1 = Engine.computeSoftmax(logits, 1.0);
  const sumP = res1.probabilities.reduce((a, b) => a + b, 0);
  assert(Math.abs(sumP - 1.0) < 1e-6, `Softmax probabilities sum to 1.0 (got ${sumP})`);
  assert(res1.probabilities[0] > res1.probabilities[1] && res1.probabilities[1] > res1.probabilities[2], 'Softmax preserves monotonicity of logits');

  // Test numerical stability (Log-Sum-Exp shift)
  const hugeLogits = [1000.0, 1005.0, 998.0];
  const resHuge = Engine.computeSoftmax(hugeLogits, 1.0);
  assert(!isNaN(resHuge.probabilities[0]) && isFinite(resHuge.probabilities[0]), 'Softmax handles huge logits (1000+) without NaN/overflow');
  const sumHuge = resHuge.probabilities.reduce((a, b) => a + b, 0);
  assert(Math.abs(sumHuge - 1.0) < 1e-6, 'Huge logits probabilities sum to 1.0');

  // Test translation invariance: softmax(z + c) == softmax(z)
  const shiftedLogits = [12.0, 11.0, 10.1]; // +10 to logits
  const resShifted = Engine.computeSoftmax(shiftedLogits, 1.0);
  assert(Math.abs(res1.probabilities[0] - resShifted.probabilities[0]) < 1e-5, 'Softmax is shift-invariant (z + C)');

  // Test Temperature -> 0 (Greedy limit)
  const resGreedy = Engine.computeSoftmax([1.0, 5.0, 2.0], 0.01);
  assert(resGreedy.probabilities[1] === 1.0 && resGreedy.probabilities[0] === 0.0 && resGreedy.probabilities[2] === 0.0, 'Temperature -> 0 yields delta distribution on argmax');
  assert(resGreedy.entropy === 0, 'Temperature -> 0 has zero entropy');

  // Test High Temperature -> Inf (Uniform limit)
  const resFlat = Engine.computeSoftmax([1.0, 5.0, 2.0], 100.0);
  assert(Math.abs(resFlat.probabilities[0] - 0.3333) < 0.05, 'High temperature flattens distribution towards uniform');
  assert(resFlat.entropy > res1.entropy, 'High temperature increases Shannon entropy');

} catch (err) {
  assert(false, `Unexpected error in Softmax tests: ${err.message}`);
}

// 3. Top-K and Top-P (Nucleus) Unit Tests
console.log('\n[3/4] Testing Top-K and Top-P Truncation & Renormalization...');
try {
  const sampleItems = [
    { token: 'A', logit: 6.0 },
    { token: 'B', logit: 4.0 },
    { token: 'C', logit: 2.0 },
    { token: 'D', logit: 0.0 },
    { token: 'E', logit: -2.0 }
  ];

  // Test Top-K = 2
  const sm = Engine.computeSoftmax(sampleItems, 1.0);
  const topKRes = Engine.applyTopK(sm.items, 2);
  assert(topKRes.survivingCount === 2, 'Top-K=2 keeps exactly 2 tokens');
  assert(topKRes.items[0].isTopK && topKRes.items[1].isTopK, 'Top-2 tokens are marked active');
  assert(!topKRes.items[2].isTopK && topKRes.items[2].prunedBy === 'top_k', 'Rank 3 token is pruned by top_k');
  const sumTopK = topKRes.items.reduce((acc, curr) => acc + (curr.topKProb || 0), 0);
  assert(Math.abs(sumTopK - 1.0) < 1e-6, `Top-K surviving probabilities renormalize to 1.0 (got ${sumTopK})`);

  // Test Top-P (Nucleus)
  const topPRes = Engine.applyTopP(topKRes.items, 0.7);
  assert(topPRes.nucleusCount >= 1, 'Top-P nucleus contains at least 1 token');
  const sumTopP = topPRes.items.reduce((acc, curr) => acc + (curr.finalProb || 0), 0);
  assert(Math.abs(sumTopP - 1.0) < 1e-6, `Top-P surviving probabilities renormalize to 1.0 (got ${sumTopP})`);

  // Full Pipeline execution
  const pipeline = Engine.runSamplingPipeline(sampleItems, {
    temperature: 0.8,
    topK: 3,
    topP: 0.9
  });
  assert(pipeline.finalTokens.length === 5, 'Pipeline preserves all tokens in diagnostic output');
  assert(pipeline.metrics.activeCount <= 3, 'Active token count bounded by Top-K');
  assert(pipeline.finalTokens[0].cdfStart === 0, 'CDF interval starts at 0.0');

  // Deterministic Sampling
  const sampleLow = Engine.sampleSingleToken(pipeline, 0.01);
  assert(sampleLow.chosenToken.token === 'A', 'Sampling at CDF 0.01 correctly picks top token A');

  // Monte Carlo simulation
  const mc = Engine.runMonteCarloSimulation(pipeline, 2000);
  assert(mc.sampleCount === 2000, 'Monte Carlo runs requested sample count');
  assert(mc.results.length === 5, 'Monte Carlo records all tokens');
  const topTokenMC = mc.results.find(r => r.token === 'A');
  assert(Math.abs(topTokenMC.empiricalProb - topTokenMC.theoreticalProb) < 0.05, 'Monte Carlo converges near theoretical probability');

} catch (err) {
  assert(false, `Unexpected error in Top-K / Top-P tests: ${err.message}`);
}

// 4. Presets and Scenarios Validation
console.log('\n[4/4] Validating Educational Presets and Story Trees...');
try {
  assert(Engine.PRESET_SCENARIOS.length >= 4, `At least 4 educational preset scenarios defined (found ${Engine.PRESET_SCENARIOS.length})`);
  Engine.PRESET_SCENARIOS.forEach(sc => {
    assert(sc.id && sc.title && sc.tokens.length >= 3, `Preset '${sc.title}' has required fields and tokens`);
  });

  assert(Engine.AUTOREGRESSIVE_STORIES.length >= 2, `At least 2 autoregressive story trees defined (found ${Engine.AUTOREGRESSIVE_STORIES.length})`);
  Engine.AUTOREGRESSIVE_STORIES.forEach(story => {
    assert(story.id && story.title && story.steps.length > 0, `Story '${story.title}' has steps`);
  });
} catch (err) {
  assert(false, `Unexpected error in Presets validation: ${err.message}`);
}

console.log('\n===============================================================');
if (failedTests === 0) {
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! (0 failures)');
  console.log('===============================================================');
  process.exit(0);
} else {
  console.error(`💥 TEST SUITE FAILED with ${failedTests} failure(s)`);
  console.log('===============================================================');
  process.exit(1);
}
