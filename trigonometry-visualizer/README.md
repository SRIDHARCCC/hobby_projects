# 📐 TrigLab: Interactive Trigonometry & Unit Circle Visualizer

> An interactive, visual exploration of the six fundamental trigonometric functions across the full $0^\circ \to 360^\circ$ circle ($0 \to 2\pi$ radians). Designed specifically for educators and students to demystify why $\sin(90^\circ) = 1$, $\cos(90^\circ) = 0$, and $\tan(90^\circ) = \infty$.

---

## 🎯 Pedagogical Objectives

Trigonometry is often taught as rote memorization of formulas. **TrigLab** bridges the gap between right-triangle geometry and wave analysis by visually connecting:
1. **The Inscribed Right Triangle** inside the Unit Circle ($r = 1$).
2. **The Coordinate Ray Projections**: $(x, y) = (\cos\theta, \sin\theta)$.
3. **The Wave Graph Representation**: How rotation around the circle unrolls into continuous sine, cosine, and tangent curves.
4. **The Cardinal Boundary Paradoxes**: Understanding collapsing sides and asymptotes.

---

## 💡 The Core Classroom Proofs Explained

### 1. Why is $\sin(90^\circ) = 1$?
* On a unit circle ($r = 1$), the coordinates of the terminal point are $(x, y) = (\cos\theta, \sin\theta)$.
* As angle $\theta$ increases toward $90^\circ$, the right triangle's vertical leg (the **Opposite** side) stretches upward until it coincides with the positive $y$-axis at $(0, 1)$.
* Because the opposite side now equals the hypotenuse ($r = 1$):
  $$\sin(90^\circ) = \frac{\text{Opposite}}{\text{Hypotenuse}} = \frac{1}{1} = 1$$

### 2. Why is $\cos(90^\circ) = 0$?
* Cosine represents the horizontal displacement from the origin along the $x$-axis: $\cos\theta = x$.
* As $\theta$ reaches $90^\circ$, the terminal point lies directly above the origin on the $y$-axis.
* The horizontal base of the right triangle (the **Adjacent** side) completely collapses to zero width:
  $$\cos(90^\circ) = \frac{\text{Adjacent}}{\text{Hypotenuse}} = \frac{0}{1} = 0$$

### 3. Why is $\tan(90^\circ) = \infty$ (Undefined)?
* **Algebraic Proof**: By definition, $\tan\theta = \frac{\sin\theta}{\cos\theta}$. At $90^\circ$:
  $$\tan(90^\circ) = \frac{1}{0} \implies \text{Division by Zero (Undefined)}$$
* **Limit Behavior**:
  * Approaching from the left ($89.99^\circ$): $\tan(89.99^\circ) \to +\infty$
  * Approaching from the right ($90.01^\circ$): $\tan(90.01^\circ) \to -\infty$
  * Because the limits diverge, the curve forms a **vertical asymptote**.
* **Geometric Proof**: Tangent is the segment intercepted on the vertical tangent line $x = 1$. At $90^\circ$, the terminal ray is strictly vertical ($x = 0$), which is parallel to $x = 1$. Parallel lines never intersect in Euclidean space, meaning the tangent line segment has infinite length!

---

## 🌟 Key Features

- **🎮 Dual Synchronized Canvases**:
  - **Unit Circle ($r = 1$)**: High-DPI interactive canvas featuring a draggable angle handle, real-time right triangle with color-coded legs, tangent line projection at $x = 1$, and reciprocal secant/cosecant lines.
  - **360° Wave Graph**: Continuous plotting of $\sin$, $\cos$, $\tan$, $\csc$, $\sec$, and $\cot$ with red dashed vertical asymptote lines at $90^\circ, 270^\circ$, a vertical angle cursor, and pulsing tracer dots.
- **⚡ Quick Teacher Jumps**:
  - One-click buttons to load and explain $\sin(90^\circ) = 1$, $\cos(90^\circ) = 0$, $\tan(90^\circ) = \infty$, and the ASTC Quadrant Rule.
- **📊 6-Function Live Dashboard**:
  - Real-time display for $\sin, \cos, \tan, \csc, \sec, \cot$ showing exact radicals (e.g., $\sqrt{3}/2, 1/2, \sqrt{2}$), 4-decimal precision, and sign badges.
- **👨‍🏫 Teacher's Guide & Proofs Tab**:
  - In-depth theoretical breakdowns with step-by-step proofs for classroom presentation.
- **🎯 Student Quiz & Practice Tab**:
  - Interactive multiple-choice challenges with instant feedback and a "Show on Circle" visual inspection button.
- **📐 360° Value Cheat Sheet**:
  - Complete benchmark reference table with exact radical values from $0^\circ$ to $360^\circ$ and fundamental Pythagorean/reciprocal identities.

---

## 🧭 The 4 Quadrants & The ASTC Rule

| Quadrant | Range | Positive Functions | Mnemonic Rule | Geometric Reason |
|---|---|---|---|---|
| **Quadrant I** | $0^\circ < \theta < 90^\circ$ | **ALL 6** | **A** — All | Both $x > 0$ and $y > 0$ |
| **Quadrant II** | $90^\circ < \theta < 180^\circ$ | **Sine & Cosecant** | **S** — Silver (Students) | $x < 0$ ($\cos < 0$), $y > 0$ ($\sin > 0$) |
| **Quadrant III** | $180^\circ < \theta < 270^\circ$ | **Tangent & Cotangent** | **T** — Tea (Take) | $x < 0, y < 0 \implies \frac{-y}{-x} > 0$ |
| **Quadrant IV** | $270^\circ < \theta < 360^\circ$ | **Cosine & Secant** | **C** — Cups (Calculus) | $x > 0$ ($\cos > 0$), $y < 0$ ($\sin < 0$) |

---

## 🚀 How to Run

### Option 1: Direct in Web Browser (Zero Setup)
Simply double-click or open `index.html` in any modern web browser (`file:///.../index.html`).

### Option 2: Standalone Python Server
Run the built-in, zero-dependency Python 3 HTTP server:
```bash
python server.py --open
```
The application will launch automatically at `http://localhost:8080`.

### Option 3: Docker Container
Build and run with Docker:
```bash
docker build -t trigonometry-visualizer .
docker run -p 8080:8080 trigonometry-visualizer
```
Navigate to `http://localhost:8080` in your browser.

---

## 🧪 Automated Testing

Run the automated Node.js test suite to verify all trigonometric algorithms, benchmark angles, Pythagorean identities, and file completeness:
```bash
node test_app.js
```

Or run the repository compliance verifier from root:
```bash
python .agents/skills/hobby-project-builder/scripts/verify.py trigonometry-visualizer
```

---

## 📦 File Architecture

```text
hobby_projects/trigonometry-visualizer/
├── index.html        # Semantic HTML5 layout, tabs, dual canvas containers
├── style.css         # Unified dark theme design system stylesheet
├── app.js            # UI controller, high-DPI canvas renderers, event listeners
├── trig-engine.js    # Domain logic: exact radicals, ASTC rules, proofs, quiz
├── server.py         # Standalone zero-dependency Python HTTP server
├── test_app.js       # Node.js integration verification & unit test suite
├── Dockerfile        # Container configuration (nginx:alpine)
├── nginx.conf        # Dynamic reverse proxy configuration
├── .dockerignore     # Build exclusion rules
└── README.md         # Educational manual & project documentation
```
