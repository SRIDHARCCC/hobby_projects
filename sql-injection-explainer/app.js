/**
 * SQL Injection Explainer - Front-End Controller
 * Connects UI, EduSQLEngine, Live Syntax Tokenizer, Missions & DB Inspector
 */

(function () {
  'use strict';

  // Instantiate SQL Engine
  const engine = new EduSQLEngine();

  // App State
  const state = {
    mode: 'vulnerable', // 'vulnerable' | 'secure'
    activeTab: 'tab-login',
    lastAuthResult: null,
    missions: {
      1: false, // Tautology bypass
      2: false, // Targeted admin comment bypass
      3: false, // UNION data exfiltration
      4: false  // Secure parameterized test
    }
  };

  // Load mission progress from localStorage
  function loadMissions() {
    try {
      const saved = localStorage.getItem('sqli_lab_missions');
      if (saved) {
        state.missions = Object.assign(state.missions, JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Could not read missions from localStorage', e);
    }
  }

  function saveMissions() {
    try {
      localStorage.setItem('sqli_lab_missions', JSON.stringify(state.missions));
    } catch (e) {
      console.warn('Could not save missions to localStorage', e);
    }
  }

  // DOM Elements
  const elements = {
    // Mode switcher
    modeVulnerableBtn: document.getElementById('modeVulnerableBtn'),
    modeSecureBtn: document.getElementById('modeSecureBtn'),
    formModeBadge: document.getElementById('formModeBadge'),
    resetDbGlobalBtn: document.getElementById('resetDbGlobalBtn'),
    resetDbInspectorBtn: document.getElementById('resetDbInspectorBtn'),

    // Tabs
    navTabs: document.querySelectorAll('.nav-tab'),
    tabPanes: document.querySelectorAll('.tab-pane'),

    // Login Lab
    loginUsername: document.getElementById('loginUsername'),
    loginPassword: document.getElementById('loginPassword'),
    executeLoginBtn: document.getElementById('executeLoginBtn'),
    sqlLivePreview: document.getElementById('sqlLivePreview'),
    executionResultCard: document.getElementById('executionResultCard'),
    matchedRowsCountBadge: document.getElementById('matchedRowsCountBadge'),
    toggleEvalAccordionBtn: document.getElementById('toggleEvalAccordionBtn'),
    evalAccordionContent: document.getElementById('evalAccordionContent'),
    rowEvaluationList: document.getElementById('rowEvaluationList'),
    payloadTip: document.getElementById('payloadTip'),

    // Search Lab
    searchQueryInput: document.getElementById('searchQueryInput'),
    executeSearchBtn: document.getElementById('executeSearchBtn'),
    searchSqlPreview: document.getElementById('searchSqlPreview'),
    searchResultsTable: document.getElementById('searchResultsTable'),
    searchResultsBody: document.getElementById('searchResultsBody'),
    searchResultsCountBadge: document.getElementById('searchResultsCountBadge'),
    searchExplanationBox: document.getElementById('searchExplanationBox'),

    // DB Inspector
    dbFilterInput: document.getElementById('dbFilterInput'),
    dbUsersTableBody: document.getElementById('dbUsersTableBody'),
    dbSecretsTableBody: document.getElementById('dbSecretsTableBody'),

    // Missions
    challengeCounter: document.getElementById('challengeCounter'),
    missionsCompletedText: document.getElementById('missionsCompletedText'),
    missionsProgressBar: document.getElementById('missionsProgressBar'),
    allMissionsCompletedBanner: document.getElementById('allMissionsCompletedBanner'),
    resetMissionsBtn: document.getElementById('resetMissionsBtn'),

    // Code Fixes
    langTabs: document.querySelectorAll('.lang-tab'),
    snippetPanes: document.querySelectorAll('.snippet-pane')
  };

  /* ==========================================================================
     Mode Switching (Vulnerable vs Secure)
     ========================================================================== */
  function setMode(newMode) {
    state.mode = newMode;

    if (newMode === 'vulnerable') {
      elements.modeVulnerableBtn.classList.add('active');
      elements.modeSecureBtn.classList.remove('active');
      elements.formModeBadge.className = 'badge badge-danger';
      elements.formModeBadge.textContent = 'Vulnerable Concatenation Mode';
    } else {
      elements.modeSecureBtn.classList.add('active');
      elements.modeVulnerableBtn.classList.remove('active');
      elements.formModeBadge.className = 'badge badge-success';
      elements.formModeBadge.textContent = '🛡️ Secure Prepared Statement Mode';
    }

    updateLivePreview();
    updateSearchPreview();

    // If an auth result is currently showing, re-run or advise
    if (state.lastAuthResult) {
      executeLogin();
    }
  }

  /* ==========================================================================
     Live SQL Syntax Highlighting & Tokenizer
     ========================================================================== */
  function updateLivePreview() {
    const rawUser = elements.loginUsername.value;
    const rawPass = elements.loginPassword.value;

    if (state.mode === 'secure') {
      // Prepared Statement view
      elements.sqlLivePreview.innerHTML = `
<span class="sql-kw">SELECT</span> * <span class="sql-kw">FROM</span> <span class="sql-id">users</span> 
<span class="sql-kw">WHERE</span> <span class="sql-id">username</span> = <span class="sql-param">?</span> 
  <span class="sql-kw">AND</span> <span class="sql-id">password</span> = <span class="sql-param">?</span>;

<span class="text-muted small">-- Bound Parameters (Sent via isolated data channel):</span>
<span class="text-muted small">-- [1]: </span><span class="sql-str">${escapeHtml(JSON.stringify(rawUser))}</span>
<span class="text-muted small">-- [2]: </span><span class="sql-str">${escapeHtml(JSON.stringify(rawPass))}</span>
      `.trim();
      return;
    }

    // Vulnerable string concatenation view with live injection breakdown
    let html = `<span class="sql-kw">SELECT</span> * <span class="sql-kw">FROM</span> <span class="sql-id">users</span> <span class="sql-kw">WHERE</span> <span class="sql-id">username</span> = '`;

    // Detect comment markers in username
    const commentIdx = findFirstCommentIndex(rawUser);

    if (commentIdx !== -1) {
      const beforeComment = rawUser.substring(0, commentIdx);
      const commentAndBeyond = rawUser.substring(commentIdx);

      html += highlightPayload(beforeComment);
      html += `<span class="sql-comment">${escapeHtml(commentAndBeyond)}' AND password = '${escapeHtml(rawPass)}';</span>`;
    } else {
      html += highlightPayload(rawUser);
      html += `' <span class="sql-kw">AND</span> <span class="sql-id">password</span> = '`;
      html += highlightPayload(rawPass);
      html += `';`;
    }

    elements.sqlLivePreview.innerHTML = html;
  }

  function findFirstCommentIndex(str) {
    const dash = str.indexOf('--');
    const block = str.indexOf('/*');
    const hash = str.indexOf('#');
    const valid = [dash, block, hash].filter(idx => idx !== -1);
    return valid.length > 0 ? Math.min(...valid) : -1;
  }

  function highlightPayload(input) {
    if (!input) return '';
    // Check if quotes are present (escaping string literal boundary)
    if (input.includes("'")) {
      const parts = input.split("'");
      let res = '';
      for (let i = 0; i < parts.length; i++) {
        res += escapeHtml(parts[i]);
        if (i < parts.length - 1) {
          // The quote character that broke the boundary!
          res += `<span class="sql-payload">'</span>`;
        }
      }
      return res;
    }
    return `<span class="sql-str">${escapeHtml(input)}</span>`;
  }

  function updateSearchPreview() {
    const term = elements.searchQueryInput.value;

    if (state.mode === 'secure') {
      elements.searchSqlPreview.innerHTML = `
<span class="sql-kw">SELECT</span> id, full_name, role, department, email <span class="sql-kw">FROM</span> <span class="sql-id">users</span>
<span class="sql-kw">WHERE</span> full_name <span class="sql-kw">LIKE</span> <span class="sql-param">?</span> <span class="sql-kw">OR</span> department <span class="sql-kw">LIKE</span> <span class="sql-param">?</span>;

<span class="text-muted small">-- Bound Parameter: </span><span class="sql-str">"%${escapeHtml(term)}%"</span>
      `.trim();
      return;
    }

    // Vulnerable search
    let preview = `<span class="sql-kw">SELECT</span> id, full_name, role, department, email <span class="sql-kw">FROM</span> <span class="sql-id">users</span>\n<span class="sql-kw">WHERE</span> full_name <span class="sql-kw">LIKE</span> '%`;

    const unionMatch = term.match(/UNION\s+SELECT/i);
    if (unionMatch) {
      const unionPos = term.search(/UNION\s+SELECT/i);
      const beforeUnion = term.substring(0, unionPos);
      const unionAndRest = term.substring(unionPos);

      preview += `${escapeHtml(beforeUnion)}%' <span class="sql-payload">${escapeHtml(unionAndRest)}</span>;`;
    } else {
      preview += `${escapeHtml(term)}%' <span class="sql-kw">OR</span> department <span class="sql-kw">LIKE</span> '%${escapeHtml(term)}%';`;
    }

    elements.searchSqlPreview.innerHTML = preview;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ==========================================================================
     Execution Handlers
     ========================================================================== */
  function executeLogin() {
    const username = elements.loginUsername.value;
    const password = elements.loginPassword.value;

    const result = engine.executeLogin(username, password, state.mode);
    state.lastAuthResult = result;

    renderLoginResult(result, username, password);
    renderRowEvaluations(result);
    highlightDbRows(result.rows || []);
    checkMissionsOnAuth(result, username, password);
  }

  function renderLoginResult(result, username, password) {
    const card = elements.executionResultCard;

    if (!result.success) {
      card.className = 'result-card danger-auth';
      card.innerHTML = `
        <div class="result-status-header">
          <div class="result-status-title">
            <span style="color: #ef4444;">❌ Access Denied</span>
          </div>
          <span class="badge badge-danger">0 Records Matched</span>
        </div>
        <p class="text-secondary small">The query returned no matching user rows with the provided credentials.</p>
        
        <div class="analysis-explanation ${state.mode === 'secure' ? 'safe' : 'vuln'}">
          <strong>Database Analysis:</strong> ${escapeHtml(result.analysis?.explanation || 'Query executed without matching rows.')}
        </div>
      `;
      return;
    }

    // Successful login!
    const user = result.authenticatedUser;
    const isInjection = result.analysis?.isInjection;

    card.className = isInjection ? 'result-card danger-auth' : 'result-card success-auth';
    card.innerHTML = `
      <div class="result-status-header">
        <div class="result-status-title">
          <span>${isInjection ? '🚨 Authentication Bypassed!' : '✅ Authenticated Successfully'}</span>
        </div>
        <span class="badge ${isInjection ? 'badge-danger' : 'badge-success'}">
          ${isInjection ? 'Vulnerability Exploited' : 'Legitimate Login'}
        </span>
      </div>

      <div class="user-profile-card">
        <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
        <div class="user-info">
          <h4>${escapeHtml(user.full_name)} (@${escapeHtml(user.username)})</h4>
          <p><strong>Role:</strong> ${escapeHtml(user.role)} &bull; <strong>Dept:</strong> ${escapeHtml(user.department)}</p>
          <p><strong>Clearance:</strong> Level ${user.clearance_level} &bull; <strong>Email:</strong> ${escapeHtml(user.email)}</p>
          
          <div class="secret-alert-box">
            🔒 <strong>Compromised Confidential Data:</strong> ${escapeHtml(user.secret_data)}
          </div>
        </div>
      </div>

      <div class="analysis-explanation ${isInjection ? 'vuln' : 'safe'}">
        <strong>Mechanism Breakdown:</strong> ${escapeHtml(result.analysis?.explanation || '')}
      </div>
    `;
  }

  function renderRowEvaluations(result) {
    const evals = result.rowEvaluations || [];
    const matchedCount = (result.rows || []).length;
    elements.matchedRowsCountBadge.textContent = matchedCount;

    let html = '';
    evals.forEach(item => {
      const isMatched = item.booleanValue || item.finalEval;
      html += `
        <div class="row-eval-item ${isMatched ? 'matched' : ''}">
          <div>
            <span class="row-eval-user">#${item.user.id} [${escapeHtml(item.user.username)}]</span>
            <span class="text-muted small ml-2">(${escapeHtml(item.user.role)})</span>
            <div class="text-secondary small mt-1">
              ${escapeHtml(item.breakdown || item.usernameEval || '')}
            </div>
          </div>
          <span class="eval-badge ${isMatched ? 'true' : 'false'}">
            ${isMatched ? 'TRUE (MATCHED)' : 'FALSE'}
          </span>
        </div>
      `;
    });

    elements.rowEvaluationList.innerHTML = html;
  }

  function executeSearch() {
    const term = elements.searchQueryInput.value;
    const result = engine.executeSearch(term, state.mode);

    elements.searchResultsCountBadge.textContent = `${result.results.length} Result${result.results.length === 1 ? '' : 's'}`;

    if (result.explanation) {
      elements.searchExplanationBox.className = result.isUnionLeak ? 'analysis-explanation vuln' : 'analysis-explanation safe';
      elements.searchExplanationBox.innerHTML = `<strong>Search Execution Analysis:</strong> ${escapeHtml(result.explanation)}`;
      elements.searchExplanationBox.classList.remove('hidden');
    }

    if (result.results.length === 0) {
      elements.searchResultsBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted">No records matched "${escapeHtml(term)}".</td>
        </tr>
      `;
      return;
    }

    let tbody = '';
    result.results.forEach((row, idx) => {
      const isLeaked = row.isLeakedRow;
      tbody += `
        <tr class="${isLeaked ? 'leaked-row' : ''}">
          <td><strong>${row.id}</strong></td>
          <td>${isLeaked ? '🚨 ' : ''}${escapeHtml(row.col1)}</td>
          <td>${escapeHtml(row.col2)}</td>
          <td>${escapeHtml(row.col3)}</td>
          <td>${escapeHtml(row.col4)}</td>
        </tr>
      `;
    });

    elements.searchResultsBody.innerHTML = tbody;

    if (result.isUnionLeak) {
      completeMission(3);
    }
  }

  /* ==========================================================================
     Database Inspector Rendering
     ========================================================================== */
  function renderDatabaseInspector(filter = '') {
    const users = engine.getUsers();
    const secrets = engine.getSecrets();
    const lowerFilter = filter.toLowerCase().trim();

    let usersHtml = '';
    users.forEach(u => {
      const matchesFilter = !lowerFilter || 
        u.username.toLowerCase().includes(lowerFilter) ||
        u.full_name.toLowerCase().includes(lowerFilter) ||
        u.role.toLowerCase().includes(lowerFilter) ||
        u.department.toLowerCase().includes(lowerFilter);

      if (!matchesFilter) return;

      usersHtml += `
        <tr data-user-id="${u.id}">
          <td><strong>${u.id}</strong></td>
          <td><code>${escapeHtml(u.username)}</code></td>
          <td><span class="password-cell">${escapeHtml(u.password)}</span></td>
          <td>${escapeHtml(u.full_name)}</td>
          <td><span class="badge badge-accent">${escapeHtml(u.role)}</span></td>
          <td>${escapeHtml(u.department)}</td>
          <td>Level ${u.clearance_level}</td>
          <td class="small text-secondary">${escapeHtml(u.secret_data)}</td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="window.App.populateLoginForm('${escapeHtml(u.username)}', '${escapeHtml(u.password)}')">
              Load
            </button>
          </td>
        </tr>
      `;
    });

    elements.dbUsersTableBody.innerHTML = usersHtml || `<tr><td colspan="9" class="text-center text-muted">No users matched filter.</td></tr>`;

    let secretsHtml = '';
    secrets.forEach(s => {
      secretsHtml += `
        <tr>
          <td><strong>${s.id}</strong></td>
          <td><code>${escapeHtml(s.secret_name)}</code></td>
          <td><span class="password-cell" style="color: #ef4444;">${escapeHtml(s.secret_val)}</span></td>
          <td class="small text-secondary">${escapeHtml(s.description)}</td>
        </tr>
      `;
    });

    elements.dbSecretsTableBody.innerHTML = secretsHtml;
  }

  function highlightDbRows(matchedRows) {
    const matchedIds = new Set(matchedRows.map(r => r.id));
    const allRows = elements.dbUsersTableBody.querySelectorAll('tr[data-user-id]');
    allRows.forEach(row => {
      const id = parseInt(row.getAttribute('data-user-id'), 10);
      if (matchedIds.has(id)) {
        row.classList.add('highlight-row');
      } else {
        row.classList.remove('highlight-row');
      }
    });
  }

  function resetDatabase() {
    engine.resetDatabase();
    renderDatabaseInspector(elements.dbFilterInput.value);
    elements.executionResultCard.innerHTML = `
      <div class="result-placeholder">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p>Database restored to default 10 users! Click <strong>"Execute Query & Attempt Login"</strong> to test.</p>
      </div>
    `;
    elements.executionResultCard.className = 'result-card';
    executeSearch();
  }

  /* ==========================================================================
     Missions & CTF Logic
     ========================================================================== */
  function checkMissionsOnAuth(result, username, password) {
    if (state.mode === 'secure') {
      // Mission 4: The Iron Fortress (run attack payload in secure mode and verify defense)
      if (username.includes("'") || username.includes("--")) {
        completeMission(4);
      }
      return;
    }

    if (!result.success) return;

    // Mission 1: Tautology bypass (logged in via OR condition)
    if (username.includes("' OR '") || username.includes("' OR 1=1") || username.includes("' OR ''='")) {
      completeMission(1);
    }

    // Mission 2: Targeted admin comment bypass (logged in specifically as admin using comment)
    if (username.startsWith("admin'") && (username.includes("--") || username.includes("/*"))) {
      if (result.authenticatedUser && result.authenticatedUser.username === 'admin') {
        completeMission(2);
      }
    }
  }

  function completeMission(missionId) {
    if (state.missions[missionId]) return; // already completed

    state.missions[missionId] = true;
    saveMissions();
    renderMissionUI();

    // Show temporary celebratory alert
    const missionNames = {
      1: "Mission 1: The Gatecrasher (Tautology Bypass)",
      2: "Mission 2: Targeted Impersonation (Admin Comment Bypass)",
      3: "Mission 3: The Secret Vault (UNION Data Exfiltration)",
      4: "Mission 4: The Iron Fortress (Prepared Statements Defense)"
    };

    console.log(`🎉 Mission Completed: ${missionNames[missionId]}`);
  }

  function renderMissionUI() {
    let completedCount = 0;
    const total = 4;

    for (let id = 1; id <= total; id++) {
      const card = document.getElementById(`mission${id}Card`);
      if (card) {
        if (state.missions[id]) {
          card.classList.add('completed');
          card.querySelector('.mission-status-icon').textContent = '✓';
          completedCount++;
        } else {
          card.classList.remove('completed');
          card.querySelector('.mission-status-icon').textContent = '○';
        }
      }
    }

    elements.challengeCounter.textContent = `${completedCount}/${total}`;
    elements.missionsCompletedText.textContent = `${completedCount} / ${total}`;
    const pct = (completedCount / total) * 100;
    elements.missionsProgressBar.style.width = `${pct}%`;

    if (completedCount === total) {
      elements.allMissionsCompletedBanner.classList.remove('hidden');
    } else {
      elements.allMissionsCompletedBanner.classList.add('hidden');
    }
  }

  function resetMissions() {
    state.missions = { 1: false, 2: false, 3: false, 4: false };
    saveMissions();
    renderMissionUI();
  }

  /* ==========================================================================
     Tab Navigation & Code Lang Switcher
     ========================================================================== */
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

        if (targetId === 'tab-database') {
          renderDatabaseInspector(elements.dbFilterInput.value);
        }
      });
    });

    elements.langTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const lang = tab.getAttribute('data-lang');
        elements.langTabs.forEach(t => t.classList.remove('active'));
        elements.snippetPanes.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        const targetSnippet = document.getElementById(`snippet-${lang}`);
        if (targetSnippet) targetSnippet.classList.add('active');
      });
    });
  }

  /* ==========================================================================
     Event Bindings & Initialization
     ========================================================================== */
  function init() {
    loadMissions();
    setupNavigation();

    // Mode Buttons
    elements.modeVulnerableBtn.addEventListener('click', () => setMode('vulnerable'));
    elements.modeSecureBtn.addEventListener('click', () => setMode('secure'));

    // DB Resets
    elements.resetDbGlobalBtn.addEventListener('click', resetDatabase);
    elements.resetDbInspectorBtn.addEventListener('click', resetDatabase);
    elements.resetMissionsBtn.addEventListener('click', resetMissions);

    // Auth Lab Inputs
    elements.loginUsername.addEventListener('input', updateLivePreview);
    elements.loginPassword.addEventListener('input', updateLivePreview);
    elements.executeLoginBtn.addEventListener('click', executeLogin);

    // Payload Chips
    document.querySelectorAll('.payload-chips .chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const user = chip.getAttribute('data-user');
        const pass = chip.getAttribute('data-pass');
        const desc = chip.getAttribute('data-desc');

        if (user !== null) elements.loginUsername.value = user;
        if (pass !== null) elements.loginPassword.value = pass;
        if (desc) elements.payloadTip.textContent = desc;

        updateLivePreview();
      });
    });

    // Accordion Toggle
    elements.toggleEvalAccordionBtn.addEventListener('click', () => {
      elements.evalAccordionContent.classList.toggle('hidden');
      const arrow = elements.toggleEvalAccordionBtn.querySelector('.accordion-arrow');
      if (elements.evalAccordionContent.classList.contains('hidden')) {
        arrow.textContent = '▼';
      } else {
        arrow.textContent = '▲';
      }
    });

    // Search Lab
    elements.searchQueryInput.addEventListener('input', updateSearchPreview);
    elements.executeSearchBtn.addEventListener('click', executeSearch);

    // DB Filter
    elements.dbFilterInput.addEventListener('input', (e) => {
      renderDatabaseInspector(e.target.value);
    });

    // Initial renders
    updateLivePreview();
    updateSearchPreview();
    renderDatabaseInspector();
    renderMissionUI();
    executeSearch(); // populate initial search table
  }

  // Public Interface for Inline HTML event callbacks
  window.App = {
    updateLivePreview,
    applySearchPreset: function (preset) {
      if (preset === 'users') {
        elements.searchQueryInput.value = "' UNION SELECT id, username, password, email, role, secret_data FROM users --";
      } else if (preset === 'secrets') {
        elements.searchQueryInput.value = "' UNION SELECT id, secret_name, secret_val, description, '', '' FROM secrets --";
      } else {
        elements.searchQueryInput.value = preset;
      }
      updateSearchPreview();
      executeSearch();
    },
    populateLoginForm: function (username, password) {
      elements.loginUsername.value = username;
      elements.loginPassword.value = password;
      elements.payloadTip.textContent = `Loaded legitimate credentials for user: ${username}`;
      
      // Switch to login tab
      document.querySelector('.nav-tab[data-tab="tab-login"]').click();
      updateLivePreview();
    },
    jumpToMission: function (missionId) {
      if (missionId === 1 || missionId === 2 || missionId === 4) {
        document.querySelector('.nav-tab[data-tab="tab-login"]').click();
        if (missionId === 4) {
          setMode('secure');
          elements.loginUsername.value = "' OR '1'='1";
          elements.loginPassword.value = "anything";
        } else if (missionId === 2) {
          setMode('vulnerable');
          elements.loginUsername.value = "admin' --";
          elements.loginPassword.value = "anything";
        } else if (missionId === 1) {
          setMode('vulnerable');
          elements.loginUsername.value = "' OR '1'='1";
          elements.loginPassword.value = "anything";
        }
        updateLivePreview();
      } else if (missionId === 3) {
        document.querySelector('.nav-tab[data-tab="tab-search"]').click();
        window.App.applySearchPreset('users');
      }
    }
  };

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
