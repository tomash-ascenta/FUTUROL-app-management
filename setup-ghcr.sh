#!/bin/bash
# GHCR Login Setup for VPS
# Run this ONCE on VPS to configure Docker to pull from GitHub Container Registry
#
# Prerequisites:
# 1. Create a GitHub Personal Access Token (classic) with 'read:packages' scope
#    Go to: GitHub Settings > Developer Settings > Personal Access Tokens > Tokens (classic)
# 2. Run this script on VPS: ./setup-ghcr.sh YOUR_GITHUB_TOKEN

if [ -z "$1" ]; then
    echo "Usage: ./setup-ghcr.sh YOUR_GITHUB_TOKEN"
    echo ""
    echo "Get your token from: https://github.com/settings/tokens"
    echo "Required scope: read:packages"
    exit 1
fi

TOKEN=$1
USERNAME="tomash-ascenta"

echo "🔐 Logging into GitHub Container Registry..."
echo "$TOKEN" | docker login ghcr.io -u $USERNAME --password-stdin

if [ $? -eq 0 ]; then
    echo "✅ Successfully logged into GHCR!"
    echo ""
    echo "Now you can pull images with:"
    echo "  docker pull ghcr.io/tomash-ascenta/futurol-app-management:latest"
else
    echo "❌ Login failed. Check your token."
    exit 1
fi
