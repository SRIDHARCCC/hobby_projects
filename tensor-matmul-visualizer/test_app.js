/**
 * Automated Verification & Test Suite for TensorMatmulLab
 * Tests both file structure completeness and mathematical correctness of MatmulEngine.
 */

const fs = require('fs');
const path = require('path');
const Engine = require('./matmul-engine.js');

console.log('===============================================================');
console.log('🧪 Running Test Suite: TensorMatmulLab');
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
  'matmul-engine.js',
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

// 2. Shape Parsing Unit Tests
console.log('\n[2/4] Testing Shape Parsing & Formatting...');
try {
  const s1 = Engine.parseShape('2, 1, 4, 3');
  assert(JSON.stringify(s1) === '[2,1,4,3]', 'Parses comma-separated string correctly');

  const s2 = Engine.parseShape('(2, 4, 16, 8)');
  assert(JSON.stringify(s2) === '[2,4,16,8]', 'Parses bracketed tuple string correctly');

  const s3 = Engine.parseShape('  16   128   64  ');
  assert(JSON.stringify(s3) === '[16,128,64]', 'Parses whitespace-separated string correctly');

  let threwInvalid = false;
  try {
    Engine.parseShape('2, -3, 4');
  } catch (e) {
    threwInvalid = true;
  }
  assert(threwInvalid, 'Rejects negative dimensions');

  assert(Engine.formatShape([2, 5, 4, 6]) === '(2, 5, 4, 6)', 'Formats shape tuple correctly');
} catch (e) {
  assert(false, `Unexpected error in parsing: ${e.message}`);
}

// 3. Matmul Core Rules & Broadcasting Verification
console.log('\n[3/4] Testing NumPy Matmul Rules & Edge Cases...');

// Case 1: Standard 3D Batch
const case1 = Engine.analyzeMatmul('3, 2, 4', '3, 4, 2');
assert(case1.isValid === true, '3D Batch matmul is valid');
assert(JSON.stringify(case1.resultShape) === '[3,2,2]', '3D Batch result shape is (3, 2, 2)');
assert(case1.totalBatchSlices === 3, '3D Batch has 3 slices');

// Case 2: Deep Learning Transformer Multi-Head Attention Q @ K^T
const case2 = Engine.analyzeMatmul('2, 4, 8, 16', '2, 4, 16, 8');
assert(case2.isValid === true, 'Attention Q @ K^T is valid');
assert(JSON.stringify(case2.resultShape) === '[2,4,8,8]', 'Attention output shape is (2, 4, 8, 8)');
assert(case2.totalBatchSlices === 8, 'Attention has 8 slices (2 batch * 4 heads)');

// Case 3: Complex Broadcasting Trick (2, 1, 4, 3) @ (1, 5, 3, 6)
const case3 = Engine.analyzeMatmul('2, 1, 4, 3', '1, 5, 3, 6');
assert(case3.isValid === true, 'Batch broadcasting is valid');
assert(JSON.stringify(case3.resultShape) === '[2,5,4,6]', 'Broadcasted result shape is (2, 5, 4, 6)');
assert(case3.totalBatchSlices === 10, 'Total batch slices is 10 (2 * 5)');
assert(case3.alignedBatches[0].status === 'BROADCAST_B', 'Axis 0 broadcasts B from 1 to 2');
assert(case3.alignedBatches[1].status === 'BROADCAST_A', 'Axis 1 broadcasts A from 1 to 5');

// Case 4: Asymmetric Ranks (Rank 3 @ Rank 2 - Feature Weight Projection)
const case4 = Engine.analyzeMatmul('16, 128, 64', '64, 256');
assert(case4.isValid === true, 'Rank 3 @ Rank 2 feature projection is valid');
assert(JSON.stringify(case4.resultShape) === '[16,128,256]', 'Projection result shape is (16, 128, 256)');

// Case 5: Classic 2D Matrix multiplication
const case5 = Engine.analyzeMatmul('3, 4', '4, 5');
assert(case5.isValid === true, '2D classic matmul is valid');
assert(JSON.stringify(case5.resultShape) === '[3,5]', '2D result shape is (3, 5)');
assert(case5.totalBatchSlices === 1, '2D classic matmul has 1 slice');

// Case 6: Core Mismatch Error
const case6 = Engine.analyzeMatmul('2, 3, 4, 5', '2, 3, 7, 6');
assert(case6.isValid === false, 'Detects core mismatch');
assert(case6.errorType === 'CORE_MISMATCH', 'Identifies errorType as CORE_MISMATCH');
assert(case6.errorMessage.includes('mismatch in its core dimension'), 'Includes NumPy gufunc mismatch message');

// Case 7: Batch Incompatible Error
const case7 = Engine.analyzeMatmul('3, 4, 2', '5, 2, 4');
assert(case7.isValid === false, 'Detects incompatible batch dimensions');
assert(case7.errorType === 'BROADCAST_MISMATCH', 'Identifies errorType as BROADCAST_MISMATCH');

// Case 8: Insufficient Rank (< 2)
const case8 = Engine.analyzeMatmul('4', '4, 2');
assert(case8.isValid === false, 'Rejects rank < 2 tensor');
assert(case8.errorType === 'RANK_TOO_LOW', 'Identifies errorType as RANK_TOO_LOW');

// 4. Batch Slice Inspection & Mathematical Product Verification
console.log('\n[4/4] Testing Slice Mapping & 2D Dot Product Arithmetic...');
const slice = Engine.inspectBatchSlice(case3, [1, 3]);
assert(slice !== null, 'Inspects batch slice successfully');
assert(JSON.stringify(slice.sliceIndexA) === '[1,0]', 'A axis 1 mapped to 0 (broadcasted)');
assert(JSON.stringify(slice.sliceIndexB) === '[0,3]', 'B axis 0 mapped to 0 (broadcasted)');

// Verify matrix arithmetic C = A @ B
let matmulMathCorrect = true;
for (let i = 0; i < slice.M; i++) {
  for (let j = 0; j < slice.N; j++) {
    let expectedSum = 0;
    for (let k = 0; k < slice.K; k++) {
      expectedSum += slice.matA[i][k] * slice.matB[k][j];
    }
    if (slice.matC[i][j] !== expectedSum) {
      matmulMathCorrect = false;
    }
  }
}
assert(matmulMathCorrect, 'Calculated 2D dot product values match matrix multiplication formula C[i,j] = sum(A[i,k]*B[k,j])');

// Verify code generator
const codes = Engine.generateCodeSnippets(case3);
assert(codes.numpy && codes.numpy.includes('A @ B'), 'Generates valid NumPy snippet');
assert(codes.pytorch && codes.pytorch.includes('torch.matmul'), 'Generates valid PyTorch snippet');
assert(codes.einsum && codes.einsum.includes('np.einsum'), 'Generates valid Einsum snippet');

// Final summary
console.log('\n===============================================================');
if (failedTests === 0) {
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! (0 failures)');
  console.log('===============================================================\n');
  process.exit(0);
} else {
  console.error(`💥 TEST SUITE FAILED with ${failedTests} failure(s)!`);
  console.log('===============================================================\n');
  process.exit(1);
}
