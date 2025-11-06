#!/bin/bash

# Production Build Test Script
# Tests the production build locally before deployment

set -e  # Exit on any error

echo "================================"
echo "Production Build Test"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print success
success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print error
error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "Step 1: Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "Node version: $NODE_VERSION"
if [[ "$NODE_VERSION" < "v18" ]]; then
    error "Node.js 18 or higher is required"
    exit 1
fi
success "Node.js version is compatible"
echo ""

echo "Step 2: Checking environment variables..."
if [ ! -f ".env.local" ] && [ ! -f ".env.production" ]; then
    warning "No .env.local or .env.production file found"
    echo "  Creating .env.local from .env.example..."
    cp .env.example .env.local
    warning "Please fill in .env.local with your actual values"
else
    success "Environment file found"
fi
echo ""

echo "Step 3: Installing dependencies..."
npm ci --silent
if [ $? -eq 0 ]; then
    success "Dependencies installed"
else
    error "Failed to install dependencies"
    exit 1
fi
echo ""

echo "Step 4: Running type check..."
npm run type-check
if [ $? -eq 0 ]; then
    success "No TypeScript errors"
else
    error "TypeScript errors found - fix before deploying"
    exit 1
fi
echo ""

echo "Step 5: Running linter..."
npm run lint
if [ $? -eq 0 ]; then
    success "No linting errors"
else
    warning "Linting warnings found - consider fixing"
fi
echo ""

echo "Step 6: Building for production..."
npm run build
if [ $? -eq 0 ]; then
    success "Build completed successfully"
else
    error "Build failed"
    exit 1
fi
echo ""

echo "Step 7: Analyzing bundle size..."
if [ -d ".next" ]; then
    echo "Build output:"
    du -sh .next
    echo ""
    echo "Route sizes:"
    du -sh .next/static/chunks/pages/* 2>/dev/null || echo "No pages chunks found"
    success "Bundle analysis complete"
else
    error ".next directory not found"
    exit 1
fi
echo ""

echo "Step 8: Checking for common issues..."

# Check for console.log in production code
CONSOLE_LOGS=$(grep -r "console.log" --include="*.tsx" --include="*.ts" app/ components/ lib/ 2>/dev/null | wc -l)
if [ $CONSOLE_LOGS -gt 0 ]; then
    warning "Found $CONSOLE_LOGS console.log statements (consider removing for production)"
else
    success "No console.log statements found"
fi

# Check for TODO comments
TODOS=$(grep -r "TODO" --include="*.tsx" --include="*.ts" app/ components/ lib/ 2>/dev/null | wc -l)
if [ $TODOS -gt 0 ]; then
    warning "Found $TODOS TODO comments (consider addressing before launch)"
else
    success "No TODO comments found"
fi

# Check for test files in production
TEST_FILES=$(find app/ components/ lib/ -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null | wc -l)
if [ $TEST_FILES -gt 0 ]; then
    warning "Found $TEST_FILES test files in src (they will be excluded from build)"
else
    success "No test files found in source"
fi

echo ""

echo "Step 9: Starting production server (for manual testing)..."
echo ""
echo "================================"
echo "Production server will start on http://localhost:3000"
echo "Press Ctrl+C to stop"
echo "================================"
echo ""
echo "Manual tests to perform:"
echo "  1. Homepage loads correctly"
echo "  2. Authentication flows work"
echo "  3. At least 3 tools function properly"
echo "  4. No console errors in browser"
echo "  5. Pages load within 2-3 seconds"
echo ""

npm run start
