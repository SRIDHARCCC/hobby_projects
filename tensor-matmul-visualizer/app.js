/**
 * NumPy Matmul & Dot Product Visualizer
 * Application Controller & Step-by-Step Playback Engine
 */

(function () {
  'use strict';

  const Engine = window.MatmulEngine;
  if (!Engine) {
    console.error('MatmulEngine not found.');
    return;
  }

  // App State
  const state = {
    // Level 1: 2D State
    shape2DA: [2, 3],
    shape2DB: [3, 2],
    mat2DA: null,
    mat2DB: null,
    computed2D: null,
    currentStepIndex: 0,
    isPlaying: false,
    playTimer: null,
    playSpeed: 1200,

    // Level 2: Batch State
    batchShapeA: [2, 2, 3],
    batchShapeB: [2, 3, 2],
    batchAnalysis: null,
    activeBatchSliceIndex: 0,

    // Level 3: Sandbox State
    sandboxShapeA: '2, 1, 4, 3',
    sandboxShapeB: '1, 5, 3, 6',
    sandboxAnalysis: null
  };

  // DOM Elements - Navigation
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const toast = document.getElementById('toast');
  const resetAppBtn = document.getElementById('resetAppBtn');
  const randomValuesBtn = document.getElementById('randomValuesBtn');

  // DOM Elements - Level 1 (2D)
  const presetChips2D = document.querySelectorAll('#tab-2d .preset-chip');
  const goldenRuleCard = document.getElementById('goldenRuleCard');
  const ruleM = document.getElementById('ruleM');
  const ruleKA = document.getElementById('ruleKA');
  const ruleKB = document.getElementById('ruleKB');
  const ruleN = document.getElementById('ruleN');
  const ruleResultM = document.getElementById('ruleResultM');
  const ruleResultN = document.getElementById('ruleResultN');
  const ruleOutDim = document.getElementById('ruleOutDim');
  const ruleExplanationText = document.getElementById('ruleExplanationText');

  const errorAlertBanner = document.getElementById('errorAlertBanner');
  const errorAlertTitle = document.getElementById('errorAlertTitle');
  const errorAlertMessage = document.getElementById('errorAlertMessage');
  const errorCalloutCode = document.getElementById('errorCalloutCode');

  const playbackControlsBar = document.getElementById('playbackControlsBar');
  const prevStepBtn = document.getElementById('prevStepBtn');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const nextStepBtn = document.getElementById('nextStepBtn');
  const stepCounterText = document.getElementById('stepCounterText');
  const speedSelect = document.getElementById('speedSelect');

  const mainMatricesStage = document.getElementById('mainMatricesStage');
  const matrix2DATable = document.getElementById('matrix2DATable');
  const matrix2DBTable = document.getElementById('matrix2DBTable');
  const matrix2DCTable = document.getElementById('matrix2DCTable');
  const labelDimA = document.getElementById('labelDimA');
  const labelDimB = document.getElementById('labelDimB');
  const labelDimC = document.getElementById('labelDimC');

  const mainDotProductCard = document.getElementById('mainDotProductCard');
  const activeDotCellLabel = document.getElementById('activeDotCellLabel');
  const activeVectorA = document.getElementById('activeVectorA');
  const activeVectorB = document.getElementById('activeVectorB');
  const activeMathCalculation = document.getElementById('activeMathCalculation');

  // DOM Elements - Level 2 (Batches)
  const batchPresets = document.querySelectorAll('#tab-batches .preset-chip');
  const batchSlicesDeck = document.getElementById('batchSlicesDeck');
  const activeBatchSliceTitle = document.getElementById('activeBatchSliceTitle');
  const batchBroadcastNotice = document.getElementById('batchBroadcastNotice');
  const matrixBatchATable = document.getElementById('matrixBatchATable');
  const matrixBatchBTable = document.getElementById('matrixBatchBTable');
  const matrixBatchCTable = document.getElementById('matrixBatchCTable');
  const batchSliceDimA = document.getElementById('batchSliceDimA');
  const batchSliceDimB = document.getElementById('batchSliceDimB');
  const batchSliceDimC = document.getElementById('batchSliceDimC');

  // DOM Elements - Level 3 (Sandbox)
  const sandboxShapeA = document.getElementById('sandboxShapeA');
  const sandboxShapeB = document.getElementById('sandboxShapeB');
  const sandboxValidBadge = document.getElementById('sandboxValidBadge');
  const sandboxResultText = document.getElementById('sandboxResultText');
  const sandboxAlignmentStrip = document.getElementById('sandboxAlignmentStrip');
  const sandboxBanner = document.getElementById('sandboxBanner');
  const sandboxBannerTitle = document.getElementById('sandboxBannerTitle');
  const sandboxBannerDesc = document.getElementById('sandboxBannerDesc');

  // DOM Elements - Level 4 (Cheat Sheet)
  const copyCheatCodeBtn = document.getElementById('copyCheatCodeBtn');
  const cheatCodeBlock = document.getElementById('cheatCodeBlock');

  /**
   * Application Initialization
   */
  function init() {
    setupTabNavigation();
    setupLevel1();
    setupLevel2();
    setupLevel3();
    setupLevel4();

    // Reset button
    if (resetAppBtn) {
      resetAppBtn.addEventListener('click', resetToDefault);
    }

    // Randomize Values button
    if (randomValuesBtn) {
      randomValuesBtn.addEventListener('click', randomize2DValues);
    }
  }

  function resetToDefault() {
    stopAutoPlay();
    state.shape2DA = [2, 3];
    state.shape2DB = [3, 2];
    state.currentStepIndex = 0;
    presetChips2D.forEach(c => c.classList.remove('active'));
    if (presetChips2D[0]) presetChips2D[0].classList.add('active');
    renderLevel1();

    state.batchShapeA = [2, 2, 3];
    state.batchShapeB = [2, 3, 2];
    state.activeBatchSliceIndex = 0;
    renderLevel2();

    sandboxShapeA.value = '2, 1, 4, 3';
    sandboxShapeB.value = '1, 5, 3, 6';
    updateSandbox();

    showToast('Reset to default example!');
  }

  function randomize2DValues() {
    const M = state.shape2DA[0];
    const K = state.shape2DA[1];
    const N = state.shape2DB[1];

    state.mat2DA = generateRandomSmallMatrix(M, K);
    state.mat2DB = generateRandomSmallMatrix(K, N);
    state.computed2D = Engine.compute2DMatmul(state.mat2DA, state.mat2DB);
    state.currentStepIndex = 0;
    render2DMatricesAndHighlight();
    showToast('New matrix numbers generated!');
  }

  function generateRandomSmallMatrix(rows, cols) {
    const mat = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        // Numbers from -2 to 4
        const val = Math.floor(Math.random() * 7) - 2;
        row.push(val);
      }
      mat.push(row);
    }
    return mat;
  }

  /**
   * Navigation Tabs Handling
   */
  function setupTabNavigation() {
    navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        stopAutoPlay();
        const targetTab = tab.getAttribute('data-tab');
        navTabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tabPanes.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        const targetPane = document.getElementById(targetTab);
        if (targetPane) targetPane.classList.add('active');
      });
    });
  }

  /* ==========================================================================
     LEVEL 1: 2D Matrix & Vector Dot Product
     ========================================================================== */

  function setupLevel1() {
    // Preset buttons
    presetChips2D.forEach(chip => {
      chip.addEventListener('click', () => {
        stopAutoPlay();
        presetChips2D.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        const aStr = chip.getAttribute('data-shape-a');
        const bStr = chip.getAttribute('data-shape-b');
        state.shape2DA = aStr.split(',').map(Number);
        state.shape2DB = bStr.split(',').map(Number);
        state.mat2DA = null;
        state.mat2DB = null;
        state.currentStepIndex = 0;

        renderLevel1();
      });
    });

    // Playback buttons
    prevStepBtn.addEventListener('click', () => {
      stopAutoPlay();
      stepPrevious();
    });

    nextStepBtn.addEventListener('click', () => {
      stopAutoPlay();
      stepNext();
    });

    playPauseBtn.addEventListener('click', toggleAutoPlay);

    speedSelect.addEventListener('change', (e) => {
      state.playSpeed = Number(e.target.value);
      if (state.isPlaying) {
        restartAutoPlayTimer();
      }
    });

    renderLevel1();
  }

  function renderLevel1() {
    const analysis = Engine.analyzeMatmul(state.shape2DA, state.shape2DB);

    if (!analysis.isValid) {
      // Show Mismatch Error Banner, hide matrices & controls
      goldenRuleCard.classList.add('hidden');
      playbackControlsBar.classList.add('hidden');
      mainMatricesStage.classList.add('hidden');
      mainDotProductCard.classList.add('hidden');

      errorAlertBanner.classList.remove('hidden');
      errorAlertTitle.textContent = 'Rule A Violation: Inner Dimensions Do Not Match!';
      errorAlertMessage.textContent = analysis.explanation;
      errorCalloutCode.textContent = analysis.errorMessage;
      return;
    }

    // Valid 2D matmul
    errorAlertBanner.classList.add('hidden');
    goldenRuleCard.classList.remove('hidden');
    playbackControlsBar.classList.remove('hidden');
    mainMatricesStage.classList.remove('hidden');
    mainDotProductCard.classList.remove('hidden');

    const M = state.shape2DA[0];
    const K = state.shape2DA[1];
    const N = state.shape2DB[1];

    // Update Golden Rule banner
    ruleM.textContent = M;
    ruleKA.textContent = K;
    ruleKB.textContent = K;
    ruleN.textContent = N;
    ruleResultM.textContent = M;
    ruleResultN.textContent = N;
    ruleOutDim.textContent = `${M} × ${N}`;
    ruleExplanationText.innerHTML = `
      The inner numbers (<span class="highlight-k">${K}</span> and <span class="highlight-k">${K}</span>) <strong>MUST MATCH</strong>. They contract together into the dot product. The result matrix takes the outer dimensions (<strong>${M} &times; ${N}</strong>).
    `;

    // Labels
    labelDimA.textContent = `(${M} × ${K})`;
    labelDimB.textContent = `(${K} × ${N})`;
    labelDimC.textContent = `(${M} × ${N})`;

    // Generate or keep matrices
    if (!state.mat2DA || state.mat2DA.length !== M || state.mat2DA[0].length !== K) {
      state.mat2DA = Engine.createFriendlyMatrix(M, K, 1);
    }
    if (!state.mat2DB || state.mat2DB.length !== K || state.mat2DB[0].length !== N) {
      state.mat2DB = Engine.createFriendlyMatrix(K, N, 2);
    }

    state.computed2D = Engine.compute2DMatmul(state.mat2DA, state.mat2DB);
    state.currentStepIndex = Math.min(state.currentStepIndex, state.computed2D.stepList.length - 1);

    render2DMatricesAndHighlight();
  }

  function render2DMatricesAndHighlight() {
    const { matA, matB, matC, stepList, M, K, N } = state.computed2D;

    // Render Matrix A
    matrix2DATable.style.gridTemplateColumns = `repeat(${K}, 44px)`;
    let htmlA = '';
    for (let r = 0; r < M; r++) {
      for (let c = 0; c < K; c++) {
        htmlA += `<div class="matrix-cell" data-row="${r}" data-col="${c}" id="cell2DA_${r}_${c}">${matA[r][c]}</div>`;
      }
    }
    matrix2DATable.innerHTML = htmlA;

    // Render Matrix B
    matrix2DBTable.style.gridTemplateColumns = `repeat(${N}, 44px)`;
    let htmlB = '';
    for (let r = 0; r < K; r++) {
      for (let c = 0; c < N; c++) {
        htmlB += `<div class="matrix-cell" data-row="${r}" data-col="${c}" id="cell2DB_${r}_${c}">${matB[r][c]}</div>`;
      }
    }
    matrix2DBTable.innerHTML = htmlB;

    // Render Matrix C
    matrix2DCTable.style.gridTemplateColumns = `repeat(${N}, 44px)`;
    let htmlC = '';
    for (let r = 0; r < M; r++) {
      for (let c = 0; c < N; c++) {
        const val = matC[r][c];
        htmlC += `<div class="matrix-cell" data-row="${r}" data-col="${c}" id="cell2DC_${r}_${c}">${val}</div>`;
      }
    }
    matrix2DCTable.innerHTML = htmlC;

    // Attach click listeners to C cells
    const cellsC = matrix2DCTable.querySelectorAll('.matrix-cell');
    cellsC.forEach(cell => {
      const r = Number(cell.getAttribute('data-row'));
      const c = Number(cell.getAttribute('data-col'));

      cell.addEventListener('click', () => {
        stopAutoPlay();
        const stepIdx = r * N + c;
        state.currentStepIndex = stepIdx;
        highlightCurrentStep();
      });

      cell.addEventListener('mouseenter', () => {
        const stepIdx = r * N + c;
        highlightSpecificStep(stepIdx);
      });

      cell.addEventListener('mouseleave', () => {
        highlightCurrentStep();
      });
    });

    highlightCurrentStep();
  }

  function highlightCurrentStep() {
    highlightSpecificStep(state.currentStepIndex);
  }

  function highlightSpecificStep(stepIdx) {
    if (!state.computed2D || !state.computed2D.stepList) return;
    const step = state.computed2D.stepList[stepIdx];
    if (!step) return;

    const { row, col, vectorA, vectorB, sum, products, terms } = step;
    const { K, stepList } = state.computed2D;

    // Clear previous cell highlights
    const allCells = document.querySelectorAll('#tab-2d .matrix-cell');
    allCells.forEach(c => {
      c.classList.remove('cell-highlight-row', 'cell-highlight-col', 'cell-active-result');
    });

    // Highlight row in A
    for (let k = 0; k < K; k++) {
      const cell = document.getElementById(`cell2DA_${row}_${k}`);
      if (cell) cell.classList.add('cell-highlight-row');
    }

    // Highlight col in B
    for (let k = 0; k < K; k++) {
      const cell = document.getElementById(`cell2DB_${k}_${col}`);
      if (cell) cell.classList.add('cell-highlight-col');
    }

    // Highlight cell in C
    const activeCellC = document.getElementById(`cell2DC_${row}_${col}`);
    if (activeCellC) activeCellC.classList.add('cell-active-result');

    // Update status counter
    stepCounterText.textContent = `Computing Element C[${row}, ${col}] (${stepIdx + 1} of ${stepList.length})`;

    // Update Dot Product Card
    activeDotCellLabel.textContent = `C[row ${row}, col ${col}] = ${sum}`;
    activeVectorA.textContent = `[${vectorA.join(', ')}]`;
    activeVectorB.textContent = `[${vectorB.join(', ')}]`;

    // Detailed formula expansion
    const formattedProducts = [];
    for (let k = 0; k < K; k++) {
      formattedProducts.push(`(<span style="color:#f59e0b">${vectorA[k]}</span> &times; <span style="color:#10b981">${vectorB[k]}</span>)`);
    }

    activeMathCalculation.innerHTML = `
      ${formattedProducts.join(' + ')} = ${terms.join(' + ')} = <strong>${sum}</strong>
    `;
  }

  function stepNext() {
    if (!state.computed2D) return;
    const maxSteps = state.computed2D.stepList.length;
    state.currentStepIndex = (state.currentStepIndex + 1) % maxSteps;
    highlightCurrentStep();
  }

  function stepPrevious() {
    if (!state.computed2D) return;
    const maxSteps = state.computed2D.stepList.length;
    state.currentStepIndex = (state.currentStepIndex - 1 + maxSteps) % maxSteps;
    highlightCurrentStep();
  }

  function toggleAutoPlay() {
    if (state.isPlaying) {
      stopAutoPlay();
    } else {
      startAutoPlay();
    }
  }

  function startAutoPlay() {
    state.isPlaying = true;
    playPauseBtn.classList.remove('btn-primary');
    playPauseBtn.classList.add('btn-secondary');
    playPauseBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
      <span>Pause</span>
    `;
    restartAutoPlayTimer();
  }

  function stopAutoPlay() {
    state.isPlaying = false;
    if (state.playTimer) {
      clearInterval(state.playTimer);
      state.playTimer = null;
    }
    if (playPauseBtn) {
      playPauseBtn.classList.remove('btn-secondary');
      playPauseBtn.classList.add('btn-primary');
      playPauseBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        <span>Play Auto-Step</span>
      `;
    }
  }

  function restartAutoPlayTimer() {
    if (state.playTimer) clearInterval(state.playTimer);
    state.playTimer = setInterval(() => {
      stepNext();
    }, state.playSpeed);
  }

  /* ==========================================================================
     LEVEL 2: 3D Batches & Broadcasting
     ========================================================================== */

  function setupLevel2() {
    batchPresets.forEach(chip => {
      chip.addEventListener('click', () => {
        batchPresets.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        const aStr = chip.getAttribute('data-shape-a');
        const bStr = chip.getAttribute('data-shape-b');
        state.batchShapeA = aStr.split(',').map(Number);
        state.batchShapeB = bStr.split(',').map(Number);
        state.activeBatchSliceIndex = 0;

        renderLevel2();
      });
    });

    renderLevel2();
  }

  function renderLevel2() {
    const analysis = Engine.analyzeMatmul(state.batchShapeA, state.batchShapeB);
    state.batchAnalysis = analysis;

    if (!analysis.isValid) return;

    const totalSlices = Math.min(analysis.totalBatchSlices, 12);
    let deckHtml = '';

    for (let i = 0; i < totalSlices; i++) {
      const isActive = (i === state.activeBatchSliceIndex);
      const slice = Engine.inspectBatchSlice(analysis, [i]);

      deckHtml += `
        <div class="batch-page-card ${isActive ? 'active' : ''}" data-slice-index="${i}">
          <div class="batch-page-title">Page / Batch [${i}]</div>
          <div class="batch-page-desc">${slice.sliceLabelA} @ ${slice.sliceLabelB}</div>
        </div>
      `;
    }

    batchSlicesDeck.innerHTML = deckHtml;

    // Attach click listeners to cards
    const cards = batchSlicesDeck.querySelectorAll('.batch-page-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const idx = Number(card.getAttribute('data-slice-index'));
        state.activeBatchSliceIndex = idx;
        renderLevel2();
      });
    });

    // Render active slice matrices
    activeBatchSliceTitle.textContent = `Batch [${state.activeBatchSliceIndex}]`;
    const slice = Engine.inspectBatchSlice(analysis, [state.activeBatchSliceIndex]);

    if (slice.isBroadcastedA || slice.isBroadcastedB) {
      batchBroadcastNotice.innerHTML = `
        <span class="badge badge-warning">Broadcast Active</span> Matrix was stretched to share memory!
      `;
    } else {
      batchBroadcastNotice.textContent = `Standard independent batch multiplication`;
    }

    batchSliceDimA.textContent = `(${slice.M} × ${slice.K})`;
    batchSliceDimB.textContent = `(${slice.K} × ${slice.N})`;
    batchSliceDimC.textContent = `(${slice.M} × ${slice.N})`;

    // Tables
    matrixBatchATable.style.gridTemplateColumns = `repeat(${slice.K}, 38px)`;
    let htmlA = '';
    for (let r = 0; r < slice.M; r++) {
      for (let c = 0; c < slice.K; c++) {
        htmlA += `<div class="matrix-cell">${slice.matA[r][c]}</div>`;
      }
    }
    matrixBatchATable.innerHTML = htmlA;

    matrixBatchBTable.style.gridTemplateColumns = `repeat(${slice.N}, 38px)`;
    let htmlB = '';
    for (let r = 0; r < slice.K; r++) {
      for (let c = 0; c < slice.N; c++) {
        htmlB += `<div class="matrix-cell">${slice.matB[r][c]}</div>`;
      }
    }
    matrixBatchBTable.innerHTML = htmlB;

    matrixBatchCTable.style.gridTemplateColumns = `repeat(${slice.N}, 38px)`;
    let htmlC = '';
    for (let r = 0; r < slice.M; r++) {
      for (let c = 0; c < slice.N; c++) {
        htmlC += `<div class="matrix-cell cell-active-result">${slice.matC[r][c]}</div>`;
      }
    }
    matrixBatchCTable.innerHTML = htmlC;
  }

  /* ==========================================================================
     LEVEL 3: Custom Shape Sandbox
     ========================================================================== */

  function setupLevel3() {
    sandboxShapeA.addEventListener('input', updateSandbox);
    sandboxShapeB.addEventListener('input', updateSandbox);
    updateSandbox();
  }

  function updateSandbox() {
    const valA = sandboxShapeA.value;
    const valB = sandboxShapeB.value;

    const analysis = Engine.analyzeMatmul(valA, valB);
    state.sandboxAnalysis = analysis;

    if (analysis.isValid) {
      sandboxValidBadge.className = 'badge badge-success';
      sandboxValidBadge.textContent = 'Valid Matmul';
      sandboxResultText.textContent = Engine.formatShape(analysis.resultShape);
      sandboxResultText.style.color = '#facc15';

      sandboxBanner.className = 'validation-banner banner-valid mt-4';
      sandboxBannerTitle.textContent = 'NumPy Matmul Compatible!';
      sandboxBannerDesc.textContent = `Valid tensor multiplication yielding ${analysis.totalBatchSlices} batch slice(s) with output shape ${Engine.formatShape(analysis.resultShape)}.`;

      renderSandboxAlignmentStrip(analysis);
    } else {
      sandboxValidBadge.className = 'badge badge-danger';
      sandboxValidBadge.textContent = 'ValueError';
      sandboxResultText.textContent = 'Invalid';
      sandboxResultText.style.color = '#f87171';

      sandboxBanner.className = 'validation-banner banner-invalid mt-4';
      sandboxBannerTitle.textContent = 'NumPy Shape Error!';
      sandboxBannerDesc.innerHTML = `${analysis.simpleRuleMessage || analysis.errorMessage}<br><div class="error-callout-box">${analysis.errorMessage}</div>`;

      renderSandboxAlignmentStrip(analysis);
    }
  }

  function renderSandboxAlignmentStrip(analysis) {
    if (!analysis.shapeA || !analysis.shapeB || analysis.shapeA.length < 2 || analysis.shapeB.length < 2) {
      sandboxAlignmentStrip.innerHTML = '<p class="text-muted">Enter shapes with at least 2 dimensions.</p>';
      return;
    }

    const { alignedBatches, coreA, coreB, errorType } = analysis;

    let html = `
      <div class="strip-tensor-row">
        <div class="strip-row-label">Tensor A (${Engine.formatShape(analysis.shapeA)})</div>
        <div class="strip-cells-group">
    `;

    alignedBatches.forEach(b => {
      html += `<div class="strip-dim-box box-batch"><span style="font-weight:700;">${b.dimA}</span><span style="font-size:0.65rem;">Batch</span></div>`;
    });

    html += `
        <div class="strip-dim-box box-m"><span style="font-weight:700;">${coreA.M}</span><span style="font-size:0.65rem;">M (row)</span></div>
        <div class="strip-dim-box box-k ${errorType === 'CORE_MISMATCH' ? 'box-mismatch' : ''}"><span style="font-weight:700;">${coreA.K}</span><span style="font-size:0.65rem;">K (col)</span></div>
      </div></div>
    `;

    // Tensor B
    html += `
      <div class="strip-tensor-row">
        <div class="strip-row-label">Tensor B (${Engine.formatShape(analysis.shapeB)})</div>
        <div class="strip-cells-group">
    `;

    alignedBatches.forEach(b => {
      html += `<div class="strip-dim-box box-batch"><span style="font-weight:700;">${b.dimB}</span><span style="font-size:0.65rem;">Batch</span></div>`;
    });

    html += `
        <div class="strip-dim-box box-k ${errorType === 'CORE_MISMATCH' ? 'box-mismatch' : ''}"><span style="font-weight:700;">${coreB.K}</span><span style="font-size:0.65rem;">K (row)</span></div>
        <div class="strip-dim-box box-n"><span style="font-weight:700;">${coreB.N}</span><span style="font-size:0.65rem;">N (col)</span></div>
      </div></div>
    `;

    // Result Row
    if (analysis.isValid) {
      html += `
        <div class="strip-tensor-row" style="border-top: 1px solid var(--border-color); padding-top: 0.5rem;">
          <div class="strip-row-label" style="color: #facc15;">Result C (${Engine.formatShape(analysis.resultShape)})</div>
          <div class="strip-cells-group">
      `;

      analysis.resultBatchShape.forEach(dim => {
        html += `<div class="strip-dim-box box-batch"><span style="font-weight:700;">${dim}</span><span style="font-size:0.65rem;">Batch</span></div>`;
      });

      html += `
          <div class="strip-dim-box box-m"><span style="font-weight:700;">${coreA.M}</span><span style="font-size:0.65rem;">M</span></div>
          <div class="strip-dim-box box-n"><span style="font-weight:700;">${coreB.N}</span><span style="font-size:0.65rem;">N</span></div>
        </div></div>
      `;
    }

    sandboxAlignmentStrip.innerHTML = html;
  }

  /* ==========================================================================
     LEVEL 4: Cheat Sheet & Copy Code
     ========================================================================== */

  function setupLevel4() {
    if (copyCheatCodeBtn) {
      copyCheatCodeBtn.addEventListener('click', () => {
        const code = cheatCodeBlock.textContent;
        navigator.clipboard.writeText(code).then(() => {
          showToast('Python code copied to clipboard!');
        });
      });
    }
  }

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
