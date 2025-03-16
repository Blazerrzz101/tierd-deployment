#!/bin/bash
if [ -z "$1" ]; then
  echo "Usage: ./force-rebuild.sh <your-vercel-deploy-hook-url>"
  echo "Create a deploy hook in Vercel dashboard: Project Settings > Git > Deploy Hooks"
  exit 1
fi

echo "Triggering force rebuild..."
curl -X POST "$1"
echo -e "\nRebuild triggered! Check Vercel dashboard for status."
