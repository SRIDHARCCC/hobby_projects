# 💉 SQLi-Lab: Interactive SQL Injection Explainer & Sandbox

An educational cybersecurity web application and interactive sandbox designed to demonstrate **how SQL Injection (SQLi) attacks work**, **why dynamic string concatenation creates critical vulnerabilities**, and **how parameterized queries (prepared statements) completely eliminate the threat**.

Built with pure HTML5, modern CSS3, and JavaScript, with a built-in SQL parsing simulator, 10 realistic user accounts, real-time AST tokenization, interactive CTF missions, and remediation guides in 6 major programming languages.

---

## 📸 Core Features

- **🧑‍🤝‍🧑 10 User Accounts & Passwords**: Pre-populated database with 10 corporate accounts (administrators, analysts, engineers, executives) complete with passwords, roles, departments, clearance levels, and confidential records.
- **⚡ Dual Engine Modes**:
  - `⚠️ Vulnerable Code Mode`: Simulates classic string concatenation (`"SELECT ... WHERE user = '" + input + "'"`).
  - `🛡️ Secure Prepared Mode`: Simulates parameterized queries (`SELECT ... WHERE user = ?`), treating all inputs strictly as literal data.
- **🔍 Live Real-Time SQL Parser & Visualizer**: Highlights how single quotes (`'`) break out of string literal delimiters, turning untrusted user input into executable database instructions.
- **🔬 Under-the-Hood Truth Evaluator**: Evaluates the SQL `WHERE` clause against all 10 users row-by-row, showing why specific users are authenticated or leaked.
- **🕵️ UNION-Based Data Exfiltration Lab**: Demonstrates how attackers use `UNION SELECT` to dump confidential columns, foreign tables, or sensitive encryption keys (`secrets` table) into innocent search forms.
- **🗄️ Database Inspector**: View, filter, and restore all 10 user accounts and system secrets at any time.
- **🎯 4 Gamified CTF Missions**:
  1. *The Gatecrasher* — Bypass login without knowing any password (Tautology `' OR '1'='1`).
  2. *Targeted Impersonation* — Hijack the `admin` account via comment truncation (`admin' --`).
  3. *The Secret Vault* — Exfiltrate confidential credentials via `UNION SELECT`.
  4. *The Iron Fortress* — Switch to Secure Mode and verify prepared statements withstand attacks.
- **💻 Multi-Language Defense Code**: Side-by-side vulnerable vs. secure code comparisons for **Python**, **Node.js/Express**, **PHP (PDO)**, **Java (JDBC)**, **C# (.NET)**, and **Go**.

---

## 👥 The 10 Sample Database Users

The simulated database comes preloaded with the following 10 corporate user accounts:

| ID | Username | Plaintext Password | Full Name | Role | Department | Clearance |
|:--:|---|---|---|---|---|:--:|
| 1 | `admin` | `AdminPassword2024!` | Eleanor Vance | Super Administrator | Executive Security | Lvl 5 |
| 2 | `alice_w` | `Wonderland#2024` | Alice Wright | Lead Financial Analyst | Finance & Accounting | Lvl 4 |
| 3 | `bob_m` | `BuilderBob#Secure!` | Bob Martinez | Senior DevOps Engineer | Infrastructure | Lvl 4 |
| 4 | `charlie_d` | `CharlieDelta@89` | Charlie Davis | Product Manager | Product Innovation | Lvl 3 |
| 5 | `diana_p` | `Themyscira!2025` | Diana Prince | Cybersecurity Analyst | Information Security | Lvl 4 |
| 6 | `ethan_h` | `MissionImpossible!7` | Ethan Hunt | Security Field Specialist | Field Operations | Lvl 5 |
| 7 | `fiona_g` | `FionaEmerald#99` | Fiona Gallagher | VP of Human Resources | Human Resources | Lvl 4 |
| 8 | `george_c` | `VandelayIndustries$` | George Costanza | Senior Database Administrator | Database Systems | Lvl 4 |
| 9 | `hannah_m` | `HannahStar@2024` | Hannah Montana | Marketing Director | Marketing & Growth | Lvl 2 |
| 10 | `ian_m` | `ChaosTheory#1993` | Ian Malcolm | Principal Data Scientist | AI & Research | Lvl 3 |

*There is also a secondary confidential `secrets` table containing production API tokens, database encryption keys, and JWT secrets used to demonstrate UNION injection.*

---

## 🚀 How to Run the App

The project is completely self-contained and has zero external npm or pip requirements.

### Option 1: Open Directly in Any Web Browser
Simply double-click or open `index.html` in Chrome, Firefox, Edge, or Safari:
```bash
start index.html     # Windows
open index.html      # macOS
xdg-open index.html  # Linux
```

### Option 2: Run with the Included Python Server
```bash
python server.py
# or with --open flag to launch browser automatically:
python server.py --open
```
Navigate to: **`http://localhost:8080`**

### Option 3: Run with Docker / Nginx
```bash
docker build -t sqli-lab .
docker run -p 8080:8080 sqli-lab
```
Navigate to: **`http://localhost:8080`**

---

## 🧠 Educational Explainer: Why SQL Injection Occurs

### 1. The Fundamental Root Cause
SQL Injection (CWE-89) occurs when software confuses **CODE** (commands meant for the SQL compiler) with **DATA** (values supplied by an external user).

When developers build queries using string formatting or string concatenation:
```python
# VULNERABLE CODE:
query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
```
The database SQL parser receives a single monolithic string containing both the command instructions and the user-supplied strings. If the user input contains a quote character (`'`), the parser interprets that character as the **closing delimiter** of the string literal, and all subsequent characters as **executable SQL tokens**!

---

### 2. The Mechanics of Common SQLi Techniques

#### A. The Tautology Attack (`' OR '1'='1`)
- **Payload entered as username**: `' OR '1'='1`
- **Resulting Backend Query**:
  ```sql
  SELECT * FROM users WHERE username = '' OR '1'='1' AND password = '...';
  ```
- **How the parser interprets it**:
  Because `'1'='1'` is mathematically always `TRUE`, the boolean expression evaluates to:
  ```text
  (username = '' [FALSE]) OR ('1'='1' [TRUE])  ==>  TRUE
  ```
  The condition evaluates to `TRUE` for **every single user in the table**. The database returns all 10 rows, and the web application signs in as the first returned user (`admin`).

#### B. Comment Truncation & Targeted Impersonation (`admin' --`)
- **Payload entered as username**: `admin' --`
- **Resulting Backend Query**:
  ```sql
  SELECT * FROM users WHERE username = 'admin' --' AND password = '...';
  ```
- **How the parser interprets it**:
  In SQL, `--` denotes an inline comment. The SQL parser completely discards everything from `--` to the end of the line. The password condition (`AND password = '...'`) is erased before execution! The database executes:
  ```sql
  SELECT * FROM users WHERE username = 'admin';
  ```
  The application authenticates the attacker as `admin` without verifying any password.

#### C. UNION-Based Data Exfiltration
- **Vulnerable search query**:
  ```sql
  SELECT id, full_name, role, department, email FROM users WHERE full_name LIKE '%USER_INPUT%'
  ```
- **Payload entered**:
  ```text
  ' UNION SELECT id, username, password, email, role, secret_data FROM users --
  ```
- **Resulting Backend Query**:
  ```sql
  SELECT id, full_name, role, department, email FROM users WHERE full_name LIKE '%' 
  UNION SELECT id, username, password, email, role, secret_data FROM users --%'
  ```
- **How the parser interprets it**:
  The `UNION` operator fuses results from the second query into the search results. Confidential passwords and encryption keys are displayed in place of employee directory records.

---

## 🛡️ The Definitive Fix: Parameterized Queries (Prepared Statements)

The only foolproof defense against SQL injection is to **separate the query structure from the data values**:

```python
# SECURE (Python sqlite3):
sql = "SELECT * FROM users WHERE username = ? AND password = ?"
cursor.execute(sql, (username, password))
```

### Why Prepared Statements Work:
1. **Compilation Phase**: The database compiles the SQL query's Abstract Syntax Tree (AST) **before** seeing any user input.
2. **Binding Phase**: The parameters `?` are sent over an isolated data protocol. The database engine treats the parameters strictly as literal values.
3. If an attacker inputs `' OR '1'='1`, the database looks for an account whose exact username is literally the string `"' OR '1'='1"`. The quote has zero syntactic meaning, and the attack fails completely.

---

## 📁 Project Structure

```text
sql-injection-explainer/
├── index.html         # Interactive web application & multi-lab interface
├── style.css          # Cybersecurity dark theme, responsive grid & animations
├── sql-engine.js      # Educational SQL engine, lexer simulation & 10 users database
├── app.js             # UI controller, live AST tokenizer, CTF missions & state
├── server.py          # Standalone Python HTTP server
├── test_engine.js     # Verification test suite for SQL simulation
├── Dockerfile         # Container deployment configuration
├── nginx.conf         # Nginx reverse proxy configuration
├── .dockerignore      # Container build exclusions
└── README.md          # Comprehensive documentation & security guide
```
