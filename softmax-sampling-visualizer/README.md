# 🎛️ SoftmaxLab: Softmax, Temperature & LLM Sampling Visualizer

> An interactive educational web application designed to visually explain how Large Language Models (LLMs) turn raw neural network scores (logits) into token generation probabilities, and how **Temperature ($T$)**, **Top-K**, and **Top-P (Nucleus)** sampling shape the creativity, coherence, and safety of generated text.

---

## 🎯 Pedagogical Objectives

When students and engineers learn about modern Transformer LLMs (such as GPT-4, Gemini, Claude, and Llama), the decoding hyperparameters often seem mysterious:
- *Why does a Temperature of $0.0$ make the model deterministic, while $2.0$ produces incoherent gibberish?*
- *What is the mathematical purpose of exponentiating logits in the Softmax function?*
- *Why do production systems subtract $\max(z)$ from logits before computing Softmax?*
- *Why did Nucleus (Top-P) sampling largely replace fixed Top-K sampling in state-of-the-art models?*
- *How does the stochastic "roll of the dice" actually pick a word from a cumulative distribution?*

**SoftmaxLab** breaks down the entire token sampling pipeline into an interactive, step-by-step visual sandbox with live charts, Monte Carlo experiments, and an autoregressive story generator.

---

## 📐 Mathematical Foundations

### 1. The Softmax Function
The final layer of a Transformer outputs unnormalized real-valued scores called **logits** $z \in (-\infty, \infty)$ for every token in vocabulary $V$. To convert these into a valid probability distribution where $\sum p_i = 1$ and $p_i \in (0, 1)$, Softmax applies:

$$\sigma(z)_i = \frac{e^{z_i}}{\sum_{j=1}^{|V|} e^{z_j}}$$

- **Why exponentiate?** $e^z > 0$ strictly maps negative numbers to positive reals while preserving monotonicity ($z_A > z_B \implies e^{z_A} > e^{z_B}$).
- **Why divide by the sum?** Normalizes the total probability mass to exactly $1.0$.
- **Exponential amplification:** A linear gap in logits translates to an exponential ratio in probabilities: $\frac{P(A)}{P(B)} = e^{z_A - z_B}$.

---

### 2. Temperature Scaling ($T > 0$)
Temperature scales logits prior to exponentiation:

$$\sigma(z, T)_i = \frac{e^{z_i / T}}{\sum_{j=1}^{|V|} e^{z_j / T}}$$

| Regime | Temperature | Mathematical Effect | Student Intuition | Recommended Use |
|---|---|---|---|---|
| **Greedy / Argmax** | $T \to 0$ ($0.01 - 0.10$) | Differences $\to \infty$; max logit gets $p \to 1.0$ | Pure determinism. Zero surprises or creativity. | Code generation, math reasoning, JSON extraction |
| **Focused** | $T \approx 0.3 - 0.7$ | High logits boosted; low logits suppressed | High coherence, factual precision, low risk. | Factual Q&A, business chat |
| **Standard** | $T = 1.0$ | Unmodified model distribution | Calibrated likelihood of the training corpus. | General text, balanced writing |
| **Creative** | $T \approx 1.2 - 1.5$ | Differences flattened; tail tokens amplified | High entropy, novel metaphors, unexpected word choices. | Creative writing, poetry, brainstorming |
| **High Chaos** | $T \ge 2.0$ | $z_i / T \to 0 \implies e^0 = 1$ (Uniform distribution) | Hallucinatory, ungrammatical, nonsensical gibberish. | Academic demonstration of high entropy |

---

### 3. The Numerical Stability Trick (Log-Sum-Exp Shift)
In IEEE 754 32-bit floating point arithmetic, $e^x$ overflows to `+Infinity` for $x > 88.7$, resulting in catastrophic `Infinity / Infinity = NaN` errors.

To solve this, production engines subtract the maximum logit $m = \max_j(z_j / T)$:

$$\sigma(z, T)_i = \frac{e^{(z_i / T) - m}}{\sum_{j=1}^{|V|} e^{(z_j / T) - m}}$$

Because Softmax is strictly shift-invariant:

$$\frac{e^{z_i - m}}{\sum e^{z_j - m}} = \frac{e^{z_i} \cdot e^{-m}}{\sum e^{z_j} \cdot e^{-m}} = \frac{e^{z_i} \cdot \cancel{e^{-m}}}{\sum e^{z_j} \cdot \cancel{e^{-m}}} = \frac{e^{z_i}}{\sum e^{z_j}}$$

The largest exponent becomes $e^0 = 1.0$, completely eliminating floating-point overflow!

---

### 4. Top-K Filtering
Truncates the candidate set to only the top $K$ tokens with the highest probabilities, setting all remaining tokens to $0$ and renormalizing:

$$p'_i = \begin{cases} \frac{p_i}{\sum_{j \in \text{Top-K}} p_j} & \text{if } \text{rank}(i) \le K \\ 0 & \text{otherwise} \end{cases}$$

- **Strength:** Prevents wild, absurd long-tail hallucinations.
- **Weakness:** A rigid $K$ fails when the model's confidence varies across tokens.

---

### 5. Top-P (Nucleus) Sampling
Instead of a fixed count $K$, Top-P dynamically selects the smallest subset of tokens whose cumulative probability exceeds threshold $P \in (0, 1]$:

$$V^{(P)} = \text{smallest set such that } \sum_{i \in V^{(P)}} p_i \ge P$$

- **High Confidence State:** When the model is sure (e.g. *"The capital of France is [Paris]"*), the nucleus contracts to just 1 or 2 tokens.
- **Uncertain / Open State:** When many words are plausible, the nucleus dynamically expands to include dozens of candidates.

---

## 🌟 Key Application Features

### 🎛️ Tab 1: Interactive Playground & Monte Carlo Sampler
- **Educational Scenario Picker**: Switch between real-world scenarios:
  1. *Fact Retrieval: Capital of France* (Steep peak on "Paris")
  2. *Creative Writing: Dark Mystery Forest* (Multimodal atmospheric distribution)
  3. *Code Generation: Python Keyword* (Syntax-critical determinism on "def")
  4. *Common Sense: Culinary Spice* (Safety guard against toxic tail words like "uranium")
  5. *Theoretical: Uniform Tie Contest* (Symmetric coin-flip distribution)
- **Real-Time Sliders**: Adjust Temperature ($0.05 - 3.0$), Top-K ($1 - N$), and Top-P ($0.05 - 1.0$) with instant visual feedback and regime status badges.
- **3 Visualizer Views**:
  - *Final Sampling Probabilities*: Animated color-coded bar chart (Active in Cyan, Cut by Top-K in Amber, Cut by Top-P in Rose).
  - *Multi-Stage Flow*: Stacked comparison comparing Raw Logits $\to$ Scaled Logits $\to$ Softmax % $\to$ Final %.
  - *Cumulative CDF Step Curve*: Step curve with adjustable horizontal Top-P cutoff threshold.
- **Interactive Logits Table**: Drag sliders or type numbers directly into the table to simulate custom logits and tokens.
- **Stochastic Token Sampler**: Roulette interval track with animated needle pointer demonstrating where uniform random draw $r \in [0, 1)$ lands!
- **Monte Carlo Experiment Lab**: Simulate 100, 1,000, or 10,000 draws to observe empirical frequency convergence to theoretical probability (Law of Large Numbers).
- **Information Theory Metrics**: Live Shannon Entropy $H(P) = -\sum p_i \log_2(p_i)$ meter and Perplexity ($2^H$).

### 📖 Tab 2: Autoregressive Story Generator
- Watch LLMs generate text token by token in a retro cyberpunk terminal.
- Branching story graphs ("Neon Odyssey: Cyberpunk Detective" and "Cosmic Signal: Deep Space Probe").
- Color-coded tokens in generated text indicating generation confidence:
  - 🟢 **Green**: High probability (> 50%)
  - 🟡 **Yellow**: Moderate probability (20% - 50%)
  - 🟣 **Purple**: Creative surprise / low probability (< 20%)
- Step-by-step playback or auto-play. Students can click any alternative candidate card to steer the story narrative manually!

### 📐 Tab 3: Step-by-Step Mathematical Pipeline
- Complete mathematical breakdown from logits to final sampling.
- Interactive live calculation cards showing real numbers plugged into the formulas.
- Deep dive into the Log-Sum-Exp numerical stability proof.
- Hyperparameter comparison matrix.

### 🎓 Tab 4: Student Comprehension Challenges & Quiz
- 6 interactive multiple-choice questions testing core concepts (limits as $T \to 0$, Top-K bounds, Nucleus adaptation, exponential scaling).
- Instant pedagogical explanations and live score tracking.

---

## 🚀 How to Run

### Option 1: Direct in Web Browser (Zero Dependencies)
Simply open `index.html` directly in any web browser:
```text
file:///path/to/hobby_projects/softmax-sampling-visualizer/index.html
```

### Option 2: Standalone Python Server
Run the included zero-dependency Python 3 HTTP server:
```bash
python server.py --open
```
Access the application at `http://localhost:8080`.

### Option 3: Docker Container
Build and run the production Nginx container:
```bash
docker build -t softmax-sampling-visualizer .
docker run -d -p 8080:8080 softmax-sampling-visualizer
```

---

## 🧪 Automated Test Suite

Run the Node.js test suite verifying both file completeness and mathematical accuracy:
```bash
node test_app.js
```

Run the repository compliance auditor:
```bash
python ../.agents/skills/hobby-project-builder/scripts/verify.py softmax-sampling-visualizer
```

---

## 🔒 Security & Privacy

This application is completely client-side, self-contained, and contains zero external dependencies, API keys, or tracking scripts. Fully compliant with GitHub Push Protection standards.
