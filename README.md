# 🎨 Hobby Projects

A collection of lightweight, self-contained educational apps, utilities, and interactive mini-projects.

Each project is designed to be completely modular and housed in its own independent folder with its own code, assets, and documentation.

---

## 📁 Projects Directory

| Folder | Project | Tech Stack | Description |
|---|---|---|---|
| [**`sorting-visualizer/`**](./sorting-visualizer/) | **SortLab: Sorting Visualizer** | HTML5, CSS3, JavaScript, Nginx/Docker | Interactive step-by-step visual explorer for Bubble Sort and Selection Sort with side-by-side comparison mode. |
| [**`sql-injection-explainer/`**](./sql-injection-explainer/) | **SQLi-Lab: SQL Injection Explainer** | HTML5, CSS3, JavaScript, Python/Docker | Interactive sandbox demonstrating SQL injection vulnerabilities, 10 users & passwords database, AST visualizer, and prepared statement defenses. |

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
├── [future-app-name]/        # App 3 (Add new apps in separate folders)
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

