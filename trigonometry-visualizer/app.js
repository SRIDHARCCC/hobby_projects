/**
 * TrigLab - Application Controller & Interactive Visualizer
 * Manages unit circle canvas, synchronized wave graph, user drag interactions,
 * real-time educational insights, teacher guide proofs, quiz, and cheat sheet.
 */

(function () {
  'use strict';

  // Application State
  const state = {
    angleDeg: 90, // Default to 90° to directly highlight user's core request
    isPlaying: false,
    animationSpeed: 1.0,
    animFrameId: null,
    isDraggingCircle: false,
    activeTab: 'tab-explorer',
    activeCurves: new Set(['sin', 'cos', 'tan']),
    projections: {
      triangle: true,
      sinCos: true,
      tanLine: true,
      reciprocals: false,
      quadrantLabels: true
    },
    activeTopicId: 'sin-90',
    quizScore: 0,
    quizAnswered: {}
  };

  // DOM Elements Cache
  const DOM = {};

  function cacheDOMElements() {
    DOM.navTabs = document.querySelectorAll('.nav-tab');
    DOM.tabPanes = document.querySelectorAll('.tab-pane');
    DOM.angleSlider = document.getElementById('angleSlider');
    DOM.displayAngleDeg = document.getElementById('displayAngleDeg');
    DOM.displayAngleRad = document.getElementById('displayAngleRad');
    DOM.displayQuadrant = document.getElementById('displayQuadrant');
    DOM.btnAutoPlay = document.getElementById('btnAutoPlay');
    DOM.playBtnText = document.getElementById('playBtnText');
    DOM.btnResetAngle = document.getElementById('btnResetAngle');
    DOM.btnStepPrev = document.getElementById('btnStepPrev');
    DOM.btnStepNext = document.getElementById('btnStepNext');
    DOM.speedChips = document.querySelectorAll('.speed-chip');
    DOM.angleChips = document.querySelectorAll('.angle-chip');
    DOM.quickTeachBtns = document.querySelectorAll('.quick-teach-btn');

    DOM.circleCanvas = document.getElementById('circleCanvas');
    DOM.waveCanvas = document.getElementById('waveCanvas');

    DOM.chkTriangle = document.getElementById('chkTriangle');
    DOM.chkSinCos = document.getElementById('chkSinCos');
    DOM.chkTanLine = document.getElementById('chkTanLine');
    DOM.chkReciprocals = document.getElementById('chkReciprocals');
    DOM.chkQuadrantLabels = document.getElementById('chkQuadrantLabels');

    DOM.curveToggles = document.querySelectorAll('.curve-toggle');
    DOM.insightContent = document.getElementById('insightContent');

    // 6 Function Cards
    DOM.cards = {
      sin: { card: document.getElementById('card-sin'), exact: document.getElementById('exact-sin'), dec: document.getElementById('dec-sin'), sign: document.getElementById('sign-sin') },
      cos: { card: document.getElementById('card-cos'), exact: document.getElementById('exact-cos'), dec: document.getElementById('dec-cos'), sign: document.getElementById('sign-cos') },
      tan: { card: document.getElementById('card-tan'), exact: document.getElementById('exact-tan'), dec: document.getElementById('dec-tan'), sign: document.getElementById('sign-tan') },
      csc: { card: document.getElementById('card-csc'), exact: document.getElementById('exact-csc'), dec: document.getElementById('dec-csc'), sign: document.getElementById('sign-csc') },
      sec: { card: document.getElementById('card-sec'), exact: document.getElementById('exact-sec'), dec: document.getElementById('dec-sec'), sign: document.getElementById('sign-sec') },
      cot: { card: document.getElementById('card-cot'), exact: document.getElementById('exact-cot'), dec: document.getElementById('dec-cot'), sign: document.getElementById('sign-cot') }
    };

    // Teacher Guide Elements
    DOM.topicMenuContainer = document.getElementById('topicMenuContainer');
    DOM.teacherDetailTitle = document.getElementById('teacherDetailTitle');
    DOM.teacherDetailAngleBadge = document.getElementById('teacherDetailAngleBadge');
    DOM.teacherDetailBody = document.getElementById('teacherDetailBody');
    DOM.teacherProofSummary = document.getElementById('teacherProofSummary');
    DOM.btnDemonstrateTopic = document.getElementById('btnDemonstrateTopic');

    // Quiz Elements
    DOM.quizCardsList = document.getElementById('quizCardsList');
    DOM.quizScoreNum = document.getElementById('quizScoreNum');
    DOM.quizTotalNum = document.getElementById('quizTotalNum');
    DOM.btnResetQuiz = document.getElementById('btnResetQuiz');

    // Cheatsheet Elements
    DOM.cheatsheetTbody = document.getElementById('cheatsheetTbody');
  }

  // =========================================================================
  // Canvas Setup & High-DPI Scaling
  // =========================================================================

  function setupCanvasDPI(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || canvas.width;
    const height = rect.height || canvas.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, width, height, dpr };
  }

  // =========================================================================
  // Canvas 1: Interactive Unit Circle Rendering
  // =========================================================================

  function renderUnitCircle() {
    if (!DOM.circleCanvas) return;
    const { ctx, width, height } = setupCanvasDPI(DOM.circleCanvas);

    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const R = Math.min(width, height) * 0.36; // Radius in pixels

    const calc = TrigEngine.calculate(state.angleDeg);
    const rad = calc.rad;
    const px = cx + calc.unitPoint.x * R;
    const py = cy - calc.unitPoint.y * R; // Canvas Y inverted

    // 1. Background Grid & ASTC Quadrant Tints
    if (state.projections.quadrantLabels) {
      drawQuadrantOverlays(ctx, cx, cy, width, height, calc.quadrantInfo);
    }

    // 2. Coordinate Axes & Grid Lines
    drawCoordinateGrid(ctx, cx, cy, R, width, height);

    // 3. Unit Circle Perimeter (r = 1)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Subtle radial glow
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();

    // 4. Angle Sweep Arc & Sector Fill
    drawAngleArc(ctx, cx, cy, R, rad, state.angleDeg);

    // 5. Inscribed Right Triangle
    if (state.projections.triangle) {
      drawRightTriangle(ctx, cx, cy, px, py, calc);
    }

    // 6. Tangent Line Projection at x = 1
    if (state.projections.tanLine) {
      drawTangentLineProjection(ctx, cx, cy, R, calc);
    }

    // 7. Reciprocal Projections (Secant, Cosecant, Cotangent)
    if (state.projections.reciprocals) {
      drawReciprocalProjections(ctx, cx, cy, R, px, py, calc);
    }

    // 8. Terminal Ray from Origin to Point P
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(px, py);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // 9. Draggable Point P(cos θ, sin θ)
    drawHandlePoint(ctx, px, py, calc);
  }

  function drawQuadrantOverlays(ctx, cx, cy, width, height, qInfo) {
    ctx.save();
    ctx.font = '600 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const padding = 28;

    // Q1 (Top-Right): ALL (+)
    ctx.fillStyle = qInfo.quadrant === 'I' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.02)';
    ctx.fillRect(cx, 0, width - cx, cy);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('Q1: ALL (+)', width - padding * 2, padding);

    // Q2 (Top-Left): SINE (+)
    ctx.fillStyle = qInfo.quadrant === 'II' ? 'rgba(16, 185, 129, 0.12)' : 'transparent';
    ctx.fillRect(0, 0, cx, cy);
    ctx.fillStyle = '#10b981';
    ctx.fillText('Q2: SINE (+)', padding * 2, padding);

    // Q3 (Bottom-Left): TANGENT (+)
    ctx.fillStyle = qInfo.quadrant === 'III' ? 'rgba(245, 158, 11, 0.12)' : 'transparent';
    ctx.fillRect(0, cy, cx, height - cy);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('Q3: TAN (+)', padding * 2, height - padding);

    // Q4 (Bottom-Right): COSINE (+)
    ctx.fillStyle = qInfo.quadrant === 'IV' ? 'rgba(168, 85, 247, 0.12)' : 'transparent';
    ctx.fillRect(cx, cy, width - cx, height - cy);
    ctx.fillStyle = '#a855f7';
    ctx.fillText('Q4: COS (+)', width - padding * 2, height - padding);

    ctx.restore();
  }

  function drawCoordinateGrid(ctx, cx, cy, R, width, height) {
    ctx.save();

    // Secondary subtle grid lines at 0.5R
    ctx.strokeStyle = 'rgba(38, 51, 77, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    [-1, -0.5, 0.5, 1].forEach(val => {
      // Vertical lines
      const x = cx + val * R;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Horizontal lines
      const y = cy - val * R;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    });

    ctx.setLineDash([]); // Reset dash

    // Main Axes X and Y
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;

    // X-Axis
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(width, cy);
    ctx.stroke();

    // Y-Axis
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, height);
    ctx.stroke();

    // Axis Labels & Numerical Ticks
    ctx.font = '500 11px "Fira Code", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // X marks: -1, 1
    ctx.fillText('+1', cx + R, cy + 6);
    ctx.fillText('-1', cx - R, cy + 6);
    ctx.fillText('0', cx - 10, cy + 6);

    // Y marks: +1, -1
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('+1', cx - 6, cy - R);
    ctx.fillText('-1', cx - 6, cy + R);

    // Axis Names
    ctx.font = '700 12px Inter, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('+X (cos)', width - 8, cy - 12);
    ctx.textAlign = 'center';
    ctx.fillText('+Y (sin)', cx + 28, 14);

    ctx.restore();
  }

  function drawAngleArc(ctx, cx, cy, R, rad, deg) {
    const arcRadius = Math.min(R * 0.28, 48);

    ctx.save();
    // Angle sector fill
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, arcRadius, 0, -rad, true);
    ctx.closePath();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.fill();

    // Arc stroke
    ctx.beginPath();
    ctx.arc(cx, cy, arcRadius, 0, -rad, true);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Angle text label
    const midAngle = -rad / 2;
    const labelRadius = arcRadius + 14;
    const lx = cx + Math.cos(midAngle) * labelRadius;
    const ly = cy + Math.sin(midAngle) * labelRadius;

    ctx.font = '700 11px "Fira Code", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(deg)}°`, lx, ly);

    ctx.restore();
  }

  function drawRightTriangle(ctx, cx, cy, px, py, calc) {
    ctx.save();

    // Triangle Fill (Semi-transparent)
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(px, cy);
    ctx.lineTo(px, py);
    ctx.closePath();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.fill();

    // Right-angle square indicator at (px, cy)
    const squareSize = 10;
    const signX = calc.unitPoint.x >= 0 ? -1 : 1;
    const signY = calc.unitPoint.y >= 0 ? -1 : 1;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(px + signX * squareSize, cy);
    ctx.lineTo(px + signX * squareSize, cy + signY * squareSize);
    ctx.lineTo(px, cy + signY * squareSize);
    ctx.stroke();

    // 1. Adjacent Base: Cosine (Electric Sky Blue)
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(px, cy);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // 2. Opposite Vertical Height: Sine (Emerald Green)
    ctx.beginPath();
    ctx.moveTo(px, cy);
    ctx.lineTo(px, py);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Side text labels
    ctx.font = '600 11px "Fira Code", monospace';

    // Cosine label along base
    const midBaseX = (cx + px) / 2;
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.textBaseline = calc.unitPoint.y >= 0 ? 'top' : 'bottom';
    const cosOffset = calc.unitPoint.y >= 0 ? 6 : -6;
    if (Math.abs(calc.unitPoint.x) > 0.12) {
      ctx.fillText(`cos = ${calc.functions.cos.text}`, midBaseX, cy + cosOffset);
    }

    // Sine label along vertical height
    const midHeightY = (cy + py) / 2;
    ctx.fillStyle = '#10b981';
    ctx.textAlign = calc.unitPoint.x >= 0 ? 'left' : 'right';
    ctx.textBaseline = 'middle';
    const sinOffset = calc.unitPoint.x >= 0 ? 8 : -8;
    if (Math.abs(calc.unitPoint.y) > 0.12) {
      ctx.fillText(`sin = ${calc.functions.sin.text}`, px + sinOffset, midHeightY);
    }

    ctx.restore();
  }

  function drawTangentLineProjection(ctx, cx, cy, R, calc) {
    ctx.save();
    const tanX = cx + R; // Vertical line at x = +1

    // Vertical line x = 1 (light dashed line)
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(tanX, 0);
    ctx.lineTo(tanX, cy * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    if (calc.functions.tan.isUndefined) {
      // Highlight vertical asymptote explanation at 90° and 270°!
      ctx.font = '700 11px Inter, sans-serif';
      ctx.fillStyle = '#ef4444';
      ctx.textAlign = 'left';
      ctx.fillText('⚡ Parallel ray: Tan 90° = Undefined (±∞)', tanX + 10, cy - R);
      ctx.restore();
      return;
    }

    // Intersection with line x = 1
    // Ray equation: y = x * tan(theta). At x = 1, y = tan(theta).
    const tanVal = calc.functions.tan.val;
    const tanY = cy - tanVal * R;

    // Draw extended ray to tangent line
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(tanX, tanY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Tangent segment from (1, 0) to (1, tan θ)
    ctx.beginPath();
    ctx.moveTo(tanX, cy);
    ctx.lineTo(tanX, tanY);
    ctx.strokeStyle = '#f59e0b'; // Amber
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Tangent point marker & label
    if (tanY >= 0 && tanY <= cy * 2) {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(tanX, tanY, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '600 11px "Fira Code", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`tan = ${calc.functions.tan.text}`, tanX + 8, (cy + tanY) / 2);
    }

    ctx.restore();
  }

  function drawReciprocalProjections(ctx, cx, cy, R, px, py, calc) {
    ctx.save();
    // Tangent line to the circle at point P:
    // Equation: x * cos(θ) + y * sin(θ) = 1
    // X-intercept: x = 1 / cos(θ) = sec(θ)
    // Y-intercept: y = 1 / sin(θ) = csc(θ)
    const cosVal = calc.unitPoint.x;
    const sinVal = calc.unitPoint.y;

    if (Math.abs(cosVal) > 0.05 && Math.abs(sinVal) > 0.05) {
      const secX = cx + (R / cosVal);
      const cscY = cy - (R / sinVal);

      // Tangent line at P passing through (sec, 0) and (0, csc)
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(secX, cy);
      ctx.lineTo(cx, cscY);
      ctx.stroke();

      // Secant segment along X-axis
      ctx.strokeStyle = '#a855f7'; // Purple
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(secX, cy);
      ctx.stroke();

      // Cosecant segment along Y-axis
      ctx.strokeStyle = '#ec4899'; // Pink
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cscY);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawHandlePoint(ctx, px, py, calc) {
    ctx.save();

    // Pulse outer halo
    ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.beginPath();
    ctx.arc(px, py, 14, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright circle
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Coordinates tooltip badge next to handle
    const coordText = `(${calc.unitPoint.x.toFixed(2)}, ${calc.unitPoint.y.toFixed(2)})`;
    ctx.font = '600 11px "Fira Code", monospace';
    const textWidth = ctx.measureText(coordText).width;

    const tipX = px + (calc.unitPoint.x >= 0 ? 12 : -textWidth - 24);
    const tipY = py + (calc.unitPoint.y >= 0 ? -12 : 20);

    // Pill background
    ctx.fillStyle = 'rgba(11, 17, 30, 0.85)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(tipX, tipY - 14, textWidth + 12, 20, 4);
    ctx.fill();
    ctx.stroke();

    // Pill text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(coordText, tipX + 6, tipY - 4);

    ctx.restore();
  }

  // =========================================================================
  // Canvas 2: Synchronized Wave Graph (0° to 360°)
  // =========================================================================

  function renderWaveGraph() {
    if (!DOM.waveCanvas) return;
    const { ctx, width, height } = setupCanvasDPI(DOM.waveCanvas);

    ctx.clearRect(0, 0, width, height);

    const padLeft = 45;
    const padRight = 30;
    const padTop = 30;
    const padBottom = 45;

    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;
    const yCenter = padTop + plotH / 2;

    const yMax = 3.2; // Domain [-3.2, 3.2]

    function degToX(deg) {
      return padLeft + (deg / 360) * plotW;
    }

    function valToY(v) {
      return yCenter - (v / yMax) * (plotH / 2);
    }

    // 1. Grid & Axes
    drawWaveGrid(ctx, padLeft, padTop, plotW, plotH, yCenter, degToX, valToY);

    // 2. Vertical Asymptotes (Dashed Red Lines at 90°, 270°, etc.)
    drawWaveAsymptotes(ctx, padTop, plotH, degToX);

    // 3. Plot Selected Active Function Curves
    state.activeCurves.forEach(curveName => {
      plotCurve(ctx, curveName, degToX, valToY, yCenter, padTop, plotH);
    });

    // 4. Current Angle Vertical Tracker & Pulsing Tracer Dots
    drawWaveTracker(ctx, state.angleDeg, degToX, valToY, padTop, plotH);
  }

  function drawWaveGrid(ctx, padLeft, padTop, plotW, plotH, yCenter, degToX, valToY) {
    ctx.save();
    ctx.strokeStyle = '#26334d';
    ctx.lineWidth = 1;

    // Horizontal grid lines: y = -3, -2, -1, 0, 1, 2, 3
    ctx.font = '500 11px "Fira Code", monospace';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    [-3, -2, -1, 0, 1, 2, 3].forEach(v => {
      const y = valToY(v);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + plotW, y);
      ctx.strokeStyle = v === 0 ? '#475569' : '#1a2234';
      ctx.lineWidth = v === 0 ? 1.5 : 1;
      ctx.stroke();

      ctx.fillText(v.toString(), padLeft - 8, y);
    });

    // Vertical angle benchmarks: 0°, 90°, 180°, 270°, 360°
    const benchmarks = [
      { deg: 0, text: '0°', rad: '0' },
      { deg: 90, text: '90°', rad: 'π/2' },
      { deg: 180, text: '180°', rad: 'π' },
      { deg: 270, text: '270°', rad: '3π/2' },
      { deg: 360, text: '360°', rad: '2π' }
    ];

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    benchmarks.forEach(bm => {
      const x = degToX(bm.deg);
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, padTop + plotH);
      ctx.strokeStyle = '#1e293b';
      ctx.stroke();

      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(bm.text, x, padTop + plotH + 6);
      ctx.fillStyle = '#64748b';
      ctx.fillText(bm.rad, x, padTop + plotH + 20);
    });

    ctx.restore();
  }

  function drawWaveAsymptotes(ctx, padTop, plotH, degToX) {
    ctx.save();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    // Check if tan or sec active (asymptotes at 90°, 270°)
    if (state.activeCurves.has('tan') || state.activeCurves.has('sec')) {
      [90, 270].forEach(deg => {
        const x = degToX(deg);
        ctx.beginPath();
        ctx.moveTo(x, padTop);
        ctx.lineTo(x, padTop + plotH);
        ctx.stroke();
      });
    }

    // Check if csc or cot active (asymptotes at 0°, 180°, 360°)
    if (state.activeCurves.has('csc') || state.activeCurves.has('cot')) {
      [0, 180, 360].forEach(deg => {
        const x = degToX(deg);
        ctx.beginPath();
        ctx.moveTo(x, padTop);
        ctx.lineTo(x, padTop + plotH);
        ctx.stroke();
      });
    }

    ctx.restore();
  }

  function plotCurve(ctx, curveName, degToX, valToY, yCenter, padTop, plotH) {
    ctx.save();

    const curveColors = {
      sin: '#10b981',
      cos: '#38bdf8',
      tan: '#f59e0b',
      csc: '#ec4899',
      sec: '#a855f7',
      cot: '#14b8a6'
    };

    ctx.strokeStyle = curveColors[curveName] || '#ffffff';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    let isDrawing = false;
    let prevY = null;

    for (let deg = 0; deg <= 360; deg += 0.5) {
      const calc = TrigEngine.calculate(deg);
      const funcObj = calc.functions[curveName];

      if (funcObj.isUndefined || funcObj.val === null) {
        isDrawing = false;
        continue;
      }

      let val = funcObj.val;
      // Clamp to prevent infinite spikes bridging across asymptotes
      if (Math.abs(val) > 3.4) {
        isDrawing = false;
        continue;
      }

      const x = degToX(deg);
      const y = valToY(val);

      // Avoid vertical jump artifact across asymptotes
      if (prevY !== null && Math.abs(y - prevY) > plotH * 0.7) {
        isDrawing = false;
      }

      if (!isDrawing) {
        ctx.moveTo(x, y);
        isDrawing = true;
      } else {
        ctx.lineTo(x, y);
      }

      prevY = y;
    }

    ctx.stroke();
    ctx.restore();
  }

  function drawWaveTracker(ctx, currentDeg, degToX, valToY, padTop, plotH) {
    const curX = degToX(currentDeg);

    ctx.save();

    // Vertical Tracking Cursor
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(curX, padTop);
    ctx.lineTo(curX, padTop + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Tracer Dots for each active curve
    const calc = TrigEngine.calculate(currentDeg);
    state.activeCurves.forEach(curveName => {
      const funcObj = calc.functions[curveName];
      if (!funcObj.isUndefined && funcObj.val !== null && Math.abs(funcObj.val) <= 3.3) {
        const curY = valToY(funcObj.val);

        // Halo
        ctx.fillStyle = funcObj.color + '40';
        ctx.beginPath();
        ctx.arc(curX, curY, 8, 0, Math.PI * 2);
        ctx.fill();

        // Dot
        ctx.fillStyle = funcObj.color;
        ctx.beginPath();
        ctx.arc(curX, curY, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });

    ctx.restore();
  }

  // =========================================================================
  // UI Updates: Function Cards & Dynamic Educational Insight
  // =========================================================================

  function updateUI() {
    const calc = TrigEngine.calculate(state.angleDeg);

    // Update Header & Toolbar Angle Displays
    DOM.displayAngleDeg.textContent = `${Math.round(state.angleDeg)}°`;
    DOM.displayAngleRad.textContent = calc.radDisplay;
    DOM.displayQuadrant.textContent = calc.quadrantInfo.label;
    DOM.angleSlider.value = Math.round(state.angleDeg);

    // Update Angle Preset Chip Active States
    DOM.angleChips.forEach(chip => {
      const deg = parseFloat(chip.getAttribute('data-deg'));
      if (Math.abs(deg - state.angleDeg) < 0.5) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });

    // Update 6 Function Cards
    ['sin', 'cos', 'tan', 'csc', 'sec', 'cot'].forEach(fnKey => {
      const fn = calc.functions[fnKey];
      const cardEl = DOM.cards[fnKey];
      if (!cardEl) return;

      cardEl.exact.textContent = fn.text;
      cardEl.exact.className = fn.isUndefined ? 'func-exact alert-undef' : 'func-exact';

      if (fn.isUndefined) {
        cardEl.dec.textContent = 'Asymptote (±∞)';
        cardEl.sign.textContent = 'Undefined';
        cardEl.sign.className = 'func-sign-badge badge-undef';
      } else {
        cardEl.dec.textContent = fn.val.toFixed(4);
        const signChar = fn.val > 0 ? '+' : (fn.val < 0 ? '-' : '0');
        cardEl.sign.textContent = signChar;
        cardEl.sign.className = 'func-sign-badge';
      }
    });

    // Update Classroom Insight Callout Box
    renderInsight(calc);

    // Render Canvases
    renderUnitCircle();
    renderWaveGraph();
  }

  function renderInsight(calc) {
    const deg = Math.round(state.angleDeg);
    let html = '';

    if (deg === 90) {
      html = `
        <strong>⚡ Classroom Focus: Why is sin(90°) = 1, cos(90°) = 0, and tan(90°) = Undefined?</strong><br>
        1. <strong>Base collapses to 0:</strong> As the angle climbs toward the top, horizontal distance from the y-axis shrinks to zero, so <code>cos(90°) = Adjacent / Hypotenuse = 0 / 1 = 0</code>.<br>
        2. <strong>Height matches radius:</strong> The vertical side stretches to equal the entire radius, so <code>sin(90°) = Opposite / Hypotenuse = 1 / 1 = 1</code>.<br>
        3. <strong>Division by zero:</strong> <code>tan(90°) = sin / cos = 1 / 0</code>. Geometrically, the terminal ray is straight up and parallel to the vertical tangent line $x = 1$, creating an infinite vertical asymptote!
      `;
    } else if (deg === 0 || deg === 360) {
      html = `
        <strong>⚡ Cardinal Angle 0° / 360° (Positive X-Axis):</strong><br>
        The terminal point is at <code>(1, 0)</code>. Horizontal base is full radius (<code>cos 0° = 1</code>), vertical height is zero (<code>sin 0° = 0</code>). 
        <code>tan 0° = 0 / 1 = 0</code>, while <code>csc 0° = 1 / 0 = Undefined</code>.
      `;
    } else if (deg === 180) {
      html = `
        <strong>⚡ Cardinal Angle 180° (Negative X-Axis):</strong><br>
        The terminal point is at <code>(-1, 0)</code> in Quadrant II / III boundary. <code>cos(180°) = -1</code>, <code>sin(180°) = 0</code>, and <code>tan(180°) = 0</code>.
      `;
    } else if (deg === 270) {
      html = `
        <strong>⚡ Cardinal Angle 270° (Negative Y-Axis):</strong><br>
        The point is directly downwards at <code>(0, -1)</code>. <code>cos(270°) = 0</code>, <code>sin(270°) = -1</code>. Like 90°, <code>tan(270°) = -1 / 0 = Undefined</code> (vertical asymptote).
      `;
    } else {
      const q = calc.quadrantInfo;
      html = `
        <strong>${q.label}:</strong> ${q.astcRule}. ${q.description}<br>
        Unit Circle Coordinates: <code>(x, y) = (${calc.unitPoint.x.toFixed(4)}, ${calc.unitPoint.y.toFixed(4)})</code>. 
        Pythagorean Check: <code>sin²(${deg}°) + cos²(${deg}°) = ${(calc.functions.sin.val**2 + calc.functions.cos.val**2).toFixed(4)} = 1.0</code>.
      `;
    }

    DOM.insightContent.innerHTML = html;
  }

  // =========================================================================
  // Interactive User Controls & Event Listeners
  // =========================================================================

  function setAngle(deg) {
    state.angleDeg = TrigEngine.normalizeDeg(deg);
    updateUI();
  }

  function togglePlay() {
    state.isPlaying = !state.isPlaying;
    if (state.isPlaying) {
      DOM.playBtnText.textContent = 'Pause';
      DOM.btnAutoPlay.classList.add('active');
      animateLoop();
    } else {
      DOM.playBtnText.textContent = 'Auto Play';
      DOM.btnAutoPlay.classList.remove('active');
      if (state.animFrameId) cancelAnimationFrame(state.animFrameId);
    }
  }

  function animateLoop() {
    if (!state.isPlaying) return;
    const step = 0.5 * state.animationSpeed;
    state.angleDeg = TrigEngine.normalizeDeg(state.angleDeg + step);
    updateUI();
    state.animFrameId = requestAnimationFrame(animateLoop);
  }

  function setupEventListeners() {
    // Navigation Tabs
    DOM.navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('data-tab');
        DOM.navTabs.forEach(t => t.classList.remove('active'));
        DOM.tabPanes.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        const targetPane = document.getElementById(targetId);
        if (targetPane) targetPane.classList.add('active');
        state.activeTab = targetId;

        // Re-render when switching back to explorer
        if (targetId === 'tab-explorer') {
          setTimeout(updateUI, 10);
        }
      });
    });

    // Angle Range Slider
    DOM.angleSlider.addEventListener('input', e => {
      if (state.isPlaying) togglePlay(); // Pause on manual input
      setAngle(parseFloat(e.target.value));
    });

    // Step Buttons
    DOM.btnStepPrev.addEventListener('click', () => {
      if (state.isPlaying) togglePlay();
      setAngle(state.angleDeg - 15);
    });

    DOM.btnStepNext.addEventListener('click', () => {
      if (state.isPlaying) togglePlay();
      setAngle(state.angleDeg + 15);
    });

    // Reset Button
    DOM.btnResetAngle.addEventListener('click', () => {
      if (state.isPlaying) togglePlay();
      setAngle(0);
    });

    // Auto Play Button
    DOM.btnAutoPlay.addEventListener('click', togglePlay);

    // Speed Chips
    DOM.speedChips.forEach(chip => {
      chip.addEventListener('click', () => {
        DOM.speedChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.animationSpeed = parseFloat(chip.getAttribute('data-speed'));
      });
    });

    // Benchmark Angle Preset Chips
    DOM.angleChips.forEach(chip => {
      chip.addEventListener('click', () => {
        if (state.isPlaying) togglePlay();
        const deg = parseFloat(chip.getAttribute('data-deg'));
        setAngle(deg);
      });
    });

    // Quick Teacher Classroom Buttons
    DOM.quickTeachBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.isPlaying) togglePlay();
        const teachId = btn.getAttribute('data-teach');
        const topic = TrigEngine.TEACHER_TOPICS.find(t => t.id === teachId);
        if (topic) {
          setAngle(topic.targetAngle);
        }
      });
    });

    // Projection Checkboxes
    DOM.chkTriangle.addEventListener('change', e => {
      state.projections.triangle = e.target.checked;
      renderUnitCircle();
    });

    DOM.chkSinCos.addEventListener('change', e => {
      state.projections.sinCos = e.target.checked;
      renderUnitCircle();
    });

    DOM.chkTanLine.addEventListener('change', e => {
      state.projections.tanLine = e.target.checked;
      renderUnitCircle();
    });

    DOM.chkReciprocals.addEventListener('change', e => {
      state.projections.reciprocals = e.target.checked;
      renderUnitCircle();
    });

    DOM.chkQuadrantLabels.addEventListener('change', e => {
      state.projections.quadrantLabels = e.target.checked;
      renderUnitCircle();
    });

    // Wave Curve Toggles
    DOM.curveToggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        const curve = toggle.getAttribute('data-curve');
        if (state.activeCurves.has(curve)) {
          // Keep at least one curve active
          if (state.activeCurves.size > 1) {
            state.activeCurves.delete(curve);
            toggle.classList.remove('active');
          }
        } else {
          state.activeCurves.add(curve);
          toggle.classList.add('active');
        }
        renderWaveGraph();
      });
    });

    // Canvas Dragging on Unit Circle
    setupCanvasInteractions();

    // Window Resize Handling
    window.addEventListener('resize', () => {
      renderUnitCircle();
      renderWaveGraph();
    });
  }

  // Pointer & Touch Dragging on Unit Circle Handle
  function setupCanvasInteractions() {
    const canvas = DOM.circleCanvas;
    if (!canvas) return;

    function handlePointer(e) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const cx = rect.width / 2;
      const cy = rect.height / 2;

      const dx = x - cx;
      const dy = cy - y; // Invert mathematical Y

      let rad = Math.atan2(dy, dx);
      if (rad < 0) rad += Math.PI * 2;

      let deg = TrigEngine.radToDeg(rad);

      // Snap to standard 15° benchmarks if close
      const nearest15 = Math.round(deg / 15) * 15;
      if (Math.abs(deg - nearest15) < 3.0) {
        deg = nearest15;
      }

      setAngle(deg);
    }

    canvas.addEventListener('pointerdown', e => {
      if (state.isPlaying) togglePlay();
      state.isDraggingCircle = true;
      canvas.setPointerCapture(e.pointerId);
      handlePointer(e);
    });

    canvas.addEventListener('pointermove', e => {
      if (state.isDraggingCircle) {
        handlePointer(e);
      }
    });

    canvas.addEventListener('pointerup', e => {
      state.isDraggingCircle = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    });

    canvas.addEventListener('pointercancel', () => {
      state.isDraggingCircle = false;
    });
  }

  // =========================================================================
  // Tab 2: Teacher's Guide & Proofs View
  // =========================================================================

  function initTeacherGuide() {
    if (!DOM.topicMenuContainer) return;
    DOM.topicMenuContainer.innerHTML = '';

    TrigEngine.TEACHER_TOPICS.forEach((topic, idx) => {
      const btn = document.createElement('button');
      btn.className = `topic-menu-btn ${idx === 0 ? 'active' : ''}`;
      btn.setAttribute('data-id', topic.id);
      btn.innerHTML = `
        <span class="topic-btn-title">${topic.title}</span>
        <span class="topic-btn-summary">${topic.shortSummary}</span>
      `;

      btn.addEventListener('click', () => {
        document.querySelectorAll('.topic-menu-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        showTeacherTopic(topic.id);
      });

      DOM.topicMenuContainer.appendChild(btn);
    });

    // Demonstrate Topic on Explorer
    DOM.btnDemonstrateTopic.addEventListener('click', () => {
      const topic = TrigEngine.TEACHER_TOPICS.find(t => t.id === state.activeTopicId);
      if (topic) {
        // Switch to Tab 1
        const tabExplorerBtn = document.querySelector('[data-tab="tab-explorer"]');
        if (tabExplorerBtn) tabExplorerBtn.click();
        setAngle(topic.targetAngle);
      }
    });

    showTeacherTopic('sin-90');
  }

  function showTeacherTopic(topicId) {
    const topic = TrigEngine.TEACHER_TOPICS.find(t => t.id === topicId);
    if (!topic) return;

    state.activeTopicId = topicId;
    DOM.teacherDetailTitle.textContent = topic.title;
    DOM.teacherDetailAngleBadge.textContent = `Target Angle: ${topic.targetAngle}°`;
    DOM.teacherDetailBody.innerHTML = topic.explanation;

    DOM.teacherProofSummary.innerHTML = `
      <strong>💡 Teaching Takeaway:</strong> ${topic.shortSummary} Click "View on Live Explorer" to see this angle animated on the unit circle.
    `;
  }

  // =========================================================================
  // Tab 3: Student Quiz & Practice
  // =========================================================================

  function initQuiz() {
    if (!DOM.quizCardsList) return;
    DOM.quizTotalNum.textContent = TrigEngine.QUIZ_QUESTIONS.length;
    DOM.quizScoreNum.textContent = '0';
    state.quizScore = 0;
    state.quizAnswered = {};

    DOM.quizCardsList.innerHTML = '';

    TrigEngine.QUIZ_QUESTIONS.forEach((q, idx) => {
      const card = document.createElement('div');
      card.className = 'quiz-card';
      card.id = `quiz-card-${q.id}`;

      let optionsHtml = '';
      q.options.forEach((opt, optIdx) => {
        optionsHtml += `
          <button class="quiz-option-btn" data-qid="${q.id}" data-opt="${optIdx}">
            <span>${['A', 'B', 'C', 'D'][optIdx]}.</span> ${opt}
          </button>
        `;
      });

      card.innerHTML = `
        <div class="quiz-card-header">
          <div class="quiz-question-title">Q${idx + 1}: ${q.question}</div>
          <button class="btn btn-secondary btn-sm quiz-visual-jump-btn" data-angle="${q.targetAngle}">
            🔍 Show ${q.targetAngle}° on Circle
          </button>
        </div>
        <div class="quiz-options-group">${optionsHtml}</div>
        <div class="quiz-feedback-box" id="feedback-${q.id}"></div>
      `;

      DOM.quizCardsList.appendChild(card);
    });

    // Attach Quiz Option Click Listeners
    DOM.quizCardsList.addEventListener('click', e => {
      const btn = e.target.closest('.quiz-option-btn');
      if (btn && !btn.disabled) {
        const qid = parseInt(btn.getAttribute('data-qid'), 10);
        const optIdx = parseInt(btn.getAttribute('data-opt'), 10);
        handleQuizAnswer(qid, optIdx);
      }

      const jumpBtn = e.target.closest('.quiz-visual-jump-btn');
      if (jumpBtn) {
        const angle = parseFloat(jumpBtn.getAttribute('data-angle'));
        const tabExplorerBtn = document.querySelector('[data-tab="tab-explorer"]');
        if (tabExplorerBtn) tabExplorerBtn.click();
        setAngle(angle);
      }
    });

    DOM.btnResetQuiz.addEventListener('click', initQuiz);
  }

  function handleQuizAnswer(qid, selectedIdx) {
    if (state.quizAnswered[qid] !== undefined) return; // Already answered

    const question = TrigEngine.QUIZ_QUESTIONS.find(q => q.id === qid);
    if (!question) return;

    state.quizAnswered[qid] = selectedIdx;
    const isCorrect = selectedIdx === question.correctIndex;
    if (isCorrect) state.quizScore++;

    DOM.quizScoreNum.textContent = state.quizScore;

    // Highlight Buttons
    const card = document.getElementById(`quiz-card-${qid}`);
    const optionBtns = card.querySelectorAll('.quiz-option-btn');
    optionBtns.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === question.correctIndex) {
        btn.classList.add('correct');
      } else if (idx === selectedIdx && !isCorrect) {
        btn.classList.add('wrong');
      }
    });

    // Show Feedback Box
    const feedbackBox = document.getElementById(`feedback-${qid}`);
    feedbackBox.className = `quiz-feedback-box active ${isCorrect ? 'quiz-feedback-correct' : 'quiz-feedback-wrong'}`;
    feedbackBox.innerHTML = `
      <strong>${isCorrect ? '✓ Correct!' : '✗ Not quite.'}</strong> ${question.explanation}
    `;
  }

  // =========================================================================
  // Tab 4: 360° Value Cheat Sheet Table
  // =========================================================================

  function initCheatSheet() {
    if (!DOM.cheatsheetTbody) return;
    DOM.cheatsheetTbody.innerHTML = '';

    const sortedDegs = Object.keys(TrigEngine.EXACT_BENCHMARKS).map(Number).sort((a, b) => a - b);

    sortedDegs.forEach(deg => {
      const bm = TrigEngine.EXACT_BENCHMARKS[deg];
      const qInfo = TrigEngine.getQuadrantInfo(deg);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${deg}°</strong></td>
        <td><code>${bm.radStr}</code></td>
        <td><span class="badge badge-subtle">${qInfo.quadrant.toUpperCase()}</span></td>
        <td class="radical-val" style="color: #10b981;">${bm.sin.text}</td>
        <td class="radical-val" style="color: #38bdf8;">${bm.cos.text}</td>
        <td class="radical-val" style="color: #f59e0b;">${bm.tan.text}</td>
        <td class="radical-val" style="color: #ec4899;">${bm.csc.text}</td>
        <td class="radical-val" style="color: #a855f7;">${bm.sec.text}</td>
        <td class="radical-val" style="color: #14b8a6;">${bm.cot.text}</td>
        <td>
          <button class="cheatsheet-jump-btn" data-deg="${deg}">Load ${deg}°</button>
        </td>
      `;

      DOM.cheatsheetTbody.appendChild(tr);
    });

    DOM.cheatsheetTbody.addEventListener('click', e => {
      const btn = e.target.closest('.cheatsheet-jump-btn');
      if (btn) {
        const deg = parseFloat(btn.getAttribute('data-deg'));
        const tabExplorerBtn = document.querySelector('[data-tab="tab-explorer"]');
        if (tabExplorerBtn) tabExplorerBtn.click();
        setAngle(deg);
      }
    });
  }

  // =========================================================================
  // Application Entry Point
  // =========================================================================

  function init() {
    cacheDOMElements();
    setupEventListeners();
    initTeacherGuide();
    initQuiz();
    initCheatSheet();

    // Initial render at 90°
    updateUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
