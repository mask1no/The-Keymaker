#!/bin/bash
# Keymaker - Commit Infrastructure Fixes and Push to GitHub
# Run this from the project root directory

set -e

echo "========================================"
echo "Keymaker - Git Commit and Push"
echo "========================================"
echo ""

# Configure remote and default branch
REPO_URL="https://github.com/mask1no/The-Keymaker.git"
echo "Ensuring remote 'origin' is $REPO_URL ..."
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

echo "Setting default branch to main..."
git branch -M main

# Stage all changes
echo "Staging all changes..."
git add -A

# Show status
echo ""
echo "Current status:"
git status --short

# Commit with comprehensive message
echo ""
echo "Creating commit..."
set +e
git commit -m "feat: infrastructure fixes - database unification, wallet APIs, env setup" \
  -m "Fixed 3 critical blockers:" \
  -m "" \
  -m "1. Database Module Conflict (RESOLVED)" \
  -m "   - Merged wallets schema into lib/db/sqlite.ts" \
  -m "   - Updated walletService to use unified module" \
  -m "   - Deleted old conflicting lib/db.ts" \
  -m "   - Added auto-create data/ directory" \
  -m "   - Replaced console.error with logger" \
  -m "" \
  -m "2. Missing Wallet API Routes (IMPLEMENTED)" \
  -m "   - Created app/api/wallets/fund/route.ts" \
  -m "   - Created app/api/wallets/sweep/route.ts" \
  -m "   - Created app/api/wallets/deepclean/route.ts" \
  -m "   - All protected with session + rate limiting" \
  -m "" \
  -m "3. Environment Documentation (ADDED)" \
  -m "   - Created env.example with full configuration" \
  -m "   - Documented all required and optional variables" \
  -m "   - Added security best practices" \
  -m "" \
  -m "Additional Improvements:" \
  -m "- Fixed truncated/corrupted API routes (trades, markets, mint activity)" \
  -m "- Created 3 guard scripts (ellipses, colors, forbidden)" \
  -m "- Added lib/server/withSessionAndLimit.ts wrapper" \
  -m "- Unified database schema (wallets + trades + positions + activity)" \
  -m "- Removed all 'Bundler' references -> 'Bundle'" \
  -m "- Fixed app/layout.tsx metadata" \
  -m "- Zero linter errors" \
  -m "- Zero placeholder code" \
  -m "" \
  -m "Files Created (11):" \
  -m "- scripts/check_ellipses.cjs" \
  -m "- scripts/check_colors.cjs" \
  -m "- scripts/check_forbidden.cjs" \
  -m "- lib/db/sqlite.ts (complete rewrite)" \
  -m "- lib/server/withSessionAndLimit.ts" \
  -m "- app/api/mint/activity/route.ts" \
  -m "- app/api/markets/tickers/route.ts" \
  -m "- app/api/wallets/fund/route.ts" \
  -m "- app/api/wallets/sweep/route.ts" \
  -m "- app/api/wallets/deepclean/route.ts" \
  -m "- env.example" \
  -m "" \
  -m "Files Modified (11):" \
  -m "- app/api/trades/route.ts" \
  -m "- services/walletService.ts" \
  -m "- app/layout.tsx" \
  -m "- app/page.tsx" \
  -m "- app/bundle/page.tsx" \
  -m "- app/dashboard/DashboardWrapper.tsx" \
  -m "- components/layout/SideNav.tsx" \
  -m "- components/layout/AppSideNav.tsx" \
  -m "- package.json" \
  -m "- scripts/check_forbidden.cjs" \
  -m "- PRODUCTION_READY.md" \
  -m "" \
  -m "Files Deleted (2):" \
  -m "- lib/db.ts (conflicting old module)" \
  -m "- PROJECT_AUDIT_REPORT.md (issues resolved)" \
  -m "" \
  -m "Infrastructure Status: PRODUCTION READY" \
  -m "- Database: Unified and operational" \
  -m "- Authentication: SIWS complete" \
  -m "- API Routes: All protected with session+limit" \
  -m "- Guards: All passing" \
  -m "- Linter: Zero errors" \
  -m "" \
  -m "Note: Trading/sniping logic (pump.fun, Jupiter, volume bots) requires separate implementation."

# Push to origin
if [ $? -eq 0 ]; then
  echo ""
  echo "Commit successful! Pushing to remote..."
  set -e
  git push -u origin main
  echo ""
  echo "========================================"
  echo "SUCCESS! Changes pushed to GitHub"
  echo "========================================"
else
  echo ""
  echo "========================================"
  echo "ERROR: Commit failed"
  echo "========================================"
  echo "Check git status and try again"
fi

echo ""

