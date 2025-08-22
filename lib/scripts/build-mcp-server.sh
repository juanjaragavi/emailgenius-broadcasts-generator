#!/bin/bash

# Build script for MCP GitHub Context Server
# This script compiles the TypeScript MCP server to JavaScript

set -e

echo "🔧 Building MCP GitHub Context Server..."

# Create output directory if it doesn't exist
mkdir -p lib/mcp/dist

# Compile TypeScript to JavaScript
npx tsc lib/mcp/github-context-server.ts --outDir lib/mcp/dist --target es2020 --module commonjs --moduleResolution node --skipLibCheck

# Check if the build was successful
if [ -f "lib/mcp/dist/github-context-server.js" ]; then
    echo "✅ MCP Server built successfully!"
    echo "📁 Output: lib/mcp/dist/github-context-server.js"
else
    echo "❌ Build failed!"
    exit 1
fi

echo "🚀 MCP Server is ready to use"
