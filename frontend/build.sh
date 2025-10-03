#!/bin/bash

echo "🔧 Installing dependencies..."
npm install

echo "🏗️ Building Next.js application..."
npm run build

echo "✅ Build completed successfully!"
echo "📁 Contents of .next directory:"
ls -la .next/

echo "📁 Contents of .next/BUILD_ID:"
cat .next/BUILD_ID || echo "BUILD_ID not found"
