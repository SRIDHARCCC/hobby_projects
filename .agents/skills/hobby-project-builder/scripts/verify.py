#!/usr/bin/env python3
"""
Hobby Projects Quality & Compliance Verifier CLI
Audits an application directory against repository standards before committing/pushing.

Usage:
    python verify.py <app-slug>
Example:
    python verify.py sql-injection-explainer
    python verify.py sorting-visualizer
"""

import sys
import os
import re
import subprocess

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

REQUIRED_FILES = [
    'index.html',
    'style.css',
    'app.js',
    'server.py',
    'Dockerfile',
    'nginx.conf',
    '.dockerignore',
    'README.md'
]

RISKY_SECRET_PATTERNS = [
    (r'sk_live_[0-9a-zA-Z]{10,}', 'Stripe Live Secret Key'),
    (r'AKIA[0-9A-Z]{16}', 'AWS Access Key ID'),
    (r'arn:aws:iam::[0-9]{12}', 'AWS IAM ARN'),
    (r'-----BEGIN [A-Z ]*PRIVATE KEY-----', 'Private Key PEM header'),
    (r'ghp_[0-9a-zA-Z]{36}', 'GitHub Personal Access Token'),
    (r'AIza[0-9A-Za-z\\-_]{35}', 'Google Cloud API Key')
]

def get_repo_root():
    current = os.path.dirname(os.path.abspath(__file__))
    while current and os.path.basename(current):
        if os.path.exists(os.path.join(current, 'sorting-visualizer')) or os.path.exists(os.path.join(current, '.git')):
            return current
        parent = os.path.dirname(current)
        if parent == current:
            break
        current = parent
    return os.getcwd()

REPO_ROOT = get_repo_root()

def audit_app(slug):
    app_dir = os.path.join(REPO_ROOT, slug)
    print(f"\n=======================================================")
    print(f"🔍 AUDITING APP: {slug}")
    print(f"📁 Path: {app_dir}")
    print(f"=======================================================\n")

    if not os.path.exists(app_dir):
        print(f"❌ FATAL: Directory does not exist: {app_dir}")
        return False

    failures = []

    # 1. File Completeness Check
    print("[1/4] Verifying required files...")
    for fname in REQUIRED_FILES:
        fpath = os.path.join(app_dir, fname)
        if not os.path.exists(fpath):
            failures.append(f"Missing required file: {fname}")
            print(f"  ❌ Missing: {fname}")
        elif os.path.getsize(fpath) == 0:
            failures.append(f"File is empty: {fname}")
            print(f"  ❌ Empty: {fname}")
        else:
            print(f"  ✓ {fname} ({os.path.getsize(fpath)} bytes)")

    # 2. Secret Scanning & GitHub Push Protection Check
    print("\n[2/4] Scanning for risky secret patterns (GitHub Push Protection)...")
    secret_found = False
    for root, _, files in os.walk(app_dir):
        if '__pycache__' in root or '.git' in root or 'node_modules' in root:
            continue
        for f in files:
            fpath = os.path.join(root, f)
            try:
                with open(fpath, 'r', encoding='utf-8', errors='ignore') as handle:
                    content = handle.read()
                    for pattern, label in RISKY_SECRET_PATTERNS:
                        matches = re.findall(pattern, content)
                        if matches:
                            rel_path = os.path.relpath(fpath, app_dir)
                            print(f"  ❌ PROHIBITED SECRET DETECTED in {rel_path}: {label}")
                            failures.append(f"Risky secret pattern ({label}) in {rel_path}")
                            secret_found = True
            except Exception as e:
                pass

    if not secret_found:
        print("  ✓ Zero prohibited secret patterns found.")

    # 3. Root README.md Registration Check
    print("\n[3/4] Verifying registration in root README.md...")
    root_readme = os.path.join(REPO_ROOT, 'README.md')
    if os.path.exists(root_readme):
        with open(root_readme, 'r', encoding='utf-8') as handle:
            readme_content = handle.read()
            if f"[**`{slug}/`**]" in readme_content or f"`{slug}`" in readme_content:
                print(f"  ✓ '{slug}' is registered in root README.md table.")
            else:
                failures.append(f"'{slug}' is NOT listed in root README.md directory table!")
                print(f"  ❌ Missing entry for '{slug}' in root README.md")
    else:
        failures.append("Root README.md not found!")

    # 4. Automated Test Suite Execution
    print("\n[4/4] Executing test suite...")
    test_node_path = os.path.join(app_dir, 'test_app.js')
    test_ran = False
    if os.path.exists(test_node_path):
        print(f"  Running Node.js test suite: {test_node_path}")
        res = subprocess.run(['node', test_node_path], cwd=app_dir, capture_output=True, text=True)
        if res.returncode == 0:
            print("  ✓ Node.js tests passed successfully.")
            test_ran = True
        else:
            failures.append(f"Node.js tests failed:\n{res.stderr or res.stdout}")
            print(f"  ❌ Test failure:\n{res.stderr or res.stdout}")

    if not test_ran:
        # Check if Python test exists
        py_tests = [f for f in os.listdir(app_dir) if f.startswith('test_') and f.endswith('.py')]
        if py_tests:
            for pt in py_tests:
                res = subprocess.run([sys.executable, pt], cwd=app_dir, capture_output=True, text=True)
                if res.returncode == 0:
                    print(f"  ✓ Python test {pt} passed.")
                    test_ran = True
                else:
                    failures.append(f"Python test {pt} failed.")

    if not test_ran:
        print("  ⚠️ Notice: No automated test suite (test_app.js) found to execute.")

    # Final Verdict
    print("\n" + "=" * 55)
    if not failures:
        print(f"🎉 VERDICT: '{slug}' PASSED ALL COMPLIANCE CHECKS!")
        print("=" * 55 + "\n")
        return True
    else:
        print(f"❌ VERDICT: '{slug}' FAILED COMPLIANCE ({len(failures)} issue(s)):")
        for f in failures:
            print(f"   - {f}")
        print("=" * 55 + "\n")
        return False

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python verify.py <app-slug>")
        sys.exit(1)
    
    slug_arg = sys.argv[1].strip()
    success = audit_app(slug_arg)
    sys.exit(0 if success else 1)
