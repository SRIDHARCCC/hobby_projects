# 🔒 Security & Secret Scanning Compliance Guidelines

This document outlines mandatory security protocols and GitHub Push Protection standards for all applications inside `hobby_projects`.

---

## 1. Zero-Secret Policy

This repository is public or shared with external contributors. **NO credentials, real API keys, production tokens, private keys, or cloud identifiers may EVER be committed.**

### Strictly Prohibited Patterns in Code & Documentation
GitHub enforces automated Secret Scanning and Push Protection. The following patterns will **instantly block `git push`** with error `GH013: Repository rule violations found`:

| Pattern Type | Examples of Blocked Strings | Safe Educational Alternative |
|---|---|---|
| **Stripe Keys** | `sk_live_...`, `rk_live_...` | `demo_mock_dummy_token_not_a_real_secret_12345` |
| **AWS Credentials** | `AKIA[0-9A-Z]{16}`, `arn:aws:iam::...` | `DEMO_ACCOUNT_ID:123456789012` |
| **GitHub Tokens** | `ghp_...`, `gho_...`, `github_pat_...` | `demo_github_dummy_pat_000000000000` |
| **Private Keys** | `-----BEGIN PRIVATE KEY-----` | `[MOCK_PEM_CERTIFICATE_DATA_FOR_DEMO_ONLY]` |
| **JWT Tokens** | Full live JWT signature strings | `mock-jwt-header.mock-payload.mock-signature` |
| **Google Cloud** | Service account JSON keys, API keys (`AIza...`) | `DEMO_MOCK_GCP_API_KEY_00000` |

---

## 2. Safe Mock Data Conventions

When building security demos, authentication systems, or API explainers that require sample data:

1. **Clear Explicit Prefixes**:
   Always prefix mock credentials with obvious non-secret markers:
   - `demo_mock_...`
   - `dummy_token_...`
   - `placeholder_...`
2. **Never Generate Strings Matching Real Provider Entropies**:
   Secret scanners use regular expressions plus high-entropy hex/base64 checks. Do not use 32+ character hex strings that mimic live cryptographic hashes or live provider keys.
3. **Excluded Files via `.gitignore`**:
   The root `.gitignore` excludes:
   ```text
   .env
   .env.*
   *.pem
   *.key
   *credentials*.json
   *secrets*.json
   __pycache__/
   node_modules/
   ```

---

## 3. Pre-Commit Security Audit Checklist

Before committing or pushing any new app or modification:
- [ ] Run secret pattern search across all new files:
      `git grep -i -E "sk_live|AKIA|ghp_|BEGIN PRIVATE KEY"`
- [ ] Verify no `.env`, local configuration, or credentials files are staged.
- [ ] Verify mock data uses safe, descriptive demonstration strings.
