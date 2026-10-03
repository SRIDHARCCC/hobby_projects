# 🧊 TensorMatmulLab: Higher-Dimensional Matrix Multiplication Visualizer

> An interactive educational web application designed to visually explain how **NumPy** and **PyTorch** handle matrix multiplication (`@` or `np.matmul` / `torch.matmul`) with tensors and higher-dimensional arrays. Helps developers and deep learning students bridge the gap between simple 2D matrix multiplication and complex transformer multi-head attention operations.

---

## 🎯 Pedagogical Objectives

When transitioning from standard 2D linear algebra to deep learning, multi-dimensional tensor operations often seem cryptic:
- Why does `(2, 4, 8, 16) @ (2, 4, 16, 8)` produce `(2, 4, 8, 8)`?
- Why does `(2, 1, 4, 3) @ (1, 5, 3, 6)` successfully evaluate to `(2, 5, 4, 6)`?
- Why does `(2, 3, 4, 5) @ (2, 3, 7, 6)` crash with a `ValueError: mismatch in core dimension 0`?

**TensorMatmulLab** breaks down any tensor multiplication by visually decoupling operations into two distinct mathematical zones:
1. **Rule A: The 2D Matrix Core** (the last 2 dimensions).
2. **Rule B: Batch Dimensions & Broadcasting** (all preceding dimensions).

---

## 💡 The Two Fundamental Rules Explained

### Rule A: The 2D Matrix Core (Last 2 Dimensions)
$$\mathbf{(\dots, M, K) \;\times\; (\dots, K, N) \;\longrightarrow\; (\dots, M, N)}$$

1. **Inner Contraction Axis ($K$):** The columns of Matrix A (last dimension, size $K$) **MUST match** the rows of Matrix B (second-to-last dimension, size $K$).
2. **Dimension Collapse:** For every pair of 2D slices, elements along axis $K$ are multiplied element-wise and summed together:
   $$C[i, j] = \sum_{k=0}^{K-1} A[i, k] \cdot B[k, j]$$
3. **Core Output:** The resulting 2D matrix slice has shape $(M, N)$.
4. **Failure Condition:** If $K_A \neq K_B$, NumPy immediately halts with:
   ```text
   ValueError: matmul: Input operand 1 has a mismatch in its core dimension 0,
   with gufunc signature (n?,k),(k,m?)->(n?,m?) (size K_A is different from K_B)
   ```

### Rule B: Batch Dimensions & Broadcasting (All Preceding Dimensions)
$$\mathbf{\text{Broadcast}(\text{shape}_A[:-2], \;\text{shape}_B[:-2])}$$

1. **Preceding Dimensions are Batches:** Everything before the last 2 dimensions represents independent batch slices.
2. **Right-to-Left Alignment:** Batch dimensions are aligned starting from the trailing batch axis. If one tensor has fewer batch axes, it is prepended with $1$s on the left.
3. **Broadcasting Compatibility:** For each aligned batch axis pair $(d_A, d_B)$:
   - **Identical ($d_A == d_B$):** The resulting batch dimension is that size (e.g. $4$ and $4 \to 4$).
   - **Stretched ($d_A == 1$ or $d_B == 1$):** The singleton dimension stretches to match the other (e.g. $1$ and $5 \to 5$).
   - **Incompatible ($d_A \neq d_B$ and neither is $1$):** NumPy raises:
     ```text
     ValueError: operands could not be broadcast together with remapped shapes
     ```

---

## 🌟 Key Application Features

- **🟢 Level 1: 2D Matrix & Vector Dot Product (Beginner Core)**:
  - Clean visual equation: `(M × K) @ (K × N) -> (M × N)` with the **Golden Rule** banner highlighting matching inner numbers.
  - **Interactive Step-by-Step Playback**: Step through each element $C[i, j]$ one by one, or press **Play Auto-Step** with speed controls (Slow/Normal/Fast).
  - **Row-Column Vector Dot Product Spotlight**: Illuminates Row $i$ in Matrix A and Column $j$ in Matrix B, showing the exact vector dot product:
    $$[A_{i,0}, \dots, A_{i,K-1}] \bullet [B_{0,j}, \dots, B_{K-1,j}] = (A_{i,0} \cdot B_{0,j}) + \dots = \text{Sum}$$
  - **Randomize Numbers Button**: Generates fresh small numbers to test and practice mental math.
- **🔵 Level 2: 3D Batches & Broadcasting (Adding Batches)**:
  - Explains batches simply as a **Stack of Pages** where NumPy runs the 2D matrix multiplication for each page.
  - Interactive page deck to click and inspect each batch slice.
  - Demonstrates broadcasting: stretching a dimension of 1 so a single matrix is shared across multiple batches without copying memory!
- **🛠️ Level 3: Custom Shape Sandbox & Alignment Strip**:
  - Flexible input to type any shape dimensions with instant validation.
  - Color-coded visual strip displaying right-to-left alignment, equal dims, broadcasted axes, and the 2D core contraction bridge.
- **💡 Level 4: Cheat Sheet (`np.dot` vs `np.matmul` / `@`)**:
  - Crystal clear side-by-side comparison explaining the difference between `@` (matrix multiplication), `np.dot` (tensor contraction), and `*` (element-wise).
  - The 3-level nested Python loop that demystifies how matrix multiplication works under the hood.
  - Ready-to-run Python snippet with one-click copy.
- **🔍 2D Core Matrix Slice Visualizer**:
  - Interactive rendering of the active batch's Matrix A ($M \times K$), Matrix B ($K \times N$), and Result Matrix C ($M \times N$).
  - Hover over any cell $C[i, j]$ to highlight the corresponding row in A and column in B, with step-by-step arithmetic displayed in real time:
    $$C[i, j] = \sum_{k=0}^{K-1} A[i, k] \cdot B[k, j] = (A_{i,0} \cdot B_{0,j}) + \dots = \text{Sum}$$
- **📦 Pre-Loaded Scenarios**:
  - **Transformer Multi-Head Attention**: $Q \times K^T$ ($ (2, 4, 8, 16) @ (2, 4, 16, 8) \to (2, 4, 8, 8) $)
  - **Context Value Weighting**: Scores $\times V$ ($ (2, 4, 8, 8) @ (2, 4, 8, 16) \to (2, 4, 8, 16) $)
  - **Batch Broadcast Trick**: $(2, 1, 4, 3) @ (1, 5, 3, 6) \to (2, 5, 4, 6)$
  - **Feature Weight Projection**: $(16, 128, 64) @ (64, 256) \to (16, 128, 256)$
  - **Core & Batch Error Presets**: Interactive demonstration of common NumPy `ValueError` causes.
- **💻 Ready-to-Run Code Generator**:
  - Auto-generated snippets for NumPy (`@`), PyTorch (`torch.matmul`), and Einstein Summation (`np.einsum('...ik,...kj->...ij', A, B)`).
  - One-click copy with toast notifications.
- **📚 Theory & Deep Learning Guides**:
  - In-depth interactive tabs explaining Transformer Attention tensor shapes and the **Stride 0** memory trick.

---

## ⚡ Zero-Copy Broadcasting: The Magic of Stride 0

When a batch axis broadcasts from $1 \to 5$, NumPy **does NOT copy memory 5 times**.
NumPy arrays use a **strides** tuple indicating the byte offset in memory to advance one index along each axis.
- On a normal axis of size 5: `stride = bytes_per_slice`
- On a broadcast axis stretched from 1 to 5: `stride = 0 bytes`

Advancing the batch index advances 0 bytes in physical memory, referencing the exact same buffer without duplicating RAM!

---

## 🚀 How to Run

### Option 1: Direct in Web Browser (Zero Dependencies)
Simply open `index.html` directly in any modern browser:
```bash
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

### Option 2: Standalone Python Server
Run the built-in server script:
```bash
python server.py --open
```
*Accessible at `http://localhost:8080`.*

### Option 3: Docker Container
```bash
# Build the production container
docker build -t tensor-matmul-visualizer .

# Run the container
docker run -p 8080:8080 tensor-matmul-visualizer
```

---

## 🧪 Automated Verification Suite

Run the Node.js test suite to verify file integrity, shape parsing, broadcasting rules, and matrix multiplication arithmetic:
```bash
node test_app.js
```

---

## 📂 File Architecture

```text
tensor-matmul-visualizer/
├── index.html         # Application layout, interactive playground, alignment strip, tabs
├── style.css          # Design system stylesheet (Dark theme, responsive, dimension colors)
├── matmul-engine.js   # Decoupled core engine: parsing, broadcasting logic, slice inspection
├── app.js             # UI controller, event listeners, real-time matrix highlighter
├── server.py          # Standalone Python 3 HTTP server with security headers
├── test_app.js        # Automated Node.js verification & mathematical test suite
├── Dockerfile         # Nginx Alpine container for cloud deployment
├── nginx.conf         # Reverse proxy template for dynamic $PORT
├── .dockerignore      # Build exclusions
└── README.md          # In-depth pedagogical documentation
```

---

## 🔒 Security & Privacy

This project contains zero external runtime dependencies, zero trackers, and zero API keys. Fully compliant with repository-wide security guidelines and GitHub Push Protection.
