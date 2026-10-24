/**
 * NetLab: Network Architecture & Protocol Visualizer - Main Controller
 */

(function () {
  'use strict';

  const engine = new NetworkEngine();
  let totalPackets = 0;
  let activeHopTimeout = null;
  let currentHandshakeStep = 0;
  const handshakeSteps = engine.simulateTcpHandshake();

  // DOM Elements
  const tabButtons = document.querySelectorAll('.nav-tab');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const hopContainer = document.getElementById('hop-container');
  const btnTransmit = document.getElementById('btnTransmitPacket');
  const hopStatusText = document.getElementById('hop-status-text');
  const wireLogBox = document.getElementById('wire-log-box');
  const statusButtonsContainer = document.getElementById('status-buttons');
  const protocolPreviewBox = document.getElementById('protocol-preview-box');
  const handshakeTimeline = document.getElementById('handshake-timeline');
  const btnStepHandshake = document.getElementById('btnStepHandshake');
  const scaleSlider = document.getElementById('scale-slider');
  const delaySlider = document.getElementById('delay-slider');
  const delayLabel = document.getElementById('delay-label');
  const btnTestDelay = document.getElementById('btnTestDelay');
  const btnQuickPing = document.getElementById('btnQuickPing');
  const btnResetApp = document.getElementById('btnResetApp');

  // Metrics
  const metricRtt = document.getElementById('metric-rtt');
  const metricPackets = document.getElementById('metric-packets');
  const teleHop = document.getElementById('tele-hop');
  const teleLayer = document.getElementById('tele-layer');

  // --- Tab Navigation ---
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const panel = document.getElementById(targetId);
      if (panel) panel.classList.add('active');
    });
  });

  // --- Render Hops ---
  function renderHops() {
    hopContainer.innerHTML = '';
    engine.hops.forEach((hop, idx) => {
      const node = document.createElement('div');
      node.className = 'hop-node';
      node.id = `hop-${hop.id}`;
      node.innerHTML = `
        <div class="hop-icon">${hop.icon}</div>
        <div class="hop-info">
          <div class="hop-title">${hop.step}. ${hop.title}</div>
          <div class="hop-meta">${hop.layer} &bull; ${hop.desc}</div>
        </div>
      `;
      hopContainer.appendChild(node);

      if (idx < engine.hops.length - 1) {
        const connector = document.createElement('div');
        connector.className = 'hop-connector';
        connector.innerText = '▼';
        hopContainer.appendChild(connector);
      }
    });
  }

  // --- Transmit Packet Animation ---
  async function transmitPacket() {
    if (activeHopTimeout) return;
    btnTransmit.disabled = true;
    hopStatusText.innerText = 'In Flight...';
    hopStatusText.className = 'badge badge-accent';

    totalPackets++;
    metricPackets.innerText = totalPackets;

    document.querySelectorAll('.hop-node').forEach(n => n.classList.remove('active-hop'));

    const start = performance.now();
    const hopDelays = [120, 160, 140, 110, 100, 90, 80];

    for (let i = 0; i < engine.hops.length; i++) {
      const hop = engine.hops[i];
      const el = document.getElementById(`hop-${hop.id}`);
      if (el) el.classList.add('active-hop');

      teleHop.innerText = `${hop.step}. ${hop.title}`;
      teleLayer.innerText = hop.layer;

      appendWireLog(`[HOP ${hop.step}] Entering ${hop.title} (${hop.layer})`);
      await new Promise(r => setTimeout(r, hopDelays[i] || 100));

      if (el && i < engine.hops.length - 1) {
        el.classList.remove('active-hop');
      }
    }

    // Attempt real /api/ping or simulate
    let rtt = Math.round(performance.now() - start);
    try {
      const resp = await fetch('/api/ping', { cache: 'no-store' });
      if (resp.ok) {
        const data = await resp.json();
        rtt = Math.round(performance.now() - start);
      }
    } catch (e) {
      // Local or static mode
    }

    metricRtt.innerText = `${rtt} ms`;
    hopStatusText.innerText = `Ack: 200 OK (${rtt}ms)`;
    hopStatusText.className = 'badge badge-green';

    appendWireLog(`[ACK] Response successfully routed back to Client in ${rtt}ms.`);
    btnTransmit.disabled = false;
  }

  function appendWireLog(msg) {
    const time = new Date().toLocaleTimeString();
    wireLogBox.innerText = `[${time}] ${msg}\n` + wireLogBox.innerText.substring(0, 1200);
  }

  // --- Render Status Codes ---
  function renderStatusButtons() {
    statusButtonsContainer.innerHTML = '';
    const codes = [200, 201, 204, 301, 304, 400, 401, 403, 404, 429, 500, 502, 504];

    codes.forEach(code => {
      const info = engine.statusCodes[code] || { name: 'Status' };
      const btn = document.createElement('button');
      const catClass = code < 300 ? 'c-2xx' : code < 400 ? 'c-3xx' : code < 500 ? 'c-4xx' : 'c-5xx';
      btn.className = `btn-status ${catClass}`;
      btn.innerText = `${code} ${info.name}`;
      btn.addEventListener('click', () => triggerStatusCode(code));
      statusButtonsContainer.appendChild(btn);
    });
  }

  async function triggerStatusCode(code) {
    const info = engine.statusCodes[code];
    let body = JSON.stringify({
      statusCode: code,
      name: info.name,
      category: info.category,
      explanation: info.desc,
      timestamp: new Date().toISOString()
    }, null, 2);

    let rawReq = engine.formatRawHttpRequest('GET', `/api/status/${code}`, {
      'Host': window.location.host || 'localhost:8080',
      'User-Agent': navigator.userAgent,
      'Accept': 'application/json'
    });

    let rawResp = engine.formatRawHttpResponse(code, {
      'Content-Type': 'application/json'
    }, body);

    protocolPreviewBox.innerText = `=== CLIENT HTTP REQUEST ===\n${rawReq}\n=== SERVER HTTP RESPONSE ===\n${rawResp}`;
  }

  // --- TCP Handshake Timeline ---
  function renderHandshake() {
    handshakeTimeline.innerHTML = '';
    handshakeSteps.forEach((s, idx) => {
      const stepDiv = document.createElement('div');
      stepDiv.className = `handshake-step ${idx <= currentHandshakeStep ? 'done' : ''}`;
      stepDiv.id = `hstep-${s.step}`;
      stepDiv.innerHTML = `
        <div class="step-num">${s.step}</div>
        <div>
          <div style="font-weight: 700; color: #fff; font-size: 0.9rem;">
            [${s.flag}] ${s.sender} &rarr; ${s.receiver}
          </div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">
            ${s.explanation}
          </div>
        </div>
      `;
      handshakeTimeline.appendChild(stepDiv);
    });
  }

  btnStepHandshake.addEventListener('click', () => {
    currentHandshakeStep = (currentHandshakeStep + 1) % handshakeSteps.length;
    renderHandshake();
  });

  // --- Scale Simulator ---
  function updateScaleSimulation(users) {
    const res = engine.simulateScalability(users);
    document.getElementById('scale-badge').innerText = `${users.toLocaleString()} Concurrent Users`;
    document.getElementById('scale-slider-val').innerText = `${users.toLocaleString()} Users`;

    // Single host
    document.getElementById('single-success').innerText = `${res.singleHost.successUsers.toLocaleString()} (${100 - res.singleHost.droppedPercent}%)`;
    document.getElementById('single-dropped').innerText = `${res.singleHost.failedUsers.toLocaleString()} (${res.singleHost.droppedPercent}%)`;
    document.getElementById('single-latency').innerText = `${res.singleHost.avgLatencyMs.toLocaleString()} ms`;
    document.getElementById('single-error').innerText = res.singleHost.primaryError;
    document.getElementById('single-bottleneck').innerText = res.singleHost.bottleneck;

    // Production Cloud
    document.getElementById('prod-success').innerText = `${res.productionCloud.successUsers.toLocaleString()} (100%)`;
    document.getElementById('prod-offload').innerText = `${res.productionCloud.edgeOffloadedPercent}% (Zero origin load)`;
    document.getElementById('prod-latency').innerText = `${res.productionCloud.edgeLatencyMs} ms`;
    document.getElementById('prod-instances').innerText = `${res.productionCloud.autoScaledInstances} Container Instances`;
  }

  scaleSlider.addEventListener('input', (e) => {
    updateScaleSimulation(e.target.value);
  });

  // --- Delay Simulator ---
  delaySlider.addEventListener('input', (e) => {
    delayLabel.innerText = `${e.target.value} ms`;
  });

  btnTestDelay.addEventListener('click', async () => {
    const ms = delaySlider.value;
    btnTestDelay.disabled = true;
    btnTestDelay.innerText = `Waiting for server response (${ms}ms)...`;

    const start = performance.now();
    try {
      const resp = await fetch(`/api/delay?ms=${ms}`);
      const data = await resp.json();
      const elapsed = Math.round(performance.now() - start);
      protocolPreviewBox.innerText = `=== SIMULATED LATENCY TEST RESULT ===\nTTFB + Transit: ${elapsed}ms\nServer Response: ${JSON.stringify(data, null, 2)}`;
    } catch (e) {
      await new Promise(r => setTimeout(r, parseInt(ms, 10)));
      const elapsed = Math.round(performance.now() - start);
      protocolPreviewBox.innerText = `=== CLIENT-SIMULATED LATENCY RESULT ===\nElapsed Time: ${elapsed}ms\nSimulated TTFB: ${ms}ms pause completed.`;
    } finally {
      btnTestDelay.disabled = false;
      btnTestDelay.innerText = 'Execute Request with Simulated Delay';
    }
  });

  // Controls
  btnTransmit.addEventListener('click', transmitPacket);
  btnQuickPing.addEventListener('click', transmitPacket);
  btnResetApp.addEventListener('click', () => {
    totalPackets = 0;
    metricPackets.innerText = '0';
    metricRtt.innerText = '-- ms';
    currentHandshakeStep = 0;
    renderHandshake();
    wireLogBox.innerText = 'System reset to initial state.';
    updateScaleSimulation(1000);
    scaleSlider.value = 1000;
  });

  // Initialize
  renderHops();
  renderStatusButtons();
  renderHandshake();
  updateScaleSimulation(1000);
  triggerStatusCode(200);
})();
