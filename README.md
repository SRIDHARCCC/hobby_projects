# 🎨 Hobby Projects

A collection of lightweight, self-contained educational apps, utilities, and interactive mini-projects.

Each project is designed to be completely modular and housed in its own independent folder with its own code, assets, and documentation.

---

## 📁 Projects Directory

| Folder | Project | Tech Stack | Description |
|---|---|---|---|
| [**`sorting-visualizer/`**](./sorting-visualizer/) | **SortLab: Sorting Visualizer** | HTML5, CSS3, JavaScript, Nginx/Docker | Interactive step-by-step visual explorer for Bubble Sort and Selection Sort with side-by-side comparison mode. |
| [**`sql-injection-explainer/`**](./sql-injection-explainer/) | **SQLi-Lab: SQL Injection Explainer** | HTML5, CSS3, JavaScript, Python/Docker | Interactive sandbox demonstrating SQL injection vulnerabilities, 10 users & passwords database, AST visualizer, and prepared statement defenses. |
| [**`trigonometry-visualizer/`**](./trigonometry-visualizer/) | **TrigLab: Interactive Trigonometry & Unit Circle Visualizer** | HTML5, CSS3, JavaScript, Python/Docker | Interactive visualizer explaining Sine, Cosine, Tangent, Cosecant, Secant, and Cotangent across 0°-360° with dynamic unit circle projections, wave graphs, and geometric proofs. |
| [**`tensor-matmul-visualizer/`**](./tensor-matmul-visualizer/) | **TensorMatmulLab: NumPy Matmul & Dot Product Visualizer** | HTML5, CSS3, JavaScript, Python/Docker | Intuitive interactive visualizer for NumPy matrix multiplication (@ / np.matmul), vector dot products, step-by-step element playback, and batch broadcasting. |
| [**`softmax-sampling-visualizer/`**](./softmax-sampling-visualizer/) | **SoftmaxLab: Softmax & LLM Sampling Visualizer** | HTML5, CSS3, JavaScript, Python/Docker | Interactive visual explorer for Softmax, Temperature scaling, Top-K, and Top-P (nucleus) sampling with live probability distributions and token generation simulation. |

---

## 🛠 Repository Architecture

```text
hobby_projects/
├── .gitignore                # Root security rules (blocks secrets, keys, env files)
├── README.md                 # Project showcase & index
│
├── sorting-visualizer/       # App 1: Sorting Algorithm Visualizer
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── Dockerfile
│   ├── nginx.conf
│   └── README.md
│
├── sql-injection-explainer/  # App 2: SQL Injection Interactive Sandbox & Explainer
│   ├── index.html
│   ├── style.css
│   ├── sql-engine.js
│   ├── app.js
│   ├── server.py
│   ├── Dockerfile
│   ├── nginx.conf
│   └── README.md
│
├── trigonometry-visualizer/  # App 3: Interactive Trigonometry & Unit Circle Visualizer
│   ├── index.html
│   ├── style.css
│   ├── trig-engine.js
│   ├── app.js
│   ├── server.py
│   ├── test_app.js
│   ├── Dockerfile
│   ├── nginx.conf
│   └── README.md
│
├── tensor-matmul-visualizer/ # App 4: Higher-Dimensional Matrix Multiplication Visualizer
│   ├── index.html
│   ├── style.css
│   ├── matmul-engine.js
│   ├── app.js
│   ├── server.py
│   ├── test_app.js
│   ├── Dockerfile
│   ├── nginx.conf
│   └── README.md
│
├── softmax-sampling-visualizer/ # App 5: Softmax & LLM Sampling Visualizer
│   ├── index.html
│   ├── style.css
│   ├── sampling-engine.js
│   ├── app.js
│   ├── server.py
│   ├── test_app.js
│   ├── Dockerfile
│   ├── nginx.conf
│   └── README.md
│
├── [future-app-name]/        # App 6 (Add new apps in separate folders)
└── ...
```

---

## ➕ Contributing a New App

We welcome community contributions! Every app must follow the self-contained, zero-dependency architecture. See our full [**Contributing Guide**](./CONTRIBUTING.md) for details.

### For Developers & AI Coding Agents
This repository includes formal instructions for human contributors and AI coding assistants, as well as a specialized **Agent Skill**:
- **Contribution Guide**: Read [`CONTRIBUTING.md`](./CONTRIBUTING.md) for complete setup and PR guidelines.
- **Agent Instructions**: Read [`AGENTS.md`](./AGENTS.md) for full project standards.
- **Agent Skill**: [`hobby-project-builder`](./.agents/skills/hobby-project-builder/SKILL.md)
  - **Auto-Scaffolding Tool**:
    ```bash
    python .agents/skills/hobby-project-builder/scripts/scaffold.py my-app "My App Title" "Description"
    ```
  - **Compliance Verifier**:
    ```bash
    python .agents/skills/hobby-project-builder/scripts/verify.py my-app
    ```

---

## 🔒 Security & Privacy

This repository strictly enforces no secrets, API keys, private tokens, or project identifiers in version control. All sensitive files (`.env`, `*credentials*.json`, `*.pem`, etc.) are actively excluded via the root [`.gitignore`](./.gitignore). Simulated credentials in code must use safe mock strings (e.g. `demo_mock_dummy_token_not_a_real_secret_12345`) to satisfy GitHub Push Protection.

