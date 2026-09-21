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

## ➕ Adding a New App

To add a new project to this repository:
1. Create a new directory at the root: `mkdir my-new-app`
2. Add your application files into that folder.
3. Add a dedicated `README.md` inside your app directory describing its features and how to run it.
4. Add an entry to the table in this root `README.md`.

---

## 🔒 Security & Privacy

This repository strictly enforces no secrets, API keys, private tokens, or project identifiers in version control. All sensitive files (`.env`, `*credentials*.json`, `*.pem`, etc.) are actively excluded via the root [`.gitignore`](./.gitignore).
