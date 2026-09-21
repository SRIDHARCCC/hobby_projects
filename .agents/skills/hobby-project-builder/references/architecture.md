# 🏛️ Hobby Projects Architecture & Design System

This reference manual documents the architectural principles, design tokens, component patterns, and container standards that every application in the `hobby_projects` repository must follow.

---

## 1. Architectural Principles

Every app in `hobby_projects` must be:

1. **Self-Contained & Modular**:
   - The app must live in its own dedicated directory at the repository root: `hobby_projects/<app-slug>/`.
   - It must never depend on code, stylesheets, or assets located outside its own directory.
   - It must not require a heavy Node build chain (no Webpack, Vite, or Babel step required for basic execution).

2. **Zero-Friction Execution**:
   - Must run directly by opening `index.html` in any browser (`file:///.../index.html`).
   - Must run via the included standalone Python server (`python server.py`).
   - Must build and run as a lightweight Docker container (`docker build -t <app-slug> .`).

3. **Interactive & Educational**:
   - The app is not a static text page. It must feature interactive controls, real-time visualizers, parameter sliders/inputs, and immediate educational feedback.
   - It should break down complex computer science, security, or algorithmic concepts into visual, understandable steps.

---

## 2. Standard App File Layout

```text
hobby_projects/<app-slug>/
├── index.html         # Main application markup & view structure
├── style.css          # Design system stylesheet (Dark mode, responsive grid)
├── app.js             # UI controller, event handlers, and state management
├── [engine.js]        # (Optional) Dedicated domain logic or algorithm simulator
├── server.py          # Standalone Python 3 HTTP server (zero pip dependencies)
├── test_app.js        # Automated verification script (Node.js test suite)
├── Dockerfile         # Multi-platform Nginx container (nginx:alpine)
├── nginx.conf         # Dynamic $PORT reverse proxy configuration
├── .dockerignore      # Exclude git, READMEs, test scripts from image
└── README.md          # Dedicated app documentation, guide & instructions
```

---

## 3. UI/UX Design System & Tokens

All apps follow a unified, modern dark cybersecurity/developer design aesthetic.

### CSS Custom Properties (`style.css`)
```css
:root {
  /* Background Palette */
  --bg-primary: #0a0e17;     /* Canvas background */
  --bg-secondary: #111827;   /* Panels and cards */
  --bg-tertiary: #1a2234;    /* Inputs, inner containers */
  --bg-card: #141c2e;        /* Main elevated cards */
  --bg-input: #0d1322;       /* Form input fields */
  --bg-hover: #1e293b;       /* Button hover state */

  /* Borders & Dividers */
  --border-color: #26334d;
  --border-focus: #3b82f6;

  /* Typography Colors */
  --text-main: #f1f5f9;      /* Primary text */
  --text-secondary: #94a3b8; /* Secondary text */
  --text-muted: #64748b;     /* Dim / helper text */

  /* Accent & Status Colors */
  --color-accent: #38bdf8;   /* Neon Cyan */
  --color-primary: #2563eb;  /* Royal Blue */
  --color-success: #10b981;  /* Emerald Green */
  --color-danger: #ef4444;   /* Crimson Red */
  --color-warning: #f59e0b;  /* Amber */

  /* Code / Visualizer Canvas */
  --code-bg: #0b111e;
  --syntax-keyword: #ec4899;
  --syntax-ident: #60a5fa;
  --syntax-string: #34d399;
  --syntax-payload: #f43f5e;
  --syntax-comment: #64748b;

  /* Fonts */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  /* Radii & Transitions */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-full: 9999px;
  --transition-fast: 0.15s ease;
  --transition-normal: 0.25s ease;
}
```

### Essential Components
1. **Header**:
   - Left: Icon badge (48x48 rounded rectangle with cyan glow) + App title + Badges + Subtitle.
   - Right: Primary mode switchers or global action buttons (Reset, Theme, Settings).
2. **Navigation Tabs**:
   - Tab buttons styled with bottom border indicators and subtle cyan active backgrounds.
   - Switchable panes with simple `.tab-pane.active` class management.
3. **Interactive Panels / Cards**:
   - Rounded corners (`10px` or `14px`), subtle border (`#26334d`), card shadows.
   - Panel header with emoji/icon, title, and contextual status badge.
4. **Form Controls & Quick Chips**:
   - Dark inputs with monospace or sans font, focus rings, clear buttons (`✕`).
   - Clickable "chips" (pills) for instant preset loading with hover lift (`transform: translateY(-1px)`).
5. **Real-Time Visualizer / Code Preview**:
   - Monospace terminal-style box with syntax highlighting.
   - Visual distinction between base state, modified/injected state, and disabled/commented state.
6. **Data Presentation**:
   - Clean responsive tables with alternating row hovers, status pills, and active row highlighting.
7. **Footer**:
   - App title, description, technology stack attribution, and author/repo note.

---

## 4. Container & Server Standards

### `server.py` Standard Template
The standalone Python server must use Python's built-in `http.server` without external `pip` dependencies:
- Serve from the current directory.
- Configurable port via `PORT` environment variable (defaults to `8080`).
- Attach standard security headers (`Cache-Control: no-cache`, `X-Content-Type-Options: nosniff`).
- Support optional `--open` CLI argument to launch default browser.

### `Dockerfile` Standard
```dockerfile
FROM nginx:alpine

ENV PORT=8080

RUN rm -rf /etc/nginx/conf.d/*

COPY nginx.conf /etc/nginx/templates/default.conf.template

COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY *.js /usr/share/nginx/html/

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
```

### `nginx.conf` Standard
```nginx
server {
    listen ${PORT};
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### `.dockerignore` Standard
```text
.git
.gitignore
README.md
server.py
test_*.js
*.pyc
__pycache__
```
