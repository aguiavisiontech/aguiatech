#!/bin/bash
# ============================================
# Aguiatech - GitHub Deploy Script
# ============================================
# Usage: GITHUB_TOKEN=your_token_here bash deploy.sh
# Or:   bash deploy.sh (will prompt for token)
# ============================================

set -e

REPO="aguiavisiontech/aguiatech"
BRANCH="main"

# Check for token
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GitHub token not found!"
    echo ""
    echo "Please provide your GitHub Personal Access Token:"
    echo "  GITHUB_TOKEN=ghp_xxxxx bash deploy.sh"
    echo ""
    echo "To create a token:"
    echo "  1. Go to https://github.com/settings/tokens"
    echo "  2. Click 'Generate new token (classic)'"
    echo "  3. Select 'repo' scope"
    echo "  4. Generate and copy the token"
    exit 1
fi

echo "🚀 Deploying to GitHub..."
echo "   Repository: $REPO"
echo "   Branch: $BRANCH"
echo ""

# Set remote with token
cd "$(dirname "$0")"
git remote set-url origin "https://${GITHUB_TOKEN}@github.com/${REPO}.git"

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push -u origin $BRANCH --force

# Clean token from remote URL
git remote set-url origin "https://github.com/${REPO}.git"

echo ""
echo "✅ Deploy complete!"
echo "   https://github.com/$REPO"
