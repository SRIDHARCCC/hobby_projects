/**
 * SoftmaxLab: Softmax & LLM Sampling Engine
 * Pure mathematical functions and simulation algorithms for:
 * - Softmax computation with numerical stability (Log-Sum-Exp shift)
 * - Temperature scaling (T > 0, T -> 0 argmax limit, T -> inf uniform limit)
 * - Top-K vocabulary truncation and renormalization
 * - Top-P (Nucleus) cumulative probability truncation and renormalization
 * - Monte Carlo empirical sampling & entropy / perplexity metrics
 * - Autoregressive story generation tree simulation
 *
 * Zero external dependencies. Works in both Node.js (CommonJS) and Browser.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SamplingEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Predefined educational prompt scenarios with realistic logits
   */
  const PRESET_SCENARIOS = [
    {
      id: 'capital-france',
      title: 'Fact Retrieval: Capital of France',
      badge: 'High Confidence Peak',
      prompt: 'The capital of France is',
      description: 'A classic factual prompt where the true answer ("Paris") has a massive logit advantage over alternative cities.',
      tokens: [
        { token: ' Paris', logit: 9.8, note: 'Target factual answer' },
        { token: ' Lyon', logit: 3.2, note: 'Large French city' },
        { token: ' Marseille', logit: 2.7, note: 'Large French city' },
        { token: ' London', logit: 2.1, note: 'Major European capital' },
        { token: ' Rome', logit: 1.5, note: 'European capital' },
        { token: ' Berlin', logit: 1.0, note: 'European capital' },
        { token: ' baguette', logit: -1.2, note: 'French culture association' },
        { token: ' Mars', logit: -3.5, note: 'Completely irrelevant' }
      ]
    },
    {
      id: 'fairytale-forest',
      title: 'Creative Writing: Dark Mystery',
      badge: 'Balanced Multimodal',
      prompt: 'Once upon a time, in a deep dark',
      description: 'An open-ended creative story prompt where multiple atmospheric words compete closely with high entropy.',
      tokens: [
        { token: ' forest', logit: 4.8, note: 'Classic fairytale trope' },
        { token: ' woods', logit: 4.4, note: 'Close synonym' },
        { token: ' cave', logit: 3.9, note: 'Atmospheric setting' },
        { token: ' castle', logit: 3.5, note: 'Gothic structure' },
        { token: ' dungeon', logit: 3.1, note: 'Dark fantasy setting' },
        { token: ' tower', logit: 2.6, note: 'Fantasy location' },
        { token: ' ocean', logit: 1.8, note: 'Uncommon setting' },
        { token: ' laptop', logit: -2.8, note: 'Anachronistic token' }
      ]
    },
    {
      id: 'python-code',
      title: 'Code Generation: Python Keyword',
      badge: 'Syntax Deterministic',
      prompt: 'In Python, the keyword to define a function is',
      description: 'Programming syntax where "def" is strictly required. High temperature creates disastrous syntax hallucinations.',
      tokens: [
        { token: ' def', logit: 11.2, note: 'Strictly correct keyword' },
        { token: ' function', logit: 2.8, note: 'JS/Kotlin keyword mistake' },
        { token: ' fn', logit: 2.0, note: 'Rust syntax mistake' },
        { token: ' func', logit: 1.6, note: 'Go/Swift syntax mistake' },
        { token: ' define', logit: 0.9, note: 'Natural language confusion' },
        { token: ' lambda', logit: 0.4, note: 'Anonymous function' },
        { token: ' class', logit: -1.0, note: 'Different Python construct' },
        { token: ' banana', logit: -4.5, note: 'Syntax absurdity' }
      ]
    },
    {
      id: 'culinary-spice',
      title: 'Common Sense: Culinary Spice',
      badge: 'Safety & Hallucination Guard',
      prompt: 'The chef tasted the simmering soup and added a pinch of',
      description: 'Multiple delicious culinary ingredients compete at the top, while hazardous/absurd tokens lurk in the tail.',
      tokens: [
        { token: ' salt', logit: 5.6, note: 'Most common seasoning' },
        { token: ' pepper', logit: 5.1, note: 'Standard condiment' },
        { token: ' sugar', logit: 3.9, note: 'Balancing ingredient' },
        { token: ' oregano', logit: 3.4, note: 'Savory herb' },
        { token: ' garlic', logit: 3.1, note: 'Savory powder' },
        { token: ' cinnamon', logit: 2.4, note: 'Warm spice' },
        { token: ' sand', logit: -2.5, note: 'Non-edible tail' },
        { token: ' uranium', logit: -5.5, note: 'Toxic hallucination tail' }
      ]
    },
    {
      id: 'equal-competitors',
      title: 'Theoretical: Uniform Tie Contest',
      badge: 'Symmetric Probabilities',
      prompt: 'Flip a fair coin: The result is',
      description: 'Equal logits show how Temperature sharpens tiny differences or softens flat distributions.',
      tokens: [
        { token: ' Heads', logit: 4.0, note: 'Equal probability 50/50' },
        { token: ' Tails', logit: 4.0, note: 'Equal probability 50/50' },
        { token: ' Edge', logit: -0.5, note: 'Extremely rare physics event' },
        { token: ' Side', logit: -1.2, note: 'Alternative phrasing' },
        { token: ' Neither', logit: -2.0, note: 'Indeterminate outcome' }
      ]
    }
  ];

  /**
   * Predefined Autoregressive Interactive Generation Trees
   */
  const AUTOREGRESSIVE_STORIES = [
    {
      id: 'cyberpunk',
      title: 'Neon Odyssey: Cyberpunk Detective',
      initialPrompt: 'Rain washed over the neon towers of Neo-Shinjuku as Detective Vance checked his',
      steps: [
        {
          id: 0,
          tokenOptions: [
            { token: ' neural-implant', logit: 5.2, nextStep: 1 },
            { token: ' pulse-pistol', logit: 4.8, nextStep: 2 },
            { token: ' pocket-watch', logit: 3.7, nextStep: 3 },
            { token: ' holographic-badge', logit: 3.1, nextStep: 1 },
            { token: ' sandwich', logit: -1.5, nextStep: 3 }
          ]
        },
        {
          id: 1,
          tokenOptions: [
            { token: ' for', logit: 4.9, nextStep: 4 },
            { token: ' which', logit: 4.2, nextStep: 4 },
            { token: ' before', logit: 3.8, nextStep: 5 },
            { token: ' and', logit: 3.1, nextStep: 5 }
          ]
        },
        {
          id: 2,
          tokenOptions: [
            { token: ' and', logit: 4.8, nextStep: 5 },
            { token: ' loaded', logit: 4.5, nextStep: 5 },
            { token: ' before', logit: 3.9, nextStep: 4 },
            { token: ' quietly', logit: 2.8, nextStep: 5 }
          ]
        },
        {
          id: 3,
          tokenOptions: [
            { token: ' while', logit: 4.7, nextStep: 4 },
            { token: ' and', logit: 4.3, nextStep: 5 },
            { token: ' with', logit: 3.6, nextStep: 4 }
          ]
        },
        {
          id: 4,
          tokenOptions: [
            { token: ' incoming', logit: 5.4, nextStep: 6 },
            { token: ' encrypted', logit: 4.8, nextStep: 6 },
            { token: ' rogue', logit: 3.9, nextStep: 6 },
            { token: ' corrupted', logit: 3.2, nextStep: 6 }
          ]
        },
        {
          id: 5,
          tokenOptions: [
            { token: ' stepping', logit: 5.1, nextStep: 7 },
            { token: ' creeping', logit: 4.5, nextStep: 7 },
            { token: ' vanishing', logit: 3.8, nextStep: 7 },
            { token: ' diving', logit: 3.0, nextStep: 7 }
          ]
        },
        {
          id: 6,
          tokenOptions: [
            { token: ' transmissions', logit: 5.2, nextStep: 8 },
            { token: ' AI-signals', logit: 4.7, nextStep: 8 },
            { token: ' bounty-alerts', logit: 4.1, nextStep: 8 },
            { token: ' memory-leaks', logit: 2.5, nextStep: 8 }
          ]
        },
        {
          id: 7,
          tokenOptions: [
            { token: ' into', logit: 5.5, nextStep: 9 },
            { token: ' through', logit: 4.6, nextStep: 9 },
            { token: ' toward', logit: 3.9, nextStep: 9 }
          ]
        },
        {
          id: 8,
          tokenOptions: [
            { token: ' from', logit: 5.0, nextStep: 10 },
            { token: ' echoing', logit: 4.3, nextStep: 10 },
            { token: ' bleeding', logit: 3.8, nextStep: 10 }
          ]
        },
        {
          id: 9,
          tokenOptions: [
            { token: ' the', logit: 5.6, nextStep: 10 },
            { token: ' an', logit: 3.8, nextStep: 10 },
            { token: ' dark', logit: 3.2, nextStep: 10 }
          ]
        },
        {
          id: 10,
          tokenOptions: [
            { token: ' cyber-underworld.', logit: 5.3, isTerminal: true },
            { token: ' black-market clinic.', logit: 4.8, isTerminal: true },
            { token: ' corporate mainframe.', logit: 4.4, isTerminal: true },
            { token: ' neon abyss.', logit: 3.9, isTerminal: true }
          ]
        }
      ]
    },
    {
      id: 'deep-space',
      title: 'Cosmic Signal: Deep Space Probe',
      initialPrompt: 'Telescope Array Kepler-X intercepted an anomalous repeating frequency from',
      steps: [
        {
          id: 0,
          tokenOptions: [
            { token: ' Proxima-Centauri', logit: 5.1, nextStep: 1 },
            { token: ' the', logit: 4.7, nextStep: 2 },
            { token: ' deep', logit: 4.0, nextStep: 2 },
            { token: ' Andromeda', logit: 3.6, nextStep: 1 }
          ]
        },
        {
          id: 1,
          tokenOptions: [
            { token: ' containing', logit: 5.0, nextStep: 3 },
            { token: ' pulsing', logit: 4.4, nextStep: 3 },
            { token: ' emitting', logit: 4.1, nextStep: 3 }
          ]
        },
        {
          id: 2,
          tokenOptions: [
            { token: ' Oort-cloud', logit: 5.2, nextStep: 1 },
            { token: ' interstellar-void', logit: 4.6, nextStep: 1 },
            { token: ' galactic-core', logit: 4.1, nextStep: 1 }
          ]
        },
        {
          id: 3,
          tokenOptions: [
            { token: ' structured', logit: 5.3, nextStep: 4 },
            { token: ' prime-number', logit: 4.8, nextStep: 4 },
            { token: ' artificial', logit: 4.2, nextStep: 4 }
          ]
        },
        {
          id: 4,
          tokenOptions: [
            { token: ' telemetry.', logit: 5.1, isTerminal: true },
            { token: ' coordinates.', logit: 4.9, isTerminal: true },
            { token: ' mathematical-proofs.', logit: 4.4, isTerminal: true },
            { token: ' biosignatures.', logit: 3.7, isTerminal: true }
          ]
        }
      ]
    }
  ];

  /**
   * Numerically stable Softmax with Temperature scaling
   *
   * Formula:
   *   z'_i = z_i / T
   *   m = max_j(z'_j)
   *   p_i = exp(z'_i - m) / sum_j(exp(z'_j - m))
   *
   * Special case: T -> 0 (Argmax / Greedy)
   *   p_i = 1 / count(argmax) for max indices, 0 elsewhere
   *
   * @param {Array<number|{logit: number, token?: string}>} inputs
   * @param {number} temperature - Must be > 0. Values near 0 act as greedy argmax.
   * @returns {Object} Comprehensive calculation trace & probabilities
   */
  function computeSoftmax(inputs, temperature = 1.0) {
    if (!Array.isArray(inputs) || inputs.length === 0) {
      throw new Error('computeSoftmax requires a non-empty array of items or logits.');
    }

    const n = inputs.length;
    const rawLogits = inputs.map(item => (typeof item === 'object' && item !== null && 'logit' in item ? Number(item.logit) : Number(item)));
    const tokenNames = inputs.map((item, idx) => (typeof item === 'object' && item !== null && 'token' in item ? item.token : `Token_${idx + 1}`));
    const notes = inputs.map(item => (typeof item === 'object' && item !== null && 'note' in item ? item.note : ''));

    const T = Number(temperature);
    if (isNaN(T) || T <= 0) {
      throw new Error('Temperature must be a positive number > 0');
    }

    // Near-zero temperature limit: Pure greedy argmax
    const GREEDY_THRESHOLD = 0.02;
    if (T < GREEDY_THRESHOLD) {
      const maxLogit = Math.max(...rawLogits);
      const argmaxIndices = [];
      rawLogits.forEach((val, idx) => {
        if (Math.abs(val - maxLogit) < 1e-9) {
          argmaxIndices.push(idx);
        }
      });

      const uniformArgmaxProb = 1.0 / argmaxIndices.length;
      const probabilities = rawLogits.map((_, idx) => (argmaxIndices.includes(idx) ? uniformArgmaxProb : 0.0));
      const entropy = argmaxIndices.length > 1 ? Math.log2(argmaxIndices.length) : 0.0;
      const perplexity = Math.pow(2, entropy);

      return {
        temperature: T,
        isGreedyLimit: true,
        rawLogits,
        scaledLogits: rawLogits.map(z => z / T),
        maxLogit,
        maxScaledLogit: maxLogit / T,
        shiftedScaledLogits: rawLogits.map(z => (z === maxLogit ? 0 : -Infinity)),
        exponentials: rawLogits.map(z => (z === maxLogit ? 1.0 : 0.0)),
        sumExponentials: argmaxIndices.length,
        probabilities,
        entropy,
        perplexity,
        items: rawLogits.map((logit, idx) => ({
          index: idx,
          token: tokenNames[idx],
          note: notes[idx],
          rawLogit: logit,
          scaledLogit: logit / T,
          shiftedLogit: logit - maxLogit,
          exponential: probabilities[idx],
          probability: probabilities[idx],
          isMax: argmaxIndices.includes(idx)
        }))
      };
    }

    // Standard Temperature Scaling: z_scaled = z / T
    const scaledLogits = rawLogits.map(z => z / T);
    const maxScaledLogit = Math.max(...scaledLogits);

    // Numerically stable exp shift: exp(z/T - max(z/T))
    const shiftedScaledLogits = scaledLogits.map(s => s - maxScaledLogit);
    const exponentials = shiftedScaledLogits.map(s => Math.exp(s));
    const sumExponentials = exponentials.reduce((acc, curr) => acc + curr, 0);

    const probabilities = exponentials.map(e => e / sumExponentials);

    // Compute Shannon Entropy H(P) = -sum p * log2(p)
    let entropy = 0.0;
    for (let i = 0; i < n; i++) {
      const p = probabilities[i];
      if (p > 1e-12) {
        entropy -= p * Math.log2(p);
      }
    }
    // Perplexity = 2^H
    const perplexity = Math.pow(2, entropy);

    const maxLogit = Math.max(...rawLogits);

    return {
      temperature: T,
      isGreedyLimit: false,
      rawLogits,
      scaledLogits,
      maxLogit,
      maxScaledLogit,
      shiftedScaledLogits,
      exponentials,
      sumExponentials,
      probabilities,
      entropy: Math.max(0, entropy),
      perplexity: Math.max(1, perplexity),
      items: rawLogits.map((logit, idx) => ({
        index: idx,
        token: tokenNames[idx],
        note: notes[idx],
        rawLogit: logit,
        scaledLogit: scaledLogits[idx],
        shiftedLogit: shiftedScaledLogits[idx],
        exponential: exponentials[idx],
        probability: probabilities[idx],
        isMax: logit === maxLogit
      }))
    };
  }

  /**
   * Apply Top-K filtering
   *
   * Only the top K tokens with highest probabilities are kept.
   * Remaining tokens have probability set to 0.
   * Surviving tokens are renormalized so their probabilities sum to 1.
   *
   * @param {Array<Object>} items - Array of token items with `probability`
   * @param {number} k - Positive integer. If k >= items.length, no filtering occurs.
   * @returns {Object} Filtered & renormalized items with pruning flags
   */
  function applyTopK(items, k) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('applyTopK requires non-empty array of items');
    }

    const n = items.length;
    const K = Math.max(1, Math.min(n, Math.round(Number(k) || n)));

    // Clone and sort descending by initial probability
    const indexed = items.map((item, originalIndex) => ({
      ...item,
      originalIndex,
      preTopKProb: item.probability
    }));

    indexed.sort((a, b) => b.probability - a.probability);

    // Mark rank and survival
    let survivingSum = 0;
    indexed.forEach((item, rankIndex) => {
      item.rank = rankIndex + 1;
      if (rankIndex < K) {
        item.isTopK = true;
        item.prunedBy = null;
        survivingSum += item.probability;
      } else {
        item.isTopK = false;
        item.prunedBy = 'top_k';
      }
    });

    // Renormalize surviving items
    indexed.forEach(item => {
      if (item.isTopK && survivingSum > 0) {
        item.topKProb = item.probability / survivingSum;
      } else {
        item.topKProb = 0.0;
      }
    });

    return {
      k: K,
      survivingCount: K,
      prunedCount: n - K,
      survivingSum,
      items: indexed
    };
  }

  /**
   * Apply Top-P (Nucleus) filtering
   *
   * Selects the smallest set of tokens whose cumulative probability exceeds or equals P.
   * Tokens outside the nucleus are zeroed.
   * Surviving nucleus tokens are renormalized to sum to 1.
   *
   * @param {Array<Object>} items - Items after Top-K (or after Softmax), each with `topKProb` or `probability`
   * @param {number} p - Float in (0.0, 1.0]. If p >= 1.0, all active tokens are kept.
   * @returns {Object} Filtered & renormalized items with cumulative tracking
   */
  function applyTopP(items, p) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('applyTopP requires non-empty array of items');
    }

    const P = Math.max(0.01, Math.min(1.0, Number(p)));

    // Extract current working probability (from topK if present, else base probability)
    const working = items.map(item => {
      const activeProb = typeof item.topKProb === 'number' ? item.topKProb : item.probability;
      return {
        ...item,
        inputProbToTopP: activeProb
      };
    });

    // Sort by input probability descending (keeping already pruned items at the very end)
    working.sort((a, b) => b.inputProbToTopP - a.inputProbToTopP);

    let cumulativeSum = 0;
    let nucleusThresholdReached = false;
    let survivingSum = 0;
    let nucleusCount = 0;

    working.forEach((item, index) => {
      // If already pruned by Top-K or probability is negligible
      if (item.prunedBy === 'top_k' || item.inputProbToTopP <= 0) {
        item.inNucleus = false;
        item.cumProbBefore = cumulativeSum;
        item.cumProbAfter = cumulativeSum;
        item.postTopPProb = 0.0;
        if (!item.prunedBy) item.prunedBy = 'top_k';
        return;
      }

      const prevCum = cumulativeSum;
      cumulativeSum += item.inputProbToTopP;
      item.cumProbBefore = prevCum;
      item.cumProbAfter = cumulativeSum;

      // The first token is ALWAYS kept in the nucleus to guarantee at least one candidate
      if (index === 0 || !nucleusThresholdReached) {
        item.inNucleus = true;
        item.prunedBy = null;
        survivingSum += item.inputProbToTopP;
        nucleusCount++;

        // Once cumulative probability reaches or exceeds P, close nucleus for subsequent tokens
        if (cumulativeSum >= P - 1e-9) {
          nucleusThresholdReached = true;
        }
      } else {
        item.inNucleus = false;
        item.prunedBy = 'top_p';
        item.postTopPProb = 0.0;
      }
    });

    // Renormalize surviving nucleus tokens
    working.forEach(item => {
      if (item.inNucleus && survivingSum > 0) {
        item.finalProb = item.inputProbToTopP / survivingSum;
      } else {
        item.finalProb = 0.0;
      }
    });

    return {
      p: P,
      nucleusCount,
      survivingSum,
      items: working
    };
  }

  /**
   * Run the complete multi-stage LLM generation pipeline:
   * 1. Raw Logits
   * 2. Temperature Scaling & Softmax
   * 3. Top-K Truncation & Renormalization
   * 4. Top-P Nucleus Truncation & Renormalization
   * 5. Final Sampling CDF Intervals
   *
   * @param {Array<Object>} tokens - [{ token: string, logit: number, note?: string }]
   * @param {Object} params - { temperature, topK, topP }
   * @returns {Object} Full traceable state of every step
   */
  function runSamplingPipeline(tokens, params = {}) {
    const temperature = typeof params.temperature === 'number' ? params.temperature : 1.0;
    const topK = typeof params.topK === 'number' ? params.topK : tokens.length;
    const topP = typeof params.topP === 'number' ? params.topP : 1.0;

    // Stage 1 & 2: Softmax with Temperature
    const softmaxStage = computeSoftmax(tokens, temperature);

    // Stage 3: Top-K
    const topKStage = applyTopK(softmaxStage.items, topK);

    // Stage 4: Top-P
    const topPStage = applyTopP(topKStage.items, topP);

    // Stage 5: Final Sampling Intervals [rangeStart, rangeEnd)
    let cumulative = 0;
    const finalTokens = topPStage.items.map(item => {
      const prob = item.finalProb || 0;
      const start = cumulative;
      cumulative += prob;
      const end = cumulative;
      return {
        ...item,
        finalProb: prob,
        cdfStart: start,
        cdfEnd: Math.min(1.0, end),
        isSampleable: prob > 0
      };
    });

    // Compute final post-filtered entropy & perplexity
    let finalEntropy = 0;
    finalTokens.forEach(t => {
      if (t.finalProb > 1e-12) {
        finalEntropy -= t.finalProb * Math.log2(t.finalProb);
      }
    });
    const finalPerplexity = Math.pow(2, finalEntropy);

    return {
      params: { temperature, topK: topKStage.k, topP: topPStage.p },
      softmaxStage,
      topKStage,
      topPStage,
      finalTokens,
      metrics: {
        rawEntropy: softmaxStage.entropy,
        rawPerplexity: softmaxStage.perplexity,
        finalEntropy: Math.max(0, finalEntropy),
        finalPerplexity: Math.max(1, finalPerplexity),
        activeCount: finalTokens.filter(t => t.isSampleable).length,
        totalCount: tokens.length
      }
    };
  }

  /**
   * Sample a token from the final probability distribution using a roll in [0, 1)
   *
   * @param {Object} pipelineResult - Output from runSamplingPipeline
   * @param {number} [forcedRoll] - Optional explicit number in [0, 1) for deterministic testing
   * @returns {Object} Sampled token details and roll metadata
   */
  function sampleSingleToken(pipelineResult, forcedRoll = null) {
    const roll = typeof forcedRoll === 'number' ? Math.max(0, Math.min(0.99999999, forcedRoll)) : Math.random();
    const activeTokens = pipelineResult.finalTokens.filter(t => t.isSampleable);

    if (activeTokens.length === 0) {
      throw new Error('No sampleable tokens available in distribution.');
    }

    let chosenToken = activeTokens[0];
    for (let i = 0; i < activeTokens.length; i++) {
      const t = activeTokens[i];
      if (roll >= t.cdfStart && roll < t.cdfEnd) {
        chosenToken = t;
        break;
      }
    }

    return {
      roll,
      rollPercentage: (roll * 100).toFixed(2),
      token: chosenToken.token,
      chosenToken,
      activeTokensCount: activeTokens.length
    };
  }

  /**
   * Run Monte Carlo simulation over N draws
   * Computes empirical frequencies vs theoretical probabilities
   *
   * @param {Object} pipelineResult - Output from runSamplingPipeline
   * @param {number} sampleCount - Number of trials (e.g. 1000)
   * @returns {Object} Empirical distribution, error, and breakdown
   */
  function runMonteCarloSimulation(pipelineResult, sampleCount = 1000) {
    const count = Math.max(10, Math.min(100000, Math.round(Number(sampleCount) || 1000)));
    const activeTokens = pipelineResult.finalTokens.filter(t => t.isSampleable);

    // Track frequencies
    const freqMap = new Map();
    activeTokens.forEach(t => freqMap.set(t.token, 0));

    // Sample N times
    for (let i = 0; i < count; i++) {
      const roll = Math.random();
      for (let j = 0; j < activeTokens.length; j++) {
        const t = activeTokens[j];
        if (roll >= t.cdfStart && roll < t.cdfEnd) {
          freqMap.set(t.token, (freqMap.get(t.token) || 0) + 1);
          break;
        }
      }
    }

    // Build comparison results
    let maxAbsError = 0;
    let meanSquaredError = 0;

    const results = pipelineResult.finalTokens.map(token => {
      const hits = freqMap.get(token.token) || 0;
      const empiricalProb = hits / count;
      const theoreticalProb = token.finalProb || 0;
      const absDiff = Math.abs(empiricalProb - theoreticalProb);

      if (token.isSampleable) {
        maxAbsError = Math.max(maxAbsError, absDiff);
        meanSquaredError += Math.pow(absDiff, 2);
      }

      return {
        token: token.token,
        hits,
        empiricalProb,
        theoreticalProb,
        absDiff,
        isSampleable: token.isSampleable
      };
    });

    meanSquaredError = activeTokens.length > 0 ? meanSquaredError / activeTokens.length : 0;

    return {
      sampleCount: count,
      results,
      maxAbsError,
      meanSquaredError,
      activeTokensCount: activeTokens.length
    };
  }

  /**
   * Public API exports
   */
  return {
    PRESET_SCENARIOS,
    AUTOREGRESSIVE_STORIES,
    computeSoftmax,
    applyTopK,
    applyTopP,
    runSamplingPipeline,
    sampleSingleToken,
    runMonteCarloSimulation
  };
}));
