/**
 * TrigLab - Trigonometric Engine
 * Pure mathematical domain logic for 6 trigonometric functions,
 * exact radical lookups, quadrant rules, geometric projections, and proofs.
 * 
 * Works in both Node.js and Browser environments.
 */

(function () {
  'use strict';

  const TrigEngine = {};

  // Degree <-> Radian conversions
  TrigEngine.degToRad = function (deg) {
    return (deg * Math.PI) / 180;
  };

  TrigEngine.radToDeg = function (rad) {
    return (rad * 180) / Math.PI;
  };

  // Normalize angle to [0, 360)
  TrigEngine.normalizeDeg = function (deg) {
    let normalized = deg % 360;
    if (normalized < 0) normalized += 360;
    return normalized;
  };

  // Quadrant classification
  // Returns: { quadrant: 'I' | 'II' | 'III' | 'IV' | 'axis', label: string, signs: object, astcRule: string }
  TrigEngine.getQuadrantInfo = function (deg) {
    const angle = TrigEngine.normalizeDeg(deg);

    if (angle === 0) {
      return {
        quadrant: 'axis',
        label: 'Positive X-Axis (0° / 360°)',
        astcRule: 'Boundary between Q4 and Q1',
        signs: { sin: '+', cos: '+', tan: '0', csc: 'undef', sec: '+', cot: 'undef' }
      };
    }
    if (angle === 90) {
      return {
        quadrant: 'axis',
        label: 'Positive Y-Axis (90°)',
        astcRule: 'Boundary between Q1 and Q2',
        signs: { sin: '+', cos: '0', tan: 'undef', csc: '+', sec: 'undef', cot: '0' }
      };
    }
    if (angle === 180) {
      return {
        quadrant: 'axis',
        label: 'Negative X-Axis (180°)',
        astcRule: 'Boundary between Q2 and Q3',
        signs: { sin: '0', cos: '-', tan: '0', csc: 'undef', sec: '-', cot: 'undef' }
      };
    }
    if (angle === 270) {
      return {
        quadrant: 'axis',
        label: 'Negative Y-Axis (270°)',
        astcRule: 'Boundary between Q3 and Q4',
        signs: { sin: '-', cos: '0', tan: 'undef', csc: '-', sec: 'undef', cot: '0' }
      };
    }

    if (angle > 0 && angle < 90) {
      return {
        quadrant: 'I',
        label: 'Quadrant I (0° – 90°)',
        astcRule: 'A — ALL functions are positive (+)',
        description: 'Both x and y are positive. All 6 trigonometric ratios are positive.',
        signs: { sin: '+', cos: '+', tan: '+', csc: '+', sec: '+', cot: '+' }
      };
    } else if (angle > 90 && angle < 180) {
      return {
        quadrant: 'II',
        label: 'Quadrant II (90° – 180°)',
        astcRule: 'S — SINE (and Cosecant) are positive (+)',
        description: 'x is negative, y is positive. Only sin and its reciprocal csc are positive; cos, sec, tan, cot are negative.',
        signs: { sin: '+', cos: '-', tan: '-', csc: '+', sec: '-', cot: '-' }
      };
    } else if (angle > 180 && angle < 270) {
      return {
        quadrant: 'III',
        label: 'Quadrant III (180° – 270°)',
        astcRule: 'T — TANGENT (and Cotangent) are positive (+)',
        description: 'Both x and y are negative. Since (-)/(-) is positive, tan and cot are positive; sin, cos, csc, sec are negative.',
        signs: { sin: '-', cos: '-', tan: '+', csc: '-', sec: '-', cot: '+' }
      };
    } else {
      return {
        quadrant: 'IV',
        label: 'Quadrant IV (270° – 360°)',
        astcRule: 'C — COSINE (and Secant) are positive (+)',
        description: 'x is positive, y is negative. cos and its reciprocal sec are positive; sin, csc, tan, cot are negative.',
        signs: { sin: '-', cos: '+', tan: '-', csc: '-', sec: '+', cot: '-' }
      };
    }
  };

  // Special benchmark angles with exact radical representations
  // Keys are degrees (0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360)
  const EXACT_BENCHMARKS = {
    0: {
      radStr: '0',
      sin: { val: 0, text: '0' },
      cos: { val: 1, text: '1' },
      tan: { val: 0, text: '0' },
      csc: { val: null, text: 'Undefined (±∞)' },
      sec: { val: 1, text: '1' },
      cot: { val: null, text: 'Undefined (±∞)' }
    },
    30: {
      radStr: 'π/6',
      sin: { val: 0.5, text: '1/2' },
      cos: { val: Math.sqrt(3) / 2, text: '√3/2' },
      tan: { val: 1 / Math.sqrt(3), text: '1/√3 (√3/3)' },
      csc: { val: 2, text: '2' },
      sec: { val: 2 / Math.sqrt(3), text: '2/√3 (2√3/3)' },
      cot: { val: Math.sqrt(3), text: '√3' }
    },
    45: {
      radStr: 'π/4',
      sin: { val: Math.SQRT1_2, text: '√2/2' },
      cos: { val: Math.SQRT1_2, text: '√2/2' },
      tan: { val: 1, text: '1' },
      csc: { val: Math.SQRT2, text: '√2' },
      sec: { val: Math.SQRT2, text: '√2' },
      cot: { val: 1, text: '1' }
    },
    60: {
      radStr: 'π/3',
      sin: { val: Math.sqrt(3) / 2, text: '√3/2' },
      cos: { val: 0.5, text: '1/2' },
      tan: { val: Math.sqrt(3), text: '√3' },
      csc: { val: 2 / Math.sqrt(3), text: '2/√3 (2√3/3)' },
      sec: { val: 2, text: '2' },
      cot: { val: 1 / Math.sqrt(3), text: '1/√3 (√3/3)' }
    },
    90: {
      radStr: 'π/2',
      sin: { val: 1, text: '1' },
      cos: { val: 0, text: '0' },
      tan: { val: null, text: 'Undefined (±∞)' },
      csc: { val: 1, text: '1' },
      sec: { val: null, text: 'Undefined (±∞)' },
      cot: { val: 0, text: '0' }
    },
    120: {
      radStr: '2π/3',
      sin: { val: Math.sqrt(3) / 2, text: '√3/2' },
      cos: { val: -0.5, text: '-1/2' },
      tan: { val: -Math.sqrt(3), text: '-√3' },
      csc: { val: 2 / Math.sqrt(3), text: '2/√3' },
      sec: { val: -2, text: '-2' },
      cot: { val: -1 / Math.sqrt(3), text: '-1/√3' }
    },
    135: {
      radStr: '3π/4',
      sin: { val: Math.SQRT1_2, text: '√2/2' },
      cos: { val: -Math.SQRT1_2, text: '-√2/2' },
      tan: { val: -1, text: '-1' },
      csc: { val: Math.SQRT2, text: '√2' },
      sec: { val: -Math.SQRT2, text: '-√2' },
      cot: { val: -1, text: '-1' }
    },
    150: {
      radStr: '5π/6',
      sin: { val: 0.5, text: '1/2' },
      cos: { val: -Math.sqrt(3) / 2, text: '-√3/2' },
      tan: { val: -1 / Math.sqrt(3), text: '-1/√3' },
      csc: { val: 2, text: '2' },
      sec: { val: -2 / Math.sqrt(3), text: '-2/√3' },
      cot: { val: -Math.sqrt(3), text: '-√3' }
    },
    180: {
      radStr: 'π',
      sin: { val: 0, text: '0' },
      cos: { val: -1, text: '-1' },
      tan: { val: 0, text: '0' },
      csc: { val: null, text: 'Undefined (±∞)' },
      sec: { val: -1, text: '-1' },
      cot: { val: null, text: 'Undefined (±∞)' }
    },
    210: {
      radStr: '7π/6',
      sin: { val: -0.5, text: '-1/2' },
      cos: { val: -Math.sqrt(3) / 2, text: '-√3/2' },
      tan: { val: 1 / Math.sqrt(3), text: '1/√3' },
      csc: { val: -2, text: '-2' },
      sec: { val: -2 / Math.sqrt(3), text: '-2/√3' },
      cot: { val: Math.sqrt(3), text: '√3' }
    },
    225: {
      radStr: '5π/4',
      sin: { val: -Math.SQRT1_2, text: '-√2/2' },
      cos: { val: -Math.SQRT1_2, text: '-√2/2' },
      tan: { val: 1, text: '1' },
      csc: { val: -Math.SQRT2, text: '-√2' },
      sec: { val: -Math.SQRT2, text: '-√2' },
      cot: { val: 1, text: '1' }
    },
    240: {
      radStr: '4π/3',
      sin: { val: -Math.sqrt(3) / 2, text: '-√3/2' },
      cos: { val: -0.5, text: '-1/2' },
      tan: { val: Math.sqrt(3), text: '√3' },
      csc: { val: -2 / Math.sqrt(3), text: '-2/√3' },
      sec: { val: -2, text: '-2' },
      cot: { val: 1 / Math.sqrt(3), text: '1/√3' }
    },
    270: {
      radStr: '3π/2',
      sin: { val: -1, text: '-1' },
      cos: { val: 0, text: '0' },
      tan: { val: null, text: 'Undefined (±∞)' },
      csc: { val: -1, text: '-1' },
      sec: { val: null, text: 'Undefined (±∞)' },
      cot: { val: 0, text: '0' }
    },
    300: {
      radStr: '5π/3',
      sin: { val: -Math.sqrt(3) / 2, text: '-√3/2' },
      cos: { val: 0.5, text: '1/2' },
      tan: { val: -Math.sqrt(3), text: '-√3' },
      csc: { val: -2 / Math.sqrt(3), text: '-2/√3' },
      sec: { val: 2, text: '2' },
      cot: { val: -1 / Math.sqrt(3), text: '-1/√3' }
    },
    315: {
      radStr: '7π/4',
      sin: { val: -Math.SQRT1_2, text: '-√2/2' },
      cos: { val: Math.SQRT1_2, text: '√2/2' },
      tan: { val: -1, text: '-1' },
      csc: { val: -Math.SQRT2, text: '-√2' },
      sec: { val: Math.SQRT2, text: '√2' },
      cot: { val: -1, text: '-1' }
    },
    330: {
      radStr: '11π/6',
      sin: { val: -0.5, text: '-1/2' },
      cos: { val: Math.sqrt(3) / 2, text: '√3/2' },
      tan: { val: -1 / Math.sqrt(3), text: '-1/√3' },
      csc: { val: -2, text: '-2' },
      sec: { val: 2 / Math.sqrt(3), text: '2/√3' },
      cot: { val: -Math.sqrt(3), text: '-√3' }
    },
    360: {
      radStr: '2π',
      sin: { val: 0, text: '0' },
      cos: { val: 1, text: '1' },
      tan: { val: 0, text: '0' },
      csc: { val: null, text: 'Undefined (±∞)' },
      sec: { val: 1, text: '1' },
      cot: { val: null, text: 'Undefined (±∞)' }
    }
  };

  TrigEngine.EXACT_BENCHMARKS = EXACT_BENCHMARKS;

  // Calculate comprehensive trigonometric values for any angle in degrees
  TrigEngine.calculate = function (deg) {
    const normDeg = TrigEngine.normalizeDeg(deg);
    const rad = TrigEngine.degToRad(normDeg);

    // Compute basic sine and cosine with clean zero handling
    let rawSin = Math.sin(rad);
    let rawCos = Math.cos(rad);

    // Snap to 0, 1, -1 for cardinal axes to prevent float inaccuracies (e.g. 1e-16)
    if (Math.abs(rawSin) < 1e-12) rawSin = 0;
    if (Math.abs(rawCos) < 1e-12) rawCos = 0;
    if (Math.abs(rawSin - 1) < 1e-12) rawSin = 1;
    if (Math.abs(rawSin + 1) < 1e-12) rawSin = -1;
    if (Math.abs(rawCos - 1) < 1e-12) rawCos = 1;
    if (Math.abs(rawCos + 1) < 1e-12) rawCos = -1;

    // Check if we hit an exact benchmark angle
    const roundedDeg = Math.round(normDeg);
    const isBenchmark = Math.abs(normDeg - roundedDeg) < 0.001 && EXACT_BENCHMARKS[roundedDeg];
    const benchmark = isBenchmark ? EXACT_BENCHMARKS[roundedDeg] : null;

    // Compute tangent: sin / cos
    let tanVal = null;
    let tanText = '';
    let isTanUndefined = Math.abs(rawCos) === 0;

    if (isTanUndefined) {
      tanVal = null;
      tanText = 'Undefined (±∞)';
    } else {
      tanVal = rawSin / rawCos;
      tanText = benchmark ? benchmark.tan.text : tanVal.toFixed(4);
    }

    // Compute cosecant: 1 / sin
    let cscVal = null;
    let cscText = '';
    let isCscUndefined = Math.abs(rawSin) === 0;

    if (isCscUndefined) {
      cscVal = null;
      cscText = 'Undefined (±∞)';
    } else {
      cscVal = 1 / rawSin;
      cscText = benchmark ? benchmark.csc.text : cscVal.toFixed(4);
    }

    // Compute secant: 1 / cos
    let secVal = null;
    let secText = '';
    let isSecUndefined = Math.abs(rawCos) === 0;

    if (isSecUndefined) {
      secVal = null;
      secText = 'Undefined (±∞)';
    } else {
      secVal = 1 / rawCos;
      secText = benchmark ? benchmark.sec.text : secVal.toFixed(4);
    }

    // Compute cotangent: cos / sin (or 1 / tan)
    let cotVal = null;
    let cotText = '';
    let isCotUndefined = Math.abs(rawSin) === 0;

    if (isCotUndefined) {
      cotVal = null;
      cotText = 'Undefined (±∞)';
    } else if (Math.abs(rawCos) === 0) {
      cotVal = 0;
      cotText = '0';
    } else {
      cotVal = rawCos / rawSin;
      cotText = benchmark ? benchmark.cot.text : cotVal.toFixed(4);
    }

    // Radian string display
    let radDisplay = rad.toFixed(3) + ' rad';
    if (benchmark && benchmark.radStr) {
      radDisplay = `${benchmark.radStr} rad (${rad.toFixed(3)})`;
    }

    // Unit circle coordinates (x = cos θ, y = sin θ)
    const unitPoint = {
      x: rawCos,
      y: rawSin
    };

    const quadrantInfo = TrigEngine.getQuadrantInfo(normDeg);

    return {
      deg: normDeg,
      rad: rad,
      radDisplay: radDisplay,
      isBenchmark: !!benchmark,
      quadrantInfo: quadrantInfo,
      unitPoint: unitPoint,
      functions: {
        sin: {
          name: 'Sine (sin)',
          abbr: 'sin',
          formula: 'Opposite / Hypotenuse = y / r',
          val: rawSin,
          text: benchmark ? benchmark.sin.text : rawSin.toFixed(4),
          isUndefined: false,
          color: '#10b981', // Emerald Green
          unitCircleRole: 'Vertical height of right triangle (y)'
        },
        cos: {
          name: 'Cosine (cos)',
          abbr: 'cos',
          formula: 'Adjacent / Hypotenuse = x / r',
          val: rawCos,
          text: benchmark ? benchmark.cos.text : rawCos.toFixed(4),
          isUndefined: false,
          color: '#38bdf8', // Neon Sky Blue
          unitCircleRole: 'Horizontal base of right triangle (x)'
        },
        tan: {
          name: 'Tangent (tan)',
          abbr: 'tan',
          formula: 'Opposite / Adjacent = sin / cos = y / x',
          val: tanVal,
          text: tanText,
          isUndefined: isTanUndefined,
          color: '#f59e0b', // Amber
          unitCircleRole: 'Length on tangent line x = 1 (ray intersection)'
        },
        csc: {
          name: 'Cosecant (cosec / csc)',
          abbr: 'csc',
          formula: 'Hypotenuse / Opposite = 1 / sin = r / y',
          val: cscVal,
          text: cscText,
          isUndefined: isCscUndefined,
          color: '#ec4899', // Pink
          unitCircleRole: 'Reciprocal of Sine: vertical intercept of tangent'
        },
        sec: {
          name: 'Secant (sec)',
          abbr: 'sec',
          formula: 'Hypotenuse / Adjacent = 1 / cos = r / x',
          val: secVal,
          text: secText,
          isUndefined: isSecUndefined,
          color: '#a855f7', // Purple
          unitCircleRole: 'Reciprocal of Cosine: horizontal intercept of tangent'
        },
        cot: {
          name: 'Cotangent (cot)',
          abbr: 'cot',
          formula: 'Adjacent / Opposite = cos / sin = x / y',
          val: cotVal,
          text: cotText,
          isUndefined: isCotUndefined,
          color: '#14b8a6', // Teal
          unitCircleRole: 'Reciprocal of Tangent: segment on tangent y = 1'
        }
      }
    };
  };

  // Educational Topics / Proofs
  TrigEngine.TEACHER_TOPICS = [
    {
      id: 'sin-90',
      title: 'Why is sin(90°) = 1?',
      targetAngle: 90,
      shortSummary: 'The triangle height grows to match the entire radius.',
      explanation: `
        <h3>Geometric Breakdown on the Unit Circle ($r = 1$):</h3>
        <p>1. On a unit circle, the coordinates of the terminal point are $(x, y) = (\\cos\\theta, \\sin\\theta)$.</p>
        <p>2. At $\\theta = 90^\\circ$, the terminal ray points straight UP along the positive $y$-axis to coordinates $(0, 1)$.</p>
        <p>3. In right-triangle trigonometry, $\\sin\\theta = \\frac{\\text{Opposite}}{\\text{Hypotenuse}}$.</p>
        <p>4. As the angle approaches $90^\\circ$, the vertical side (opposite) stretches until it coincides with the hypotenuse ($r = 1$).</p>
        <p class="highlight-formula">$$\\sin(90^\\circ) = \\frac{\\text{Opposite}}{\\text{Hypotenuse}} = \\frac{1}{1} = 1$$</p>
      `
    },
    {
      id: 'cos-90',
      title: 'Why is cos(90°) = 0?',
      targetAngle: 90,
      shortSummary: 'The triangle base completely collapses to width zero.',
      explanation: `
        <h3>Geometric Breakdown on the Unit Circle ($r = 1$):</h3>
        <p>1. Cosine measures the horizontal displacement along the $x$-axis from the origin: $\\cos\\theta = x$.</p>
        <p>2. At $\\theta = 0^\\circ$, the triangle base is wide ($x = 1$). As $\\theta$ increases toward $90^\\circ$, the terminal point slides upward along the circle perimeter toward $(0, 1)$.</p>
        <p>3. At exactly $90^\\circ$, the point is directly above the origin. The horizontal distance from the $y$-axis has shrunk to zero ($x = 0$).</p>
        <p class="highlight-formula">$$\\cos(90^\\circ) = \\frac{\\text{Adjacent}}{\\text{Hypotenuse}} = \\frac{0}{1} = 0$$</p>
      `
    },
    {
      id: 'tan-90',
      title: 'Why is tan(90°) Infinity / Undefined?',
      targetAngle: 90,
      shortSummary: 'Division by zero: Opposite / Adjacent = 1 / 0.',
      explanation: `
        <h3>The Dual Proof (Algebraic + Geometric):</h3>
        <p><strong>1. Algebraic Ratio Proof:</strong><br>
        By definition, $\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta}$.<br>
        At $90^\\circ$: $\\sin(90^\\circ) = 1$ and $\\cos(90^\\circ) = 0$.<br>
        Therefore: $\\tan(90^\\circ) = \\frac{1}{0}$. Division by zero is mathematically undefined!
        </p>
        <p><strong>2. Limit Behavior (Vertical Asymptote):</strong><br>
        - Approaching from $89.9^\\circ$: $\\tan(89.9^\\circ) \\approx +572.96 \\to +\\infty$<br>
        - Approaching from $90.1^\\circ$: $\\tan(90.1^\\circ) \\approx -572.96 \\to -\\infty$<br>
        Because the left-hand and right-hand limits diverge to opposite infinities, the graph has a vertical asymptote at $\\theta = 90^\\circ$!
        </p>
        <p><strong>3. Geometric Tangent Line Proof:</strong><br>
        Tangent is physically the segment drawn on the line $x = 1$ from $(1, 0)$ to the intersection with the terminal ray. At $90^\\circ$, the terminal ray is vertical ($x = 0$), which is perfectly parallel to $x = 1$. Two parallel lines never intersect in Euclidean space, so the tangent length is infinite!
        </p>
      `
    },
    {
      id: 'astc-rule',
      title: 'The ASTC Quadrant Rule (Signs)',
      targetAngle: 135,
      shortSummary: 'All, Sine, Tangent, Cosine positive signs mnemonic.',
      explanation: `
        <h3>Mnemonic: "All Silver Tea Cups" or "All Students Take Calculus":</h3>
        <table class="theory-table">
          <thead>
            <tr><th>Quadrant</th><th>Angle Range</th><th>Positive Functions</th><th>Negative Functions</th><th>Why?</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>Q1</strong></td><td>0° – 90°</td><td><span class="badge badge-success">ALL 6</span></td><td>None</td><td>$x > 0$ and $y > 0$</td></tr>
            <tr><td><strong>Q2</strong></td><td>90° – 180°</td><td><span class="badge badge-success">SINE, Csc</span></td><td>Cos, Sec, Tan, Cot</td><td>$x < 0$ (cos < 0), $y > 0$ (sin > 0)</td></tr>
            <tr><td><strong>Q3</strong></td><td>180° – 270°</td><td><span class="badge badge-success">TANGENT, Cot</span></td><td>Sin, Cos, Csc, Sec</td><td>$x < 0, y < 0 \\implies y/x > 0$</td></tr>
            <tr><td><strong>Q4</strong></td><td>270° – 360°</td><td><span class="badge badge-success">COSINE, Sec</span></td><td>Sin, Csc, Tan, Cot</td><td>$x > 0$ (cos > 0), $y < 0$ (sin < 0)</td></tr>
          </tbody>
        </table>
      `
    },
    {
      id: 'pythagoras-identity',
      title: 'Proof of sin²(θ) + cos²(θ) = 1',
      targetAngle: 45,
      shortSummary: 'Pythagorean Theorem on the Unit Circle.',
      explanation: `
        <h3>The Fundamental Trigonometric Identity:</h3>
        <p>1. Consider any point $P(x, y)$ on a unit circle centered at the origin $(0,0)$ with radius $r = 1$.</p>
        <p>2. By the Pythagorean theorem for the right-angled triangle formed with the $x$-axis:</p>
        <p class="highlight-formula">$$x^2 + y^2 = r^2$$</p>
        <p>3. Because $r = 1$, $x = \\cos\\theta$, and $y = \\sin\\theta$, direct substitution yields:</p>
        <p class="highlight-formula">$$(\\cos\\theta)^2 + (\\sin\\theta)^2 = 1^2 \\implies \\sin^2\\theta + \\cos^2\\theta = 1$$</p>
        <p>4. This holds true for <strong>every single angle</strong> from $0^\\circ$ to $360^\\circ$ regardless of quadrant!</p>
      `
    },
    {
      id: 'reciprocals',
      title: 'Why Cosec, Sec, Cot are Reciprocals',
      targetAngle: 30,
      shortSummary: 'Inverting fractions: csc = 1/sin, sec = 1/cos, cot = 1/tan.',
      explanation: `
        <h3>Reciprocal Pairs Breakdown:</h3>
        <p>Each secondary trigonometric function is formed by inverting one of the primary ratios:</p>
        <ul class="theory-list">
          <li><strong>$\\csc\\theta = \\frac{1}{\\sin\\theta} = \\frac{\\text{Hypotenuse}}{\\text{Opposite}}$</strong>: Inverted sine. Notice when $\\sin\\theta = 0$ ($0^\\circ, 180^\\circ, 360^\\circ$), $\\csc\\theta$ blows up to undefined ($\\frac{1}{0}$).</li>
          <li><strong>$\\sec\\theta = \\frac{1}{\\cos\\theta} = \\frac{\\text{Hypotenuse}}{\\text{Adjacent}}$</strong>: Inverted cosine. Notice when $\\cos\\theta = 0$ ($90^\\circ, 270^\\circ$), $\\sec\\theta$ is undefined ($\\frac{1}{0}$).</li>
          <li><strong>$\\cot\\theta = \\frac{1}{\\tan\\theta} = \\frac{\\cos\\theta}{\\sin\\theta}$</strong>: Inverted tangent. At $90^\\circ$, while $\\tan(90^\\circ)$ is undefined, $\\cot(90^\\circ) = \\frac{\\cos 90^\\circ}{\\sin 90^\\circ} = \\frac{0}{1} = 0$!</li>
        </ul>
      `
    }
  ];

  // Interactive Quiz questions for students
  TrigEngine.QUIZ_QUESTIONS = [
    {
      id: 1,
      question: 'Why is sin(90°) equal to 1?',
      options: [
        'The opposite side collapses to 0',
        'The vertical opposite side stretches to equal the hypotenuse (radius = 1)',
        'Because 90 divided by 90 is 1',
        'Because tangent is 0'
      ],
      correctIndex: 1,
      targetAngle: 90,
      explanation: 'At 90°, the terminal point reaches (0, 1) on the unit circle. The vertical opposite side has length 1, exactly matching the hypotenuse radius of 1, so sin(90°) = 1/1 = 1.'
    },
    {
      id: 2,
      question: 'What is the value of cos(90°) and why?',
      options: [
        '1, because the angle is a right angle',
        'Undefined, because we divide by zero',
        '0, because the horizontal adjacent side shrinks completely to width 0',
        '-1, because it entered Quadrant II'
      ],
      correctIndex: 2,
      targetAngle: 90,
      explanation: 'At 90°, the point is directly on the y-axis at (0, 1). The horizontal adjacent side has zero width, so cos(90°) = 0/1 = 0.'
    },
    {
      id: 3,
      question: 'Why is tan(90°) undefined (or infinity)?',
      options: [
        'Because tan = sin / cos = 1 / 0, which is division by zero',
        'Because triangles cannot have angles greater than 45°',
        'Because sin and cos cancel each other out',
        'Because the unit circle is too small'
      ],
      correctIndex: 0,
      targetAngle: 90,
      explanation: 'tan(θ) = sin(θ) / cos(θ). At 90°, sin(90°) = 1 and cos(90°) = 0, giving 1/0. Division by zero is undefined, and the geometric tangent line is parallel to the ray.'
    },
    {
      id: 4,
      question: 'According to the ASTC rule, which functions are positive in Quadrant II (90° to 180°)?',
      options: [
        'All 6 functions',
        'Sine and its reciprocal Cosecant only',
        'Tangent and Cotangent only',
        'Cosine and Secant only'
      ],
      correctIndex: 1,
      targetAngle: 120,
      explanation: 'In Q2, x is negative (cos < 0) and y is positive (sin > 0). Therefore, only sin and csc = 1/sin are positive.'
    },
    {
      id: 5,
      question: 'At which of these angles is tan(θ) equal to 1?',
      options: [
        '30° and 210°',
        '45° and 225°',
        '60° and 240°',
        '90° and 270°'
      ],
      correctIndex: 1,
      targetAngle: 45,
      explanation: 'At 45°, opposite = adjacent = √2/2, so tan(45°) = 1. In Q3 at 225°, both are negative (-√2/2), so (-)/(-) = +1.'
    },
    {
      id: 6,
      question: 'What is the reciprocal of sin(θ)?',
      options: [
        'Cosine (cos)',
        'Secant (sec)',
        'Cosecant (csc)',
        'Cotangent (cot)'
      ],
      correctIndex: 2,
      targetAngle: 30,
      explanation: 'Cosecant (csc θ = 1 / sin θ) is the reciprocal of sine.'
    }
  ];

  // Export for Node.js and Browser
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrigEngine;
  } else {
    window.TrigEngine = TrigEngine;
  }
})();
