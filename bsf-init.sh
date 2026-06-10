#!/bin/bash
# =============================================================================
# bsf-init.sh — Bharath Software Factory Product Initializer
#
# Run this script once after cloning the BSF boilerplate to scaffold a new
# standalone product. It will:
#   1. Prompt for the new product name and GitHub remote URL
#   2. Wipe the boilerplate git history and create a fresh repository
#   3. Rename the package in package.json
#   4. Create a local .env.local starter from .env.example
#   5. Print deployment instructions
#
# Usage:
#   chmod +x bsf-init.sh && ./bsf-init.sh
#
# Works on: macOS, Linux, and Git Bash for Windows (Node.js must be on PATH)
# =============================================================================

set -euo pipefail

# ── Colours ───────────────────────────────────────────────────────────────────
BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
CYAN="\033[0;36m"
RED="\033[0;31m"
RESET="\033[0m"

# ── Header banner ─────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════════════════════╗${RESET}"
echo -e "${CYAN}${BOLD}║      Bharath Software Factory — Product Initializer      ║${RESET}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════════════════╝${RESET}"
echo ""

# ── Safety check: must be run from project root ───────────────────────────────
if [[ ! -f "package.json" ]]; then
  echo -e "${RED}ERROR: package.json not found.${RESET}"
  echo "  Run this script from the root of your cloned BSF boilerplate."
  exit 1
fi

# ── Prompts ───────────────────────────────────────────────────────────────────
echo -e "${BOLD}Step 1 of 3 — Product details${RESET}"
echo ""
read -rp "  New product name (kebab-case, e.g. avatar-genius): " NEW_PRODUCT_NAME
read -rp "  New GitHub remote URL (e.g. https://github.com/you/repo.git): " NEW_GITHUB_URL
echo ""

# ── Validate inputs ───────────────────────────────────────────────────────────
if [[ -z "${NEW_PRODUCT_NAME}" ]]; then
  echo -e "${RED}ERROR: Product name cannot be empty.${RESET}"
  exit 1
fi

if [[ -z "${NEW_GITHUB_URL}" ]]; then
  echo -e "${RED}ERROR: GitHub URL cannot be empty.${RESET}"
  exit 1
fi

# Validate kebab-case (letters, digits, hyphens only)
if [[ ! "${NEW_PRODUCT_NAME}" =~ ^[a-z0-9][a-z0-9-]*[a-z0-9]$ ]]; then
  echo -e "${YELLOW}WARNING: '${NEW_PRODUCT_NAME}' is not kebab-case. Continuing anyway.${RESET}"
fi

# ── Confirm before destroying git history ────────────────────────────────────
echo -e "${YELLOW}⚠  This will permanently delete the current .git history.${RESET}"
read -rp "  Continue with product '${NEW_PRODUCT_NAME}'? (y/N): " CONFIRM
if [[ "${CONFIRM}" != "y" && "${CONFIRM}" != "Y" ]]; then
  echo "Aborted — no changes made."
  exit 0
fi
echo ""

# ── Step 2: Reset git history ─────────────────────────────────────────────────
echo -e "${BOLD}Step 2 of 3 — Resetting git history${RESET}"

echo "  → Removing boilerplate .git directory…"
rm -rf .git

echo "  → Initialising fresh git repository…"
git init
# Ensure branch is called 'main' regardless of system defaults
git symbolic-ref HEAD refs/heads/main

# ── Step 3: Rename package.json ───────────────────────────────────────────────
echo ""
echo -e "${BOLD}Step 3 of 3 — Configuring product${RESET}"

echo "  → Updating package.json name → '${NEW_PRODUCT_NAME}'…"
# Use Node.js for cross-platform JSON mutation (avoids sed -i portability issues)
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  pkg.name = process.argv[1];
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
" "${NEW_PRODUCT_NAME}"

# ── Stage all files and make initial commit ───────────────────────────────────
echo "  → Staging all project files…"
git add .

echo "  → Creating scaffold commit…"
# Configure a minimal identity if none is set (common in fresh CI environments)
git -c user.name="${GIT_AUTHOR_NAME:-BSF Init}" \
    -c user.email="${GIT_AUTHOR_EMAIL:-init@bsf.local}" \
    commit -m "chore: scaffold infrastructure via BSF master template"

# ── Bootstrap .env.local ──────────────────────────────────────────────────────
echo "  → Bootstrapping .env.local…"
if [[ -f ".env.local" ]]; then
  echo "     .env.local already exists — skipping (edit it manually)."
else
  cp .env.example .env.local
  echo "     Created .env.local from .env.example. Fill in your secrets before running the app."
fi

# ── Completion banner ─────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${GREEN}${BOLD}║   ✓  '${NEW_PRODUCT_NAME}' scaffolded successfully!$(printf '%*s' $((37 - ${#NEW_PRODUCT_NAME})) '')║${RESET}"
echo -e "${GREEN}${BOLD}╠══════════════════════════════════════════════════════════════════════╣${RESET}"
echo -e "${GREEN}${BOLD}║                                                                      ║${RESET}"
echo -e "${GREEN}${BOLD}║   Next steps to go live:                                             ║${RESET}"
echo -e "${GREEN}${BOLD}║                                                                      ║${RESET}"
echo -e "${GREEN}${BOLD}║   1. Push to GitHub                                                  ║${RESET}"
echo -e "${GREEN}${BOLD}║                                                                      ║${RESET}"
echo -e "${GREEN}${BOLD}║      git remote add origin <YOUR_GITHUB_URL>                        ║${RESET}"
echo -e "${GREEN}${BOLD}║      git push -u origin main                                         ║${RESET}"
echo -e "${GREEN}${BOLD}║                                                                      ║${RESET}"
echo -e "${GREEN}${BOLD}║   2. Create a new Supabase project                                   ║${RESET}"
echo -e "${GREEN}${BOLD}║      https://supabase.com/dashboard/new                              ║${RESET}"
echo -e "${GREEN}${BOLD}║      Run migrations: supabase db push                                ║${RESET}"
echo -e "${GREEN}${BOLD}║                                                                      ║${RESET}"
echo -e "${GREEN}${BOLD}║   3. Import into Vercel & set env vars                               ║${RESET}"
echo -e "${GREEN}${BOLD}║      https://vercel.com/new                                          ║${RESET}"
echo -e "${GREEN}${BOLD}║      Copy all keys from .env.local → Vercel Dashboard                ║${RESET}"
echo -e "${GREEN}${BOLD}║                                                                      ║${RESET}"
echo -e "${GREEN}${BOLD}║   4. Create Sentry project & paste DSN                               ║${RESET}"
echo -e "${GREEN}${BOLD}║      https://sentry.io/settings/projects/                            ║${RESET}"
echo -e "${GREEN}${BOLD}║      Set: NEXT_PUBLIC_SENTRY_DSN + SENTRY_AUTH_TOKEN                 ║${RESET}"
echo -e "${GREEN}${BOLD}║                                                                      ║${RESET}"
echo -e "${GREEN}${BOLD}║   5. Register merchant accounts for this product                     ║${RESET}"
echo -e "${GREEN}${BOLD}║      DoDo Payments (international): https://dodopayments.com         ║${RESET}"
echo -e "${GREEN}${BOLD}║      Razorpay (India):              https://razorpay.com             ║${RESET}"
echo -e "${GREEN}${BOLD}║      Update DODO_* and RAZORPAY_* vars in .env.local + Vercel        ║${RESET}"
echo -e "${GREEN}${BOLD}║                                                                      ║${RESET}"
echo -e "${GREEN}${BOLD}║   6. Vercel CLI (optional — push env vars in one command)            ║${RESET}"
echo -e "${GREEN}${BOLD}║      npm i -g vercel                                                 ║${RESET}"
echo -e "${GREEN}${BOLD}║      vercel env pull .env.local    # pull from Vercel → local        ║${RESET}"
echo -e "${GREEN}${BOLD}║      vercel --prod                 # deploy to production            ║${RESET}"
echo -e "${GREEN}${BOLD}║                                                                      ║${RESET}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  Your GitHub remote: ${CYAN}${NEW_GITHUB_URL}${RESET}"
echo ""
echo -e "  ${BOLD}git remote add origin ${NEW_GITHUB_URL}${RESET}"
echo -e "  ${BOLD}git push -u origin main${RESET}"
echo ""
