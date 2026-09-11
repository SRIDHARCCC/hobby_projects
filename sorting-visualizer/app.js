/**
 * SortLab - Interactive Bubble Sort & Selection Sort Visualizer
 */

// Application State
const state = {
  mode: 'single', // 'single' or 'compare'
  algo1: 'bubble', // 'bubble' or 'selection'
  algo2: 'selection',
  arraySize: 15,
  speedLevel: 3,
  preset: 'random',
  initialArray: [],
  
  // Execution controllers
  isRunning: false,
  isPaused: false,
  timerId: null,

  // Engine instances
  engine1: null,
  engine2: null
};

const SPEED_DELAYS = {
  1: 650, // Very slow
  2: 320, // Slow
  3: 150, // Medium
  4: 60,  // Fast
  5: 15   // Very fast
};

const SPEED_LABELS = {
  1: 'Slowest',
  2: 'Slow',
  3: 'Medium',
  4: 'Fast',
  5: 'Lightning'
};

// DOM Elements
const singleModeBtn = document.getElementById('singleModeBtn');
const compareModeBtn = document.getElementById('compareModeBtn');
const visualizerContainer = document.getElementById('visualizerContainer');
const panel2 = document.getElementById('panel2');

const arraySizeInput = document.getElementById('arraySize');
const sizeVal = document.getElementById('sizeVal');
const sortSpeedInput = document.getElementById('sortSpeed');
const speedVal = document.getElementById('speedVal');
const arrayPresetSelect = document.getElementById('arrayPreset');

const newArrayBtn = document.getElementById('newArrayBtn');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stepBtn = document.getElementById('stepBtn');
const resetBtn = document.getElementById('resetBtn');

const algoSelect1 = document.getElementById('algoSelect1');
const conceptTitle1 = document.getElementById('conceptTitle1');
const conceptBody1 = document.getElementById('conceptBody1');

// Concept descriptions for Single View toggle
const ALGO_CONCEPTS = {
  bubble: {
    title: '💡 How Bubble Sort Works',
    body: `
      <p><strong>Mechanism:</strong> Iterates through the list, comparing adjacent items <code>(A[j], A[j+1])</code>. If they are in the wrong order, it swaps them.</p>
      <p><strong>Why "Bubble"?</strong> With each complete pass, the largest remaining unsorted element "bubbles up" to its correct final place at the end of the list.</p>
      <div class="code-preview">
        <pre><code>for (let i = 0; i &lt; n - 1; i++) {
  for (let j = 0; j &lt; n - i - 1; j++) {
    if (arr[j] &gt; arr[j + 1]) {
      swap(arr[j], arr[j + 1]);
    }
  }
}</code></pre>
      </div>`
  },
  selection: {
    title: '💡 How Selection Sort Works',
    body: `
      <p><strong>Mechanism:</strong> Divides the array into a sorted portion and an unsorted portion. Scans the unsorted portion to find the <em>absolute minimum</em>, then places it at the front.</p>
      <p><strong>Key Feature:</strong> Performs significantly fewer writes/swaps than Bubble Sort (at most <strong>1 swap per pass</strong>), but always takes O(n²) comparisons.</p>
      <div class="code-preview">
        <pre><code>for (let i = 0; i &lt; n - 1; i++) {
  let minIdx = i;
  for (let j = i + 1; j &lt; n; j++) {
    if (arr[j] &lt; arr[minIdx]) minIdx = j;
  }
  if (minIdx !== i) swap(arr[i], arr[minIdx]);
}</code></pre>
      </div>`
  }
};

/**
 * Creates an execution engine for a specific algorithm on an array
 */
class SortEngine {
  constructor(panelIndex, algoType) {
    this.panelIndex = panelIndex;
    this.algoType = algoType;
    this.barsContainer = document.getElementById(`barsContainer${panelIndex}`);
    this.compElement = document.getElementById(`compCount${panelIndex}`);
    this.swapElement = document.getElementById(`swapCount${panelIndex}`);
    this.statusElement = document.getElementById(`statusText${panelIndex}`);
    this.explanationElement = document.getElementById(`explanationText${panelIndex}`);
    
    this.array = [];
    this.comparisons = 0;
    this.swaps = 0;
    this.generator = null;
    this.isFinished = false;
  }

  init(sourceArray) {
    this.array = [...sourceArray];
    this.comparisons = 0;
    this.swaps = 0;
    this.isFinished = false;
    this.generator = this.createGenerator();
    this.updateStats();
    this.setStatus('Ready', 'status-ready');
    this.setExplanation('Array loaded. Click "Start Sort" or "Step" to observe the algorithm in action.');
    this.renderBars();
  }

  setStatus(text, className) {
    this.statusElement.textContent = text;
    this.statusElement.className = className;
  }

  setExplanation(text) {
    this.explanationElement.innerHTML = text;
  }

  updateStats() {
    this.compElement.textContent = this.comparisons;
    this.swapElement.textContent = this.swaps;
  }

  createGenerator() {
    if (this.algoType === 'bubble') {
      return this.bubbleSort();
    } else {
      return this.selectionSort();
    }
  }

  renderBars(highlights = {}) {
    this.barsContainer.innerHTML = '';
    const maxVal = Math.max(...this.array, 100);
    const count = this.array.length;

    this.array.forEach((val, idx) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'bar-wrapper';

      const valLabel = document.createElement('span');
      valLabel.className = 'bar-val';
      // If array is dense, show values for fewer elements or smaller font
      valLabel.textContent = count <= 25 ? val : '';

      const bar = document.createElement('div');
      bar.className = 'bar';
      
      const heightPercent = Math.max(10, Math.round((val / maxVal) * 88));
      bar.style.height = `${heightPercent}%`;

      // Apply highlights
      if (highlights.sorted && highlights.sorted.has(idx)) {
        bar.classList.add('sorted');
      } else if (highlights.swapping && highlights.swapping.includes(idx)) {
        bar.classList.add('swapping');
      } else if (highlights.min !== undefined && highlights.min === idx) {
        bar.classList.add('min-candidate');
      } else if (highlights.comparing && highlights.comparing.includes(idx)) {
        bar.classList.add('comparing');
      }

      wrapper.appendChild(valLabel);
      wrapper.appendChild(bar);
      this.barsContainer.appendChild(wrapper);
    });
  }

  // Bubble Sort Step Generator
  *bubbleSort() {
    const arr = this.array;
    const n = arr.length;
    const sortedIndices = new Set();

    for (let i = 0; i < n; i++) {
      let swappedInThisPass = false;

      for (let j = 0; j < n - i - 1; j++) {
        this.comparisons++;
        this.updateStats();

        // 1. Highlight comparing
        yield {
          render: () => this.renderBars({
            comparing: [j, j + 1],
            sorted: sortedIndices
          }),
          explanation: `Comparing adjacent items: index <code>${j}</code> (value <strong>${arr[j]}</strong>) and index <code>${j + 1}</code> (value <strong>${arr[j + 1]}</strong>).`
        };

        if (arr[j] > arr[j + 1]) {
          // 2. Swapping
          const temp = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = temp;
          this.swaps++;
          swappedInThisPass = true;
          this.updateStats();

          yield {
            render: () => this.renderBars({
              swapping: [j, j + 1],
              sorted: sortedIndices
            }),
            explanation: `Since <strong>${temp} &gt; ${arr[j]}</strong>, they are out of order! 🔀 Swapping index <code>${j}</code> and <code>${j + 1}</code>.`
          };
        }
      }

      // Largest unsorted element is now at its final resting place
      const sortedIdx = n - i - 1;
      sortedIndices.add(sortedIdx);

      yield {
        render: () => this.renderBars({ sorted: sortedIndices }),
        explanation: `Pass <strong>${i + 1}</strong> complete: <strong>${arr[sortedIdx]}</strong> has bubbled up to its final sorted position at index <code>${sortedIdx}</code>.`
      };

      // Optimization: if no swaps occurred, the array is already sorted!
      if (!swappedInThisPass) {
        for (let k = 0; k < n; k++) sortedIndices.add(k);
        yield {
          render: () => this.renderBars({ sorted: sortedIndices }),
          explanation: `🎯 <strong>Early Exit:</strong> No swaps occurred during this entire pass! The array is completely sorted.`
        };
        break;
      }
    }

    // Ensure all sorted
    for (let k = 0; k < n; k++) sortedIndices.add(k);
    this.isFinished = true;
    this.setStatus('Completed 🎉', 'status-done');
    return {
      render: () => this.renderBars({ sorted: sortedIndices }),
      explanation: `Bubble Sort finished! Total comparisons: <strong>${this.comparisons}</strong>, total swaps: <strong>${this.swaps}</strong>.`
    };
  }

  // Selection Sort Step Generator
  *selectionSort() {
    const arr = this.array;
    const n = arr.length;
    const sortedIndices = new Set();

    for (let i = 0; i < n; i++) {
      let minIdx = i;

      yield {
        render: () => this.renderBars({
          min: minIdx,
          sorted: sortedIndices
        }),
        explanation: `Pass <strong>${i + 1}</strong>: Setting initial minimum candidate as index <code>${i}</code> (value: <strong>${arr[i]}</strong>). Scanning rest of list...`
      };

      for (let j = i + 1; j < n; j++) {
        this.comparisons++;
        this.updateStats();

        yield {
          render: () => this.renderBars({
            comparing: [j],
            min: minIdx,
            sorted: sortedIndices
          }),
          explanation: `Checking index <code>${j}</code> (value <strong>${arr[j]}</strong>) against current minimum <strong>${arr[minIdx]}</strong> at index <code>${minIdx}</code>.`
        };

        if (arr[j] < arr[minIdx]) {
          minIdx = j;
          yield {
            render: () => this.renderBars({
              min: minIdx,
              sorted: sortedIndices
            }),
            explanation: `✨ New minimum discovered! Found smaller value <strong>${arr[minIdx]}</strong> at index <code>${minIdx}</code>.`
          };
        }
      }

      // Swap minimum into slot i if needed
      if (minIdx !== i) {
        this.swaps++;
        this.updateStats();
        const oldVal = arr[i];
        const minVal = arr[minIdx];

        arr[minIdx] = oldVal;
        arr[i] = minVal;

        yield {
          render: () => this.renderBars({
            swapping: [i, minIdx],
            sorted: sortedIndices
          }),
          explanation: `🔀 Swapping minimum element <strong>${minVal}</strong> from index <code>${minIdx}</code> into sorted position at index <code>${i}</code>.`
        };
      } else {
        yield {
          render: () => this.renderBars({
            min: i,
            sorted: sortedIndices
          }),
          explanation: `Element <strong>${arr[i]}</strong> at index <code>${i}</code> is already the smallest remaining. No swap needed!`
        };
      }

      sortedIndices.add(i);
      yield {
        render: () => this.renderBars({ sorted: sortedIndices }),
        explanation: `Position <code>${i}</code> is now permanently locked into sorted order.`
      };
    }

    for (let k = 0; k < n; k++) sortedIndices.add(k);
    this.isFinished = true;
    this.setStatus('Completed 🎉', 'status-done');
    return {
      render: () => this.renderBars({ sorted: sortedIndices }),
      explanation: `Selection Sort finished! Total comparisons: <strong>${this.comparisons}</strong>, total swaps: <strong>${this.swaps}</strong>.`
    };
  }

  step() {
    if (this.isFinished || !this.generator) return true;
    const result = this.generator.next();
    if (result.value) {
      if (result.value.render) result.value.render();
      if (result.value.explanation) this.setExplanation(result.value.explanation);
    }
    if (result.done) {
      this.isFinished = true;
      this.setStatus('Completed 🎉', 'status-done');
      return true;
    }
    return false;
  }
}

// Array Generation Utilities
function generateArray(size, type) {
  const result = [];
  switch (type) {
    case 'reversed': {
      const step = Math.floor(90 / size);
      for (let i = 0; i < size; i++) {
        result.push(95 - i * step);
      }
      break;
    }
    case 'nearlySorted': {
      const step = Math.floor(85 / size);
      for (let i = 0; i < size; i++) {
        result.push(10 + i * step);
      }
      // Swap 2 or 3 random pairs
      const swaps = Math.max(1, Math.floor(size / 5));
      for (let s = 0; s < swaps; s++) {
        const i1 = Math.floor(Math.random() * size);
        const i2 = Math.floor(Math.random() * size);
        const temp = result[i1];
        result[i1] = result[i2];
        result[i2] = temp;
      }
      break;
    }
    case 'fewUnique': {
      const uniqueValues = [20, 45, 70, 92];
      for (let i = 0; i < size; i++) {
        result.push(uniqueValues[Math.floor(Math.random() * uniqueValues.length)]);
      }
      break;
    }
    case 'random':
    default: {
      for (let i = 0; i < size; i++) {
        result.push(Math.floor(Math.random() * 88) + 12);
      }
      break;
    }
  }
  return result;
}

// Main Flow Control
function initVisualizers() {
  stopAutoPlay();
  state.initialArray = generateArray(state.arraySize, state.preset);
  
  state.engine1 = new SortEngine(1, state.algo1);
  state.engine1.init(state.initialArray);

  if (state.mode === 'compare') {
    state.engine2 = new SortEngine(2, 'selection');
    state.engine2.init(state.initialArray);
  }

  updateControlsState({ running: false });
}

function resetCurrentArray() {
  stopAutoPlay();
  state.engine1 = new SortEngine(1, state.algo1);
  state.engine1.init(state.initialArray);

  if (state.mode === 'compare') {
    state.engine2 = new SortEngine(2, 'selection');
    state.engine2.init(state.initialArray);
  }

  updateControlsState({ running: false });
}

function stepForward() {
  if (state.engine1.isFinished && (!state.engine2 || state.engine2.isFinished)) {
    return;
  }

  state.engine1.setStatus('Stepping...', 'status-running');
  state.engine1.step();

  if (state.mode === 'compare' && state.engine2) {
    state.engine2.setStatus('Stepping...', 'status-running');
    state.engine2.step();
  }

  checkAllFinished();
}

function startAutoPlay() {
  if (state.isRunning) return;

  state.isRunning = true;
  state.isPaused = false;
  updateControlsState({ running: true });

  state.engine1.setStatus('Sorting...', 'status-running');
  if (state.engine2) state.engine2.setStatus('Sorting...', 'status-running');

  runLoop();
}

function runLoop() {
  if (!state.isRunning || state.isPaused) return;

  const done1 = state.engine1.step();
  let done2 = true;
  if (state.mode === 'compare' && state.engine2) {
    done2 = state.engine2.step();
  }

  if (done1 && done2) {
    stopAutoPlay();
    checkAllFinished();
    return;
  }

  const delay = SPEED_DELAYS[state.speedLevel] || 150;
  state.timerId = setTimeout(runLoop, delay);
}

function pauseAutoPlay() {
  state.isPaused = true;
  state.isRunning = false;
  if (state.timerId) clearTimeout(state.timerId);
  updateControlsState({ running: false, paused: true });

  state.engine1.setStatus('Paused', 'status-ready');
  if (state.engine2) state.engine2.setStatus('Paused', 'status-ready');
}

function stopAutoPlay() {
  state.isRunning = false;
  state.isPaused = false;
  if (state.timerId) {
    clearTimeout(state.timerId);
    state.timerId = null;
  }
}

function checkAllFinished() {
  const finished1 = state.engine1 && state.engine1.isFinished;
  const finished2 = !state.engine2 || state.engine2.isFinished;

  if (finished1 && finished2) {
    stopAutoPlay();
    updateControlsState({ running: false, finished: true });
  }
}

function updateControlsState({ running = false, paused = false, finished = false }) {
  playBtn.disabled = running;
  pauseBtn.disabled = !running;
  stepBtn.disabled = running || finished;
  newArrayBtn.disabled = running;
  arraySizeInput.disabled = running;
  arrayPresetSelect.disabled = running;
  algoSelect1.disabled = running;

  if (finished) {
    playBtn.disabled = true;
  }
}

// Event Listeners
singleModeBtn.addEventListener('click', () => {
  if (state.mode === 'single') return;
  state.mode = 'single';
  singleModeBtn.classList.add('active');
  compareModeBtn.classList.remove('active');
  visualizerContainer.classList.remove('compare-layout');
  visualizerContainer.classList.add('single-layout');
  panel2.classList.add('hidden');
  initVisualizers();
});

compareModeBtn.addEventListener('click', () => {
  if (state.mode === 'compare') return;
  state.mode = 'compare';
  compareModeBtn.classList.add('active');
  singleModeBtn.classList.remove('active');
  visualizerContainer.classList.remove('single-layout');
  visualizerContainer.classList.add('compare-layout');
  panel2.classList.remove('hidden');
  
  // In compare mode, ensure panel 1 is Bubble Sort
  state.algo1 = 'bubble';
  algoSelect1.value = 'bubble';
  updateConceptExplanation('bubble');
  initVisualizers();
});

algoSelect1.addEventListener('change', (e) => {
  state.algo1 = e.target.value;
  updateConceptExplanation(state.algo1);
  initVisualizers();
});

function updateConceptExplanation(algo) {
  const data = ALGO_CONCEPTS[algo];
  if (data) {
    conceptTitle1.textContent = data.title;
    conceptBody1.innerHTML = data.body;
  }
}

arraySizeInput.addEventListener('input', (e) => {
  state.arraySize = parseInt(e.target.value, 10);
  sizeVal.textContent = state.arraySize;
  initVisualizers();
});

sortSpeedInput.addEventListener('input', (e) => {
  state.speedLevel = parseInt(e.target.value, 10);
  speedVal.textContent = SPEED_LABELS[state.speedLevel];
});

arrayPresetSelect.addEventListener('change', (e) => {
  state.preset = e.target.value;
  initVisualizers();
});

newArrayBtn.addEventListener('click', () => {
  initVisualizers();
});

playBtn.addEventListener('click', () => {
  startAutoPlay();
});

pauseBtn.addEventListener('click', () => {
  pauseAutoPlay();
});

stepBtn.addEventListener('click', () => {
  stepForward();
});

resetBtn.addEventListener('click', () => {
  resetCurrentArray();
});

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  initVisualizers();
});
