#!/usr/bin/env python3
"""
Hobby Projects Scaffolder CLI
Automates the creation of a new, fully compliant app inside the hobby_projects repository.

Usage:
    python scaffold.py <app-slug> "<App Title>" "<Short Description>" "<Tech Stack>"
Example:
    python scaffold.py graph-pathfinder "PathLab: Graph Search Visualizer" "Interactive A*, Dijkstra, and BFS visualizer" "HTML5, CSS3, JavaScript, Python/Docker"
"""

import sys
import os
import re

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

def get_repo_root():
    current = os.path.dirname(os.path.abspath(__file__))
    # Walk up to find folder containing sorting-visualizer or .git
    while current and os.path.basename(current):
        if os.path.exists(os.path.join(current, 'sorting-visualizer')) or os.path.exists(os.path.join(current, '.git')):
            return current
        parent = os.path.dirname(current)
        if parent == current:
            break
        current = parent
    return os.getcwd()

REPO_ROOT = get_repo_root()

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} | Hobby Projects</title>
  <link rel="stylesheet" href="style.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body class="theme-dark">
  <div class="app-container">
    
    <!-- Top Header -->
    <header class="app-header">
      <div class="header-brand">
        <div class="brand-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
        </div>
        <div>
          <div class="title-row">
            <h1>{title}</h1>
            <span class="badge badge-accent">Interactive Lab</span>
          </div>
          <p class="subtitle">{description}</p>
        </div>
      </div>

      <div class="header-controls">
        <button id="resetAppBtn" class="btn btn-secondary btn-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
          Reset
        </button>
      </div>
    </header>

    <!-- Navigation Tabs -->
    <nav class="nav-tabs">
      <button class="nav-tab active" data-tab="tab-main">
        <span>🎮 Interactive Playground</span>
      </button>
      <button class="nav-tab" data-tab="tab-theory">
        <span>📚 Concept & Theory</span>
      </button>
    </nav>

    <!-- Main Content Area -->
    <main class="app-main">
      <section id="tab-main" class="tab-pane active">
        <div class="panel">
          <div class="panel-header">
            <h2>Controls & Parameters</h2>
          </div>
          <div class="controls-row">
            <button id="primaryActionBtn" class="btn btn-primary">Start Interactive Run</button>
          </div>
          <div id="outputDisplay" class="output-canvas mt-4">
            <p class="text-muted">Interactive output will be rendered here.</p>
          </div>
        </div>
      </section>

      <section id="tab-theory" class="tab-pane">
        <div class="panel">
          <div class="panel-header">
            <h2>How It Works</h2>
          </div>
          <p>{description}</p>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="app-footer">
      <div><strong>{title}</strong> &bull; Part of Hobby Projects Collection</div>
      <div>Zero-dependency Vanilla Web Architecture</div>
    </footer>

  </div>

  <script src="app.js"></script>
</body>
</html>
"""

STYLE_TEMPLATE = """/* ==========================================================================
   {title} - Design System Stylesheet
   ========================================================================== */

:root {
  --bg-primary: #0a0e17;
  --bg-secondary: #111827;
  --bg-tertiary: #1a2234;
  --bg-card: #141c2e;
  --bg-input: #0d1322;
  --bg-hover: #1e293b;

  --border-color: #26334d;
  --border-focus: #3b82f6;

  --text-main: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;

  --color-accent: #38bdf8;
  --color-primary: #2563eb;
  --color-success: #10b981;
  --color-danger: #ef4444;
  --color-warning: #f59e0b;

  --code-bg: #0b111e;
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'Fira Code', ui-monospace, Menlo, Monaco, Consolas, monospace;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-full: 9999px;

  --transition-fast: 0.15s ease;
  --transition-normal: 0.25s ease;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-sans);
  background-color: var(--bg-primary);
  color: var(--text-main);
  line-height: 1.6;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1.25rem;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.brand-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #1e3a8a, #0284c7);
  border: 1px solid #38bdf840;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.35);
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.title-row h1 {
  font-size: 1.65rem;
  font-weight: 800;
  background: linear-gradient(90deg, #f8fafc, #38bdf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-accent {
  background: rgba(56, 189, 248, 0.15);
  color: var(--color-accent);
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.nav-tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1.5rem;
}

.nav-tab {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.65rem 1rem;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all var(--transition-fast);
}

.nav-tab:hover {
  color: var(--text-main);
  background: var(--bg-secondary);
}

.nav-tab.active {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
  background: rgba(56, 189, 248, 0.08);
}

.tab-pane {
  display: none;
}

.tab-pane.active {
  display: block;
}

.panel {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
}

.panel-header {
  margin-bottom: 1rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-sans);
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.6rem 1.25rem;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-primary {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #1d4ed8, #1e40af);
}

.btn-secondary {
  background: var(--bg-tertiary);
  border-color: var(--border-color);
  color: var(--text-main);
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
}

.output-canvas {
  background: var(--code-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  min-height: 200px;
}

.mt-4 { margin-top: 1rem; }
.text-muted { color: var(--text-muted); }

.app-footer {
  margin-top: 2rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: var(--text-muted);
  flex-wrap: wrap;
  gap: 0.5rem;
}
"""

APP_JS_TEMPLATE = """/**
 * {title} - Application Logic
 */

(function () {
  'use strict';

  // Application State
  const state = {
    activeTab: 'tab-main'
  };

  // DOM Elements
  const elements = {
    navTabs: document.querySelectorAll('.nav-tab'),
    tabPanes: document.querySelectorAll('.tab-pane'),
    primaryActionBtn: document.getElementById('primaryActionBtn'),
    resetAppBtn: document.getElementById('resetAppBtn'),
    outputDisplay: document.getElementById('outputDisplay')
  };

  function setupNavigation() {
    elements.navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('data-tab');
        elements.navTabs.forEach(t => t.classList.remove('active'));
        elements.tabPanes.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        const targetPane = document.getElementById(targetId);
        if (targetPane) targetPane.classList.add('active');
        state.activeTab = targetId;
      });
    });
  }

  function handleAction() {
    elements.outputDisplay.innerHTML = `
      <div style="color: #38bdf8; font-weight: 600;">
        ✓ Interactive action triggered successfully!
      </div>
    `;
  }

  function handleReset() {
    elements.outputDisplay.innerHTML = `
      <p class="text-muted">Interactive output will be rendered here.</p>
    `;
  }

  function init() {
    setupNavigation();
    if (elements.primaryActionBtn) {
      elements.primaryActionBtn.addEventListener('click', handleAction);
    }
    if (elements.resetAppBtn) {
      elements.resetAppBtn.addEventListener('click', handleReset);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
"""

SERVER_PY_TEMPLATE = """#!/usr/bin/env python3
\"\"\"
{title} - Standalone HTTP Server
\"\"\"

import http.server
import socketserver
import os
import sys
import webbrowser

PORT = int(os.environ.get("PORT", 8080))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        super().end_headers()

def main():
    os.chdir(DIRECTORY)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}"
        print(f"[{title}] Server running at {url}")
        if "--open" in sys.argv:
            try:
                webbrowser.open(url)
            except Exception:
                pass
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\\nStopping server.")
            httpd.server_close()

if __name__ == "__main__":
    main()
"""

DOCKERFILE_TEMPLATE = """FROM nginx:alpine

ENV PORT=8080

RUN rm -rf /etc/nginx/conf.d/*

COPY nginx.conf /etc/nginx/templates/default.conf.template

COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY *.js /usr/share/nginx/html/

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
"""

NGINX_CONF_TEMPLATE = """server {
    listen ${PORT};
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
"""

DOCKERIGNORE_TEMPLATE = """.git
.gitignore
README.md
server.py
test_*.js
*.pyc
__pycache__
"""

TEST_APP_TEMPLATE = """/**
 * Automated Verification Suite for {title}
 */
const fs = require('fs');
const path = require('path');

console.log('=== Running Verification for {title} ===');

const requiredFiles = ['index.html', 'style.css', 'app.js', 'server.py', 'Dockerfile', 'nginx.conf', '.dockerignore', 'README.md'];
let allPassed = true;

requiredFiles.forEach(file => {
  const p = path.join(__dirname, file);
  if (!fs.existsSync(p) || fs.statSync(p).size === 0) {
    console.error(`✗ Missing or empty file: ${{file}}`);
    allPassed = false;
  } else {
    console.log(`✓ Verified ${{file}} (${{fs.statSync(p).size}} bytes)`);
  }
});

if (!allPassed) {
  process.exit(1);
}

console.log('🎉 All verification checks passed!');
"""

README_TEMPLATE = """# {title}

{description}

---

## 📸 Features

- **Interactive Playground**: Real-time simulation and visualization.
- **Zero-Dependency Architecture**: Built using pure HTML5, modern CSS3, and JavaScript.
- **Multi-Environment Ready**: Run directly in browser, via Python standard server, or inside Docker.

---

## 🚀 How to Run

### Option 1: Direct in Web Browser
Open `index.html` in your browser.

### Option 2: Standalone Python Server
```bash
python server.py --open
```

### Option 3: Docker Container
```bash
docker build -t {slug} .
docker run -p 8080:8080 {slug}
```
"""

def scaffold(slug, title, description, tech_stack):
    target_dir = os.path.join(REPO_ROOT, slug)
    if os.path.exists(target_dir):
        print(f"Error: Directory '{slug}' already exists at {target_dir}")
        sys.exit(1)

    os.makedirs(target_dir, exist_ok=True)
    print(f"Created directory: {target_dir}")

    files = {
        'index.html': HTML_TEMPLATE.format(title=title, description=description),
        'style.css': STYLE_TEMPLATE.format(title=title),
        'app.js': APP_JS_TEMPLATE.format(title=title),
        'server.py': SERVER_PY_TEMPLATE.format(title=title),
        'Dockerfile': DOCKERFILE_TEMPLATE,
        'nginx.conf': NGINX_CONF_TEMPLATE,
        '.dockerignore': DOCKERIGNORE_TEMPLATE,
        'test_app.js': TEST_APP_TEMPLATE.format(title=title),
        'README.md': README_TEMPLATE.format(title=title, description=description, slug=slug)
    }

    for fname, content in files.items():
        fpath = os.path.join(target_dir, fname)
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  + Created {fname}")

    # Register in root README.md
    root_readme_path = os.path.join(REPO_ROOT, 'README.md')
    if os.path.exists(root_readme_path):
        with open(root_readme_path, 'r', encoding='utf-8') as f:
            content = f.read()

        table_entry = f"| [**`{slug}/`**](./{slug}/) | **{title}** | {tech_stack} | {description} |\n"
        if f"[**`{slug}/`**]" not in content:
            # Insert before the closing delimiter of the table or next section
            content = content.replace("---\n\n## 🛠 Repository Architecture", f"{table_entry}\n---\n\n## 🛠 Repository Architecture")
            with open(root_readme_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  + Registered '{slug}' in root README.md")

    print(f"\n🎉 Successfully scaffolded '{title}' in {slug}/")
    print(f"Next steps:")
    print(f"  1. Customize {slug}/app.js with your domain logic")
    print(f"  2. Run 'python .agents/skills/hobby-project-builder/scripts/verify.py {slug}' to validate")

if __name__ == '__main__':
    if len(sys.argv) < 4:
        print("Usage: python scaffold.py <slug> \"<Title>\" \"<Description>\" [\"<Tech Stack>\"]")
        sys.exit(1)
    
    slug_arg = sys.argv[1].lower().strip().replace(' ', '-')
    title_arg = sys.argv[2]
    desc_arg = sys.argv[3]
    tech_arg = sys.argv[4] if len(sys.argv) > 4 else "HTML5, CSS3, JavaScript, Python/Docker"
    scaffold(slug_arg, title_arg, desc_arg, tech_arg)
