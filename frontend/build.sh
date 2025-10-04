#!/bin/bash

# Install dependencies
echo "Installing dependencies..."
npm ci

# Run build
echo "Building application..."
npm run build

# Verify build exists
if [ -d ".next" ]; then
    echo "✅ Build successful - .next directory exists"
    ls -la .next/
else
    echo "❌ Build failed - .next directory not found"
    exit 1
fi

echo "Build process completed successfully"