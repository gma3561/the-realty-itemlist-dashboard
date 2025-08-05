#!/bin/bash

echo "🎭 Playwright E2E Test Runner"
echo "=============================="
echo ""

# Check if Playwright is installed
if ! npx playwright --version > /dev/null 2>&1; then
    echo "❌ Playwright not found. Installing..."
    npm install --save-dev @playwright/test playwright
    npx playwright install
else
    echo "✅ Playwright is installed"
fi

# Check if dev server is running
if ! curl -s http://localhost:5173 > /dev/null; then
    echo "⚠️  Dev server not running. Starting in background..."
    npm run dev &
    DEV_PID=$!
    echo "Waiting for dev server to start..."
    sleep 5
fi

echo ""
echo "Select test mode:"
echo "1) Run all tests"
echo "2) Run tests with UI (recommended)"
echo "3) Run tests in headed mode (see browser)"
echo "4) Debug tests"
echo "5) Show test report"
echo "6) Run specific test file"
echo ""

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo "Running all tests..."
        npm run test:e2e
        ;;
    2)
        echo "Opening Playwright UI..."
        npm run test:e2e:ui
        ;;
    3)
        echo "Running tests in headed mode..."
        npm run test:e2e:headed
        ;;
    4)
        echo "Starting debug mode..."
        npm run test:e2e:debug
        ;;
    5)
        echo "Showing test report..."
        npm run test:e2e:report
        ;;
    6)
        echo ""
        echo "Available test files:"
        ls -1 e2e-tests/*.spec.js | sed 's/e2e-tests\//  - /'
        echo ""
        read -p "Enter test file name (without path): " testfile
        echo "Running $testfile..."
        npx playwright test e2e-tests/$testfile
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

# Cleanup dev server if we started it
if [ ! -z "$DEV_PID" ]; then
    echo ""
    read -p "Stop dev server? (y/n): " stop_dev
    if [ "$stop_dev" = "y" ]; then
        kill $DEV_PID
        echo "Dev server stopped."
    fi
fi

echo ""
echo "Done! 🎉"