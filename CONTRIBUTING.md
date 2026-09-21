# 🤝 Contributing to Hobby Projects

Thank you for your interest in contributing to **Hobby Projects**! We welcome new educational mini-apps, interactive algorithm visualizers, cybersecurity sandboxes, and developer utilities.

To maintain consistency, quality, and zero-friction execution across the entire repository, all projects follow a standardized architecture and design system.

---

## 🤖 Contributing with an AI Coding Agent

This repository is equipped with an official **Agent Skill**: [**`hobby-project-builder`**](./.agents/skills/hobby-project-builder/SKILL.md).

If you or your team use an agentic coding assistant (such as **Antigravity**, **Gemini CLI**, **Claude Code**, or **Cursor**), you can give the agent this skill so it automatically builds apps adhering to the exact architecture, dark UI design tokens, Docker configurations, Python servers, and test suites.

### How to Use the Agent Skill

#### Option A: Antigravity / Gemini CLI (Automatic Discovery)
Because this repository contains the `.agents/skills/` directory, **Antigravity automatically discovers and loads the skill** whenever working in this workspace. You can simply prompt your agent:
> *"Create a new hobby project called `pathfinding-visualizer` demonstrating Dijkstra and A* algorithms using the hobby-project-builder skill."*

#### Option B: Copying the Skill to Your Global Agent Config
If you wish to use this skill globally across other workspaces:
```bash
# Copy into your global Gemini/Antigravity skills folder
cp -r .agents/skills/hobby-project-builder ~/.gemini/config/skills/
```

#### Option C: Any Other AI Assistant (Cursor, Claude Code, Copilot)
Simply reference or copy [`.agents/skills/hobby-project-builder/SKILL.md`](./.agents/skills/hobby-project-builder/SKILL.md) into your prompt or project rules.

---

## 📋 The 6 Golden Rules for Every App

1. **Self-Contained & Zero Build Step**:
   - The app must live in its own folder: `hobby_projects/<app-slug>/`.
   - Must run directly by opening `index.html` in any browser. No Webpack, Vite, or npm install required.
2. **Interactive & Educational**:
   - Must feature interactive controls (play, pause, step, sliders, presets) and real-time visual feedback or narration.
3. **Modern Dark Design Aesthetic**:
   - Follow the CSS custom properties documented in [`.agents/skills/hobby-project-builder/references/architecture.md`](./.agents/skills/hobby-project-builder/references/architecture.md).
4. **Multi-Mode Execution**:
   - Browser: Direct `index.html`.
   - Local: `python server.py`.
   - Container: `Dockerfile` + `nginx.conf` (Alpine Nginx dynamically binding to `$PORT`).
5. **Automated Verification**:
   - Includes `test_app.js` runnable with `node test_app.js` with zero npm packages.
6. **Strict Zero-Secret Policy**:
   - Never commit real credentials, tokens, or private keys. GitHub Push Protection is enabled. Always use safe prefixes like `demo_mock_...`. See [Security Guidelines](./.agents/skills/hobby-project-builder/references/security.md).

---

## 🚀 Step-by-Step Contribution Workflow

### 1. Scaffold a New App
Run the automated scaffolder CLI from the repository root:
```bash
python .agents/skills/hobby-project-builder/scripts/scaffold.py <app-slug> "<App Title>" "<Short Description>" "<Tech Stack>"
```
*Example:*
```bash
python .agents/skills/hobby-project-builder/scripts/scaffold.py pathfinding-visualizer "PathLab: A* & Dijkstra Visualizer" "Interactive grid search algorithm visualizer" "HTML5, CSS3, JavaScript, Python/Docker"
```
This generates all 8 required files and registers your app in the root `README.md`.

### 2. Implement Your App Logic
- Build the core interactive experience in `index.html`, `style.css`, and `app.js`.
- Separate domain algorithms or complex state simulators into a helper file (e.g., `engine.js`) if helpful.

### 3. Add Automated Tests
- Implement unit and edge-case checks in `<app-slug>/test_app.js`.
- Verify tests pass:
  ```bash
  node <app-slug>/test_app.js
  ```

### 4. Run the Automated Compliance Audit
Before opening a Pull Request, run the repository compliance verifier:
```bash
python .agents/skills/hobby-project-builder/scripts/verify.py <app-slug>
```
The audit checks:
- [x] All 8 required files present and non-empty.
- [x] Zero prohibited secret patterns (Push Protection).
- [x] Registered in root `README.md`.
- [x] Test suite passes cleanly.

### 5. Commit and Submit
Use Conventional Commits:
```bash
git add <app-slug> README.md
git commit -m "feat(<app-slug>): add <app-title> educational web app"
git push origin <your-branch>
```
Open a Pull Request describing your app and its educational objectives!
