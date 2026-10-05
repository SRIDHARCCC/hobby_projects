/**
 * SoftmaxLab: Softmax & LLM Sampling Visualizer - UI Controller
 * Integrates SamplingEngine with interactive DOM elements, responsive charts,
 * Monte Carlo simulator, and Autoregressive Story Generator.
 */

(function () {
  'use strict';

  // Ensure SamplingEngine is loaded
  const Engine = window.SamplingEngine;
  if (!Engine) {
    console.error('SamplingEngine not found! Make sure sampling-engine.js is included before app.js.');
    return;
  }

  /* ==========================================================================
     Application State
     ========================================================================== */
  const state = {
    activeTab: 'tab-playground',
    activeScenarioId: 'capital-france',
    tokens: [],
    temperature: 1.0,
    topK: 8,
    topP: 1.0,
    activeView: 'final-probs', // 'final-probs' | 'pipeline-compare' | 'cdf-curve'
    
    // Sampler & Monte Carlo state
    lastSample: null,
    mcSampleCount: 1000,
    mcResults: null,

    // Autoregressive Story Generator State
    story: {
      activeStoryId: 'cyberpunk',
      stepIndex: 0,
      generatedTokens: [],
      temperature: 0.70,
      topK: 3,
      topP: 0.90,
      isPlaying: false,
      timer: null
    },

    // Quiz State
    quiz: {
      userAnswers: {},
      score: 0
    }
  };

  /* ==========================================================================
     Quiz Questions Definition
     ========================================================================== */
  const QUIZ_QUESTIONS = [
    {
      id: 'q1',
      question: 'What happens to the output probability distribution when Temperature T approaches 0 (e.g. T = 0.01)?',
      options: [
        'All tokens become equally likely with uniform probability 1/N.',
        'The distribution collapses into a one-hot (delta) distribution on the highest logit token (Greedy/Argmax).',
        'Probabilities become negative.',
        'The model alternates randomly between top 3 tokens.'
      ],
      correctIndex: 1,
      explanation: 'As T &rarr; 0, differences between logits are multiplied towards infinity. The largest logit overwhelmingly dominates the exponentiation, yielding probability ~1.0 for the argmax token and 0.0 for all others. This is deterministic Greedy Decoding.'
    },
    {
      id: 'q2',
      question: 'If Top-K is set to 3 on a vocabulary of 50,000 tokens, what is the maximum number of tokens that can have a non-zero sampling probability?',
      options: [
        'Exactly 3 tokens (all other 49,997 are zeroed and pruned).',
        '50,000 tokens, but weighted by 3.',
        '3% of the vocabulary (1,500 tokens).',
        'Depends on the temperature.'
      ],
      correctIndex: 0,
      explanation: 'Top-K strictly truncates the candidate list to the K tokens with the highest probabilities. All remaining tokens outside the top K are zeroed, and the surviving K tokens are renormalized so their probabilities sum to 1.0.'
    },
    {
      id: 'q3',
      question: 'Why is Top-P (Nucleus) sampling generally preferred over fixed Top-K in modern LLMs?',
      options: [
        'Top-P is faster to compute than Top-K.',
        'Top-P removes the need for the Softmax function completely.',
        'Top-P dynamically expands or contracts the candidate pool based on model confidence.',
        'Top-P guarantees that the temperature is always 1.0.'
      ],
      correctIndex: 2,
      explanation: 'When the model is confident (e.g. "capital of France is ___"), the nucleus contracts to 1 or 2 tokens. When the model is uncertain, the nucleus expands to dozens of plausible candidates. A fixed Top-K cannot adapt to varying uncertainty.'
    },
    {
      id: 'q4',
      question: 'A student sets Temperature to 10.0 while prompting an LLM. What will the generated output most likely look like?',
      options: [
        'Completely deterministic and repetitive identical sentences.',
        'Chaotic, nonsensical, ungrammatical, and highly random text (hallucinations/gibberish).',
        'Perfect mathematical proofs with zero errors.',
        'The model will stop producing tokens entirely.'
      ],
      correctIndex: 1,
      explanation: 'When T is very high (T=10.0), z_i / T approaches 0 for all tokens, meaning e^0 = 1. The distribution flattens into a nearly uniform distribution where unlikely words and punctuation have almost equal odds of being chosen.'
    },
    {
      id: 'q5',
      question: 'Why do production LLM implementations subtract max(z) from logits before calculating exp(z) in Softmax?',
      options: [
        'To prevent numerical overflow (e.g. exp(1000) = Infinity -> NaN) in IEEE 754 floating point arithmetic.',
        'To make all probabilities integers.',
        'Because negative numbers cannot be processed by GPUs.',
        'To speed up Top-P nucleus sorting.'
      ],
      correctIndex: 0,
      explanation: 'In 32-bit floats, exp(x) overflows when x > ~88. Subtraction of max(z) shifts the maximum exponent to exp(0) = 1.0. Because Softmax is shift-invariant (e^(z-c) / sum e^(z_j-c) == e^z / sum e^z_j), the probabilities are mathematically identical but completely immune to overflow.'
    },
    {
      id: 'q6',
      question: 'If Token A has logit z_A = 10.0 and Token B has logit z_B = 5.0 (at T=1.0), what is the ratio of their probabilities P(A) / P(B)?',
      options: [
        'Exactly 2.0 times higher (10 / 5).',
        'e^(10 - 5) = e^5 &approx; 148.4 times higher.',
        'They have equal probability.',
        '5.0 times higher.'
      ],
      correctIndex: 1,
      explanation: 'Softmax exponentiates logits: P(A)/P(B) = (e^(z_A) / S) / (e^(z_B) / S) = e^(z_A - z_B). Here e^(10 - 5) = e^5 &approx; 148.41. A linear difference in logits creates an exponential difference in probabilities!'
    }
  ];

  /* ==========================================================================
     DOM Element References
     ========================================================================== */
  const dom = {
    // Tabs
    navTabs: document.querySelectorAll('.nav-tab'),
    tabPanes: document.querySelectorAll('.tab-pane'),

    // Header Controls
    btnQuickGreedy: document.getElementById('btnQuickGreedy'),
    btnQuickBalanced: document.getElementById('btnQuickBalanced'),
    btnResetApp: document.getElementById('btnResetApp'),

    // Preset Scenarios
    presetChipsContainer: document.getElementById('presetChipsContainer'),
    activePromptText: document.getElementById('activePromptText'),
    activeScenarioDesc: document.getElementById('activeScenarioDesc'),

    // Sliders & Hyperparam Inputs
    tempSlider: document.getElementById('tempSlider'),
    tempValDisplay: document.getElementById('tempValDisplay'),
    tempRegimeBadge: document.getElementById('tempRegimeBadge'),
    tempMicroButtons: document.querySelectorAll('[data-set-temp]'),

    topKSlider: document.getElementById('topKSlider'),
    topKValDisplay: document.getElementById('topKValDisplay'),
    topKRegimeBadge: document.getElementById('topKRegimeBadge'),
    topKMicroButtons: document.querySelectorAll('[data-set-topk]'),

    topPSlider: document.getElementById('topPSlider'),
    topPValDisplay: document.getElementById('topPValDisplay'),
    topPRegimeBadge: document.getElementById('topPRegimeBadge'),
    topPMicroButtons: document.querySelectorAll('[data-set-topp]'),

    // Metrics
    metricEntropy: document.getElementById('metricEntropy'),
    metricEntropyFill: document.getElementById('metricEntropyFill'),
    metricPerplexity: document.getElementById('metricPerplexity'),
    metricActiveCount: document.getElementById('metricActiveCount'),
    metricActiveCaption: document.getElementById('metricActiveCaption'),
    metricPrunedCount: document.getElementById('metricPrunedCount'),
    metricPrunedCaption: document.getElementById('metricPrunedCaption'),

    // Charts & View Toggles
    viewToggleBtns: document.querySelectorAll('.view-toggle-btn'),
    mainChartContainer: document.getElementById('mainChartContainer'),

    // Table
    tokenTableBody: document.getElementById('tokenTableBody'),
    btnAddToken: document.getElementById('btnAddToken'),
    btnResetLogits: document.getElementById('btnResetLogits'),

    // Sampler
    rouletteTrack: document.getElementById('rouletteTrack'),
    rouletteNeedle: document.getElementById('rouletteNeedle'),
    needleLabel: document.getElementById('needleLabel'),
    btnSampleOnce: document.getElementById('btnSampleOnce'),
    sampledTokenName: document.getElementById('sampledTokenName'),
    sampledDetailsText: document.getElementById('sampledDetailsText'),

    // Monte Carlo
    mcBtns: document.querySelectorAll('.mc-btn'),
    btnRunMonteCarlo: document.getElementById('btnRunMonteCarlo'),
    mcChartBox: document.getElementById('mcChartBox'),
    mcStatsRow: document.getElementById('mcStatsRow'),
    mcTotalDraws: document.getElementById('mcTotalDraws'),
    mcMaxError: document.getElementById('mcMaxError'),
    mcMse: document.getElementById('mcMse'),

    // Story Tab
    storyChipsContainer: document.getElementById('storyChipsContainer'),
    storyTempSlider: document.getElementById('storyTempSlider'),
    storyTempVal: document.getElementById('storyTempVal'),
    storyTopKSlider: document.getElementById('storyTopKSlider'),
    storyTopKVal: document.getElementById('storyTopKVal'),
    storyTopPSlider: document.getElementById('storyTopPSlider'),
    storyTopPVal: document.getElementById('storyTopPVal'),
    storyTerminalText: document.getElementById('storyTerminalText'),
    storyCandidatesGrid: document.getElementById('storyCandidatesGrid'),
    storyStatusBadge: document.getElementById('storyStatusBadge'),
    btnStoryStep: document.getElementById('btnStoryStep'),
    btnStoryAutoPlay: document.getElementById('btnStoryAutoPlay'),
    btnStoryReset: document.getElementById('btnStoryReset'),

    // Quiz Tab
    quizQuestionsContainer: document.getElementById('quizQuestionsContainer'),
    quizScoreBadge: document.getElementById('quizScoreBadge'),
    btnResetQuiz: document.getElementById('btnResetQuiz')
  };

  /* ==========================================================================
     Initialization
     ========================================================================== */
  function init() {
    setupTabSwitching();
    initPresets();
    initStoryTab();
    initQuizTab();
    bindEventListeners();
    loadScenario(state.activeScenarioId);
  }

  /* ==========================================================================
     Tab Navigation
     ========================================================================== */
  function setupTabSwitching() {
    dom.navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('data-tab');
        state.activeTab = targetId;

        dom.navTabs.forEach(t => {
          const isActive = t === tab;
          t.classList.toggle('active', isActive);
          t.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        dom.tabPanes.forEach(pane => {
          pane.classList.toggle('active', pane.id === targetId);
        });
      });
    });
  }

  /* ==========================================================================
     Presets & Scenarios
     ========================================================================== */
  function initPresets() {
    dom.presetChipsContainer.innerHTML = '';
    Engine.PRESET_SCENARIOS.forEach(sc => {
      const btn = document.createElement('button');
      btn.className = `preset-chip ${sc.id === state.activeScenarioId ? 'active' : ''}`;
      btn.dataset.scenarioId = sc.id;
      btn.innerHTML = `${sc.title} <span class="badge badge-subtle ml-1">${sc.badge}</span>`;
      btn.addEventListener('click', () => loadScenario(sc.id));
      dom.presetChipsContainer.appendChild(btn);
    });
  }

  function loadScenario(scenarioId) {
    const sc = Engine.PRESET_SCENARIOS.find(s => s.id === scenarioId) || Engine.PRESET_SCENARIOS[0];
    state.activeScenarioId = sc.id;
    // Deep clone tokens
    state.tokens = JSON.parse(JSON.stringify(sc.tokens));

    // Update active chip
    document.querySelectorAll('.preset-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.scenarioId === sc.id);
    });

    // Update prompt banner
    dom.activePromptText.textContent = `"${sc.prompt} [ ... ]"`;
    dom.activeScenarioDesc.textContent = sc.description;

    // Reset Top-K bounds
    updateTopKBounds();

    // Recompute and update view
    updatePipelineAndRender();
  }

  function updateTopKBounds() {
    const n = Math.max(1, state.tokens.length);
    dom.topKSlider.max = n;
    if (state.topK > n) {
      state.topK = n;
      dom.topKSlider.value = n;
    }
  }

  /* ==========================================================================
     Pipeline Calculation & State Updates
     ========================================================================== */
  function getPipeline() {
    return Engine.runSamplingPipeline(state.tokens, {
      temperature: state.temperature,
      topK: state.topK,
      topP: state.topP
    });
  }

  function updatePipelineAndRender() {
    const pipeline = getPipeline();

    updateHyperparamDisplays();
    updateMetrics(pipeline);
    renderMainChart(pipeline);
    renderTokenTable(pipeline);
    renderRouletteTrack(pipeline);

    if (state.mcResults) {
      runMonteCarlo();
    }
  }

  /* ==========================================================================
     Hyperparameters & Badges
     ========================================================================== */
  function updateHyperparamDisplays() {
    // Temperature
    dom.tempValDisplay.textContent = state.temperature.toFixed(2);
    dom.tempSlider.value = state.temperature;

    let tempBadge = 'Standard (T=1.0)';
    if (state.temperature <= 0.1) tempBadge = 'Argmax / Greedy Limit';
    else if (state.temperature < 0.6) tempBadge = 'Focused / Low Entropy';
    else if (state.temperature <= 1.1) tempBadge = 'Balanced / Model Native';
    else if (state.temperature <= 1.8) tempBadge = 'High Creativity';
    else tempBadge = 'Chaotic / High Hallucination';
    dom.tempRegimeBadge.textContent = tempBadge;

    dom.tempMicroButtons.forEach(btn => {
      const val = parseFloat(btn.dataset.setTemp);
      btn.classList.toggle('active', Math.abs(val - state.temperature) < 0.04);
    });

    // Top-K
    const n = state.tokens.length;
    dom.topKValDisplay.textContent = state.topK >= n ? `${state.topK} (All)` : state.topK;
    dom.topKSlider.value = state.topK;

    let kBadge = `Top-${state.topK} Active`;
    if (state.topK === 1) kBadge = 'K=1 (Strict Argmax)';
    else if (state.topK >= n) kBadge = 'All Tokens (No Truncation)';
    dom.topKRegimeBadge.textContent = kBadge;

    dom.topKMicroButtons.forEach(btn => {
      const val = btn.dataset.setTopk;
      if (val === 'max') {
        btn.classList.toggle('active', state.topK >= n);
      } else {
        btn.classList.toggle('active', parseInt(val, 10) === state.topK);
      }
    });

    // Top-P
    dom.topPValDisplay.textContent = state.topP.toFixed(2);
    dom.topPSlider.value = state.topP;

    let pBadge = `Nucleus P=${state.topP.toFixed(2)}`;
    if (state.topP >= 0.99) pBadge = 'Full Mass (Off)';
    else if (state.topP <= 0.5) pBadge = 'Tight Nucleus';
    else pBadge = 'Dynamic Nucleus';
    dom.topPRegimeBadge.textContent = pBadge;

    dom.topPMicroButtons.forEach(btn => {
      const val = parseFloat(btn.dataset.setTopp);
      btn.classList.toggle('active', Math.abs(val - state.topP) < 0.02);
    });
  }

  /* ==========================================================================
     Metrics
     ========================================================================== */
  function updateMetrics(pipeline) {
    const H = pipeline.metrics.finalEntropy;
    const perplexity = pipeline.metrics.finalPerplexity;
    const active = pipeline.metrics.activeCount;
    const total = pipeline.metrics.totalCount;
    const pruned = total - active;

    dom.metricEntropy.textContent = `${H.toFixed(2)} bits`;
    const maxPossibleEntropy = Math.log2(Math.max(1, total));
    const entropyPercent = maxPossibleEntropy > 0 ? Math.min(100, (H / maxPossibleEntropy) * 100) : 0;
    dom.metricEntropyFill.style.width = `${entropyPercent}%`;

    dom.metricPerplexity.textContent = perplexity.toFixed(2);
    dom.metricActiveCount.textContent = `${active} / ${total}`;
    dom.metricActiveCaption.textContent = active === 1 ? 'Deterministic single choice' : `${active} tokens eligible for draw`;

    dom.metricPrunedCount.textContent = `${pruned} pruned`;
    if (pruned === 0) {
      dom.metricPrunedCaption.textContent = 'Zero tokens truncated';
      dom.metricPrunedCaption.className = 'metric-caption text-muted';
    } else {
      dom.metricPrunedCaption.textContent = 'Filtered by Top-K / Top-P';
      dom.metricPrunedCaption.className = 'metric-caption text-warning';
    }
  }

  /* ==========================================================================
     Main Visualizer Chart
     ========================================================================== */
  function renderMainChart(pipeline) {
    if (state.activeView === 'final-probs') {
      renderFinalProbsView(pipeline);
    } else if (state.activeView === 'pipeline-compare') {
      renderPipelineCompareView(pipeline);
    } else if (state.activeView === 'cdf-curve') {
      renderCdfCurveView(pipeline);
    }
  }

  function renderFinalProbsView(pipeline) {
    const tokens = pipeline.finalTokens;
    let html = '<div class="bars-wrapper">';

    tokens.forEach((t) => {
      const prob = t.finalProb || 0;
      const probPct = (prob * 100).toFixed(1);
      const heightPct = Math.max(3, Math.min(100, prob * 100));

      let barClass = 'bar-active';
      let statusText = 'Active';
      if (t.prunedBy === 'top_k') {
        barClass = 'bar-pruned-topk';
        statusText = 'Cut by Top-K';
      } else if (t.prunedBy === 'top_p') {
        barClass = 'bar-pruned-topp';
        statusText = 'Cut by Top-P';
      }

      html += `
        <div class="chart-bar-col" title="${t.token}: ${probPct}% (${statusText})">
          <div class="bar-val-label">${t.isSampleable ? probPct + '%' : '0%'}</div>
          <div class="bar-pill ${barClass}" style="height: ${t.isSampleable ? heightPct : 6}%;"></div>
          <div class="bar-token-label">${escapeHtml(t.token)}</div>
        </div>
      `;
    });

    html += '</div>';
    dom.mainChartContainer.innerHTML = html;
  }

  function renderPipelineCompareView(pipeline) {
    const tokens = pipeline.finalTokens;
    const stages = [
      { name: '1. Raw Logits (z)', key: 'rawLogit', format: v => v.toFixed(1) },
      { name: '2. Softmax (Base %)', key: 'preTopKProb', format: v => (v * 100).toFixed(1) + '%' },
      { name: '3. After Top-K %', key: 'topKProb', format: v => (v * 100).toFixed(1) + '%' },
      { name: '4. Final Sample %', key: 'finalProb', format: v => (v * 100).toFixed(1) + '%' }
    ];

    const colors = ['#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#fb923c', '#4ade80', '#2dd4bf', '#a78bfa'];

    let html = '<div class="stage-compare-grid">';

    stages.forEach(stage => {
      html += `
        <div class="stage-row">
          <div class="stage-row-label">${stage.name}</div>
          <div class="stage-bars-container">
      `;

      let sumVal = 0;
      if (stage.key === 'rawLogit') {
        // Shift positive for stacked visual
        const minLogit = Math.min(0, ...tokens.map(t => t.rawLogit));
        const shifted = tokens.map(t => t.rawLogit - minLogit + 0.5);
        sumVal = shifted.reduce((a, b) => a + b, 0);
        tokens.forEach((t, i) => {
          const widthPct = ((shifted[i] / sumVal) * 100).toFixed(1);
          html += `<div class="stage-bar-slice" style="width: ${widthPct}%; background: ${colors[i % colors.length]};" title="${t.token}: ${t.rawLogit.toFixed(1)}">${escapeHtml(t.token)}</div>`;
        });
      } else {
        tokens.forEach((t, i) => {
          const val = t[stage.key] || 0;
          const widthPct = (val * 100).toFixed(1);
          if (val > 0.01) {
            html += `<div class="stage-bar-slice" style="width: ${widthPct}%; background: ${colors[i % colors.length]};" title="${t.token}: ${(val*100).toFixed(1)}%">${escapeHtml(t.token)}</div>`;
          }
        });
      }

      html += `
          </div>
          <div class="stage-row-metric font-mono text-muted text-xs text-right">100%</div>
        </div>
      `;
    });

    html += '</div>';
    dom.mainChartContainer.innerHTML = html;
  }

  function renderCdfCurveView(pipeline) {
    const tokens = pipeline.finalTokens;
    const P = state.topP;
    const topPPct = (P * 100).toFixed(0);

    let html = `
      <div class="cdf-container">
        <div class="cdf-topp-line" style="bottom: ${topPPct}%;">
          <div class="cdf-topp-label">Top-P Threshold: ${topPPct}%</div>
        </div>
        <div class="bars-wrapper" style="height: 190px;">
    `;

    tokens.forEach((t) => {
      const cumEnd = t.cumProbAfter || t.preTopKProb || 0;
      const heightPct = Math.min(100, Math.max(4, cumEnd * 100));
      const inNucleus = t.inNucleus !== false && t.prunedBy !== 'top_k';
      const barClass = inNucleus ? 'bar-active' : 'bar-pruned-topp';

      html += `
        <div class="chart-bar-col" title="${t.token}: Cumul ${ (cumEnd * 100).toFixed(1) }% (In Nucleus: ${inNucleus ? 'Yes' : 'Cut'})">
          <div class="bar-val-label font-mono text-xs">${ (cumEnd * 100).toFixed(0) }%</div>
          <div class="bar-pill ${barClass}" style="height: ${heightPct}%;"></div>
          <div class="bar-token-label">${escapeHtml(t.token)}</div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    dom.mainChartContainer.innerHTML = html;
  }

  /* ==========================================================================
     Token Table & Inline Editor
     ========================================================================== */
  function renderTokenTable(pipeline) {
    dom.tokenTableBody.innerHTML = '';

    pipeline.finalTokens.forEach((t) => {
      const tr = document.createElement('tr');

      const isSampleable = t.isSampleable;
      let statusBadge = '<span class="status-badge status-active">Active</span>';
      if (t.prunedBy === 'top_k') {
        statusBadge = '<span class="status-badge status-topk">Cut: Top-K</span>';
      } else if (t.prunedBy === 'top_p') {
        statusBadge = '<span class="status-badge status-topp">Cut: Top-P</span>';
      }

      const rawZ = t.rawLogit;
      const scaledZ = t.scaledLogit;
      const expVal = t.exponential;
      const baseProb = ((t.preTopKProb || 0) * 100).toFixed(1);
      const finalProb = ((t.finalProb || 0) * 100).toFixed(1);
      const cumProb = ((t.cumProbAfter || 0) * 100).toFixed(1);

      tr.innerHTML = `
        <td class="token-cell-token">
          <input type="text" class="token-logit-input font-mono" style="width: 80px;" value="${escapeHtml(t.token)}" data-action="rename-token" data-index="${t.originalIndex ?? t.index}">
        </td>
        <td>
          <input type="number" step="0.5" class="token-logit-input" value="${rawZ.toFixed(1)}" data-action="edit-logit" data-index="${t.originalIndex ?? t.index}">
        </td>
        <td class="font-mono text-muted">${scaledZ.toFixed(2)}</td>
        <td class="font-mono text-muted">${expVal > 1000 ? expVal.toExponential(1) : expVal.toFixed(2)}</td>
        <td class="font-mono">${baseProb}%</td>
        <td class="font-mono">#${t.rank || '-'}</td>
        <td class="font-mono text-muted">${cumProb}%</td>
        <td class="font-mono text-bold ${isSampleable ? 'text-accent' : 'text-muted'}">${finalProb}%</td>
        <td>${statusBadge}</td>
        <td>
          <button class="btn-delete-token" title="Remove token" data-action="delete-token" data-index="${t.originalIndex ?? t.index}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </td>
      `;

      dom.tokenTableBody.appendChild(tr);
    });
  }

  /* ==========================================================================
     Roulette Track & Stochastic Sampler
     ========================================================================== */
  function renderRouletteTrack(pipeline) {
    const colors = ['#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#fb923c', '#4ade80', '#2dd4bf', '#a78bfa'];
    dom.rouletteTrack.innerHTML = '';

    pipeline.finalTokens.forEach((t, i) => {
      const prob = t.finalProb || 0;
      if (prob > 0.005) {
        const slice = document.createElement('div');
        slice.className = 'roulette-slice';
        slice.style.width = `${(prob * 100).toFixed(2)}%`;
        slice.style.backgroundColor = colors[i % colors.length];
        slice.textContent = prob > 0.05 ? t.token : '';
        slice.title = `${t.token}: [${t.cdfStart.toFixed(3)}, ${t.cdfEnd.toFixed(3)}) (${(prob * 100).toFixed(1)}%)`;
        dom.rouletteTrack.appendChild(slice);
      }
    });
  }

  function sampleNextToken() {
    const pipeline = getPipeline();
    const result = Engine.sampleSingleToken(pipeline);
    state.lastSample = result;

    // Animate Needle
    const rollPct = (result.roll * 100).toFixed(2);
    dom.rouletteNeedle.style.left = `${rollPct}%`;
    dom.needleLabel.textContent = `r = ${result.roll.toFixed(4)}`;

    // Update Card
    dom.sampledTokenName.textContent = `"${result.token}"`;
    dom.sampledTokenName.style.transform = 'scale(1.15)';
    setTimeout(() => { dom.sampledTokenName.style.transform = 'scale(1)'; }, 200);

    const tokenData = result.chosenToken;
    const finalPct = ((tokenData.finalProb || 0) * 100).toFixed(1);
    dom.sampledDetailsText.innerHTML = `
      Random draw <strong>r = ${result.roll.toFixed(4)}</strong> landed in cumulative interval 
      <span class="font-mono">[${tokenData.cdfStart.toFixed(3)}, ${tokenData.cdfEnd.toFixed(3)})</span>.<br>
      Token probability: <strong>${finalPct}%</strong>. Rank: <strong>#${tokenData.rank}</strong>.
    `;
  }

  /* ==========================================================================
     Monte Carlo Simulation Lab
     ========================================================================== */
  function runMonteCarlo() {
    const pipeline = getPipeline();
    const mc = Engine.runMonteCarloSimulation(pipeline, state.mcSampleCount);
    state.mcResults = mc;

    dom.mcChartBox.innerHTML = '';
    mc.results.forEach(item => {
      const empPct = (item.empiricalProb * 100).toFixed(1);
      const theoPct = (item.theoreticalProb * 100).toFixed(1);

      const row = document.createElement('div');
      row.className = 'mc-bar-row';
      row.innerHTML = `
        <div class="mc-bar-token" title="${item.token}">${escapeHtml(item.token)}</div>
        <div class="mc-bar-track">
          <div class="mc-bar-empirical" style="width: ${empPct}%;"></div>
          <div class="mc-bar-target-marker" style="left: ${theoPct}%;" title="Theoretical: ${theoPct}%"></div>
        </div>
        <div class="font-mono text-xs text-right">
          <span class="text-accent">${empPct}%</span> <span class="text-muted">/ ${theoPct}%</span>
        </div>
      `;
      dom.mcChartBox.appendChild(row);
    });

    dom.mcStatsRow.style.display = 'flex';
    dom.mcTotalDraws.textContent = mc.sampleCount.toLocaleString();
    dom.mcMaxError.textContent = `${(mc.maxAbsError * 100).toFixed(2)}%`;
    dom.mcMse.textContent = mc.meanSquaredError.toFixed(5);
  }

  /* ==========================================================================
     Tab 2: Autoregressive Story Generator
     ========================================================================== */
  function initStoryTab() {
    dom.storyChipsContainer.innerHTML = '';
    Engine.AUTOREGRESSIVE_STORIES.forEach(story => {
      const btn = document.createElement('button');
      btn.className = `preset-chip ${story.id === state.story.activeStoryId ? 'active' : ''}`;
      btn.dataset.storyId = story.id;
      btn.textContent = story.title;
      btn.addEventListener('click', () => loadStory(story.id));
      dom.storyChipsContainer.appendChild(btn);
    });

    loadStory(state.story.activeStoryId);
  }

  function loadStory(storyId) {
    const storyDef = Engine.AUTOREGRESSIVE_STORIES.find(s => s.id === storyId) || Engine.AUTOREGRESSIVE_STORIES[0];
    state.story.activeStoryId = storyDef.id;
    state.story.stepIndex = 0;
    state.story.generatedTokens = [];
    if (state.story.timer) {
      clearInterval(state.story.timer);
      state.story.timer = null;
      state.story.isPlaying = false;
      dom.btnStoryAutoPlay.textContent = 'Auto-Play Story';
    }

    document.querySelectorAll('.story-chips-container .preset-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.storyId === storyDef.id);
    });

    renderStoryState();
  }

  function renderStoryState() {
    const storyDef = Engine.AUTOREGRESSIVE_STORIES.find(s => s.id === state.story.activeStoryId);
    if (!storyDef) return;

    // Render Terminal text
    let terminalHTML = `<span>${storyDef.initialPrompt}</span>`;
    state.story.generatedTokens.forEach(t => {
      terminalHTML += ` <span class="story-token ${t.probClass}" title="P = ${(t.prob*100).toFixed(1)}%">${escapeHtml(t.token)}</span>`;
    });
    dom.storyTerminalText.innerHTML = terminalHTML;

    // Current step choices
    const currentStep = storyDef.steps[state.story.stepIndex];
    dom.storyCandidatesGrid.innerHTML = '';

    if (!currentStep) {
      dom.storyStatusBadge.textContent = 'Story Complete';
      dom.storyStatusBadge.className = 'terminal-status text-success';
      dom.storyCandidatesGrid.innerHTML = '<div class="text-muted text-sm py-2">Generation finished! Click "Restart Story" to test another path.</div>';
      return;
    }

    dom.storyStatusBadge.textContent = `Step ${state.story.stepIndex + 1} of ${storyDef.steps.length}`;
    dom.storyStatusBadge.className = 'terminal-status';

    // Compute distribution over currentStep.tokenOptions using story hyperparams
    const storyPipeline = Engine.runSamplingPipeline(currentStep.tokenOptions, {
      temperature: state.story.temperature,
      topK: state.story.topK,
      topP: state.story.topP
    });

    storyPipeline.finalTokens.forEach(candidate => {
      const prob = candidate.finalProb || 0;
      const probPct = (prob * 100).toFixed(1);
      const isSampleable = candidate.isSampleable;

      const card = document.createElement('div');
      card.className = 'candidate-card';
      if (!isSampleable) card.style.opacity = '0.4';

      card.innerHTML = `
        <div class="candidate-token-title">${escapeHtml(candidate.token)}</div>
        <div class="candidate-prob-bar">
          <div class="candidate-prob-fill" style="width: ${probPct}%;"></div>
        </div>
        <div class="candidate-footer">
          <span>Logit: ${candidate.rawLogit.toFixed(1)}</span>
          <span class="text-bold ${isSampleable ? 'text-accent' : 'text-muted'}">${probPct}%</span>
        </div>
      `;

      card.addEventListener('click', () => {
        advanceStoryWithToken(candidate);
      });

      dom.storyCandidatesGrid.appendChild(card);
    });
  }

  function advanceStoryWithToken(chosenCandidate) {
    const storyDef = Engine.AUTOREGRESSIVE_STORIES.find(s => s.id === state.story.activeStoryId);
    if (!storyDef) return;

    const prob = chosenCandidate.finalProb || 0;
    let probClass = 'token-prob-high';
    if (prob < 0.20) probClass = 'token-prob-creative';
    else if (prob < 0.50) probClass = 'token-prob-med';

    state.story.generatedTokens.push({
      token: chosenCandidate.token,
      prob,
      probClass
    });

    const opt = storyDef.steps[state.story.stepIndex]?.tokenOptions.find(o => o.token === chosenCandidate.token);
    if (opt && typeof opt.nextStep === 'number') {
      state.story.stepIndex = opt.nextStep;
    } else {
      state.story.stepIndex = storyDef.steps.length; // Complete
    }

    renderStoryState();
  }

  function stepStory() {
    const storyDef = Engine.AUTOREGRESSIVE_STORIES.find(s => s.id === state.story.activeStoryId);
    if (!storyDef || state.story.stepIndex >= storyDef.steps.length) return;

    const currentStep = storyDef.steps[state.story.stepIndex];
    const storyPipeline = Engine.runSamplingPipeline(currentStep.tokenOptions, {
      temperature: state.story.temperature,
      topK: state.story.topK,
      topP: state.story.topP
    });

    const sample = Engine.sampleSingleToken(storyPipeline);
    advanceStoryWithToken(sample.chosenToken);
  }

  function toggleAutoPlayStory() {
    if (state.story.isPlaying) {
      clearInterval(state.story.timer);
      state.story.timer = null;
      state.story.isPlaying = false;
      dom.btnStoryAutoPlay.textContent = 'Auto-Play Story';
    } else {
      state.story.isPlaying = true;
      dom.btnStoryAutoPlay.textContent = 'Pause Auto-Play';
      state.story.timer = setInterval(() => {
        const storyDef = Engine.AUTOREGRESSIVE_STORIES.find(s => s.id === state.story.activeStoryId);
        if (state.story.stepIndex >= storyDef.steps.length) {
          clearInterval(state.story.timer);
          state.story.timer = null;
          state.story.isPlaying = false;
          dom.btnStoryAutoPlay.textContent = 'Auto-Play Story';
          return;
        }
        stepStory();
      }, 750);
    }
  }

  /* ==========================================================================
     Tab 4: Student Quiz & Interactive Challenges
     ========================================================================== */
  function initQuizTab() {
    dom.quizQuestionsContainer.innerHTML = '';
    state.quiz.userAnswers = {};
    state.quiz.score = 0;
    updateQuizScoreBadge();

    QUIZ_QUESTIONS.forEach((q, qIndex) => {
      const card = document.createElement('div');
      card.className = 'quiz-question-card';
      card.id = `quiz-card-${q.id}`;

      let optionsHTML = '<div class="quiz-options-list">';
      q.options.forEach((optText, optIndex) => {
        optionsHTML += `
          <button class="quiz-option-btn" data-qid="${q.id}" data-optindex="${optIndex}">
            ${escapeHtml(optText)}
          </button>
        `;
      });
      optionsHTML += '</div>';

      card.innerHTML = `
        <div class="question-title-row">
          <span class="question-number">Question ${qIndex + 1}</span>
          <span class="question-text">${q.question}</span>
        </div>
        ${optionsHTML}
        <div class="quiz-explanation-box" id="explain-${q.id}">
          <strong>Pedagogical Explanation:</strong> ${q.explanation}
        </div>
      `;

      dom.quizQuestionsContainer.appendChild(card);
    });

    // Delegate option clicks
    dom.quizQuestionsContainer.addEventListener('click', e => {
      const btn = e.target.closest('.quiz-option-btn');
      if (!btn) return;

      const qid = btn.dataset.qid;
      const optIndex = parseInt(btn.dataset.optindex, 10);
      if (state.quiz.userAnswers[qid] !== undefined) return; // Already answered

      const question = QUIZ_QUESTIONS.find(q => q.id === qid);
      if (!question) return;

      state.quiz.userAnswers[qid] = optIndex;
      const isCorrect = optIndex === question.correctIndex;
      if (isCorrect) state.quiz.score++;

      // Highlight selected and correct buttons
      const card = document.getElementById(`quiz-card-${qid}`);
      const buttons = card.querySelectorAll('.quiz-option-btn');
      buttons.forEach((b, idx) => {
        b.disabled = true;
        if (idx === question.correctIndex) {
          b.classList.add('correct');
        } else if (idx === optIndex && !isCorrect) {
          b.classList.add('incorrect');
        }
      });

      // Show explanation
      const explainBox = document.getElementById(`explain-${qid}`);
      if (explainBox) explainBox.classList.add('visible');

      updateQuizScoreBadge();
    });
  }

  function updateQuizScoreBadge() {
    dom.quizScoreBadge.textContent = `Score: ${state.quiz.score} / ${QUIZ_QUESTIONS.length}`;
  }

  /* ==========================================================================
     Event Listeners Binding
     ========================================================================== */
  function bindEventListeners() {
    // Temperature Slider & Micro buttons
    dom.tempSlider.addEventListener('input', e => {
      state.temperature = parseFloat(e.target.value);
      updatePipelineAndRender();
    });

    dom.tempMicroButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        state.temperature = parseFloat(btn.dataset.setTemp);
        updatePipelineAndRender();
      });
    });

    // Top-K Slider & Micro buttons
    dom.topKSlider.addEventListener('input', e => {
      state.topK = parseInt(e.target.value, 10);
      updatePipelineAndRender();
    });

    dom.topKMicroButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.setTopk;
        state.topK = val === 'max' ? state.tokens.length : parseInt(val, 10);
        updatePipelineAndRender();
      });
    });

    // Top-P Slider & Micro buttons
    dom.topPSlider.addEventListener('input', e => {
      state.topP = parseFloat(e.target.value);
      updatePipelineAndRender();
    });

    dom.topPMicroButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        state.topP = parseFloat(btn.dataset.setTopp);
        updatePipelineAndRender();
      });
    });

    // View Toggles
    dom.viewToggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeView = btn.dataset.view;
        dom.viewToggleBtns.forEach(b => b.classList.toggle('active', b === btn));
        const pipeline = getPipeline();
        renderMainChart(pipeline);
      });
    });

    // Header Quick Buttons
    dom.btnQuickGreedy.addEventListener('click', () => {
      state.temperature = 0.05;
      state.topK = 1;
      state.topP = 1.0;
      updatePipelineAndRender();
    });

    dom.btnQuickBalanced.addEventListener('click', () => {
      state.temperature = 0.70;
      state.topK = state.tokens.length;
      state.topP = 0.90;
      updatePipelineAndRender();
    });

    dom.btnResetApp.addEventListener('click', () => {
      state.temperature = 1.00;
      state.topK = 8;
      state.topP = 1.00;
      loadScenario('capital-france');
    });

    // Sampler Single Roll
    dom.btnSampleOnce.addEventListener('click', () => {
      sampleNextToken();
    });

    // Monte Carlo
    dom.mcBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        dom.mcBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.mcSampleCount = parseInt(btn.dataset.samples, 10);
      });
    });

    dom.btnRunMonteCarlo.addEventListener('click', () => {
      runMonteCarlo();
    });

    // Table Inline Editing Delegation
    dom.tokenTableBody.addEventListener('change', e => {
      const action = e.target.dataset.action;
      const index = parseInt(e.target.dataset.index, 10);
      if (isNaN(index) || !state.tokens[index]) return;

      if (action === 'edit-logit') {
        state.tokens[index].logit = parseFloat(e.target.value) || 0;
        updatePipelineAndRender();
      } else if (action === 'rename-token') {
        state.tokens[index].token = e.target.value.trim() || `Token_${index+1}`;
        updatePipelineAndRender();
      }
    });

    dom.tokenTableBody.addEventListener('click', e => {
      const delBtn = e.target.closest('[data-action="delete-token"]');
      if (delBtn) {
        const index = parseInt(delBtn.dataset.index, 10);
        if (state.tokens.length <= 2) {
          alert('You must have at least 2 tokens to compute Softmax.');
          return;
        }
        state.tokens.splice(index, 1);
        updateTopKBounds();
        updatePipelineAndRender();
      }
    });

    // Add Token
    dom.btnAddToken.addEventListener('click', () => {
      const name = prompt('Enter token name (e.g. " galaxy"):', ` Token_${state.tokens.length + 1}`);
      if (!name) return;
      state.tokens.push({
        token: name,
        logit: 2.5,
        note: 'User custom token'
      });
      updateTopKBounds();
      updatePipelineAndRender();
    });

    // Reset Logits
    dom.btnResetLogits.addEventListener('click', () => {
      loadScenario(state.activeScenarioId);
    });

    // Story Tab Controls
    dom.storyTempSlider.addEventListener('input', e => {
      state.story.temperature = parseFloat(e.target.value);
      dom.storyTempVal.textContent = state.story.temperature.toFixed(2);
      renderStoryState();
    });

    dom.storyTopKSlider.addEventListener('input', e => {
      state.story.topK = parseInt(e.target.value, 10);
      dom.storyTopKVal.textContent = state.story.topK;
      renderStoryState();
    });

    dom.storyTopPSlider.addEventListener('input', e => {
      state.story.topP = parseFloat(e.target.value);
      dom.storyTopPVal.textContent = state.story.topP.toFixed(2);
      renderStoryState();
    });

    dom.btnStoryStep.addEventListener('click', stepStory);
    dom.btnStoryAutoPlay.addEventListener('click', toggleAutoPlayStory);
    dom.btnStoryReset.addEventListener('click', () => loadStory(state.story.activeStoryId));

    // Quiz Reset
    dom.btnResetQuiz.addEventListener('click', initQuizTab);
  }

  /* ==========================================================================
     Helper Utilities
     ========================================================================== */
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Start application on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
