/**
 * MatmulEngine: Core mathematical and dimensional analysis engine
 * for NumPy tensor matrix multiplication (@ / np.matmul) and 2D vector dot products.
 *
 * Implements:
 * 1. 2D Vector Dot Product & Matrix Multiplication: (M, K) @ (K, N) -> (M, N)
 * 2. 3D & Tensor Batch Broadcasting: Right-to-left alignment, stretching singleton axes
 * 3. Step-by-step arithmetic computation for each element C[i, j]
 * 4. Plain-English beginner friendly explanations & exact NumPy error diagnosis
 *
 * Compatible with Node.js (CommonJS) and browser globals (window.MatmulEngine).
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.MatmulEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Parse shape string such as "2, 3", "(2, 3)", "[2 3]" into an array of integers.
   * @param {string|Array} input 
   * @returns {number[]} Array of positive integers
   */
  function parseShape(input) {
    if (Array.isArray(input)) {
      if (input.length === 0) throw new Error('Shape cannot be empty.');
      const sanitized = input.map(x => Number(x));
      for (let i = 0; i < sanitized.length; i++) {
        if (!Number.isInteger(sanitized[i]) || sanitized[i] <= 0) {
          throw new Error(`Dimension at index ${i} must be a positive integer, got: ${input[i]}`);
        }
      }
      return sanitized;
    }

    if (typeof input !== 'string') {
      throw new Error('Shape input must be a string or array.');
    }

    const trimmed = input.trim();
    if (!trimmed) {
      throw new Error('Shape input is empty. Please enter dimensions e.g. "2, 3".');
    }

    const cleanStr = trimmed.replace(/[()[\]{}]/g, ' ').trim();
    const tokens = cleanStr.split(/[\s,]+/).filter(Boolean);

    if (tokens.length === 0) {
      throw new Error('No dimensions found in shape input.');
    }

    const dims = [];
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const val = Number(token);
      if (isNaN(val) || !Number.isInteger(val)) {
        throw new Error(`Invalid dimension token "${token}" at position ${i + 1}. Must be an integer.`);
      }
      if (val <= 0) {
        throw new Error(`Dimension must be > 0, got ${val} at position ${i + 1}.`);
      }
      dims.push(val);
    }

    return dims;
  }

  /**
   * Format shape array into standard Python tuple string, e.g. (2, 3)
   * @param {number[]} shape 
   * @returns {string}
   */
  function formatShape(shape) {
    if (!shape || !Array.isArray(shape) || shape.length === 0) return '()';
    if (shape.length === 1) return `(${shape[0]},)`;
    return `(${shape.join(', ')})`;
  }

  /**
   * Main analysis of tensor matrix multiplication A @ B according to NumPy semantics.
   * @param {string|number[]} rawShapeA 
   * @param {string|number[]} rawShapeB 
   * @returns {Object} Full analysis result
   */
  function analyzeMatmul(rawShapeA, rawShapeB) {
    let shapeA, shapeB;
    let parseError = null;

    try {
      shapeA = parseShape(rawShapeA);
    } catch (err) {
      parseError = `Tensor A shape error: ${err.message}`;
    }

    if (!parseError) {
      try {
        shapeB = parseShape(rawShapeB);
      } catch (err) {
        parseError = `Tensor B shape error: ${err.message}`;
      }
    }

    if (parseError) {
      return {
        isValid: false,
        errorType: 'INVALID_INPUT',
        errorMessage: parseError,
        shapeA: shapeA || [],
        shapeB: shapeB || [],
        explanation: parseError,
        simpleRuleMessage: parseError
      };
    }

    const rankA = shapeA.length;
    const rankB = shapeB.length;

    // Minimum rank checks (2D or higher)
    if (rankA < 2 || rankB < 2) {
      return {
        isValid: false,
        errorType: 'RANK_TOO_LOW',
        shapeA,
        shapeB,
        rankA,
        rankB,
        errorMessage: `Both tensors must have at least 2 dimensions for matrix multiplication. Got rank ${rankA} and rank ${rankB}.`,
        explanation: `Rule A requires the last 2 dimensions to be a 2D matrix (M, K) @ (K, N). For 1D arrays, NumPy treats them as vectors; for matrix multiplication, use shapes with at least 2 dimensions like (1, ${shapeA[0] || 2}).`,
        simpleRuleMessage: 'Matrix multiplication needs 2D shapes: (Rows, Cols).'
      };
    }

    // 2D Core extraction (Last 2 dimensions)
    const M = shapeA[rankA - 2];
    const K_A = shapeA[rankA - 1];

    const K_B = shapeB[rankB - 2];
    const N = shapeB[rankB - 1];

    const coreA = { M, K: K_A, dimNames: ['M', 'K'] };
    const coreB = { K: K_B, N, dimNames: ['K', 'N'] };

    // Batch dimensions (everything before last 2 dims)
    const batchA = shapeA.slice(0, rankA - 2);
    const batchB = shapeB.slice(0, rankB - 2);

    // Rule A: Inner core contraction K_A === K_B
    const coreMatches = (K_A === K_B);

    // Rule B: Broadcasting batch dimensions
    const maxBatchRank = Math.max(batchA.length, batchB.length);
    const alignedBatches = [];
    let batchBroadcastingValid = true;
    let firstBatchMismatch = null;

    const paddedBatchA = [];
    const paddedBatchB = [];

    const padCountA = maxBatchRank - batchA.length;
    const padCountB = maxBatchRank - batchB.length;

    for (let i = 0; i < maxBatchRank; i++) {
      const dimA = i < padCountA ? 1 : batchA[i - padCountA];
      const dimB = i < padCountB ? 1 : batchB[i - padCountB];
      const isPaddedA = i < padCountA;
      const isPaddedB = i < padCountB;

      paddedBatchA.push(dimA);
      paddedBatchB.push(dimB);

      let status = 'EQUAL';
      let resultDim = dimA;

      if (dimA === dimB) {
        status = 'EQUAL';
        resultDim = dimA;
      } else if (dimA === 1) {
        status = 'BROADCAST_A';
        resultDim = dimB;
      } else if (dimB === 1) {
        status = 'BROADCAST_B';
        resultDim = dimA;
      } else {
        status = 'MISMATCH';
        resultDim = null;
        batchBroadcastingValid = false;
        if (!firstBatchMismatch) {
          firstBatchMismatch = {
            axisFromRight: maxBatchRank - 1 - i,
            batchIndex: i,
            dimA,
            dimB
          };
        }
      }

      alignedBatches.push({
        batchIndex: i,
        axisFromRight: maxBatchRank - 1 - i,
        dimA,
        dimB,
        resultDim,
        status,
        isPaddedA,
        isPaddedB
      });
    }

    const isValid = coreMatches && batchBroadcastingValid;

    let errorType = null;
    let errorMessage = null;
    let explanation = null;
    let simpleRuleMessage = null;

    if (!coreMatches) {
      errorType = 'CORE_MISMATCH';
      errorMessage = `ValueError: matmul: Input operand 1 has a mismatch in its core dimension 0, with gufunc signature (n?,k),(k,m?)->(n?,m?) (size ${K_A} is different from ${K_B})`;
      explanation = `Rule A (2D Core Mismatch): The inner dimensions must match! Matrix A has ${K_A} columns, but Matrix B has ${K_B} rows. For matrix multiplication to work, every row of A must take the dot product with every column of B. Because ${K_A} ≠ ${K_B}, their lengths don't match!`;
      simpleRuleMessage = `Inner dimensions do not match: Matrix A has ${K_A} columns, but Matrix B has ${K_B} rows. Both must be equal to multiply!`;
    } else if (!batchBroadcastingValid) {
      errorType = 'BROADCAST_MISMATCH';
      errorMessage = `ValueError: operands could not be broadcast together with remapped shapes[original->remapped]: (${batchA.join(',')})->(${batchA.join(',')}) (${batchB.join(',')})->(${batchB.join(',')}) and requested shape (${M},${N})`;
      const { batchIndex, dimA, dimB } = firstBatchMismatch;
      explanation = `Rule B (Batch Broadcasting Mismatch): At batch axis ${batchIndex}, Tensor A has size ${dimA} while Tensor B has size ${dimB}. In NumPy broadcasting, dimensions must either be identical or one of them must be 1. Since neither is 1 (${dimA} ≠ ${dimB}), NumPy cannot broadcast them together.`;
      simpleRuleMessage = `Batch sizes ${dimA} and ${dimB} cannot broadcast together. One of them must be 1, or they must be equal!`;
    } else {
      simpleRuleMessage = `Valid matrix multiplication! Output shape is (${[...alignedBatches.map(b => b.resultDim), M, N].join(', ')}).`;
    }

    const resultBatchShape = batchBroadcastingValid
      ? alignedBatches.map(b => b.resultDim)
      : [];
    const resultShape = isValid
      ? [...resultBatchShape, M, N]
      : null;

    const totalBatchSlices = resultBatchShape.length > 0
      ? resultBatchShape.reduce((acc, v) => acc * v, 1)
      : 1;

    const totalElementsA = shapeA.reduce((acc, v) => acc * v, 1);
    const totalElementsB = shapeB.reduce((acc, v) => acc * v, 1);
    const totalElementsResult = resultShape
      ? resultShape.reduce((acc, v) => acc * v, 1)
      : 0;

    const flopsPerSlice = 2 * M * N * K_A;
    const totalFlops = isValid ? totalBatchSlices * flopsPerSlice : 0;

    return {
      isValid,
      errorType,
      errorMessage,
      explanation,
      simpleRuleMessage,
      shapeA,
      shapeB,
      rankA,
      rankB,
      coreA,
      coreB,
      batchA,
      batchB,
      paddedBatchA,
      paddedBatchB,
      maxBatchRank,
      alignedBatches,
      resultBatchShape,
      resultCoreShape: [M, N],
      resultShape,
      totalBatchSlices,
      totalElementsA,
      totalElementsB,
      totalElementsResult,
      totalFlops
    };
  }

  /**
   * Generates friendly, small integer matrix values for easy mental math.
   * Keeps numbers between -2 and 4.
   */
  function createFriendlyMatrix(rows, cols, seedMultiplier) {
    const matrix = [];
    const presets = [
      [1, 2, 0, 3, -1, 2],
      [2, -1, 3, 1, 0, 4],
      [0, 3, 1, -2, 2, 1],
      [3, 1, -1, 2, 0, 3],
      [-1, 2, 2, 0, 3, 1]
    ];

    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        const pRow = presets[(r + seedMultiplier) % presets.length];
        const val = pRow[(c * 2 + seedMultiplier) % pRow.length];
        row.push(val);
      }
      matrix.push(row);
    }
    return matrix;
  }

  /**
   * Given matrices A (M x K) and B (K x N), compute C (M x N)
   * and record full step-by-step vector dot product arithmetic.
   */
  function compute2DMatmul(matA, matB) {
    const M = matA.length;
    const K = matA[0].length;
    const N = matB[0].length;

    const matC = [];
    const cellSteps = [];
    const stepList = []; // Ordered list of all (row, col) steps for playback

    for (let i = 0; i < M; i++) {
      const rowC = [];
      const rowSteps = [];

      for (let j = 0; j < N; j++) {
        let sum = 0;
        const products = [];
        const terms = [];
        const vectorA = [];
        const vectorB = [];

        for (let k = 0; k < K; k++) {
          const aVal = matA[i][k];
          const bVal = matB[k][j];
          const prod = aVal * bVal;
          sum += prod;

          vectorA.push(aVal);
          vectorB.push(bVal);
          products.push(`(${aVal} × ${bVal})`);
          terms.push(prod);
        }

        rowC.push(sum);

        const stepObj = {
          stepIndex: stepList.length,
          row: i,
          col: j,
          vectorA,
          vectorB,
          products,
          terms,
          sum,
          formulaStr: `${products.join(' + ')} = ${terms.join(' + ')} = ${sum}`,
          simpleDotStr: `[${vectorA.join(', ')}] • [${vectorB.join(', ')}] = ${sum}`
        };

        rowSteps.push(stepObj);
        stepList.push(stepObj);
      }

      matC.push(rowC);
      cellSteps.push(rowSteps);
    }

    return {
      matA,
      matB,
      matC,
      cellSteps,
      stepList,
      M,
      K,
      N
    };
  }

  /**
   * Inspect a batch slice of the tensor multiplication.
   */
  function inspectBatchSlice(analysis, batchIndices, customMatA, customMatB) {
    if (!analysis.isValid) return null;

    const resultBatchShape = analysis.resultBatchShape;
    const padCountA = analysis.maxBatchRank - analysis.batchA.length;
    const padCountB = analysis.maxBatchRank - analysis.batchB.length;

    const sliceIndexA = [];
    const sliceIndexB = [];
    const isBroadcastedA = [];
    const isBroadcastedB = [];

    for (let i = 0; i < resultBatchShape.length; i++) {
      const resIdx = (batchIndices && batchIndices[i] !== undefined) ? batchIndices[i] : 0;

      // Tensor A
      if (i < padCountA) {
        isBroadcastedA.push(true);
      } else {
        const origDimA = analysis.batchA[i - padCountA];
        if (origDimA === 1) {
          sliceIndexA.push(0);
          isBroadcastedA.push(resIdx > 0);
        } else {
          sliceIndexA.push(resIdx);
          isBroadcastedA.push(false);
        }
      }

      // Tensor B
      if (i < padCountB) {
        isBroadcastedB.push(true);
      } else {
        const origDimB = analysis.batchB[i - padCountB];
        if (origDimB === 1) {
          sliceIndexB.push(0);
          isBroadcastedB.push(resIdx > 0);
        } else {
          sliceIndexB.push(resIdx);
          isBroadcastedB.push(false);
        }
      }
    }

    const M = analysis.coreA.M;
    const K = analysis.coreA.K;
    const N = analysis.coreB.N;

    const seedA = sliceIndexA.reduce((acc, v, idx) => acc + (v + 1) * (idx + 2), 1);
    const seedB = sliceIndexB.reduce((acc, v, idx) => acc + (v + 1) * (idx + 3), 3);

    const matA = customMatA || createFriendlyMatrix(M, K, seedA);
    const matB = customMatB || createFriendlyMatrix(K, N, seedB);

    const computed = compute2DMatmul(matA, matB);

    return {
      batchIndices: batchIndices || [],
      sliceIndexA,
      sliceIndexB,
      isBroadcastedA: isBroadcastedA.some(Boolean),
      isBroadcastedB: isBroadcastedB.some(Boolean),
      sliceLabelA: sliceIndexA.length > 0 ? `A[${sliceIndexA.join(',')}, :, :]` : 'A',
      sliceLabelB: sliceIndexB.length > 0 ? `B[${sliceIndexB.join(',')}, :, :]` : 'B',
      sliceLabelC: (batchIndices && batchIndices.length > 0) ? `C[${batchIndices.join(',')}, :, :]` : 'C',
      matA: computed.matA,
      matB: computed.matB,
      matC: computed.matC,
      cellSteps: computed.cellSteps,
      stepList: computed.stepList,
      M,
      K,
      N
    };
  }

  /**
   * Generates clean Python / NumPy snippets and simple Python nested loop for learning.
   */
  function generateCodeSnippets(analysis) {
    const shapeAStr = formatShape(analysis.shapeA);
    const shapeBStr = formatShape(analysis.shapeB);

    const numpyCode = `# 1. NumPy Matrix Multiplication (@ operator)
import numpy as np

# Create two tensors
A = np.array(${shapeAStr})  # shape: ${shapeAStr}
B = np.array(${shapeBStr})  # shape: ${shapeBStr}

# In NumPy: A @ B calls np.matmul(A, B)
C = A @ B

print("Shape of A:", A.shape)
print("Shape of B:", B.shape)
print("Shape of C:", C.shape)  # ${analysis.resultShape ? formatShape(analysis.resultShape) : 'ValueError'}
`;

    const pythonLoopCode = `# What NumPy @ actually does under the hood (for each 2D slice):
# Given Matrix A (${analysis.coreA ? analysis.coreA.M : 'M'} x ${analysis.coreA ? analysis.coreA.K : 'K'}) and Matrix B (${analysis.coreB ? analysis.coreB.K : 'K'} x ${analysis.coreB ? analysis.coreB.N : 'N'})
M, K = ${analysis.coreA ? analysis.coreA.M : 2}, ${analysis.coreA ? analysis.coreA.K : 3}
K, N = ${analysis.coreB ? analysis.coreB.K : 3}, ${analysis.coreB ? analysis.coreB.N : 2}

# Initialize result with zeros
C = [[0 for _ in range(N)] for _ in range(M)]

# 3 Simple Nested Loops:
for i in range(M):          # For each row in A
    for j in range(N):      # For each col in B
        for k in range(K):  # Dot product: multiply and sum!
            C[i][j] += A[i][k] * B[k][j]
`;

    const pytorchCode = `# PyTorch Matrix Multiplication
import torch

A = torch.randn${shapeAStr}
B = torch.randn${shapeBStr}

# In PyTorch: A @ B or torch.matmul(A, B)
C = A @ B
print("Result shape:", C.shape)
`;

    let einsumCode = '# Einstein Summation (np.einsum)\n';
    if (analysis.isValid) {
      einsumCode += `C = np.einsum('...ik,...kj->...ij', A, B)\n` +
        `# Contracts dimension 'k' and keeps batch dimensions '...'`;
    } else {
      einsumCode += `# Shapes cannot be multiplied.\n`;
    }

    return {
      numpy: numpyCode,
      loop: pythonLoopCode,
      pytorch: pytorchCode,
      einsum: einsumCode
    };
  }

  return {
    parseShape,
    formatShape,
    analyzeMatmul,
    createFriendlyMatrix,
    compute2DMatmul,
    inspectBatchSlice,
    generateCodeSnippets
  };
});
