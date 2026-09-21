/**
 * SQL Injection Explainer - Educational SQL Engine & Parser Simulator
 * 
 * Simulates how SQL database parsers interpret both safe parameterized queries
 * and vulnerable dynamically concatenated queries.
 */

const DEFAULT_USERS = [
  {
    id: 1,
    username: "admin",
    password: "AdminPassword2024!",
    full_name: "Eleanor Vance (Administrator)",
    role: "Super Administrator",
    email: "admin@corp-secure.io",
    secret_data: "Master Key: SKYNET-PROD-9981-SEC; 2FA Seed: K7XW9Q2Z",
    clearance_level: 5,
    department: "Executive Security"
  },
  {
    id: 2,
    username: "alice_w",
    password: "Wonderland#2024",
    full_name: "Alice Wright",
    role: "Lead Financial Analyst",
    email: "a.wright@corp-secure.io",
    secret_data: "Q4 Treasury Reserves: $14,250,000; Swiss Vault #402",
    clearance_level: 4,
    department: "Finance & Accounting"
  },
  {
    id: 3,
    username: "bob_m",
    password: "BuilderBob#Secure!",
    full_name: "Bob Martinez",
    role: "Senior DevOps Engineer",
    email: "b.martinez@corp-secure.io",
    secret_data: "Infrastructure Cluster Root Admin Token: CLUSTER-DEMO-ROOT-0012",
    clearance_level: 4,
    department: "Infrastructure"
  },
  {
    id: 4,
    username: "charlie_d",
    password: "CharlieDelta@89",
    full_name: "Charlie Davis",
    role: "Product Manager",
    email: "c.davis@corp-secure.io",
    secret_data: "Unreleased Roadmap: Project Hyperion Launch Date: Nov 2026",
    clearance_level: 3,
    department: "Product Innovation"
  },
  {
    id: 5,
    username: "diana_p",
    password: "Themyscira!2025",
    full_name: "Diana Prince",
    role: "Cybersecurity Analyst",
    email: "d.prince@corp-secure.io",
    secret_data: "Active Threat Intel Feeds & Honeypot IPs: 198.51.100.44",
    clearance_level: 4,
    department: "Information Security"
  },
  {
    id: 6,
    username: "ethan_h",
    password: "MissionImpossible!7",
    full_name: "Ethan Hunt",
    role: "Security Field Specialist",
    email: "e.hunt@corp-secure.io",
    secret_data: "Safehouse Emergency Frequencies & Distress Code: OMEGA-RED",
    clearance_level: 5,
    department: "Field Operations"
  },
  {
    id: 7,
    username: "fiona_g",
    password: "FionaEmerald#99",
    full_name: "Fiona Gallagher",
    role: "VP of Human Resources",
    email: "f.gallagher@corp-secure.io",
    secret_data: "Executive Payroll & Performance Records Archive #HR-900",
    clearance_level: 4,
    department: "Human Resources"
  },
  {
    id: 8,
    username: "george_c",
    password: "VandelayIndustries$",
    full_name: "George Costanza",
    role: "Senior Database Administrator",
    email: "g.costanza@corp-secure.io",
    secret_data: "Backup Passphrase: 'art-vandelay-import-export-latex'",
    clearance_level: 4,
    department: "Database Systems"
  },
  {
    id: 9,
    username: "hannah_m",
    password: "HannahStar@2024",
    full_name: "Hannah Montana",
    role: "Marketing Director",
    email: "h.montana@corp-secure.io",
    secret_data: "Q4 Brand Ad Spend Budget: $3,500,000; Influencer Contracts",
    clearance_level: 2,
    department: "Marketing & Growth"
  },
  {
    id: 10,
    username: "ian_m",
    password: "ChaosTheory#1993",
    full_name: "Ian Malcolm",
    role: "Principal Data Scientist",
    email: "i.malcolm@corp-secure.io",
    secret_data: "AI Model Private Weights Checkpoint: s3://models/deep-chaos.bin",
    clearance_level: 3,
    department: "AI & Research"
  }
];

const DEFAULT_SECRETS = [
  { id: 1, secret_name: "PAYMENT_GATEWAY_TEST_TOKEN", secret_val: "demo_mock_dummy_token_not_a_real_secret_12345", description: "Payment gateway simulation key" },
  { id: 2, secret_name: "DATABASE_ENCRYPTION_KEY", secret_val: "AES256-HEX-9988776655443322AABBCCDDEEFF0011", description: "At-rest storage key" },
  { id: 3, secret_name: "JWT_SIGNING_SECRET", secret_val: "super-duper-secret-jwt-key-never-commit-this-2026", description: "Auth token HMAC secret" },
  { id: 4, secret_name: "VPN_GATEWAY_TOKEN", secret_val: "vpn-tok-prod-gw-01-a8b299e410b", description: "Internal network tunnel bearer token" }
];

class EduSQLEngine {
  constructor() {
    this.resetDatabase();
  }

  resetDatabase() {
    this.users = JSON.parse(JSON.stringify(DEFAULT_USERS));
    this.secrets = JSON.parse(JSON.stringify(DEFAULT_SECRETS));
    this.isTableDropped = false;
  }

  getUsers() {
    return this.users;
  }

  getSecrets() {
    return this.secrets;
  }

  /**
   * Builds the query string and metadata for Login authentication
   */
  buildLoginQuery(username, password, mode = 'vulnerable') {
    if (mode === 'secure') {
      return {
        mode: 'secure',
        template: `SELECT * FROM users WHERE username = ? AND password = ?;`,
        params: [username, password],
        displayQuery: `SELECT * FROM users WHERE username = ? AND password = ?;\n-- Parameters: [1: "${username}", 2: "${password}"]`,
        isVulnerable: false
      };
    }

    // Vulnerable string concatenation
    const rawQuery = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}';`;
    return {
      mode: 'vulnerable',
      rawQuery: rawQuery,
      displayQuery: rawQuery,
      usernameInput: username,
      passwordInput: password,
      isVulnerable: true
    };
  }

  /**
   * Executes the Login Query and returns detailed step-by-step educational analysis
   */
  executeLogin(username, password, mode = 'vulnerable') {
    if (this.isTableDropped) {
      return {
        success: false,
        error: "OperationalError: no such table: users (Table was dropped by stacked query attack! Please click 'Reset DB')",
        rows: [],
        authenticatedUser: null,
        analysis: {
          technique: "Database destroyed",
          explanation: "The users table does not exist anymore. Reset database to restore data."
        }
      };
    }

    if (mode === 'secure') {
      return this._executeSecureLogin(username, password);
    } else {
      return this._executeVulnerableLogin(username, password);
    }
  }

  _executeSecureLogin(username, password) {
    // In prepared statements, inputs are strictly treated as literal data
    const matchedUser = this.users.find(u => u.username === username && u.password === password);
    const rows = matchedUser ? [matchedUser] : [];

    const rowEvaluations = this.users.map(u => {
      const userMatch = u.username === username;
      const passMatch = u.password === password;
      return {
        user: u,
        usernameEval: `"${u.username}" === "${username}" -> ${userMatch}`,
        passwordEval: `"${u.password}" === "${password}" -> ${passMatch}`,
        finalEval: userMatch && passMatch
      };
    });

    return {
      success: !!matchedUser,
      mode: 'secure',
      queryExecuted: `SELECT * FROM users WHERE username = ? AND password = ?;`,
      params: [username, password],
      rows: rows,
      authenticatedUser: matchedUser || null,
      rowEvaluations: rowEvaluations,
      analysis: {
        technique: "Parameterized Prepared Statement (Defense Active)",
        isInjectionDetected: username.includes("'") || password.includes("'") || username.includes("--"),
        explanation: username.includes("'") || username.includes("--") 
          ? `The database driver treated your input (${JSON.stringify(username)}) strictly as a literal text string. The single quotes and SQL keywords were NOT parsed as executable SQL code. Because no user exists with literal username ${JSON.stringify(username)}, 0 rows matched. Attack neutralised!`
          : (matchedUser 
              ? `Authentication succeeded legitimately for user "${matchedUser.username}". Safe parameterized execution.` 
              : `Authentication failed: Invalid credentials. Input treated strictly as literal data.`)
      }
    };
  }

  _executeVulnerableLogin(username, password) {
    const rawQuery = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}';`;
    
    // Check for stacked queries like '; DROP TABLE users;'
    const stackedDropMatch = /;\s*DROP\s+TABLE\s+users/i.test(username) || /;\s*DROP\s+TABLE\s+users/i.test(password);
    if (stackedDropMatch) {
      this.isTableDropped = true;
      return {
        success: false,
        error: "FATAL: Stacked Query Executed! Table `users` has been DROPPED from database!",
        rows: [],
        authenticatedUser: null,
        queryExecuted: rawQuery,
        analysis: {
          technique: "Stacked Query / Destructive Injection (CWE-89)",
          explanation: "The query terminated with a semicolon ';' and executed a subsequent DROP TABLE command. The users table has been completely erased from the database!"
        }
      };
    }

    // Parse the effective WHERE clause by simulating SQL lexer/parser
    const { effectiveQuery, commentedOutPart, whereExpr } = this._parseVulnerableAuthQuery(username, password);

    // Evaluate each row against whereExpr
    const rowEvaluations = [];
    const matchedRows = [];

    for (const u of this.users) {
      const evalResult = this._evaluateAuthCondition(whereExpr, u, username, password);
      rowEvaluations.push({
        user: u,
        expressionEvaluated: evalResult.expressionString,
        booleanValue: evalResult.passed,
        breakdown: evalResult.breakdown
      });

      if (evalResult.passed) {
        matchedRows.push(u);
      }
    }

    const authenticatedUser = matchedRows.length > 0 ? matchedRows[0] : null;
    const injectionAnalysis = this._categorizeAuthInjection(username, password, matchedRows, effectiveQuery, commentedOutPart);

    return {
      success: !!authenticatedUser,
      mode: 'vulnerable',
      queryExecuted: rawQuery,
      effectiveQuery: effectiveQuery,
      commentedOutPart: commentedOutPart,
      rows: matchedRows,
      authenticatedUser: authenticatedUser,
      rowEvaluations: rowEvaluations,
      analysis: injectionAnalysis
    };
  }

  _parseVulnerableAuthQuery(username, password) {
    // Check for SQL comment in username: '--' or '/*' or '#'
    let commentIndex = -1;
    let commentType = '';
    
    const dashIndex = username.indexOf('--');
    const blockIndex = username.indexOf('/*');
    const hashIndex = username.indexOf('#');

    const indices = [];
    if (dashIndex !== -1) indices.push({ idx: dashIndex, type: '--' });
    if (blockIndex !== -1) indices.push({ idx: blockIndex, type: '/*' });
    if (hashIndex !== -1) indices.push({ idx: hashIndex, type: '#' });

    indices.sort((a, b) => a.idx - b.idx);

    let effectiveUsernameClause = username;
    let commentedOutPart = '';

    if (indices.length > 0) {
      commentIndex = indices[0].idx;
      commentType = indices[0].type;
      effectiveUsernameClause = username.substring(0, commentIndex);
      commentedOutPart = username.substring(commentIndex) + `' AND password = '${password}';`;
    }

    let effectiveQuery = '';
    let whereExpr = '';

    if (commentIndex !== -1) {
      effectiveQuery = `SELECT * FROM users WHERE username = '${effectiveUsernameClause}';`;
      whereExpr = `username = '${effectiveUsernameClause}'`;
    } else {
      effectiveQuery = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}';`;
      whereExpr = `username = '${username}' AND password = '${password}'`;
    }

    return { effectiveQuery, commentedOutPart, whereExpr };
  }

  _evaluateAuthCondition(whereExpr, user, rawUsername, rawPassword) {
    // Check for classic Tautology: ' OR '1'='1 or ' OR 1=1 or ' OR 'a'='a or ' OR ''='
    const tautologyRegex = /'\s+OR\s+('?[a-zA-Z0-9]*'?\s*=\s*'?[a-zA-Z0-9]*'|1\s*=\s*1|TRUE)/i;
    const hasTautology = tautologyRegex.test(whereExpr);

    // Check for comment bypass targeting specific user: e.g. admin' --
    const adminBypassMatch = rawUsername.match(/^([a-zA-Z0-9_]+)'\s*(--|\/\*|#)/);

    if (adminBypassMatch) {
      const targetUser = adminBypassMatch[1];
      const matchesTarget = (user.username.toLowerCase() === targetUser.toLowerCase());
      return {
        passed: matchesTarget,
        expressionString: `WHERE username = '${user.username}' (password check bypassed by comment)`,
        breakdown: matchesTarget 
          ? `User '${user.username}' matches target '${targetUser}'. Password check was truncated by '--' comment!`
          : `User '${user.username}' does not match '${targetUser}'.`
      };
    }

    // Check for empty username + tautology: e.g. ' OR 1=1 -- or ' OR '1'='1
    if (hasTautology) {
      return {
        passed: true,
        expressionString: `WHERE username = '${user.username}' OR [TRUE] -> TRUE`,
        breakdown: `The injected 'OR' clause evaluates to TRUE unconditionally for user '${user.username}'.`
      };
    }

    // Check for normal credentials match
    const usernameMatch = (user.username === rawUsername);
    const passwordMatch = (user.password === rawPassword);
    const normalPassed = usernameMatch && passwordMatch;

    return {
      passed: normalPassed,
      expressionString: `WHERE username = '${user.username}' (${usernameMatch}) AND password = '***' (${passwordMatch})`,
      breakdown: normalPassed 
        ? `Valid username & password provided.` 
        : (usernameMatch ? `Username matches, but incorrect password.` : `Username does not match.`)
    };
  }

  _categorizeAuthInjection(username, password, matchedRows, effectiveQuery, commentedOutPart) {
    const isComment = commentedOutPart.length > 0;
    const isTautology = /'\s+OR\s+/i.test(username) || /'\s+OR\s+/i.test(password);
    const hasUnion = /UNION\s+SELECT/i.test(username) || /UNION\s+SELECT/i.test(password);

    if (hasUnion) {
      return {
        technique: "UNION-Based Authentication Injection",
        isInjection: true,
        summary: "UNION operator injected into authentication query.",
        explanation: "The query combined results from a secondary query, potentially injecting synthetic administrative sessions."
      };
    }

    if (isComment && /^[a-zA-Z0-9_]+'/i.test(username)) {
      const targetUser = username.split("'")[0];
      return {
        technique: "Comment Truncation / Targeted Impersonation",
        isInjection: true,
        summary: `Line comment '--' neutralized the password verification!`,
        explanation: `By appending single-quote followed by SQL comment characters (' --), the attacker closed the string literal early and instructed the SQL parser to discard everything that followed. The database never validated the password, granting immediate access as '${targetUser}'!`
      };
    }

    if (isTautology) {
      return {
        technique: "Tautology Attack (Boolean Always True: ' OR '1'='1')",
        isInjection: true,
        summary: `Injected boolean OR condition forced the query to match all records!`,
        explanation: `The injection broke out of the username string and injected an 'OR' operator with an expression that is mathematically always true ('1'='1'). The database returned all ${matchedRows.length} users, and the web application logged in as the first returned record (${matchedRows[0]?.username || 'admin'}).`
      };
    }

    if (username.includes("'") || password.includes("'")) {
      return {
        technique: "Malformed SQL Syntax Attempt",
        isInjection: true,
        summary: `Unescaped single-quote detected.`,
        explanation: `The single quote broke out of the string literal boundary, altering the query structure. If not matching a tautology or comment, it causes logic mismatch or syntax errors.`
      };
    }

    if (matchedRows.length > 0) {
      return {
        technique: "Legitimate Authentication",
        isInjection: false,
        summary: "Standard login without SQL injection.",
        explanation: "Credentials matched existing user records legitimately."
      };
    }

    return {
      technique: "Standard Failed Login",
      isInjection: false,
      summary: "Invalid username or password.",
      explanation: "No database records matched the provided username and password combination."
    };
  }

  /**
   * Executes a directory search query (demonstrating UNION injection)
   */
  executeSearch(term, mode = 'vulnerable') {
    if (this.isTableDropped) {
      return {
        success: false,
        error: "OperationalError: table `users` dropped.",
        results: [],
        isUnionLeak: false
      };
    }

    if (mode === 'secure') {
      // Parameterized query: SELECT id, username, full_name, role, department, email FROM users WHERE full_name LIKE ? OR department LIKE ?
      const searchParam = `%${term}%`.toLowerCase();
      const results = this.users
        .filter(u => u.full_name.toLowerCase().includes(term.toLowerCase()) || u.department.toLowerCase().includes(term.toLowerCase()))
        .map(u => ({
          id: u.id,
          col1: u.full_name,
          col2: u.role,
          col3: u.department,
          col4: u.email,
          isLeakedRow: false
        }));

      return {
        success: true,
        mode: 'secure',
        query: `SELECT id, full_name, role, department, email FROM users WHERE full_name LIKE ? OR department LIKE ?;`,
        params: [`%${term}%`, `%${term}%`],
        results: results,
        isUnionLeak: false,
        explanation: `Input treated strictly as search literal string. Special characters like single quotes, UNION, or comments have zero effect on query structure.`
      };
    }

    // Vulnerable search concatenation:
    const rawQuery = `SELECT id, full_name, role, department, email FROM users WHERE full_name LIKE '%${term}%' OR department LIKE '%${term}%';`;

    // Check for UNION injection in term
    const unionMatch = term.match(/UNION\s+SELECT\s+(.*?)(?:--|\/\*|#|;|$)/i);
    
    if (unionMatch) {
      const injectedColumnsStr = unionMatch[1].trim();
      let leakedResults = [];

      // If user is selecting from users to get passwords
      if (/FROM\s+users/i.test(term)) {
        leakedResults = this.users.map(u => ({
          id: u.id,
          col1: `[PWNED USER]: ${u.username}`,
          col2: `PASSWORD: ${u.password}`,
          col3: `CLEARANCE: Lvl ${u.clearance_level}`,
          col4: `SECRET: ${u.secret_data}`,
          isLeakedRow: true
        }));
      } else if (/FROM\s+(secrets|system_secrets)/i.test(term)) {
        leakedResults = this.secrets.map(s => ({
          id: s.id,
          col1: `[EXFILTRATED SECRET]: ${s.secret_name}`,
          col2: `VALUE: ${s.secret_val}`,
          col3: `DESC: ${s.description}`,
          col4: `INTERNAL REPO`,
          isLeakedRow: true
        }));
      } else {
        // Generic simulated union projection
        leakedResults = [
          {
            id: 999,
            col1: "INJECTED_RECORD_1",
            col2: "admin_password_hash: $2b$12$e8x...",
            col3: "UNRESTRICTED_ACCESS",
            col4: "master_key: SKYNET-PROD-9981-SEC",
            isLeakedRow: true
          }
        ];
      }

      // Normal results before the union if any
      const normalResults = this.users
        .filter(u => term.startsWith(u.full_name) || term.startsWith(u.department))
        .map(u => ({
          id: u.id,
          col1: u.full_name,
          col2: u.role,
          col3: u.department,
          col4: u.email,
          isLeakedRow: false
        }));

      return {
        success: true,
        mode: 'vulnerable',
        rawQuery: rawQuery,
        results: [...normalResults, ...leakedResults],
        isUnionLeak: true,
        explanation: `CRITICAL DATA EXFILTRATION! The injected UNION operator forced the SQL engine to combine the legitimate search table columns with confidential records from another table or sensitive columns (passwords, encryption keys). The attacker bypassed all access controls simply by crafting a search string!`
      };
    }

    // Normal vulnerable search
    const cleanTerm = term.replace(/'/g, '');
    const results = this.users
      .filter(u => u.full_name.toLowerCase().includes(cleanTerm.toLowerCase()) || u.department.toLowerCase().includes(cleanTerm.toLowerCase()))
      .map(u => ({
        id: u.id,
        col1: u.full_name,
        col2: u.role,
        col3: u.department,
        col4: u.email,
        isLeakedRow: false
      }));

    return {
      success: true,
      mode: 'vulnerable',
      rawQuery: rawQuery,
      results: results,
      isUnionLeak: false,
      explanation: `Standard search query executed. If the input contains quotes or syntax, they are directly incorporated into the database command.`
    };
  }
}

// Export for Node/module and Browser global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EduSQLEngine, DEFAULT_USERS, DEFAULT_SECRETS };
} else {
  window.EduSQLEngine = EduSQLEngine;
  window.DEFAULT_USERS = DEFAULT_USERS;
  window.DEFAULT_SECRETS = DEFAULT_SECRETS;
}
