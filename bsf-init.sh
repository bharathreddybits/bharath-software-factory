#!/bin/bash
# =============================================================================
# bsf-init.sh — Bharath Software Factory Product Initializer
#
# Run this script once after cloning the BSF boilerplate to scaffold a new
# standalone product. It will:
#   1. Prompt for the new product name and GitHub remote URL
#   2. Wipe the boilerplate git history and create a fresh repository
#   3. Update package.json name
#   4. Update factory.config.ts: product name, tagline, domain, supportEmail,
#      SEO titles/descriptions, and legal companyName
#   5. Wire the GitHub remote and create a scaffold commit
#   6. Create a local .env.local starter from .env.example
#   7. Print deployment instructions
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
echo -e "${BOLD}Step 1 of 4 — Product details${RESET}"
echo ""
read -rp "  New product name (kebab-case, e.g. avatar-genius): " NEW_PRODUCT_NAME
read -rp "  Domain (e.g. avatargenius.com — no https://): " NEW_DOMAIN
read -rp "  New GitHub remote URL (e.g. https://github.com/you/repo.git): " NEW_GITHUB_URL
echo ""

# ── Validate inputs ───────────────────────────────────────────────────────────
if [[ -z "${NEW_PRODUCT_NAME}" ]]; then
  echo -e "${RED}ERROR: Product name cannot be empty.${RESET}"
  exit 1
fi

if [[ -z "${NEW_DOMAIN}" ]]; then
  echo -e "${RED}ERROR: Domain cannot be empty.${RESET}"
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
read -rp "  Continue with product '${NEW_PRODUCT_NAME}' at ${NEW_DOMAIN}? (y/N): " CONFIRM
if [[ "${CONFIRM}" != "y" && "${CONFIRM}" != "Y" ]]; then
  echo "Aborted — no changes made."
  exit 0
fi
echo ""

# ── Step 2: Reset git history ─────────────────────────────────────────────────
echo -e "${BOLD}Step 2 of 4 — Resetting git history${RESET}"

echo "  → Removing boilerplate .git directory…"
rm -rf .git

echo "  → Initialising fresh git repository…"
git init
git symbolic-ref HEAD refs/heads/main

# ── Step 3: Configure product ─────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Step 3 of 4 — Configuring product${RESET}"

echo "  → Updating package.json name → '${NEW_PRODUCT_NAME}'…"
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  pkg.name = process.argv[1];
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
" "${NEW_PRODUCT_NAME}"

echo "  → Updating factory.config.ts…"
node -e "
  const fs = require('fs');
  const kebab   = process.argv[1];
  const domain  = process.argv[2];
  const display = kebab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  let c = fs.readFileSync('src/config/factory.config.ts', 'utf8');

  // product section
  c = c.replace(/name: \"Bharath Software Factory\"/g,               'name: \"' + display + '\"');
  c = c.replace(/tagline: \"Ship SaaS products 10× faster with AI\.\"/,  'tagline: \"Your product tagline goes here.\"');
  c = c.replace(/description: \"AI-native SaaS framework optimized for LLM context efficiency\.\"/,
                'description: \"' + display + ' — replace this description.\"');
  c = c.replace(/domain: \"bharathsoftwarefactory\.com\"/,            'domain: \"' + domain + '\"');
  c = c.replace(/supportEmail: \"support@bharathsoftwarefactory\.com\"/, 'supportEmail: \"support@' + domain + '\"');

  // legal section
  c = c.replace(/companyName: \"Bharath Software Factory\"/g,         'companyName: \"' + display + '\"');

  // seo section
  c = c.replace(/metaTitle: \"Bharath Software Factory — Ship SaaS 10× Faster\"/,
                'metaTitle: \"' + display + '\"');
  c = c.replace(/metaDescription:\s*\"AI-native SaaS boilerplate[^\"]*\"/,
                'metaDescription: \"' + display + ' — replace this meta description.\"');
  c = c.replace(/title: \"Bharath Software Factory\",\n\s*description: \"Ship SaaS products 10× faster with Claude Code and BSF\.\"/,
                'title: \"' + display + '\",\n      description: \"' + display + ' — replace this OG description.\"');

  // branding label
  c = c.replace(/label: \"BSF Blue\"/,   'label: \"Primary\"');
  c = c.replace(/label: \"BSF Violet\"/, 'label: \"Accent\"');

  fs.writeFileSync('src/config/factory.config.ts', c);
  console.log('     Display name : ' + display);
  console.log('     Domain       : ' + domain);
  console.log('     Support email: support@' + domain);
" "${NEW_PRODUCT_NAME}" "${NEW_DOMAIN}"

echo "  → Updating AI persona files…"
for f in src/ai/*.md; do
  sed -i "s/\[PRODUCT_NAME\]/${display}/g" "$f"
done

# ── Step 4: Scaffold commit + remote ─────────────────────────────────────────
echo ""
echo -e "${BOLD}Step 4 of 4 — Git scaffold${RESET}"

echo "  → Staging all project files…"
git add .

echo "  → Creating scaffold commit…"
git -c user.name="${GIT_AUTHOR_NAME:-BSF Init}" \
    -c user.email="${GIT_AUTHOR_EMAIL:-init@bsf.local}" \
    commit -m "chore: scaffold ${NEW_PRODUCT_NAME} via BSF master template"

echo "  → Wiring GitHub remote…"
git remote add origin "${NEW_GITHUB_URL}"

# ── Bootstrap .env.local ──────────────────────────────────────────────────────
echo "  → Bootstrapping .env.local…"
if [[ -f ".env.local" ]]; then
  echo "     .env.local already exists — skipping (edit it manually)."
else
  cp .env.example .env.local
  # Pre-fill NEXT_PUBLIC_APP_URL with the provided domain
  node -e "
    const fs = require('fs');
    const domain = process.argv[1];
    let env = fs.readFileSync('.env.local', 'utf8');
    env = env.replace('NEXT_PUBLIC_APP_URL=http://localhost:3000', 'NEXT_PUBLIC_APP_URL=https://' + domain);
    fs.writeFileSync('.env.local', env);
  " "${NEW_DOMAIN}"
  echo "     Created .env.local — fill in secrets before deploying."
fi

# ── Completion banner ─────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${GREEN}${BOLD}║   ✓  '${NEW_PRODUCT_NAME}' scaffolded successfully!$(printf '%*s' $((37 - ${#NEW_PRODUCT_NAME})) '')║${RESET}"
echo -e "${GREEN}${BOLD}╠══════════════════════════════════════════════════════════════════════╣${RESET}"
echo -e "${GREEN}${BOLD}║                                                                      ║${RESET}"
echo -e "${GREEN}${BOLD}║   Next steps:                                                        ║${RESET}"
echo -e "${GREEN}${BOLD}║                                                                      ║${RESET}"
echo -e "${GREEN}${BOLD}║   1. Push to GitHub                                                  ║${RESET}"
echo -e "${GREEN}${BOLD}║      git push -u origin main                                         ║${RESET}"
echo -e "${GREEN}${BOLD}║                                                                      ║${RESET}"
echo -e "${GREEN}${BOLD}║   2. Create a new Supabase project                                   ║${RESET}"
echo -e "${GREEN}${BOLD}║      https://supabase.com/dashboard/new                              ║${RESET}"
echo -e "${GREEN}${BOLD}║      Run:  supabase db push                                          ║${RESET}"
echo -e "${GREEN}${BOLD}║      Then: paste rls_policies.sql into the SQL Editor                ║${RESET}"
echo -e "${GREEN}${BOLD}║                                                                      ║${RESET}"
echo -e "${GREEN}${BOLD}║   3. Import into Vercel & set env vars from .env.local               ║${RESET}"
echo -e "${GREEN}${BOLD}║      https://vercel.com/new                                          ║${RESET}"
echo -e "${GREEN}${BOLD}║      NEXT_PUBLIC_APP_URL is pre-set to https://${NEW_DOMAIN}$(printf '%*s' $((20 - ${#NEW_DOMAIN})) '')║${RESET}"
echo -e "${GREEN}${BOLD}║                                                                      ║${RESET}"
echo -e "${GREEN}${BOLD}║   4. Create plans in DoDo and Razorpay dashboards                    ║${RESET}"
echo -e "${GREEN}${BOLD}║      Then paste the plan IDs into factory.config.ts → plans[]        ║${RESET}"
echo -e "${GREEN}${BOLD}║                                                                      ║${RESET}"
echo -e "${GREEN}${BOLD}║   5. Update factory.config.ts with your product details:             ║${RESET}"
echo -e "${GREEN}${BOLD}║      - product.tagline / description                                 ║${RESET}"
echo -e "${GREEN}${BOLD}║      - seo.metaDescription / openGraph.description                   ║${RESET}"
echo -e "${GREEN}${BOLD}║      - branding.primary / accent colors (oklch values)               ║${RESET}"
echo -e "${GREEN}${BOLD}║      - Replace public/logo.svg with your actual logo                 ║${RESET}"
echo -e "${GREEN}${BOLD}║                                                                      ║${RESET}"
echo -e "${GREEN}${BOLD}║   6. Create Sentry project & paste DSN                               ║${RESET}"
echo -e "${GREEN}${BOLD}║      https://sentry.io/settings/projects/                            ║${RESET}"
echo -e "${GREEN}${BOLD}║                                                                      ║${RESET}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  Your GitHub remote: ${CYAN}${NEW_GITHUB_URL}${RESET}"
echo -e "  Push when ready:    ${BOLD}git push -u origin main${RESET}"
echo ""
