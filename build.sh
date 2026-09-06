#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "=== Step 1: Installing Python Dependencies ==="
pip install -r requirements.txt

echo "=== Step 2: Building React Frontend ==="
cd frontend
npm install
npm run build
cd ..

echo "=== Build Complete: Frontend and Backend Ready ==="
