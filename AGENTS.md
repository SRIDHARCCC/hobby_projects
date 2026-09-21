# 🤖 Instructions for AI Coding Agents (`AGENTS.md`)

This repository (`hobby_projects`) is an open collection of lightweight, self-contained educational web applications, algorithm visualizers, and interactive security labs.

When asked to create, modify, test, or document a new hobby project in this repository, **you MUST follow the architectural patterns and quality standards documented below**.

---

## ⚡ Primary Agent Skill: `hobby-project-builder`

The dedicated agent skill for this repository is located at:  
👉 [`.agents/skills/hobby-project-builder/SKILL.md`](./.agents/skills/hobby-project-builder/SKILL.md)

Before starting any new application, read that file and consult its references:
- **Design System & Architecture**: [`.agents/skills/hobby-project-builder/references/architecture.md`](./.agents/skills/hobby-project-builder/references/architecture.md)
- **Secret Scanning & Security Rules**: [`.agents/skills/hobby-project-builder/references/security.md`](./.agents/skills/hobby-project-builder/references/security.md)

---

## 🏗️ Core Architectural Rules

1. **Self-Contained Folders**:
   - Every app lives in its own root directory: `hobby_projects/<app-slug>/` (lowercase, hyphen-separated, e.g. `sorting-visualizer`, `sql-injection-explainer`).
   - Do NOT import code, styles, or assets from other project folders.

2. **Zero-Dependency Vanilla Stack**:
   - Built with pure HTML5, modern CSS3, and standard ES6+ JavaScript.
   - Do NOT introduce heavy bundlers, Webpack, Vite, or npm/pip dependencies for basic execution.
   - Must be runnable directly via `file:///.../index.html`, through `python server.py`, or via Docker.

3. **Standard 9-File Checklist**:
   Every application must contain:
   - `index.html`: Semantic markup, header with badge, tabs, controls, visualizer output, footer.
   - `style.css`: Unified dark developer theme (`--bg-primary: #0a0e17`), responsive flex/grid, card layouts, animations.
   - `app.js`: Clean modular state management, DOM event listeners, real-time input preview.
   - `server.py`: Standalone Python 3 HTTP server with security headers and `--open` flag.
   - `test_app.js`: Automated Node.js integration verification suite.
   - `Dockerfile`: Multi-platform Nginx container (`nginx:alpine`) binding to dynamic `$PORT`.
   - `nginx.conf`: Nginx reverse proxy template.
   - `.dockerignore`: Exclude git, READMEs, test scripts from container build.
   - `README.md`: In-depth documentation with overview, features list, tech stack, and run commands.

4. **Interactive & Educational Value**:
   - The app must visually explain a concept (algorithms, security, protocols, data structures) through step-by-step playback, real-time query tokenization, or interactive sandboxes.

5. **Root README Registration**:
   - Every app must be registered in the **Projects Directory** table and the **Repository Architecture** tree in the root [`README.md`](./README.md).

---

## 🚀 Standard Workflow for Agents

### 1. Scaffold Automatically
Run the scaffolding script to generate boilerplate:
```bash
python .agents/skills/hobby-project-builder/scripts/scaffold.py <app-slug> "<Title>" "<Description>"
```

### 2. Implement App Logic & UI
- Customize `index.html` and `app.js`.
- (Optional) Implement domain logic in a decoupled engine (e.g. `engine.js`).
- Add tests to `test_app.js`.

### 3. Verify Compliance Before Push
Run the automated compliance verifier:
```bash
python .agents/skills/hobby-project-builder/scripts/verify.py <app-slug>
```
Ensure all 4 checks pass:
- [x] All 8 required files present and non-empty
- [x] Zero prohibited secret patterns (prevents GitHub Push Protection `GH013` blocks)
- [x] Registered in root `README.md`
- [x] Automated test suite executed and passed

---

## 🔒 Secret Scanning & Push Protection Warning

GitHub will automatically block `git push` if any simulated credentials match patterns for Stripe (`sk_live_...`), AWS (`AKIA...` or `arn:aws:iam...`), GitHub (`ghp_...`), or private keys.
Always use explicit dummy strings such as:
`demo_mock_dummy_token_not_a_real_secret_12345`
