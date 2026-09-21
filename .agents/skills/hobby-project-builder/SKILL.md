---
name: hobby-project-builder
description: >-
  Use this skill whenever creating, scaffolding, modifying, testing, or reviewing an educational mini-app or interactive utility inside the hobby_projects repository. Enforces the self-contained modular architecture, modern dark-theme design system, Docker containerization, standalone Python server, automated testing, zero-secret GitHub Push Protection compliance, and root README registration.
---

# 🎨 Hobby Project Builder: Contributor Agent Skill

Welcome to the **Hobby Projects** ecosystem! This skill instructs AI coding agents on how to build, test, and document new educational mini-apps and utilities in the exact same format and quality level as existing projects in `hobby_projects`.

---

## 🏗️ Repository Architecture & Guiding Philosophy

Every application in this repository is **completely self-contained, modular, and educational**:
1. **Self-Contained**: Housed strictly inside its own root-level directory `hobby_projects/<app-slug>/`. Never import or depend on files outside that directory.
2. **Zero-Friction / No Build Step**: Uses standard Vanilla JavaScript (ES6+), HTML5, and CSS3. Must run immediately when opened directly in a browser (`file://`), served via Python, or built with Docker. No complex bundler (Webpack/Vite/Babel) required.
3. **Interactive & Visual**: Every project must feature interactive controls, parameters, and real-time visualization to explain a concept (algorithms, security, data structures, math, physics, etc.).
4. **Production-Ready Container**: Every project includes an Nginx Dockerfile (`nginx:alpine`) configured for dynamic `$PORT` environments (e.g. Cloud Run).

For detailed design tokens and CSS variables, consult [references/architecture.md](./references/architecture.md).  
For secret scanning and Push Protection rules, consult [references/security.md](./references/security.md).

---

## 📋 Required File Checklist for Every New App

Every application folder `hobby_projects/<app-slug>/` must contain the following 9 files:

```text
hobby_projects/<app-slug>/
├── index.html         # Application layout, semantic header, tabs, visualizer & footer
├── style.css          # Design system stylesheet (Dark mode, CSS variables, responsive)
├── app.js             # UI controller, state management, event listeners
├── [engine.js]        # (Optional) Dedicated algorithmic or simulation engine
├── server.py          # Standalone Python 3 HTTP server (zero pip dependencies)
├── test_app.js        # Automated Node.js integration verification suite
├── Dockerfile         # Multi-platform Nginx container template
├── nginx.conf         # Dynamic $PORT reverse proxy configuration
├── .dockerignore      # Exclude git, READMEs, test scripts from image
└── README.md          # Comprehensive documentation & educational guide
```

---

## 🛠️ Step-by-Step Workflow for Coding Agents

### Step 1: Scaffold the Application
Use the built-in scaffolding CLI script to instantly generate the folder structure and all standard files:

```bash
python .agents/skills/hobby-project-builder/scripts/scaffold.py <app-slug> "<App Title>" "<Short Description>"
```
*Example:*
```bash
python .agents/skills/hobby-project-builder/scripts/scaffold.py pathfinding-visualizer "PathLab: Pathfinding Visualizer" "Interactive visualizer for A*, Dijkstra, and BFS graph search"
```
The script will:
- Create `hobby_projects/<app-slug>/`
- Generate standard `index.html`, `style.css`, `app.js`, `server.py`, `Dockerfile`, `nginx.conf`, `.dockerignore`, `test_app.js`, and `README.md`
- Automatically register the project in the root `hobby_projects/README.md` table!

---

### Step 2: Implement Domain Logic & Engines
If the project involves complex simulations, parsing, or data operations, create a dedicated engine file (e.g. `engine.js` or `simulator.js`) decoupled from the DOM:
- Export cleanly for both Node.js (`module.exports`) and browser (`window.<Engine>`):
  ```javascript
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MyEngine };
  } else {
    window.MyEngine = MyEngine;
  }
  ```
- Keep functions pure and deterministic whenever possible to make unit testing easy.

---

### Step 3: Build the Interactive User Interface
Follow the unified design system in `style.css`:
- **Header**: Icon badge + App title + Badges + Controls (Theme/Reset/Mode switcher).
- **Navigation Tabs**: Clean tabbed view switching between primary interactive playground and secondary educational/theory screens.
- **Controls & Quick Presets**: Form inputs with clear buttons and clickable preset chips (`.chip .chip-attack`, `.chip .chip-legit`, etc.).
- **Live Visualizer / Display**: Syntax-highlighted code boxes, canvas/SVG graphs, or dynamic comparison grids with real-time feedback.
- **Footer**: Project attribution and link to hobby repository.

---

### Step 4: Write Automated Integration Tests
In `test_app.js`, verify:
1. All core algorithms or functions produce expected outputs on standard and edge cases.
2. File existence and non-empty size checks.
3. Exit with code `0` on success or code `1` on error.
Run via:
```bash
node <app-slug>/test_app.js
```

---

### Step 5: Document the Project
In `<app-slug>/README.md`:
1. Title and one-paragraph elevator pitch.
2. Key Features list with bullet points.
3. Concept explanation with code snippets or diagrams.
4. "How to Run" section covering:
   - Direct browser (`index.html`)
   - Standalone server (`python server.py --open`)
   - Docker container (`docker build -t <slug> .` & `docker run -p 8080:8080 <slug>`)

---

### Step 6: Verify Compliance Before Commit
Run the automated compliance verifier script:

```bash
python .agents/skills/hobby-project-builder/scripts/verify.py <app-slug>
```
The verifier audits:
- [x] All 8 required files exist and are non-empty
- [x] Zero prohibited secret patterns (e.g. `sk_live_`, AWS ARNs, private keys) that would trip GitHub Push Protection
- [x] Registration in the root `hobby_projects/README.md`
- [x] Successful execution of `test_app.js`

Fix any reported issues before proceeding to commit.

---

## 🔒 Mandatory Secret Scanning & Push Protection Rules

To prevent GitHub Push Protection rejections (`GH013`):
- **NEVER** use strings resembling real API keys or tokens (even as dummy examples).
  - Do NOT write `sk_live_...` (matches Stripe)
  - Do NOT write `arn:aws:iam::...` or `AKIA...` (matches AWS)
  - Do NOT write `ghp_...` (matches GitHub PAT)
- **ALWAYS** use safe explicit mock labels:
  - `demo_mock_dummy_token_not_a_real_secret_12345`
  - `MOCK_CLUSTER_ROOT_ADMIN_TOKEN_001`
- Keep `__pycache__`, `.env`, and credentials files excluded via `.gitignore`.

---

## 🤝 Summary Checklist for Contributors

When submitting a new hobby project:
1. [ ] Created inside `hobby_projects/<app-slug>/`.
2. [ ] Contains all 9 standardized files.
3. [ ] Runs out-of-the-box without `npm install` or `pip install`.
4. [ ] Passes `python .agents/skills/hobby-project-builder/scripts/verify.py <app-slug>`.
5. [ ] Added to the directory table in `hobby_projects/README.md`.
